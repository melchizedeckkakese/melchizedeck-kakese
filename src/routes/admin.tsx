import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, uploadMedia, ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES, parseList } from "@/lib/cms";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Moderation } from "@/components/admin/Moderation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Upload, LogOut, ImageIcon } from "lucide-react";
import { BlocksEditor } from "@/components/admin/BlocksEditor";
import { FONT_OPTIONS, FONT_GROUPS, findFont } from "@/lib/fonts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Website Admin | Melchizedeck Kakese" }, { name: "description", content: "Manage biography photos, writing and events on Melchizedeck Kakese’s website." }, { property: "og:title", content: "Website Admin | Melchizedeck Kakese" }, { property: "og:description", content: "Manage biography photos, writing and events on Melchizedeck Kakese’s website." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

const PAGES: { page: string; sections: { key: string; label: string; fields: FieldSpec[] }[] }[] = [
  { page: "home", sections: [
    { key: "hero", label: "Hero", fields: [
      { name: "videoUrl", label: "Hero background video", type: "video" },
      { name: "posterUrl", label: "Hero poster image (shown while the video loads)", type: "image" },
      { name: "eyebrow", label: "Eyebrow" },
      { name: "rotatingPrefix", label: "Static line above the moving words (e.g. I am)" },
      { name: "rotatingPhrases", label: "Moving words — one per line", type: "textarea" },
      { name: "title", label: "Title (unused when moving words are set)" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "ctaPrimaryLabel", label: "Primary button label" },
      { name: "ctaPrimaryTo", label: "Primary button link" },
      { name: "ctaSecondaryLabel", label: "Secondary button label" },
      { name: "ctaSecondaryTo", label: "Secondary button link" },
    ]},
    { key: "featured", label: "Featured Work", fields: [
      { name: "label", label: "Section label" },
      { name: "title", label: "Title" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "imageUrl", label: "Image", type: "image" },
      { name: "primaryLabel", label: "Primary button label" },
      { name: "primaryTo", label: "Primary button link" },
      { name: "secondaryLabel", label: "Secondary button label" },
      { name: "secondaryTo", label: "Secondary button link" },
    ]},
    { key: "pillars", label: "What I Do (three pillars)", fields: [
      { name: "eyebrow", label: "Eyebrow" },
      { name: "title", label: "Section title" },
      { name: "items", label: "Work areas", type: "pillars" },
      { name: "projectsNote", label: "Line above the Projects button" },
      { name: "projectsLabel", label: "Projects button label" },
    ]},
    { key: "impact", label: "Impact Numbers (animated counters)", fields: [
      { name: "eyebrow", label: "Eyebrow" },
      { name: "title", label: "Section title" },
      { name: "items", label: "Stats (JSON array of {label, value, suffix})", type: "json" },
      { name: "note", label: "Small note under the numbers", type: "textarea" },
    ]},
    { key: "newsletter", label: "Newsletter", fields: [
      { name: "title", label: "Title" },
      { name: "body", label: "Body", type: "textarea" },
    ]},
  ]},
  { page: "projects", sections: [
    { key: "header", label: "Projects page header", fields: [
      { name: "title", label: "Title" },
      { name: "body", label: "Intro", type: "textarea" },
    ]},
  ]},
  { page: "about", sections: [
    { key: "timeline", label: "Milestones timeline heading", fields: [
      { name: "eyebrow", label: "Eyebrow" },
      { name: "title", label: "Title" },
      { name: "body", label: "Intro", type: "textarea" },
    ]},
    { key: "main", label: "About", fields: [
      { name: "title", label: "Title" },
      { name: "body", label: "Body (used only if no story blocks below)", type: "textarea" },
      { name: "imageUrl", label: "Portrait image", type: "image" },
      { name: "blocks", label: "Story blocks", type: "blocks" },
      { name: "galleryTitle", label: "Photo gallery title" },
      { name: "gallery", label: "Photo gallery (separate from milestones)", type: "gallery" },
    ]},
  ]},

  { page: "books", sections: [{ key: "header", label: "Header", fields: [{ name: "title", label: "Title" }, { name: "body", label: "Intro", type: "textarea" }] }] },
  { page: "scripts", sections: [{ key: "header", label: "Header", fields: [{ name: "title", label: "Title" }, { name: "body", label: "Intro", type: "textarea" }] }] },
  { page: "blog", sections: [{ key: "header", label: "Header", fields: [{ name: "title", label: "Title" }, { name: "body", label: "Intro", type: "textarea" }] }] },
  { page: "events", sections: [{ key: "header", label: "Header", fields: [{ name: "title", label: "Title" }, { name: "body", label: "Intro", type: "textarea" }] }] },
  { page: "speeches", sections: [{ key: "header", label: "Header", fields: [{ name: "title", label: "Title" }, { name: "body", label: "Intro", type: "textarea" }] }] },
  { page: "advocacy", sections: [{ key: "header", label: "Header", fields: [{ name: "title", label: "Title" }, { name: "body", label: "Intro", type: "textarea" }] }] },
  { page: "contact", sections: [{ key: "main", label: "Contact", fields: [
    { name: "title", label: "Title" }, { name: "body", label: "Body", type: "textarea" },
    { name: "email", label: "Public email" }, { name: "location", label: "Location" },
  ]}]},
  { page: "site", sections: [
    { key: "background", label: "Site background image", fields: [
      { name: "imageUrl", label: "Background photo (blurred behind all pages)", type: "image" },
      { name: "bg_about", label: "About page background (optional — overrides the default)", type: "image" },
      { name: "bg_projects", label: "Projects page background", type: "image" },
      { name: "bg_books", label: "Books page background", type: "image" },
      { name: "bg_scripts", label: "Scripts page background", type: "image" },
      { name: "bg_blog", label: "Blog page background", type: "image" },
      { name: "bg_advocacy", label: "Advocacy page background", type: "image" },
      { name: "bg_events", label: "Events page background", type: "image" },
      { name: "bg_speeches", label: "Speeches page background", type: "image" },
      { name: "bg_contact", label: "Contact page background", type: "image" },
    ]},
    { key: "support", label: "Support My Vision (contributions)", fields: [
      { name: "eyebrow", label: "Eyebrow" },
      { name: "title", label: "Title" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "amounts", label: "Suggested amounts (comma separated, e.g. 5000, 10000, 25000)" },
      { name: "buttonLabel", label: "Button label" },
      { name: "note", label: "Small note under the text", type: "textarea" },
    ]},
    { key: "typography", label: "Typography (fonts)", fields: [
      { name: "displayFont", label: "Display font — big page/hero titles", type: "font" },
      { name: "headingFont", label: "Heading font — section headings", type: "font" },
      { name: "bodyFont", label: "Body font — paragraphs & buttons", type: "font" },
      { name: "accentFont", label: "Accent font — eyebrows, quotes, signatures (handwritten works well)", type: "font" },
      { name: "baseSize", label: "Base text size in px (12–24, default 16)" },
      { name: "headingScale", label: "Heading size multiplier (0.8–1.5, default 1)" },
    ]},

    { key: "community", label: "Join the Family (footer community block)", fields: [
      { name: "eyebrow", label: "Eyebrow" },
      { name: "title", label: "Title" },
      { name: "body", label: "Invitation text", type: "textarea" },
      { name: "instagram", label: "Instagram followers (baseline — auto-updated when API access is connected)" },
      { name: "linkedin", label: "LinkedIn followers (baseline)" },
      { name: "facebook", label: "Facebook followers (baseline)" },
      { name: "threads", label: "Threads followers (baseline)" },
      { name: "whatsapp", label: "WhatsApp channel followers (baseline)" },
    ]},
    { key: "footer", label: "Footer & Social links", fields: [

      { name: "tagline", label: "Tagline" }, { name: "copyright", label: "Copyright text" },
      { name: "instagram", label: "Instagram URL" },
      { name: "threads", label: "Threads URL" },
      { name: "facebook", label: "Facebook URL" },
      { name: "linkedin", label: "LinkedIn URL" },
      { name: "whatsapp", label: "WhatsApp URL" },
      { name: "amazon", label: "Amazon URL" },
      { name: "discord", label: "Discord URL" },
      { name: "email", label: "Email (mailto:…)" },
      { name: "linktree", label: "Linktree URL" },
    ]},
  ]},
];

type MetaField = { name: string; label: string; type?: "text" | "bool" | "video" | "textarea" | "gallery" };
const COLLECTIONS: { key: string; label: string; extraMeta: MetaField[]; lockable?: boolean }[] = [
  { key: "book", label: "Books", lockable: true, extraMeta: [
    { name: "genre", label: "Genre" },
    { name: "status", label: "Status (e.g. Published, Coming Soon)" },
    { name: "year", label: "Year" },
    { name: "price", label: "Price (numeric — overrides standard price)" },
    { name: "currency", label: "Currency code (e.g. TZS, USD) — defaults to site currency" },
    { name: "buy_url", label: "Buy link (Amazon etc.)" },
    { name: "sample_url", label: "Read Sample link" },
    { name: "review_url", label: "Leave a Review link" },
    { name: "notify_url", label: "Notify Me link" },
    { name: "coming_soon", label: "Coming soon (show Notify Me)", type: "bool" },
  ]},
  { key: "blog", label: "Blog posts", extraMeta: [
    { name: "category", label: "Category" },
    { name: "read_time", label: "Read time (e.g. 5 min)" },
  ]},
  { key: "script", label: "Scripts", lockable: true, extraMeta: [
    { name: "synopsis", label: "Synopsis (shown on its own page — Body above is the logline)", type: "textarea" },
    { name: "genre", label: "Genre" },
    { name: "status", label: "Status" },
    { name: "price", label: "Price (numeric — overrides standard price)" },
    { name: "currency", label: "Currency code (e.g. TZS, USD)" },
    { name: "request_url", label: "Treatment request URL (optional)" },
    { name: "request_email", label: "Treatment request email (optional)" },
  ]},
  { key: "event", label: "Events", extraMeta: [
    { name: "date", label: "Date" }, { name: "location", label: "Location" }, { name: "url", label: "Details link" },
  ]},
  { key: "advocacy", label: "Advocacy & adventures", extraMeta: [] },
  { key: "project", label: "Projects", extraMeta: [
    { name: "role", label: "My role (e.g. Founder, Contributor)" },
    { name: "url", label: "Project link (optional)" },
    { name: "galleryTitle", label: "Photo catalogue title (optional)" },
    { name: "gallery", label: "Project photo catalogue", type: "gallery" },
  ]},
  { key: "achievement", label: "Milestones / Achievements (timeline)", extraMeta: [
    { name: "year", label: "Year (use 'Future' for what's coming)" },
    { name: "location", label: "Location" },
    { name: "url", label: "Related link (optional)" },
  ]},
  { key: "speech", label: "Speeches (videos)", extraMeta: [
    { name: "video_url", label: "Video file", type: "video" },
    { name: "external_url", label: "Or paste a YouTube / Vimeo / Facebook video link" },
    { name: "date", label: "Date (e.g. 2026-05-12)" },
    { name: "location", label: "Location / event" },
    { name: "duration", label: "Duration (e.g. 12:40)" },
  ]},

];

type FieldSpec = { name: string; label: string; type?: "text" | "textarea" | "image" | "json" | "video" | "blocks" | "gallery" | "font" | "pillars" };

function Admin() {
  const nav = useNavigate();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav({ to: "/auth" });
      setCheckedSession(true);
    });
  }, [nav]);

  if (!checkedSession || isLoading) {
    return <SiteLayout><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div></SiteLayout>;
  }

  if (!isAdmin) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="font-serif text-3xl text-cream">Not an admin yet</h1>
          <p className="mt-3 text-sm text-muted-foreground">You're signed in but haven't been promoted to admin. Share your account email with the site owner to be granted access.</p>
          <Button className="mt-6" variant="outline" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}>Sign out</Button>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl text-cream">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Edit any part of the site. Changes go live instantly.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-gold">View site</Link>
            <Button variant="outline" size="sm" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pages">
          <TabsList className="flex-wrap">
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="mt-6">
            <Tabs defaultValue={PAGES[0].page}>
              <TabsList className="flex-wrap">
                {PAGES.map((p) => <TabsTrigger key={p.page} value={p.page} className="capitalize">{p.page}</TabsTrigger>)}
              </TabsList>
              {PAGES.map((p) => (
                <TabsContent key={p.page} value={p.page} className="mt-6 space-y-6">
                  {p.sections.map((s) => (
                    <SectionEditor key={s.key} page={p.page} sectionKey={s.key} label={s.label} fields={s.fields} />
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="collections" className="mt-6">
            <Tabs defaultValue={COLLECTIONS[0].key}>
              <TabsList className="flex-wrap">
                {COLLECTIONS.map((c) => <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>)}
              </TabsList>
              {COLLECTIONS.map((c) => (
                <TabsContent key={c.key} value={c.key} className="mt-6">
                  <CollectionEditor collection={c.key} label={c.label} extraMeta={c.extraMeta} lockable={c.lockable} />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="payments" className="mt-6"><PaymentsSettings /></TabsContent>
          <TabsContent value="inbox" className="mt-6"><Inbox /></TabsContent>
          <TabsContent value="moderation" className="mt-6"><Moderation /></TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}

function SectionEditor({ page, sectionKey, label, fields }: { page: string; sectionKey: string; label: string; fields: FieldSpec[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-section", page, sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase.from("page_sections").select("*").eq("page", page).eq("section_key", sectionKey).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState<Record<string, unknown>>({});
  useEffect(() => { if (data) setForm(data.content as Record<string, unknown>); }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { page, section_key: sectionKey, content: form as never };
      const { data: saved, error } = await supabase.from("page_sections").upsert(payload as never, { onConflict: "page,section_key" }).select("*").single();
      if (error) throw error;
      return saved;
    },
    onSuccess: (saved) => {
      qc.setQueryData(["section", page, sectionKey], saved);
      qc.setQueryData(["admin-section", page, sectionKey], saved);
      toast.success(`${label} saved`);
      qc.invalidateQueries({ queryKey: ["section", page, sectionKey] });
      qc.invalidateQueries({ queryKey: ["admin-section", page, sectionKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="rounded-lg border border-border/60 p-6"><Loader2 className="h-4 w-4 animate-spin" /></div>;

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-6">
      <h3 className="font-serif text-xl text-cream">{label}</h3>
      <div className="mt-4 grid gap-4">
        {fields.map((f) => (
          <FieldInput key={f.name} field={f} value={form[f.name]} onChange={(v) => setForm({ ...form, [f.name]: v })} />
        ))}
      </div>
      <Button className="mt-6 bg-gold text-primary-foreground hover:opacity-90" disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldSpec; value: unknown; onChange: (v: unknown) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  if (field.type === "pillars") {
    const items = parseList<Record<string, unknown>>(value);
    return (
      <div className="grid gap-5">
        {items.map((item, index) => (
          <fieldset key={index} className="grid gap-3 border-t border-border pt-4">
            <legend className="text-sm font-medium text-foreground">Work area {index + 1}</legend>
            <label className="grid gap-1.5 text-sm text-muted-foreground">
              Title
              <Input value={String(item.title ?? "")} onChange={(e) => onChange(items.map((entry, i) => i === index ? { ...entry, title: e.target.value } : entry))} />
            </label>
            <label className="grid gap-1.5 text-sm text-muted-foreground">
              Description
              <Textarea rows={4} value={String(item.body ?? "")} onChange={(e) => onChange(items.map((entry, i) => i === index ? { ...entry, body: e.target.value } : entry))} />
            </label>
          </fieldset>
        ))}
      </div>
    );
  }
  if (field.type === "blocks" || field.type === "gallery") {
    return (
      <div>
        <BlocksEditor value={value} photosOnly={field.type === "gallery"} onChange={(v) => onChange(v)} />
      </div>
    );
  }
  if (field.type === "font") {
    return <FontField label={field.label} value={String(value ?? "")} onChange={onChange} />;
  }

  if (field.type === "textarea") {
    return (
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{field.label}</span>
        <Textarea rows={4} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
      </label>
    );
  }
  if (field.type === "video") {
    const url = String(value ?? "");
    return (
      <div className="rounded-lg border border-border/60 p-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{field.label}</span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {url ? (
            <video src={url} controls preload="metadata" className="h-28 w-48 rounded-md border border-border/60 bg-black object-cover" />
          ) : (
            <div className="flex h-28 w-48 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">No video</div>
          )}
          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent/10">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? `Uploading… ${progress}%` : "Upload video"}
              <input type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setUploading(true); setProgress(0);
                const t = toast.loading("Uploading video…");
                try {
                  const u = await uploadMedia(file, {
                    onProgress: (p) => setProgress(p),
                    allowedTypes: ALLOWED_VIDEO_TYPES,
                    maxBytes: MAX_VIDEO_BYTES,
                  });
                  onChange(u);
                  toast.success("Video uploaded", { id: t });
                } catch (err) {
                  toast.error((err as Error).message, { id: t });
                } finally {
                  setUploading(false); setProgress(0); e.target.value = "";
                }
              }} />
            </label>
            {uploading && <Progress value={progress} className="w-48" />}
            {url && <Button size="sm" variant="ghost" onClick={() => onChange("")}>Remove video</Button>}
            <p className="max-w-xs text-xs text-muted-foreground">MP4, WEBM, MOV, M4V or OGG — up to 50MB. For longer speeches, upload to YouTube and paste the link instead. Or leave empty and paste a YouTube/Vimeo link below.</p>
          </div>
        </div>
      </div>
    );
  }
  if (field.type === "image") {

    const url = String(value ?? "");
    return (
      <div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{field.label}</span>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {url ? (
            <img src={url} alt="" className="h-20 w-20 rounded-md border border-border/60 object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent/10">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? `Uploading… ${progress}%` : "Upload image"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              setUploading(true); setProgress(0);
              const t = toast.loading("Uploading image…");
              try {
                const u = await uploadMedia(file, { onProgress: (p) => setProgress(p) });
                onChange(u);
                toast.success("Uploaded", { id: t });
              } catch (err) {
                toast.error((err as Error).message, { id: t });
              } finally {
                setUploading(false); setProgress(0); e.target.value = "";
              }
            }} />
          </label>
          {url && <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => onChange("")}>Remove</button>}
        </div>
        {uploading && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG, WEBP, GIF, AVIF or SVG · max 10MB</p>
        <Input value={url} onChange={(e) => onChange(e.target.value)} placeholder="or paste image URL" className="mt-2" />
      </div>
    );
  }
  if (field.type === "json") {
    const text = typeof value === "string" ? value : JSON.stringify(value ?? [], null, 2);
    return (
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{field.label}</span>
        <Textarea rows={8} value={text} onChange={(e) => {
          try { onChange(JSON.parse(e.target.value)); }
          catch { onChange(e.target.value); }
        }} className="mt-1.5 font-mono text-xs" />
        {typeof value === "string" && value.trim() && (() => { try { JSON.parse(value); return null; } catch { return <span className="mt-1 block text-xs text-destructive">This list has a formatting mistake (check quotes, commas and line breaks inside text). It may not show on the site until fixed.</span>; } })()}
      </label>
    );
  }
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{field.label}</span>
      <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
    </label>
  );
}

function CollectionEditor({ collection, label, extraMeta, lockable }: { collection: string; label: string; extraMeta: MetaField[]; lockable?: boolean }) {
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-collection", collection],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_items").select("*").eq("collection", collection).order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-collection", collection] });
    qc.invalidateQueries({ queryKey: ["collection", collection] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("content_items").insert({ collection, title: "Untitled", published: true });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-xl text-cream">{label}</h3>
        <Button size="sm" onClick={() => create.mutate()} className="bg-gold text-primary-foreground hover:opacity-90">
          <Plus className="mr-1 h-4 w-4" /> New
        </Button>
      </div>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="space-y-4">
          {items?.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
          {items?.map((item) => (
            <ItemEditor key={item.id} item={item as unknown as Item} extraMeta={extraMeta} lockable={lockable} onChange={invalidate} />
          ))}
        </div>
      )}
    </div>
  );
}

type Item = {
  id: string; collection: string; title: string; subtitle: string | null; body: string | null;
  image_url: string | null; meta: Record<string, unknown>; sort_order: number; published: boolean;
};

function ItemEditor({ item, extraMeta, lockable, onChange }: { item: Item; extraMeta: MetaField[]; lockable?: boolean; onChange: () => void }) {
  const [form, setForm] = useState(item);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("content_items").update({
        title: form.title, subtitle: form.subtitle, body: form.body,
        image_url: form.image_url, meta: form.meta as never, sort_order: form.sort_order, published: form.published,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("content_items").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5">
      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <div>
          <FieldInput field={{ name: "image_url", label: "Image", type: "image" }} value={form.image_url} onChange={(v) => setForm({ ...form, image_url: String(v) })} />
        </div>
        <div className="grid gap-3">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
          <Input value={form.subtitle ?? ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Subtitle" />
          <Textarea rows={4} value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Body" />
          {extraMeta.map((m) => {
            const cur = (form.meta as Record<string, unknown>)?.[m.name];
            if (m.type === "gallery") {
              return (
                <div key={m.name} className="grid gap-1" aria-label={m.label}>
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <BlocksEditor value={cur} photosOnly onChange={(v) => setForm({ ...form, meta: { ...form.meta, [m.name]: v } })} />
                </div>
              );
            }
            if (m.type === "bool") {
              return (
                <label key={m.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={!!cur}
                    onChange={(e) => setForm({ ...form, meta: { ...(form.meta as Record<string, unknown>), [m.name]: e.target.checked } })} />
                  {m.label}
                </label>
              );
            }
            if (m.type === "textarea") {
              return (
                <div key={m.name} className="grid gap-1">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <Textarea rows={10} placeholder={m.label} value={String(cur ?? "")}
                    onChange={(e) => setForm({ ...form, meta: { ...(form.meta as Record<string, unknown>), [m.name]: e.target.value } })} />
                </div>
              );
            }
            if (m.type === "video") {
              return (
                <FieldInput key={m.name} field={{ name: m.name, label: m.label, type: "video" }} value={cur}
                  onChange={(v) => setForm({ ...form, meta: { ...(form.meta as Record<string, unknown>), [m.name]: v } })} />
              );
            }
            return (
              <Input key={m.name} placeholder={m.label} value={String(cur ?? "")}
                onChange={(e) => setForm({ ...form, meta: { ...(form.meta as Record<string, unknown>), [m.name]: e.target.value } })} />
            );
          })}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Published
            </label>
            {lockable && (
              <label className="flex items-center gap-2 text-sm text-gold">
                <input type="checkbox" checked={!!(form.meta as Record<string, unknown>)?.locked}
                  onChange={(e) => setForm({ ...form, meta: { ...(form.meta as Record<string, unknown>), locked: e.target.checked } })} />
                🔒 Locked (paid unlock)
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Order
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-24" />
            </label>
            <div className="ml-auto flex gap-2">
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending} className="bg-gold text-primary-foreground hover:opacity-90">
                {save.isPending ? "…" : "Save"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this item?")) del.mutate(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Inbox() {
  const qc = useQueryClient();
  const { data: messages } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => (await supabase.from("messages").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: subs } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: async () => (await supabase.from("subscribers").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="font-serif text-xl text-cream">Messages ({messages?.length ?? 0})</h3>
        <div className="mt-4 space-y-3">
          {messages?.map((m) => (
            <div key={m.id} className="rounded-lg border border-border/60 bg-card/40 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-cream">{m.name} <span className="text-xs text-muted-foreground">({m.kind})</span></p>
                <button className="text-muted-foreground hover:text-destructive" onClick={async () => {
                  await supabase.from("messages").delete().eq("id", m.id);
                  qc.invalidateQueries({ queryKey: ["admin-messages"] });
                }}><Trash2 className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground">{m.email} · {new Date(m.created_at).toLocaleString()}</p>
              {m.subject && <p className="mt-2 text-sm text-gold">{m.subject}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.body}</p>
            </div>
          ))}
          {messages?.length === 0 && <p className="text-sm text-muted-foreground">No messages.</p>}
        </div>
      </div>
      <div>
        <h3 className="font-serif text-xl text-cream">Subscribers ({subs?.length ?? 0})</h3>
        <Broadcast emails={(subs ?? []).map((s) => s.email)} />
        <div className="mt-6 space-y-2">
          {subs?.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border border-border/60 bg-card/40 px-3 py-2 text-sm">
              <span>{s.email}</span>
              <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {subs?.length === 0 && <p className="text-sm text-muted-foreground">No subscribers yet.</p>}
        </div>
      </div>
    </div>
  );
}

const SITE_URL = "https://melchizedeck-kakese.lovable.app";

function Broadcast({ emails }: { emails: string[] }) {
  const [postId, setPostId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: posts } = useQuery({
    queryKey: ["admin-broadcast-posts"],
    queryFn: async () =>
      (await supabase
        .from("content_items")
        .select("id, title, subtitle, slug, body, collection, created_at")
        .in("collection", ["blog", "book", "script", "event", "speech"])
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(30)).data ?? [],
  });

  const PATHS: Record<string, string> = { blog: "/blog", book: "/books", script: "/scripts", event: "/events", speech: "/speeches" };

  function compose(id: string) {
    setPostId(id);
    const p = posts?.find((x) => x.id === id);
    if (!p) { setSubject(""); setBody(""); return; }
    const url = `${SITE_URL}${PATHS[p.collection] ?? "/"}#${p.slug ?? p.id}`;
    setSubject(`New from Melchizedeck Kakese: ${p.title}`);
    setBody(
      `Hello,\n\nI've just published something new — "${p.title}"${p.subtitle ? ` (${p.subtitle})` : ""}.\n\n` +
        (p.body ? `${p.body.slice(0, 400)}${p.body.length > 400 ? "…" : ""}\n\n` : "") +
        `Read it here: ${url}\n\nWarm regards,\nMelchizedeck Kakese\n${SITE_URL}`,
    );
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast.error(`Couldn't copy ${what.toLowerCase()}`);
    }
  }

  function downloadCsv() {
    const csv = ["email", ...emails].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails.join(","))}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-card/40 p-4">
      <p className="text-xs uppercase tracking-widest text-gold">Announce a new post</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Pick what you published, then send it from your own inbox. Subscribers go in BCC so nobody sees each other's address.
      </p>

      <select
        value={postId}
        onChange={(e) => compose(e.target.value)}
        className="mt-3 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
      >
        <option value="">Select content…</option>
        {posts?.map((p) => (
          <option key={p.id} value={p.id}>{p.collection}: {p.title}</option>
        ))}
      </select>

      {postId && (
        <div className="mt-3 space-y-2">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Message" />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => copy(emails.join(", "), "BCC list")} disabled={!emails.length}>
          Copy BCC list ({emails.length})
        </Button>
        <Button size="sm" variant="outline" onClick={downloadCsv} disabled={!emails.length}>Download CSV</Button>
        <Button size="sm" variant="outline" onClick={() => copy(`${subject}\n\n${body}`, "Announcement")} disabled={!subject && !body}>
          Copy message
        </Button>
        <Button
          size="sm"
          className="bg-gold text-primary-foreground hover:opacity-90"
          disabled={!emails.length || !subject}
          onClick={() => window.open(gmail, "_blank", "noopener")}
        >
          Open in Gmail
        </Button>
      </div>
    </div>
  );
}


function PaymentsSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings", "payments"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "payments").maybeSingle();
      return (data?.value ?? {}) as Record<string, unknown>;
    },
  });
  const [form, setForm] = useState<Record<string, unknown>>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert({ key: "payments", value: form as never }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Payments settings saved"); qc.invalidateQueries({ queryKey: ["admin-settings", "payments"] }); qc.invalidateQueries({ queryKey: ["site-settings", "payments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: purchases } = useQuery({
    queryKey: ["admin-purchases"],
    queryFn: async () => (await supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const { data: donations } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => (await supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });


  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border/60 bg-card/40 p-6">
        <h3 className="font-serif text-xl text-cream">Payments</h3>
        <p className="mt-1 text-xs text-muted-foreground">Standard unlock price applies to every locked book / screenplay. After paying, the buyer gets a <strong>one-hour bundle window</strong> to pick <strong>one</strong> additional book or screenplay for free (so their standard payment gives them <strong>two</strong> works total).</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Standard price</span>
            <Input type="number" value={Number(form.standard_price ?? 0)} onChange={(e) => setForm({ ...form, standard_price: Number(e.target.value) })} className="mt-1.5" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Currency</span>
            <Input value={String(form.currency ?? "TZS")} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mt-1.5" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Bundle window (minutes)</span>
            <Input type="number" value={Number(form.bundle_minutes ?? 60)} onChange={(e) => setForm({ ...form, bundle_minutes: Number(e.target.value) })} className="mt-1.5" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Free picks per bundle</span>
            <Input type="number" value={Number(form.bundle_free_picks ?? 1)} onChange={(e) => setForm({ ...form, bundle_free_picks: Number(e.target.value) })} className="mt-1.5" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Minimum contribution (Support My Vision)</span>
            <Input type="number" value={Number(form.min_donation ?? 500)} onChange={(e) => setForm({ ...form, min_donation: Number(e.target.value) })} className="mt-1.5" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Notification email (payment alerts)</span>
            <Input value={String(form.notify_email ?? "")} onChange={(e) => setForm({ ...form, notify_email: e.target.value })} className="mt-1.5" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Selcom payment link</span>
            <Input value={String(form.pay_link ?? "")} onChange={(e) => setForm({ ...form, pay_link: e.target.value })} placeholder="https://selcompay.me/70048280" className="mt-1.5" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Till / Lipa number</span>
            <Input value={String(form.till_number ?? "")} onChange={(e) => setForm({ ...form, till_number: e.target.value })} className="mt-1.5" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Merchant name (shown to payers)</span>
            <Input value={String(form.merchant_name ?? "")} onChange={(e) => setForm({ ...form, merchant_name: e.target.value })} className="mt-1.5" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">TIPS QR payload (scannable code)</span>
            <Input value={String(form.tips_qr ?? "")} onChange={(e) => setForm({ ...form, tips_qr: e.target.value })} className="mt-1.5" />
          </label>



        </div>
        <Button className="mt-6 bg-gold text-primary-foreground hover:opacity-90" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
        <div className="mt-6 rounded-md border border-border/60 bg-background/50 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-cream">Selcom webhook URL</p>
          <code className="mt-1 block break-all text-gold">{typeof window !== "undefined" ? `${window.location.origin}/api/public/selcom/webhook` : "/api/public/selcom/webhook"}</code>
          <p className="mt-2">Configure this URL in your Selcom merchant dashboard so payment confirmations reach the site.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 p-6">
        <h3 className="font-serif text-xl text-cream">Recent purchases</h3>
        <div className="mt-4 space-y-2">
          {purchases?.length === 0 && <p className="text-sm text-muted-foreground">No purchases yet.</p>}
          {purchases?.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${p.status === "paid" ? "bg-emerald-500/15 text-emerald-400" : p.status === "failed" ? "bg-destructive/20 text-destructive" : "bg-amber-500/15 text-amber-400"}`}>{p.status}</span>
              <span className="font-medium text-cream">{p.item_title ?? "—"}</span>
              <span className="text-muted-foreground">{p.email}</span>
              <span className="text-muted-foreground">{p.amount} {p.currency}</span>
              <span className="ml-auto text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 p-6">
        <h3 className="font-serif text-xl text-cream">Contributions (Support My Vision)</h3>
        <p className="mt-1 text-xs text-muted-foreground">Text and suggested amounts are editable under Pages → Site → Support My Vision.</p>
        <div className="mt-4 space-y-2">
          {donations?.length === 0 && <p className="text-sm text-muted-foreground">No contributions yet.</p>}
          {donations?.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${d.status === "paid" ? "bg-emerald-500/15 text-emerald-400" : d.status === "failed" ? "bg-destructive/20 text-destructive" : "bg-amber-500/15 text-amber-400"}`}>{d.status}</span>
              <span className="font-medium text-cream">{d.name ?? "Anonymous"}</span>
              <span className="text-muted-foreground">{d.email}</span>
              <span className="text-gold">{d.amount} {d.currency}</span>
              {d.message && <span className="text-muted-foreground italic">“{d.message}”</span>}
              <span className="ml-auto text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

  );
}

function FontField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const selected = findFont(value);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "admin-font-previews";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${FONT_OPTIONS.filter((f) => f.google)
      .map((f) => `family=${f.google}`)
      .join("&")}&display=swap`;
    document.head.appendChild(link);
  }, []);

  return (
    <div className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        <option value="">Site default</option>
        {FONT_GROUPS.map((g) => (
          <optgroup key={g} label={g}>
            {FONT_OPTIONS.filter((f) => f.group === g).map((f) => (
              <option key={f.family} value={f.family} style={{ fontFamily: f.stack }}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div className="mt-2 rounded-md border border-border/60 bg-card/60 px-3 py-3">
        <p className="text-lg leading-snug text-cream" style={{ fontFamily: selected?.stack }}>
          Words that move continents
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {selected ? `${selected.label} · ${selected.group}` : "Using the site default font"}
        </p>
      </div>
    </div>
  );
}
