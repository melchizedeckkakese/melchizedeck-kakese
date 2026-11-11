import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Selcom payment webhook.
 * Configure this URL in your Selcom merchant dashboard:
 *   https://<your-domain>/api/public/selcom/webhook
 *
 * Expected JSON body (Selcom Checkout callback):
 * {
 *   "order_id": "<order_ref we sent>",
 *   "reference": "<selcom transaction id>",
 *   "result": "SUCCESS" | "FAILED",
 *   "amount": 10000,
 *   "signature": "<hmac-sha256 of order_id|reference|result|amount using SELCOM_API_SECRET>"
 * }
 *
 * If SELCOM_WEBHOOK_SECRET is set we verify the signature header (`x-selcom-signature`).
 */
export const Route = createFileRoute("/api/public/selcom/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const secret = process.env.SELCOM_WEBHOOK_SECRET;
        if (!secret) {
          // Fail closed: never trust unsigned payment callbacks.
          return new Response("Webhook not configured", { status: 503 });
        }
        {
          const sig = request.headers.get("x-selcom-signature") ?? "";
          const expected = createHmac("sha256", secret).update(raw).digest("hex");
          const a = Buffer.from(sig);
          const b = Buffer.from(expected);
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let payload: Record<string, unknown>;
        try { payload = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }

        const orderRef = String(payload.order_id ?? payload.order_ref ?? "");
        const reference = String(payload.reference ?? payload.transid ?? "");
        const result = String(payload.result ?? payload.status ?? "").toUpperCase();
        if (!orderRef) return new Response("Missing order_id", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const succeeded = result === "SUCCESS" || result === "PAID" || result === "COMPLETED";

        const { data: purchase } = await supabaseAdmin
          .from("purchases")
          .select("id, email, item_id, item_title, amount, currency, status, bundle_expires_at")
          .eq("order_ref", orderRef)
          .maybeSingle();

        if (!purchase) {
          // Not a product purchase — it may be a "Support My Vision" contribution.
          const { data: donation } = await supabaseAdmin
            .from("donations")
            .select("id, name, email, amount, currency, message, status")
            .eq("order_ref", orderRef)
            .maybeSingle();
          if (!donation) return new Response("Unknown order", { status: 404 });
          if (donation.status === "paid") return new Response("ok");

          if (!succeeded) {
            await supabaseAdmin.from("donations").update({ status: "failed", provider_ref: reference }).eq("id", donation.id);
            return new Response("ok");
          }

          await supabaseAdmin.from("donations").update({
            status: "paid",
            provider_ref: reference,
            paid_at: new Date().toISOString(),
          }).eq("id", donation.id);

          const { data: dSettings } = await supabaseAdmin
            .from("site_settings")
            .select("value")
            .eq("key", "payments")
            .maybeSingle();
          const dPay = (dSettings?.value ?? {}) as { notify_email?: string };
          const dNotify = dPay.notify_email ?? "melchizedeckkakese@gmail.com";
          const dSubject = `Contribution received: ${donation.amount} ${donation.currency} — Support My Vision`;
          const dText = `A new contribution was received.

Supporter: ${donation.name ?? "(anonymous)"}
Email: ${donation.email}
Amount: ${donation.amount} ${donation.currency}
Message: ${donation.message ?? "(none)"}
Selcom reference: ${reference}
Order ref: ${orderRef}`;

          await supabaseAdmin.from("messages").insert({
            name: donation.name ?? donation.email,
            email: donation.email,
            kind: "donation",
            subject: dSubject,
            body: `${dText}

Notify: ${dNotify}`,
          });

          try {
            const key = process.env.LOVABLE_API_KEY;
            const from = process.env.NOTIFY_FROM_EMAIL;
            if (key && from) {
              const { sendLovableEmail } = await import("@lovable.dev/email-js");
              await sendLovableEmail(
                {
                  to: dNotify,
                  from,
                  subject: dSubject,
                  html: `<p>A new contribution was received.</p><ul>
                    <li><strong>Supporter:</strong> ${donation.name ?? "(anonymous)"}</li>
                    <li><strong>Email:</strong> ${donation.email}</li>
                    <li><strong>Amount:</strong> ${donation.amount} ${donation.currency}</li>
                    <li><strong>Message:</strong> ${donation.message ?? "(none)"}</li>
                    <li><strong>Selcom ref:</strong> ${reference}</li>
                    <li><strong>Order ref:</strong> ${orderRef}</li>
                  </ul>`,
                  text: dText,
                },
                { apiKey: key },
              );
            }
          } catch (err) {
            console.error("[selcom webhook] donation email send failed:", err);
          }

          return new Response("ok");
        }

        if (purchase.status === "paid") return new Response("ok");


        if (result !== "SUCCESS" && result !== "PAID" && result !== "COMPLETED") {
          await supabaseAdmin.from("purchases").update({ status: "failed", provider_ref: reference }).eq("id", purchase.id);
          return new Response("ok");
        }

        // Load settings for bundle window
        const { data: settings } = await supabaseAdmin
          .from("site_settings")
          .select("value")
          .eq("key", "payments")
          .maybeSingle();
        const pay = (settings?.value ?? {}) as {
          bundle_minutes?: number;
          notify_email?: string;
          standard_price?: number;
        };
        const standard = Number(pay.standard_price ?? 0);
        const qualifies = standard > 0 && Number(purchase.amount) >= standard;
        const bundleMs = Math.max(1, Number(pay.bundle_minutes ?? 60)) * 60 * 1000;
        const bundleExpires = qualifies ? new Date(Date.now() + bundleMs).toISOString() : null;

        await supabaseAdmin.from("purchases").update({
          status: "paid",
          provider_ref: reference,
          paid_at: new Date().toISOString(),
          bundle_expires_at: bundleExpires,
        }).eq("id", purchase.id);

        if (purchase.item_id) {
          await supabaseAdmin.from("unlocks").upsert({
            email: purchase.email,
            item_id: purchase.item_id,
            source: "purchase",
          }, { onConflict: "email,item_id" });
        }

        // Admin notification via existing messages inbox (always works, even without email domain)
        const notify = pay.notify_email ?? "melchizedeckkakese@gmail.com";
        await supabaseAdmin.from("messages").insert({
          name: purchase.email,
          email: purchase.email,
          kind: "payment",
          subject: `Payment received: ${purchase.item_title ?? "item"} — ${purchase.amount} ${purchase.currency}`,
          body: `A new payment was received.

Item: ${purchase.item_title ?? "(none)"}
Amount: ${purchase.amount} ${purchase.currency}
Buyer email: ${purchase.email}
Selcom reference: ${reference}
Order ref: ${orderRef}
Bundle window: ${bundleExpires ? `until ${bundleExpires}` : "not eligible (below standard price)"}

Notify: ${notify}`,
        });

        // Best-effort email via Lovable Emails (only sends when a sender is configured & LOVABLE_API_KEY present).
        try {
          const key = process.env.LOVABLE_API_KEY;
          const from = process.env.NOTIFY_FROM_EMAIL;
          if (key && from) {
            const { sendLovableEmail } = await import("@lovable.dev/email-js");
            const subject = `Payment received: ${purchase.item_title ?? "item"} — ${purchase.amount} ${purchase.currency}`;
            const html = `<p>A new payment was received.</p>
                     <ul>
                       <li><strong>Item:</strong> ${purchase.item_title ?? "(none)"}</li>
                       <li><strong>Amount:</strong> ${purchase.amount} ${purchase.currency}</li>
                       <li><strong>Buyer:</strong> ${purchase.email}</li>
                       <li><strong>Selcom ref:</strong> ${reference}</li>
                       <li><strong>Order ref:</strong> ${orderRef}</li>
                     </ul>`;
            const text = `Payment received. Item: ${purchase.item_title ?? "(none)"}. Amount: ${purchase.amount} ${purchase.currency}. Buyer: ${purchase.email}. Ref: ${reference}.`;
            await sendLovableEmail(
              { to: notify, from, subject, html, text },
              { apiKey: key },
            );
          }
        } catch (err) {
          console.error("[selcom webhook] email send failed:", err);
        }

        return new Response("ok");
      },
    },
  },
});
