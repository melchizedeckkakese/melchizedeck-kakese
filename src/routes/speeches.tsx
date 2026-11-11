import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSection, useCollection, type ContentItem } from "@/lib/cms";
import { SmartImage } from "@/components/site/SmartImage";
import { ExpandableText } from "@/components/site/ExpandableText";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Play, Clock } from "lucide-react";

export const Route = createFileRoute("/speeches")({
  head: () => pageHead({ path: "/speeches", title: "Showreel | Melchizedeck Kakese", description: "Watch recorded speeches, talks and keynotes by Melchizedeck Kakese on storytelling, youth advocacy, leadership and African narratives.", type: "website" }),
  component: Speeches,
});

type SpeechMeta = {
  video_url?: string;
  external_url?: string;
  date?: string;
  location?: string;
  duration?: string;
};

/** Turns a YouTube/Vimeo watch URL into an embeddable player URL. */
function toEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return raw;
      if (url.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${url.pathname.split("/")[2]}`;
      const v = url.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (host.endsWith("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host.endsWith("facebook.com") || host.endsWith("fb.watch")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}&show_text=false`;
    }
    return null;
  } catch {
    return null;
  }
}

function youtubeThumb(raw: string): string | null {
  const embed = toEmbedUrl(raw);
  if (!embed || !embed.includes("youtube.com/embed/")) return null;
  const id = embed.split("/embed/")[1]?.split(/[?&]/)[0];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

function Speeches() {
  const { data: header } = useSection<{ title: string; body: string }>("speeches", "header");
  const { data: items } = useCollection("speech");
  const [active, setActive] = useState<ContentItem | null>(null);
  const h = header?.content;

  const sorted = [...(items ?? [])].sort((a, b) => {
    const ad = new Date(((a.meta as SpeechMeta)?.date ?? a.created_at) || 0).getTime();
    const bd = new Date(((b.meta as SpeechMeta)?.date ?? b.created_at) || 0).getTime();
    return bd - ad;
  });

  const activeMeta = (active?.meta ?? {}) as SpeechMeta;
  const activeSource = activeMeta.video_url || activeMeta.external_url || "";
  const activeEmbed = activeMeta.external_url ? toEmbedUrl(activeMeta.external_url) : null;

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h1 className="font-serif text-5xl text-cream">{h?.title ?? "Showreel"}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          {h?.body ?? "Talks, keynotes and conversations — recorded on stage and online."}
        </p>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((item) => {
            const meta = (item.meta ?? {}) as SpeechMeta;
            const poster = item.image_url || (meta.external_url ? youtubeThumb(meta.external_url) : null);
            const playable = !!(meta.video_url || (meta.external_url && toEmbedUrl(meta.external_url)));
            return (
              <article key={item.id} className="group overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur">
                <button
                  type="button"
                  onClick={() => (playable ? setActive(item) : meta.external_url && window.open(meta.external_url, "_blank", "noreferrer"))}
                  className="relative block aspect-video w-full overflow-hidden bg-background/60"
                  aria-label={`Play ${item.title}`}
                >
                  <SmartImage src={poster} alt={item.title} fallbackLabel={item.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/20">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 bg-background/70 text-gold">
                      <Play className="h-6 w-6" />
                    </span>
                  </span>
                  {meta.duration && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-background/80 px-2 py-0.5 text-xs text-cream">
                      <Clock className="h-3 w-3 text-gold" /> {meta.duration}
                    </span>
                  )}
                </button>
                <div className="p-5">
                  <h2 className="font-serif text-xl text-cream">{item.title}</h2>
                  {item.subtitle && <p className="mt-1 text-sm text-gold/80">{item.subtitle}</p>}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {meta.date && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-gold" /> {meta.date}</span>}
                    {meta.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gold" /> {meta.location}</span>}
                  </div>
                  {item.body && <ExpandableText text={item.body} className="mt-3 text-sm text-muted-foreground" />}
                </div>
              </article>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <p className="mt-10 text-muted-foreground">No videos published yet — check back soon.</p>
        )}
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="font-serif text-xl text-cream">{active?.title}</DialogTitle>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            {activeEmbed ? (
              <iframe
                src={activeEmbed}
                title={active?.title ?? "Speech"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full"
              />
            ) : activeSource ? (
              <video src={activeSource} controls autoPlay playsInline poster={active?.image_url ?? undefined} className="h-full w-full" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
