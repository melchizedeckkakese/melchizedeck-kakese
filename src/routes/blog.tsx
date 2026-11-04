import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSection, useCollection } from "@/lib/cms";
import { ShareButtons } from "@/components/site/ShareButtons";
import { LikeButton } from "@/components/site/LikeButton";
import { CommentsSection } from "@/components/site/CommentsSection";
import { ExpandableText } from "@/components/site/ExpandableText";

export const Route = createFileRoute("/blog")({
  head: () => pageHead({ path: "/blog", title: "Blog & Essays | Melchizedeck Kakese", description: "Essays, reflections and stories by Melchizedeck Kakese on writing, African narratives, youth, creativity and the questions that shape our world.", type: "website" }),
  component: Blog,
});

function Blog() {
  const { data: header } = useSection<{ title: string; body: string }>(
    "blog",
    "header",
  );
  const { data: items } = useCollection("blog");
  const h = header?.content;
  const [filter, setFilter] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();

    items?.forEach((p) => {
      const c = (p.meta as { category?: string } | null)?.category;
      if (c) set.add(c);
    });

    return ["All", ...Array.from(set)];
  }, [items]);

  const filtered =
    filter === "All"
      ? items
      : items?.filter(
          (p) =>
            (p.meta as { category?: string } | null)?.category === filter,
        );

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-xs font-accent uppercase tracking-[0.3em] text-gold">
          Blog &amp; Essays
        </p>

        <h1 className="mt-3 font-serif text-5xl text-cream">
          {h?.title}
        </h1>

        <p className="mt-4 text-muted-foreground">{h?.body}</p>

        {categories.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition ${
                  filter === c
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border/60 text-muted-foreground hover:border-gold/60 hover:text-cream"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="mt-14 space-y-10">
          {filtered?.map((post) => {
            const m = (post.meta ?? {}) as {
              category?: string;
              read_time?: string; audio_url?: string;
            };

            const dateStr = new Date(
              post.created_at,
            ).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
            });

            const meta = [m.category, dateStr, m.read_time]
              .filter(Boolean)
              .join(" · ");

            return (
              <article
                key={post.id}
                id={post.slug ?? post.id}
                className="scroll-mt-24 border-b border-border/40 pb-10"
              >
                <p className="text-xs uppercase tracking-widest text-gold">
                  {meta}
                </p>

                <h2 className="mt-2 font-serif text-3xl text-cream">
                  {post.title}
                </h2>

                {post.subtitle && (
                  <p className="mt-1 text-gold/80">{post.subtitle}</p>
                )}

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    loading="lazy"
                    className="mt-6 aspect-[16/9] w-full rounded-lg border border-border/60 object-cover"
                  />
                )}

                {post.body && (
                  <ExpandableText
                    text={post.body}
                    threshold={600}
                    preserveLineBreaks={/poem|poetry/i.test(m.category ?? "")}
                    className="mt-6 text-muted-foreground"
                  />
                )}

                {m.audio_url && (
                  <div className="mt-6 rounded-lg border border-border/60 bg-card/60 p-4">
                    <p className="text-xs uppercase tracking-widest text-gold">Listen to this piece</p>
                    <audio src={m.audio_url} controls preload="none" className="mt-2 w-full" />
                  </div>
                )}

                {/* Engagement */}
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <LikeButton itemId={post.id} />

                  <ShareButtons
                    title={post.title}
                    path={`/blog#${post.slug ?? post.id}`}
                    text={post.subtitle ?? undefined}
                  />
                </div>

                <CommentsSection itemId={post.id} />
              </article>
            );
          })}

          {filtered?.length === 0 && (
            <p className="text-muted-foreground">No essays yet.</p>
          )}
        </div>
      </section>
    </SiteLayout>
  );
      }
