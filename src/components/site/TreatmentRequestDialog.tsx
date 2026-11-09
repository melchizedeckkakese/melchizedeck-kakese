import { useState } from "react";
import { z } from "zod";
import { X, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { treatmentRequestSchema as schema } from "@/lib/treatment-request";

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
    try {
      const { error } = await supabase.from("messages").insert({
        name: d.name, email: d.email, subject: `Treatment request: ${title}`, body, kind: "treatment_request",
      });
      if (error) throw error;
      toast.success("Request sent! You'll be contacted by email.");
      onClose();
    } catch {
      toast.error("Could not send your request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <form role="dialog" aria-modal="true" aria-label={`Treatment request: ${title}`} onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-gold"><FileText className="h-5 w-5" /><span className="text-xs uppercase tracking-widest">Treatment request</span></div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></Button>
        </div>
        <h3 className="mt-3 font-serif text-2xl text-cream">{title}</h3>
        <div className="mt-4 space-y-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="text-muted-foreground">{f.label}{f.required && " *"}</span>
              <Input required={f.required} type={f.type ?? "text"} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-1" />
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
