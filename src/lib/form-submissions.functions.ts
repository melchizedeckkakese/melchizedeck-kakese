import { createServerFn } from "@tanstack/react-start";
import { submissionSchema, submissionMessage } from "@/lib/form-submissions";

export const submitWebsiteForm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submissionSchema.parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Submission storage is not configured");
    // Anonymous insert-only permissions; never use admin access for public form writes.
    const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } } });
    const id = crypto.randomUUID();
    const message = submissionMessage(data);
    const { error } = data.type === "subscription"
      ? await client.from("subscribers").insert({ id, email: data.email })
      : await client.from("messages").insert({ id, ...message });
    if (error?.code === "23505" && data.type === "subscription") return { saved: true, alreadySubscribed: true, emailSent: false };
    if (error) throw new Error("Could not save your submission. Please try again.");
    try {
      const { sendFormEmail } = await import("@/lib/form-email.server");
      const notification = await sendFormEmail(id, message);
      return { saved: true, emailSent: notification.sent };
    } catch {
      console.error("Form notification could not be dispatched; saved submission retained", id);
      return { saved: true, emailSent: false };
    }
  });