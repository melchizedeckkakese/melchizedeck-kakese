import { ShareButtons } from "@/components/site/ShareButtons";
import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead, PERSON_LD, WEBSITE_LD, SITE_URL } from "@/lib/seo";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  useSection,
  useCollection,
  fetchSection,
  parseList,
  fetchCollection,
} from "@/lib/cms";
import { SupportVision } from "@/components/site/SupportVision";
import {
  ArrowRight,
  BookOpen,
  PenLine,
  Sparkles,
  Users,
  HeartHandshake,
  FolderOpen,
} from "lucide-react";
import { ImpactNumbers, type Impact } from "@/components/site/ImpactNumbers";
import { EventsSlideshow } from "@/components/site/EventsSlideshow";
import { RotatingHeadline } from "@/components/site/RotatingHeadline";
import { RoadStoriesSlideshow } from "@/components/site/RoadStoriesSlideshow";
import { ExpandableText } from "@/components/site/ExpandableText";
import { latestFirst } from "@/lib/journey";
import { ArchiveHighlights } from "@/components/site/ArchiveHighlights";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [hero, featured, pillars, impact, books, events, stories, scripts, blogs] = await Promise.all([
      fetchSection<Hero>("home", "hero").catch(() => null),
      fetchSection<Featured>("home", "featured").catch(() => null),
      fetchSection<Pillars>("home", "pillars").catch(() => null),
      fetchSection<Impact>("home", "impact").catch(() => null),
      fetchCollection("book").catch(() => []),
      fetchCollection("event").catch(() => []),
      fetchCollection("advocacy").catch(() => []),
      fetchCollection("script").catch(() => []),
      fetchCollection("blog").catch(() => []),
    ]);
    return { hero, featured, pillars, impact, books, events, stories, scripts, blogs };
  },
  head: ({ loaderData }) => {
    const video =
      (loaderData?.hero?.content?.videoUrl || "").trim() || DEFAULT_HERO_VIDEO;
    const poster =
      (loaderData?.hero?.content?.posterUrl || "").trim() || DEFAULT_HERO_POSTER;
    const seo = pageHead({
      path: "/",
      title: "Melchizedeck Kakese | Author, Screenwriter & Youth Advocate",
      description:
        "Melchizedeck Kakese is a Tanzanian author, screenwriter, youth advocate and founder of The Writer's Frame, sharing books, screenplays and youth projects.",
      image: poster.startsWith("http") ? poster : `${SITE_URL}${poster}`,
      jsonLd: [PERSON_LD, WEBSITE_LD],
    });
    return {
      ...seo,
      links: [
        ...seo.links,
        { rel: "preload", as: "image", href: poster, fetchpriority: "high" },
        { rel: "preload", as: "video", href: video, type: "video/mp4" },
      ],
    };
  },
  component: Index,
});


type Hero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryTo: string;
  ctaSecondaryLabel: string;
  ctaSecondaryTo: string;
  videoUrl?: string;
  posterUrl?: string;
  rotatingPrefix?: string;
  rotatingPhrases?: string[] | string;
};

const DEFAULT_HERO_VIDEO = "/VID_20260817_122335_118%20%282%29.mp4";
const DEFAULT_HERO_POSTER = "/20260705_145620.jpg";

type Featured = {
  label: string;
  title: string;
  body: string;
  imageUrl: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel: string;
  secondaryTo: string;
};

type Pillars = {
  eyebrow?: string;
  title: string;
  items: {
    title: string;
    body: string;
  }[];
  projectsLabel?: string;
  projectsNote?: string;
};

const ICONS = [
  PenLine,
  Users,
  HeartHandshake,
  BookOpen,
  Sparkles,
];

const DEFAULT_PILLARS: Pillars = {
  eyebrow: "What I Do",
  title: "Writing, Advocacy & Community Impact",
  items: [
    {
      title: "Writing",
      body:
        "I write books, poetry, screenplays and essays that explore human experience, African stories and the questions that shape how we see the world.",
    },
    {
      title: "Advocacy",
      body:
        "I create platforms and opportunities that help young people discover their voices, express their ideas and take an active role in shaping their communities.",
    },
    {
      title: "Community Impact",
      body:
        "I build and lead youth-centered initiatives that bring together creativity, communication, leadership and community action to turn ideas into meaningful work.",
    },
  ],
  projectsLabel: "Explore My Projects",
  projectsNote:
    "Discover the initiatives, platforms and creative work behind the journey.",
};

function Index() {
  const preloaded = Route.useLoaderData();
  const { data: hero } = useSection<Hero>("home", "hero", {
    initialData: preloaded.hero,
  });
  const { data: featured } = useSection<Featured>("home", "featured", {
    initialData: preloaded.featured,
  });
  const { data: pillars } = useSection<Pillars>("home", "pillars", {
    initialData: preloaded.pillars,
  });
  const { data: books } = useCollection("book", {
    initialData: preloaded.books,
  });
  const { data: events } = useCollection("event", {
    initialData: preloaded.events,
    refetchInterval: 60_000,
  });


  const h = hero?.content;
  const latestEvent = latestFirst(events ?? [])[0];
  const f: Featured | undefined = latestEvent ? {
    label: featured?.content?.label || "Point of Focus",
    title: latestEvent.title,
    body: latestEvent.body || latestEvent.subtitle || "",
    imageUrl: latestEvent.image_url || "",
    primaryLabel: "View events",
    primaryTo: "/events",
    secondaryLabel: "",
    secondaryTo: "",
  } : featured?.content;

  const pillarItems = parseList<Pillars["items"][number]>(pillars?.content?.items).filter((i) => i && i.title);
  const p: Pillars = pillarItems.length
    ? { ...DEFAULT_PILLARS, ...pillars?.content, items: pillarItems }
    : { ...DEFAULT_PILLARS, ...(pillars?.content ?? {}), items: DEFAULT_PILLARS.items };

  const featuredImage =
    f?.imageUrl || (latestEvent ? "" : books?.[0]?.image_url) || "";

  const heroVideo =
    (h?.videoUrl || "").trim() || DEFAULT_HERO_VIDEO;

  const heroPoster =
    (h?.posterUrl || "").trim() || DEFAULT_HERO_POSTER;

  const phrases = Array.isArray(h?.rotatingPhrases)
    ? h.rotatingPhrases
    : String(h?.rotatingPhrases ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

  return (
    <SiteLayout>
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative -mt-px min-h-[88svh] overflow-hidden">
        {/* Background poster */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${heroPoster}")`,
          }}
        />

        {/* Background video */}
        <video
          key={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={heroPoster}
          src={heroVideo}
          onLoadedData={(e) => {
            const video = e.currentTarget;
            video.style.opacity = "1";
            void video.play().catch(() => {});
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
        />

        {/* Dark overlay */}
        <div
          aria-hidden
          className="absolute inset-0 bg-black/60"
        />

        {/* Hero content */}
        <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
          {h?.eyebrow && (
            <p className="text-xs font-medium font-accent uppercase tracking-[0.3em] text-gold">
              {h.eyebrow}
            </p>
          )}

          <RotatingHeadline
            prefix={h?.rotatingPrefix || "I am"}
            phrases={phrases}
          />

          {h?.subtitle && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
              {h.subtitle}
            </p>
          )}

          {(h?.ctaPrimaryLabel || h?.ctaSecondaryLabel) && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {h?.ctaPrimaryLabel && (
                <Link
                  to={h.ctaPrimaryTo || "/books"}
                  className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  {h.ctaPrimaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}

              {h?.ctaSecondaryLabel && (
                <Link
                  to={h.ctaSecondaryTo || "/blog"}
                  className="inline-flex rounded-md border border-white/50 px-6 py-3 text-sm text-white transition hover:bg-white/10"
                >
                  {h.ctaSecondaryLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          FEATURED
      ========================================================== */}
      {f && (
        <section className="border-t border-border/40 bg-background py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
            {/* Text */}
            <div className="order-2 md:order-1">
              {f.label && (
                <p className="text-xs font-medium font-accent uppercase tracking-[0.3em] text-gold">
                  {f.label}
                </p>
              )}

              <h2 className="mt-4 font-serif text-4xl text-foreground">
                {f.title}
              </h2>

              {f.body && (
                <ExpandableText key={latestEvent?.id ?? f.body} text={f.body} threshold={240} moreHref={latestEvent ? "/events" : undefined} className="mt-4 text-muted-foreground" />
              )}

              <div className="mt-4">
                <ShareButtons title={f.title || "Point of Focus"} path="/events" text={(f.body || "").slice(0, 140)} />
              </div>

              {(f.primaryLabel || f.secondaryLabel) && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {f.primaryLabel && (
                    <Link
                      to={f.primaryTo || "/books"}
                      className="rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      {f.primaryLabel}
                    </Link>
                  )}

                  {f.secondaryLabel && (
                    <Link
                      to={f.secondaryTo || "/books"}
                      className="rounded-md border border-border px-5 py-2.5 text-sm text-foreground transition hover:bg-muted"
                    >
                      {f.secondaryLabel}
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Image */}
            <div className="order-1 md:order-2">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-lg border border-gold/20 bg-card shadow-2xl shadow-black/20">
                {featuredImage ? (
                  <img
                    key={featuredImage}
                    src={featuredImage}
                    alt={f.title}
                    loading="eager"
                    onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center font-serif text-2xl text-gold/70">
                    {f.title}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          EVENTS
      ========================================================== */}
      <EventsSlideshow initialData={preloaded.events} />
      <RoadStoriesSlideshow initialData={preloaded.stories} />
      <ArchiveHighlights books={preloaded.books} scripts={preloaded.scripts} blogs={preloaded.blogs} />

      {/* =========================================================
          WHAT I DO
      ========================================================== */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-6xl px-6">
          {/* Section heading */}
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-accent uppercase tracking-[0.3em] text-gold">
              {p.eyebrow ?? "What I Do"}
            </p>

            <h2 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">
              {p.title ?? "Ideas into words. Words into impact."}
            </h2>
          </div>

          {/* Pillars */}
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {p.items?.map((item, i) => {
              const Icon = ICONS[i % ICONS.length];

              return (
                <div
                  key={`${item.title}-${i}`}
                  className="group rounded-xl border border-border/60 bg-card p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg"
                >
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-gold transition group-hover:bg-gold group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Title */}
                  <h3 className="mt-6 font-serif text-2xl text-foreground">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <ExpandableText key={item.body} text={item.body} moreHref="/projects" className="mt-3 text-sm text-muted-foreground" />
                </div>
              );
            })}
          </div>

          {/* Projects CTA */}
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            {p.projectsNote && (
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {p.projectsNote}
              </p>
            )}

            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <FolderOpen className="h-4 w-4" />
              {p.projectsLabel || "Explore My Projects"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          IMPACT NUMBERS
      ========================================================== */}
      <ImpactNumbers initialData={preloaded.impact} />

      {/* =========================================================
          SUPPORT / VISION
      ========================================================== */}
      <SupportVision />
    </SiteLayout>
  );
}
