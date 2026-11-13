import { useState, useEffect } from "react";
import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCollection, useSection } from "@/lib/cms";
import { SmartImage } from "@/components/site/SmartImage";
import { ExpandableText } from "@/components/site/ExpandableText";
import { AboutGallery } from "@/components/site/AboutGallery";
import { parseBlocks } from "@/components/site/AboutBlocks";
import { SupportVision } from "@/components/site/SupportVision";
import { ArrowUpRight, Heart, Link2, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  head: () =>
    pageHead({
      path: "/projects",
      title: "Projects & Initiatives | Melchizedeck Kakese",
      description:
        "Initiatives founded and supported by Melchizedeck Kakese, including The Writer's Frame, writing platforms, youth programmes and community work.",
      type: "website",
    }),
  component: Projects,
});

function Projects() {
  const { data: header } = useSection<{ title?: string; body?: string }>("projects", "header");
  const { data: projects } = useCollection("project");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const h = header?.content;

  // Auto-scroll and highlight if loaded with a #project-... hash
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, []);

  const handleCopyLink = (anchorId: string, title: string) => {
    const url = `${window.location.origin}/projects#${anchorId}`;
    navigator.clipboard.writeText(url).then(
      () => {
        setCopiedId(anchorId);
        toast.success(`Copied direct link for "${title}"!`);
        setTimeout(() => setCopiedId(null), 2500);
      },
      () => toast.error("Could not copy link")
    );
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-xs font-accent uppercase tracking-[0.3em] text-gold">Portfolio</p>
        <h1 className="mt-3 font-serif text-5xl text-cream">{h?.title ?? "Projects"}</h1>
        {h?.body && <p className="mt-4 max-w-2xl text-muted-foreground">{h.body}</p>}

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {(projects ?? []).map((p) => {
            const meta = (p.meta ?? {}) as {
              role?: string;
              url?: string;
              support_url?: string;
              supportUrl?: string;
              support_label?: string;
              supportLabel?: string;
              gallery?: unknown;
              galleryTitle?: string;
            };

            const photos = parseBlocks(meta.gallery)
              .filter((block) => block.type === "image")
              .filter((photo) => !!photo.url);

            const role = meta.role || p.subtitle || "";
            const anchorId = `project-${p.slug || p.id}`;
            const supportLink = meta.support_url || meta.supportUrl;
            const supportText = meta.support_label || meta.supportLabel || "Support Project";

            return (
              <article
                key={p.id}
                id={anchorId}
                className="group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/70 transition hover:border-gold/50"
              >
                {p.image_url && (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-background/60">
                    <SmartImage
                      src={p.image_url}
                      alt={p.title}
                      className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                      fallbackLabel={p.title}
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif text-2xl text-foreground">{p.title}</h2>
                    {/* One-click direct permalink button */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(anchorId, p.title)}
                      title="Copy direct link for this project"
                      className="rounded-md border border-border/60 p-1.5 text-muted-foreground transition hover:border-gold/60 hover:text-gold"
                    >
                      {copiedId === anchorId ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {role && (
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold/80">{role}</p>
                  )}

                  {p.body && (
                    <ExpandableText
                      text={p.body}
                      threshold={220}
                      className="mt-4 text-sm text-muted-foreground"
                    />
                  )}

                  <AboutGallery photos={photos} title={meta.galleryTitle || "Photo catalogue"} embedded />

                  {/* Actions: Support Button & Visit Link */}
                  <div className="mt-auto pt-6 flex flex-wrap items-center gap-3">
                    {supportLink ? (
                      <a
                        href={supportLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-gold px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-gold/90"
                      >
                        <Heart className="h-3.5 w-3.5 fill-black" />
                        {supportText}
                      </a>
                    ) : (
                      <a
                        href="#support"
                        className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-gold transition hover:bg-gold hover:text-black"
                      >
                        <Heart className="h-3.5 w-3.5" />
                        Support Initiative
                      </a>
                    )}

                    {meta.url && (
                      <a
                        href={meta.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-gold/80 hover:text-gold hover:underline"
                      >
                        Visit <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {(!projects || projects.length === 0) && (
          <p className="mt-14 text-muted-foreground">Projects will be listed here soon.</p>
        )}
      </section>

      {/* On-page contribution section for supporting initiatives */}
      <SupportVision />
    </SiteLayout>
  );
}
