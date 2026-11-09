import { z } from "zod";

export const treatmentRequestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional(),
  role: z.string().trim().min(2, "Please enter your role").max(100),
  company: z.string().trim().min(2, "Please enter your film company").max(150),
  agency: z.string().trim().max(150).optional(),
  website: z.string().trim().max(300).optional(),
  message: z.string().trim().max(2000).optional(),
});

export function synopsisNeedsPayment(meta: Record<string, unknown>, synopsis: string | null | undefined) {
  return (meta.locked === true || meta.locked === "true") && synopsis == null;
}