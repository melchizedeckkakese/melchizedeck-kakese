import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { formStorageConfig } from "@/lib/form-config";
import type { Database } from "@/integrations/supabase/types";

function makeFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if ((key.startsWith("sb_")) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function serverClient() {
  const { url, key } = formStorageConfig(process.env, {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  });
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { fetch: makeFetch(key) },
  });
}

function normEmail(e: string) {
  return e.trim().toLowerCase();
}

/** Public: create a pending purchase and return an order reference the client can present to Selcom. */
export const startCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; phone?: string; itemId: string }) => d)
  .handler(async ({ data }) => {
    const email = normEmail(data.email);
    if (!email.includes("@")) throw new Error("Enter a valid email");
    if (!data.itemId) throw new Error("Missing item");

    const supabase = serverClient();
    const { data: item, error: itemErr } = await supabase
      .from("content_items")
      .select("id, title, collection, meta, published")
      .eq("id", data.itemId)
      .maybeSingle();
    if (itemErr || !item || !item.published) throw new Error("Item not available");

    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payments")
      .maybeSingle();
    const pay = (settings?.value ?? {}) as {
      standard_price?: number;
      currency?: string;
    };
    const itemMeta = (item.meta ?? {}) as { price?: number; currency?: string };
    const amount = Number(itemMeta.price ?? pay.standard_price ?? 10000);
    const currency = (itemMeta.currency ?? pay.currency ?? "TZS");

    // Anonymous insert-only (pending) so checkout works on any host, even without admin keys.
    const purchase = { order_ref: crypto.randomUUID(), amount, currency };
    const { error } = await supabase.from("purchases").insert({
      id: crypto.randomUUID(),
      order_ref: purchase.order_ref,
      email,
      phone: data.phone ?? null,
      item_id: item.id,
      item_title: item.title,
      amount,
      currency,
      provider: "selcom",
      status: "pending",
    });
    if (error) throw new Error("Could not start the payment. Please try again.");

    // Create a hosted Selcom checkout session and return the gateway URL the
    // buyer is redirected to. All Selcom logic lives in selcom.server.ts (server-only).
    const { readSelcomCreds, createSelcomCheckoutOrder, buildReturnUrls } = await import("@/lib/selcom.server");
    const creds = readSelcomCreds();
    const manual = {
      payLink: (pay as { pay_link?: string }).pay_link ?? null,
      tillNumber: (pay as { till_number?: string }).till_number ?? null,
      merchantName: (pay as { merchant_name?: string }).merchant_name ?? null,
      qrPayload: (pay as { tips_qr?: string }).tips_qr ?? null,
    };
    if (!creds) {
      // No hosted-checkout credentials: hand the buyer the merchant's Selcom
      // payment link / TIPS QR so the money still reaches the merchant.
      if (!manual.payLink && !manual.qrPayload) {
        throw new Error("Payments are not configured yet. Please try again later.");
      }
      return {
        orderRef: purchase.order_ref,
        amount: purchase.amount,
        currency: purchase.currency,
        checkoutUrl: null as string | null,
        manual,
        pending: true,
      };
    }

    const { webhook, redirect_url, cancel_url } = buildReturnUrls(purchase.order_ref);
    let checkoutUrl: string | null = null;
    try {
      ({ checkoutUrl } = await createSelcomCheckoutOrder(
        {
          order_id: purchase.order_ref,
          buyer_email: email,
          buyer_name: email.split("@")[0] || "Buyer",
          buyer_phone: data.phone ?? "",
          amount,
          currency,
          webhook,
          redirect_url,
          cancel_url,
          merchant_remarks: `Unlock: ${item.title}`,
        },
        creds,
      ));
    } catch (err) {
      if (!manual.payLink && !manual.qrPayload) throw err;
      console.error("Selcom hosted checkout failed; showing QR/till instead", err);
    }

    return {
      orderRef: purchase.order_ref,
      amount: purchase.amount,
      currency: purchase.currency,
      checkoutUrl: checkoutUrl as string | null,
      manual,
      pending: true,
    };
  });

/** Public: list unlocked item ids for a given email (only currently valid unlocks). */
export const listUnlocks = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    const email = normEmail(data.email);
    if (!email.includes("@")) return { itemIds: [] as string[], bundleExpiresAt: null as string | null };
    const supabase = serverClient();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("unlocks")
      .select("item_id, expires_at")
      .eq("email", email);
    const now = Date.now();
    const itemIds = (rows ?? [])
      .filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now)
      .map((r) => r.item_id);

    const { data: bundle } = await supabaseAdmin
      .from("purchases")
      .select("bundle_expires_at")
      .eq("email", email)
      .eq("status", "paid")
      .order("bundle_expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const be = bundle?.bundle_expires_at;
    const bundleActive = be && new Date(be).getTime() > now ? be : null;
    return { itemIds, bundleExpiresAt: bundleActive };
  });

/** Public: within a bundle window, claim one extra free unlock. */
export const claimBundlePick = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; itemId: string; paymentReference: string }) => d)
  .handler(async ({ data }) => {
    const email = normEmail(data.email);
    const paymentReference = String(data.paymentReference ?? "").trim();
    if (!email.includes("@") || !data.itemId) throw new Error("Invalid request");
    if (paymentReference.length < 8 || paymentReference.length > 100) {
      throw new Error("Enter the order reference from your bundle payment");
    }

    const supabase = serverClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payments")
      .maybeSingle();
    const pay = (settings?.value ?? {}) as { bundle_free_picks?: number };
    const freePicks = Math.max(0, Number(pay.bundle_free_picks ?? 1));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Caller must prove ownership of the paid bundle purchase via its order reference.
    const { data: bundle } = await supabaseAdmin
      .from("purchases")
      .select("id, bundle_expires_at")
      .eq("email", email)
      .eq("order_ref", paymentReference)
      .eq("status", "paid")
      .maybeSingle();
    if (!bundle?.bundle_expires_at || new Date(bundle.bundle_expires_at).getTime() < Date.now()) {
      throw new Error("Your bundle window has ended");
    }

    const { count } = await supabaseAdmin
      .from("unlocks")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .eq("source", "bundle");
    if ((count ?? 0) >= freePicks) throw new Error(`You've already claimed your ${freePicks} free pick(s)`);

    const { error } = await supabaseAdmin
      .from("unlocks")
      .insert({ email, item_id: data.itemId, source: "bundle" });
    if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message);

    return { ok: true };
  });
