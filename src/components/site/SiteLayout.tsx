import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, ShieldCheck, ChevronDown, Instagram, Facebook, Linkedin, Mail, MessageCircle, ShoppingBag, AtSign, Link2 } from "lucide-react";
import { useIsAdmin, useSection, useCollection } from "@/lib/cms";
import { useTypography } from "@/lib/fonts";
import { CookieConsent } from "@/components/site/CookieConsent";
import { JoinTheFamily } from "@/components/site/JoinTheFamily";
import { cn } from "@/lib/utils";
import bgPhoto from "@/assets/kakese-community.jpg.asset.json";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
const JUNGLE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'>
    <g fill='none' stroke='%23e5b567' stroke-width='1.2' stroke-linecap='round' opacity='0.55'>
      <path d='M60 380 Q90 250 140 160'/>
      <path d='M80 340 Q60 320 40 315'/><path d='M90 310 Q70 288 48 282'/>
      <path d='M100 280 Q82 258 60 250'/><path d='M112 248 Q96 226 74 216'/>
      <path d='M124 214 Q112 192 92 180'/><path d='M136 180 Q128 160 112 148'/>
      <path d='M330 380 L330 250'/>
      <path d='M270 240 Q330 200 390 240 Q380 220 330 210 Q280 220 270 240 Z'/>
      <path d='M290 220 Q330 195 370 220'/>
      <path d='M210 90 Q240 60 270 90 Q240 120 210 90 Z'/><path d='M240 62 L240 118'/>
      <circle cx='30' cy='40' r='2' fill='%23e5b567' stroke='none'/>
      <circle cx='50' cy='30' r='1.5' fill='%23e5b567' stroke='none'/>
      <circle cx='70' cy='45' r='1.8' fill='%23e5b567' stroke='none'/>
      <circle cx='380' cy='60' r='2' fill='%23e5b567' stroke='none'/>
      <circle cx='400' cy='80' r='1.5' fill='%23e5b567' stroke='none'/>
      <path d='M150 400 L165 388 L180 400 L195 388 L210 400 L225 388 L240 400'/>
      <path d='M0 200 L12 190 L24 200 L36 190 L48 200'/>
    </g>
  </svg>`
)}`;

type NavChild = { to: string; hash?: string; label: string };
type NavNode = { to: string; label: string; children?: NavChild[] };

const NAV: NavNode[] = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  {
    to: "/books",
    label: "My Archive",
    children: [
      { to: "/books", label: "Books" },
      { to: "/scripts", label: "Scripts" },
      { to: "/blog", label: "Blog" },
    ],
  },
  {
    to: "/advocacy",
    label: "Journey",
    children: [
      { to: "/advocacy", label: "Advocacy" },
      { to: "/events", label: "Events" },
      { to: "/advocacy", hash: "adventures", label: "Adventures" },
      { to: "/speeches", label: "Speeches" },
    ],
  },
  { to: "/contact", label: "Contact & Partner" },
];

const FOOTER_LINKS: NavChild[] = [
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/books", label: "Books" },
  { to: "/scripts", label: "Scripts" },
  { to: "/blog", label: "Blog" },
  { to: "/advocacy", label: "Advocacy" },
  { to: "/events", label: "Events" },
  { to: "/speeches", label: "Speeches" },
  { to: "/contact", label: "Contact & Partner" },
];

function projectAnchor(p: { slug: string | null; id: string }) {
  return `project-${p.slug || p.id}`;
}

const DEFAULT_SOCIALS = {
  instagram: "https://www.instagram.com/melchizedeckkakese",
  threads: "https://www.threads.com/@melchizedeckkakese",
  facebook: "https://www.facebook.com/meckie06",
  linkedin: "https://www.linkedin.com/in/melchizedeck-kakese-89a8b42b3",
  whatsapp: "https://whatsapp.com/channel/0029VaTYeyJL2AU0K2Scpu1k",
  amazon: "https://amzn.eu/d/0cpRNl28",
  email: "mailto:Melchizedeckkakese@gmail.com",
  discord: "",
  linktree: "https://linktr.ee/melchizedeckkakese",
};

type Socials = Partial<typeof DEFAULT_SOCIALS>;

function useVerifiedBackground(url: string, fallback: string) {
  const [src, setSrc] = useState(fallback);
  useEffect(() => {
    if (!url || url === fallback) { setSrc(fallback); return; }
    const img = new Image();
    let done = false;
    img.onload = () => { if (!done) { done = true; setSrc(url); } };
    img.onerror = () => { if (!done) { done = true; setSrc(fallback); } };
    img.src = url;
    return () => { done = true; };
  }, [url, fallback]);
  return src;
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { data: isAdmin } = useIsAdmin();
  useTypography();
  const { data: footer } = useSection<{ tagline?: string; copyright?: string } & Socials>("site", "footer");
  const { data: bgSection } = useSection<Record<string, string | undefined>>("site", "background");
  const pageKey = `bg_${pathname.split("/")[1]?.replace(/_$/, "") ?? ""}`;
  const bgUrl = bgSection?.content?.[pageKey] || bgSection?.content?.imageUrl || "";
  const bgImage = useVerifiedBackground(bgUrl, bgPhoto.url);
  const socials: Socials = { ...DEFAULT_SOCIALS, ...(footer?.content ?? {}) };
  const { data: projectItems } = useCollection("project");
  const navTree: NavNode[] = NAV.map((node) =>
    node.to === "/projects"
      ? {
          ...node,
          children: (projectItems ?? []).map((p) => ({
            to: "/projects",
            hash: projectAnchor(p),
            label: p.title,
          })),
        }
      : node,
  );

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${bgImage}")`, filter: "blur(6px) saturate(115%)", transform: "scale(1.08)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ backgroundImage: `url("${JUNGLE_SVG}")`, backgroundRepeat: "repeat", backgroundSize: "420px 420px", opacity: 0.35, mixBlendMode: "overlay" }}
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background/55" />

<header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
  <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-5 md:flex md:justify-between">
    <Link to="/" className="min-w-0 shrink-0 truncate font-serif text-xl tracking-wide text-cream">
      M.<span className="text-gold">Kakese</span>
    </Link>
    <nav aria-label="Main navigation" className="hidden min-w-0 items-center gap-3 md:flex xl:gap-6">
      {navTree.map((item) =>
        item.children && item.children.length > 0 ? (
          <div key={item.label} className="group relative">
            <Link
              to={item.to}
              className={cn(
                "inline-flex items-center gap-1 text-sm transition-colors hover:text-gold",
                item.children.some((c) => c.to === pathname) || pathname === item.to
                  ? "text-gold"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
              <ChevronDown className="h-3.5 w-3.5" />
            </Link>
            <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="min-w-[220px] rounded-lg border border-border/60 bg-background/95 p-2 shadow-lg backdrop-blur">
                {item.children.map((c) => (
                  <Link
                    key={`${c.to}-${c.label}`}
                    to={c.to}
                    hash={c.hash}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-gold/10 hover:text-gold"
                  >
                    <span className="text-gold/50">└</span>
                    <span className="truncate">{c.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "text-sm transition-colors hover:text-gold",
              pathname === item.to ? "text-gold" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ),
      )}


      {isAdmin && (
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold/10"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin
        </Link>
      )}

      <ThemeSwitcher />
    </nav>

    <div className="flex shrink-0 items-center gap-3 md:hidden">
      <ThemeSwitcher />

      <Button
        variant="ghost" size="icon" className="text-cream"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? <X /> : <Menu />}
      </Button>
    </div>
  </div>

  {open && (
    <div className="border-t border-border/40 bg-background/95 md:hidden">
      <nav className="mx-auto flex max-w-7xl flex-col px-6 py-4">
        {navTree.map((item) => (
          <div key={item.label}>
            <Link
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "block py-2 text-sm",
                pathname === item.to ? "text-gold" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
            {item.children && item.children.length > 0 && (
              <div className="ml-3 border-l border-border/60 pl-3">
                {item.children.map((c) => (
                  <Link
                    key={`${c.to}-${c.label}`}
                    to={c.to}
                    hash={c.hash}
                    onClick={() => setOpen(false)}
                    className="block py-1.5 text-sm text-muted-foreground hover:text-gold"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}


        {isAdmin && (
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="mt-2 py-2 text-sm text-gold"
          >
            Admin dashboard
          </Link>
        )}
      </nav>
    </div>
  )}
</header>

      <main className={cn("flex-1", pathname !== "/admin" && "site-reading")}>{children}</main>

      <footer className="border-t border-border/40 bg-background/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12">
          <JoinTheFamily
            links={{
              instagram: socials.instagram,
              linkedin: socials.linkedin,
              facebook: socials.facebook,
              threads: socials.threads,
              whatsapp: socials.whatsapp,
            }}
          />
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-serif text-lg text-cream">M.<span className="text-gold">Kakese</span></div>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{footer?.content?.tagline ?? "Words that move continents."}</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {FOOTER_LINKS.map((n) => (
                <Link key={n.to} to={n.to} className="hover:text-gold">{n.label}</Link>
              ))}
            </div>
          </div>
          <SocialsBar socials={socials} />
          <p className="text-xs text-muted-foreground">{footer?.content?.copyright ?? "© Melchizedeck Kakese."}</p>
        </div>
      </footer>

      <CookieConsent />

    </div>
  );
}

function SocialsBar({ socials }: { socials: Socials }) {
  const items: { key: keyof typeof DEFAULT_SOCIALS; label: string; icon: ReactNode }[] = [
    { key: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
    { key: "threads", label: "Threads", icon: <AtSign className="h-4 w-4" /> },
    { key: "facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" /> },
    { key: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" /> },
    { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" /> },
    { key: "amazon", label: "Amazon", icon: <ShoppingBag className="h-4 w-4" /> },
    { key: "discord", label: "Discord", icon: <MessageCircle className="h-4 w-4" /> },
    { key: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
    { key: "linktree", label: "Linktree", icon: <Link2 className="h-4 w-4" /> },
  ];
  const visible = items.filter((i) => socials[i.key]);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-6">
      <span className="mr-2 text-xs font-accent uppercase tracking-[0.3em] text-gold">Follow</span>
      {visible.map((i) => (
        <a
          key={i.key}
          href={socials[i.key]!}
          target={socials[i.key]!.startsWith("mailto:") ? undefined : "_blank"}
          rel="noreferrer"
          aria-label={i.label}
          title={i.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-cream transition hover:border-gold/60 hover:text-gold"
        >
          {i.icon}
          <span>{i.label}</span>
        </a>
      ))}
    </div>
  );
}
