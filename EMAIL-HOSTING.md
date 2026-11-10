# Form notifications

Contact and partnership enquiries, screenplay treatment requests and new newsletter subscriptions are saved first, then an owner-only notification is sent with Brevo. Visitors receive no automatic confirmation email. Failed email dispatch never deletes the saved submission.

## External hosting (including Vercel)

GitHub stores source code; it does not send these notifications. Configure the hosting provider's encrypted environment variables before deploying:

- Keep the existing public `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` configuration available at build time. Form storage now uses these as a fallback, so separate server database variables are optional. Existing `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`) still take precedence.
- For direct Brevo delivery on Vercel, add **`BREVO_DIRECT_API_KEY`** using a real API key from your Brevo account. Store it only in Vercel's encrypted environment variables, never in GitHub or a `VITE_` variable. The existing verified sender must remain authorized in Brevo.
- Alternatively, hosts already configured with `LOVABLE_API_KEY` and the linked `BREVO_API_KEY` continue to use the Brevo connector gateway. The connection key is not a direct Brevo API key; do not copy it into `BREVO_DIRECT_API_KEY`.

In Vercel, open the project's **Settings → Environment Variables**, add `BREVO_DIRECT_API_KEY` for the environments you use, then redeploy the latest deployment. Changes to build-time public configuration also require redeployment. If Brevo restricts sending IPs, authorize your hosting provider's outbound IPs or configure a stable outbound IP using that provider's supported options.

Direct delivery is selected only when `BREVO_DIRECT_API_KEY` is explicitly configured. A failed gateway request never switches automatically to the provider API. Without email credentials, forms still save to the admin inbox; no email is sent.

Never commit private keys. Lovable-linked secrets are not automatically copied to Vercel. Brevo must authorize the connector gateway's sending IP addresses; preview, tool checks and published requests can use different addresses. A successful sender lookup alone does not prove email delivery.

The sender and recipient are the existing verified `melchizedeckkakese@gmail.com` address. The visitor's address is Reply-To only. Saved enquiries appear under Admin → Inbox; subscriptions appear under Admin → Subscribers.