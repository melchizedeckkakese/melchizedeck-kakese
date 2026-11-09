import { pageHead } from "@/lib/seo";
import { useReviewSummaries } from "@/lib/engagement";
import { ReviewsSection } from "@/components/site/ReviewsSection";
import { Stars } from "@/components/site/Stars";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSection, useCollection, type ContentItem } from "@/lib/cms";
import { SmartImage } from "@/components/site/SmartImage";
import { useUnlockEmail, useUnlocks, isItemLocked } from "@/lib/locks";
import { TreatmentRequestDialog } from "@/components/site/TreatmentRequestDialog";
import { UnlockDialog } from "@/components/site/UnlockDialog";
import { ExpandableText } from "@/components/site/ExpandableText";
import { PriceTag } from "@/components/site/PriceTag";
import { BookOpen, Lock, Gift, Loader2, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { claimBundlePick } from "@/lib/payments.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Header = { title: string; body: string };

export const Route = createFileRoute("/scripts")({
  head: () => pageHead({ path: "/scripts", title: "Screenplays & Scripts | Melchizedeck Kakese", description: "Screenplays and teleplays by screenwriter Melchizedeck Kakese. Explore public loglines, unlock paid synopses, and request screenplay treatments with your contact and professional details.", type: "website" }),
  component: Scripts,
});

function Scripts() {
  const { data: header } = useSection<Header>("scripts", "header");
  const { data: items } = useCollection("script");
  const [email] = useUnlockEmail();
  const { data: unlocks } = useUnlocks(email);
  const { data: pricing } = useQuery({
    queryKey: ["site-settings", "payments"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "payments").maybeSingle();
      return (data?.value ?? {}) as { standard_price?: number; currency?: string };
    },
  });
  const [treatmentItem, setTreatmentItem] = useState<ContentItem | null>(null);
  const [unlockItem, setUnlockItem] = useState<ContentItem | null>(null);
  const qc = useQueryClient();
  const claim = useServerFn(claimBundlePick);
  const claimMut = useMutation({
    mutationFn: async (id: string) => claim({ data: { email, itemId: id } }),
    onSuccess: () => { toast.success("Free pick claimed!"); qc.invalidateQueries({ queryKey: ["unlocks", email] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const unlockedIds = new Set(unlocks?.itemIds ?? []);
  const bundleActive = !!unlocks?.bundleExpiresAt;
  const h = header?.content;
const itemIds = items?.map((item) => item.id) ?? [];
const { data: reviewSummaries } = useReviewSummaries(itemIds);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-accent uppercase tracking-[0.3em] text-gold">Screenwriting</p>
          <h1 className="mt-3 font-serif text-5xl text-cream">{h?.title}</h1>
          <p className="mt-4 text-muted-foreground">{h?.body}</p>
        </div>
        <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items?.map((it: ContentItem) => {
            const synopsisLocked = isItemLocked(it.meta) && !unlockedIds.has(it.id);
            const m = (it.meta ?? {}) as { genre?: string; status?: string; price?: number; currency?: string; request_url?: string; request_email?: string };
            const itemPrice = m.price != null ? Number(m.price) : (pricing?.standard_price ?? null);
            const itemCurrency = m.currency ?? pricing?.currency ?? "TZS";
            return (
              <article key={it.id} className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur">
                {it.image_url && (
                  <div className="relative flex min-h-[14rem] items-center justify-center overflow-hidden bg-background/60 p-2">
                    <SmartImage
                      src={it.image_url}
                      alt={it.title}
                      loading="lazy"
                      fallbackLabel={it.title}
                      className="max-h-[28rem] w-auto max-w-full object-contain"
                      wrapperClassName="flex items-center justify-center"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest">
                    {m.genre && <span className="text-gold">{m.genre}</span>}
                    {m.genre && m.status && <span className="text-muted-foreground/60">·</span>}
                    {m.status && <span className="text-muted-foreground">{m.status}</span>}
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <h2 className="font-serif text-xl text-cream">{it.title}</h2>
                    {synopsisLocked && itemPrice != null && <PriceTag amount={itemPrice} currency={itemCurrency} className="shrink-0" />}
                  </div>
                  {it.subtitle && <p className="mt-1 text-sm text-gold/80">{it.subtitle}</p>}
                  {(() => {
  const summary = reviewSummaries?.[it.id];

  if (!summary) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <Stars value={0} size={16} />
        <span className="text-xs text-muted-foreground">
          No reviews yet
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <Stars value={summary.average} size={16} />
      <span className="text-xs text-muted-foreground">
        {summary.average.toFixed(1)} · {summary.count}{" "}
        {summary.count === 1 ? "review" : "reviews"}
      </span>
    </div>
  );
})()}
                  {it.body && (
                    <>
                      <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground/70">Logline</p>
                      <ExpandableText text={it.body} className="mt-1 text-sm text-muted-foreground" />
                    </>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {synopsisLocked ? (
                      <Button size="sm" variant="outline" onClick={() => setUnlockItem(it)}>
                        <Lock className="mr-1 h-3.5 w-3.5" /> Read Synopsis
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/scripts/$id" params={{ id: it.slug || it.id }}>
                          <BookOpen className="mr-1 h-3.5 w-3.5" /> Read Synopsis
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" className="bg-gold text-primary-foreground hover:opacity-90" onClick={() => setTreatmentItem(it)}>
                      <FileText className="mr-1 h-3.5 w-3.5" /> Request Screenplay Treatment
                    </Button>
                    {synopsisLocked && bundleActive && email && (
                      <Button size="sm" variant="outline" disabled={claimMut.isPending} onClick={() => claimMut.mutate(it.id)}>
                        {claimMut.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Gift className="mr-1 h-3.5 w-3.5" />} Use free pick
                      </Button>
                    )}
                  </div>
                  <ReviewsSection itemId={it.id} />
                </div>
              </article>
            );
          })}
          {items?.length === 0 && <p className="text-muted-foreground">Nothing here yet — check back soon.</p>}
        </div>
      </section>
      {treatmentItem && <TreatmentRequestDialog title={treatmentItem.title} onClose={() => setTreatmentItem(null)} />}
      {unlockItem && (() => { const om = (unlockItem.meta ?? {}) as { price?: number | string; currency?: string }; const ip = om.price != null && om.price !== "" ? Number(om.price) : null; return <UnlockDialog synopsis item={unlockItem} onClose={() => setUnlockItem(null)} price={pricing} itemPrice={ip} itemCurrency={om.currency ?? pricing?.currency} />; })()}
    </SiteLayout>
  );
}
