# Form notifications

Contact and partnership enquiries, screenplay treatment requests and new newsletter subscriptions are saved first, then an owner-only notification is sent with Brevo. Visitors receive no automatic confirmation email. Failed email dispatch never deletes the saved submission.

## External hosting (including Vercel)

GitHub stores source code; it does not send these notifications. Configure the hosting provider's encrypted environment variables before deploying:

- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`) for the existing Cloud database.
- `LOVABLE_API_KEY` and the linked `BREVO_API_KEY` connection key for the Brevo connector gateway. The connection key is not a direct Brevo API key.
- Keep the existing browser `VITE_SUPABASE_*` configuration.

Never commit private keys. Lovable-linked secrets are not automatically copied to Vercel. Brevo must authorize the connector gateway's sending IP addresses; preview, tool checks and published requests can use different addresses. A successful sender lookup alone does not prove email delivery.

The sender and recipient are the existing verified `melchizedeckkakese@gmail.com` address. The visitor's address is Reply-To only. Saved enquiries appear under Admin → Inbox; subscriptions appear under Admin → Subscribers.