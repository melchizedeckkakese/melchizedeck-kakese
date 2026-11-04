import { useState } from "react";
import { z } from "zod";
import { X, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional(),
  role: z.string().trim().min(2, "Please enter your role").max(100),
  company: z.string().trim().min(2, "Please enter your film company").max(150),
  agency: z.string().trim().max(150).optional(),
  website: z.string().trim().max(300).optional(),
  message: z.string().trim().max(2000).optional(),
});

type Form = z.infer<typeof schema>;
const FIELDS: { key: keyof Form; label: string; required?: boolean; type?: string }[] = [
  { key: "name", label: "Full name", required: true },
  { key: "email", label: "Email", required: true, type: "email" },
  { key: "phone", label: "Phone" },
  { key: "role", label: "Role (e.g. Producer, Director, Agent)", required: true },
  { key: "company", label: "Film / production company", required: true },
  { key: "agency", label: "Agency / representation" },
  { key: "website", label: "Website or IMDb link" },
];

export function TreatmentRequestDialog({ title, onClose }: { title: string; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Form>>({});
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[String(i.path[0])] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const d = parsed.data;
    const body = [
      `Screenplay: ${title}`,
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      d.phone && `Phone: ${d.phone}`,
      `Role: ${d.role}`,
      `Company: ${d.company}`,
      d.agency && `Agency: ${d.agency}`,
      d.website && `Website: ${d.website}`,
      d.message && `\nMessage:\n${d.message}`,
    ].filter(Boolean).join("\n");
    const { error } = await supabase.from("messages").insert({
      name: d.name, email: d.email, subject: `Treatment request: ${title}`, body, kind: "treatment_request",
    });
    setBusy(false);
    if (error) { toast.error("Could not send your request. Please try again."); return; }
    toast.success("Request sent! You'll be contacted by email.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-gold"><FileText className="h-5 w-5" /><span className="text-xs uppercase tracking-widest">Treatment request</span></div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <h3 className="mt-3 font-serif text-2xl text-cream">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Tell us who you are so the treatment can be shared with you.</p>
        <div className="mt-4 space-y-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="text-muted-foreground">{f.label}{f.required && " *"}</span>
              <Input type={f.type ?? "text"} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-1" />
              {errors[f.key] && <span className="text-xs text-destructive">{errors[f.key]}</span>}
            </label>
          ))}
          <label className="block text-sm">
            <span className="text-muted-foreground">Purpose / message</span>
            <Textarea value={form.message ?? ""} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1" rows={4} />
          </label>
        </div>
        <Button type="submit" disabled={busy} className="mt-5 w-full bg-gold text-primary-foreground hover:opacity-90">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send request
        </Button>
      </form>
    </div>
  );
}
