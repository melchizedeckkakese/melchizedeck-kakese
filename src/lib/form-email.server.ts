import { OWNER_EMAIL } from "@/lib/form-submissions";

export async function sendFormEmail(id: string, message: { name: string; email: string; subject: string; body: string; kind: string }) {
  const apiKey = process.env.LOVABLE_API_KEY;
  const connectionKey = process.env.BREVO_API_KEY;
  if (!apiKey || !connectionKey) return { sent: false, error: "Email service is not configured" };
  const response = await fetch("https://connector-gateway.lovable.dev/brevo/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": connectionKey },
    body: JSON.stringify({
      sender: { name: "The Writer's Frame", email: OWNER_EMAIL },
      to: [{ email: OWNER_EMAIL }], replyTo: { email: message.email, name: message.name },
      subject: `[Website] ${message.subject}`,
      textContent: `New ${message.kind} submission\n\nName: ${message.name}\nEmail: ${message.email}\n\n${message.body}\n\nSubmission reference: ${id}`,
      headers: { idempotencyKey: id },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error(`Brevo form email failed [${response.status}]: ${body}`);
    return { sent: false, error: `Email provider [${response.status}]: ${body}` };
  }
  const result = await response.json() as { messageId?: string };
  return { sent: Boolean(result.messageId), messageId: result.messageId };
}