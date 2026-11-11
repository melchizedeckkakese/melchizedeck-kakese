import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { formStorageConfig } from "@/lib/form-config";
import type { Database } from "@/integrations/supabase/types";

function makeFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
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

/**
 * Public: start a "Support My Vision" donation.
 * Creates a pending donation row and opens a hosted Selcom checkout session.
 */
export const startDonation = createServerFn({ method: "POST" })
  .inputValidator((d: {
    name?: string;
    email: string;
    phone?: string;
    amount: number;
    message?: string;
  }) => d)
  .handler(async ({ data }) => {
    const email = (data.email ?? "").trim().toLowerCase();
    if (!email.includes("@") || email.length > 200) throw new Error("Enter a valid email");
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount");

    const supabase = serverClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payments")
      .maybeSingle();
    const pay = (settings?.value ?? {}) as { currency?: string; min_donation?: number };
    const currency = pay.currency ?? "TZS";
    const min = Number(pay.min_donation ?? 500);
    if (amount < min) throw new Error(`Minimum contribution is ${min} ${currency}`);

    const name = (data.name ?? "").trim().slice(0, 120) || null;
    const message = (data.message ?? "").trim().slice(0, 1000) || null;
    const phone = (data.phone ?? "").trim().slice(0, 30) || null;

    const donation = {
      order_ref: "DON-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase(),
      amount,
      currency,
    };
    const { error } = await supabase.from("donations").insert({
      id: crypto.randomUUID(),
      order_ref: donation.order_ref,
      name, email, phone, amount, currency, message,
      provider: "selcom",
      status: "pending",
    });
    if (error) throw new Error("Could not start the payment. Please try again.");

    const { readSelcomCreds, createSelcomCheckoutOrder, buildReturnUrls } = await import(
      "@/lib/selcom.server"
    );
    const creds = readSelcomCreds();
    const manual = {
      payLink: (pay as { pay_link?: string }).pay_link ?? null,
      tillNumber: (pay as { till_number?: string }).till_number ?? null,
      merchantName: (pay as { merchant_name?: string }).merchant_name ?? null,
      qrPayload: (pay as { tips_qr?: string }).tips_qr ?? null,
    };
    if (!creds) {
      if (!manual.payLink && !manual.qrPayload) {
        throw new Error("Contributions are not configured yet. Please try again later.");
      }
      return {
        orderRef: donation.order_ref,
        amount: donation.amount,
        currency: donation.currency,
        checkoutUrl: null as string | null,
        manual,
      };
    }

    const { webhook, redirect_url, cancel_url } = buildReturnUrls(
      donation.order_ref,
      "/support-thanks",
    );
    let checkoutUrl: string | null = null;
    try {
      ({ checkoutUrl } = await createSelcomCheckoutOrder(
        {
          order_id: donation.order_ref,
          buyer_email: email,
          buyer_name: name ?? email.split("@")[0] ?? "Supporter",
          buyer_phone: phone ?? "",
          amount,
          currency,
          webhook,
          redirect_url,
          cancel_url,
          merchant_remarks: "Support My Vision contribution",
        },
        creds,
      ));
    } catch (err) {
      if (!manual.payLink && !manual.qrPayload) throw err;
      console.error("Selcom hosted checkout failed; showing QR/till instead", err);
    }

    return {
      orderRef: donation.order_ref,
      amount: donation.amount,
      currency: donation.currency,
      checkoutUrl: checkoutUrl as string | null,
      manual,
    };
  });
