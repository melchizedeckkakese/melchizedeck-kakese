import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSection } from "@/lib/cms";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { submitWebsiteForm } from "@/lib/form-submissions.functions";
import { submissionSchema } from "@/lib/form-submissions";
import { toast } from "sonner";
import { Mail, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => pageHead({ path: "/contact", title: "Contact & Partner | Melchizedeck Kakese", description: "Get in touch with Melchizedeck Kakese for collaborations, speaking engagements, writing projects, youth programmes and partnerships.", type: "website" }),
  component: Contact,
});

function Contact() {
  const { data } = useSection<{ title: string; body: string; email?: string; location?: string }>("contact", "main");
  const c = data?.content;
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "", kind: "contact" });
  const [loading, setLoading] = useState(false);
  const send = useServerFn(submitWebsiteForm);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const input = submissionSchema.parse({ type: "message", ...form });
      const result = await send({ data: input });
      if (result.emailSent) toast.success("Message sent.");
      else toast.success("Message received. Email notification is delayed.");
      setForm({ name: "", email: "", subject: "", body: "", kind: "contact" });
    } catch { toast.error("Could not send your message. Check your details and try again."); }
    finally { setLoading(false); }
  }

  return (
    <SiteLayout>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2">
        <div>
          <h1 className="font-serif text-5xl text-cream">{c?.title}</h1>
          <p className="mt-4 text-muted-foreground">{c?.body}</p>
          <div className="mt-8 space-y-3 text-sm">
            {c?.email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-gold" /> {c.email}</div>}
            {c?.location && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-gold" /> {c.location}</div>}
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-6">
          <div className="flex gap-2">
            {["contact", "partner"].map((k) => (
              <button key={k} type="button" onClick={() => setForm({ ...form, kind: k })}
                className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize transition ${form.kind === k ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}>
                {k === "contact" ? "Say hello" : "Partner with me"}
              </button>
            ))}
          </div>
          <Input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Textarea required rows={6} placeholder="Your message…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <Button type="submit" disabled={loading} className="w-full bg-gold text-primary-foreground hover:opacity-90">
            {loading ? "Sending…" : "Send message"}
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}
