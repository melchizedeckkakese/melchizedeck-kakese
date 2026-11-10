import { z } from "zod";
import { treatmentRequestSchema } from "@/lib/treatment-request";

export const OWNER_EMAIL = "melchizedeckkakese@gmail.com";
export const submissionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("message"), name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(255), subject: z.string().trim().max(200), body: z.string().trim().min(2).max(6000), kind: z.enum(["contact", "partner"]) }),
  z.object({ type: z.literal("treatment"), title: z.string().trim().min(1).max(300), details: treatmentRequestSchema }),
  z.object({ type: z.literal("subscription"), email: z.string().trim().email().max(255) }),
]);

export function submissionMessage(input: z.infer<typeof submissionSchema>) {
  if (input.type === "subscription") return { name: "Newsletter subscriber", email: input.email, subject: "New newsletter subscriber", body: `Email: ${input.email}`, kind: "subscription" };
  if (input.type === "message") return { name: input.name, email: input.email, subject: input.subject || (input.kind === "partner" ? "Partnership enquiry" : "Contact message"), body: input.body, kind: input.kind };
  const d = input.details;
  return {
    name: d.name, email: d.email, subject: `Treatment request: ${input.title}`, kind: "treatment_request",
    body: [`Screenplay: ${input.title}`, `Name: ${d.name}`, `Email: ${d.email}`, d.phone && `Phone: ${d.phone}`, `Role: ${d.role}`, `Company: ${d.company}`, d.agency && `Agency: ${d.agency}`, d.website && `Website: ${d.website}`, d.message && `\nMessage:\n${d.message}`].filter(Boolean).join("\n"),
  };
}