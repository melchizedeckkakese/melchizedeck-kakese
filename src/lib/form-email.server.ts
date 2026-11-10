import { OWNER_EMAIL } from "@/lib/form-submissions";

export async function sendFormEmail(id: string, message: { name: string; email: string; subject: string; body: string; kind: string }) {
  const apiKey = process.env.LOVABLE_API_KEY;
  const connectionKey = process.env.BREVO_API_KEY;
  // External hosts opt in with a separate provider key. A gateway connection
  // key must never be sent directly to Brevo, even when gateway delivery fails.
  const directKey = process.env.BREVO_DIRECT_API_KEY;
  if (!directKey && (!apiKey || !connectionKey)) return { sent: false, error: "Email service is not configured" };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (directKey) headers["api-key"] = directKey;
  else if (apiKey && connectionKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers["X-Connection-Api-Key"] = connectionKey;
  }
  const response = await fetch(directKey
    ? "https://api.brevo.com/v3/smtp/email"
    : "https://connector-gateway.lovable.dev/brevo/smtp/email", {
    method: "POST",
    headers,
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