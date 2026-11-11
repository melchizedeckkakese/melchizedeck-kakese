import { usePaymentReference } from "@/lib/locks";
import { pageHead } from "@/lib/seo";
import { useReviewSummaries } from "@/lib/engagement";
import { ReviewsSection } from "@/components/site/ReviewsSection";
import { Stars } from "@/components/site/Stars";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSection, useCollection, type ContentItem } from "@/lib/cms";
import { SmartImage } from "@/components/site/SmartImage";
import { useUnlockEmail, useUnlocks, isItemLocked } from "@/lib/locks";
import { UnlockDialog } from "@/components/site/UnlockDialog";
import { ExpandableText } from "@/components/site/ExpandableText";
import { PriceTag } from "@/components/site/PriceTag";
import { Lock, Unlock, Gift, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { claimBundlePick } from "@/lib/payments.functions";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/books")({
  head: () => pageHead({ path: "/books", title: "Books by Melchizedeck Kakese | Novels, Poetry & Essays", description: "Discover books by Tanzanian author Melchizedeck Kakese: read samples, explore genres and buy novels, poetry and essays exploring human experience.", type: "website" }),
  component: Books,
});

function usePricing() {
  return useQuery({
    queryKey: ["site-settings", "payments"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "payments").maybeSingle();
      return (data?.value ?? {}) as { standard_price?: number; currency?: string; bundle_free_picks?: number };
    },
  });
}

function Books() {
  const { data: header } = useSection<{ title: string; body: string }>("books", "header");
  const { data: items } = useCollection("book");
  const [email] = useUnlockEmail();
  const { data: unlocks } = useUnlocks(email);
  const { data: pricing } = usePricing();
  const [openItem, setOpenItem] = useState<ContentItem | null>(null);
  const qc = useQueryClient();
  const claim = useServerFn(claimBundlePick);
  const paymentReference = usePaymentReference();
  const claimMut = useMutation({
    mutationFn: async (id: string) => claim({ data: { email, itemId: id, paymentReference: paymentReference ?? "" } }),
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
          <p className="text-xs font-accent uppercase tracking-[0.3em] text-gold">Bibliography</p>
          <h1 className="mt-3 font-serif text-5xl text-cream">{h?.title ?? "Books"}</h1>
          <p className="mt-4 text-muted-foreground">{h?.body}</p>
        </div>
        <div className="mt-6 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {items?.map((b) => {
            const locked = isItemLocked(b.meta) && !unlockedIds.has(b.id);
            const m = (b.meta ?? {}) as { genre?: string; status?: string; year?: string | number; price?: number; currency?: string; buy_url?: string; sample_url?: string; review_url?: string; notify_url?: string; coming_soon?: boolean };
            const itemPrice = m.price != null ? Number(m.price) : (pricing?.standard_price ?? null);
            const itemCurrency = m.currency ?? pricing?.currency ?? "TZS";
            const statusLine = [m.genre, m.status, m.year].filter(Boolean).join(" · ");
            return (
              <article key={b.id} className="group relative rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur">
                <div className="relative flex min-h-[16rem] w-full items-center justify-center overflow-hidden rounded-md border border-border/60 bg-background p-2">
                  <SmartImage
                    src={b.image_url}
                    alt={b.title}
                    loading="lazy"
                    fallbackLabel={b.title}
                    className={`max-h-[28rem] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.03] ${locked ? "blur-[3px]" : ""}`}
                    wrapperClassName="flex items-center justify-center"
                  />
                  {locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25">
                      <Lock className="h-8 w-8 text-gold drop-shadow-lg" />
                    </div>
                  )}
                </div>
                {statusLine && <p className="mt-4 text-xs uppercase tracking-widest text-gold">{statusLine}</p>}
                <div className="mt-1 flex items-start justify-between gap-3">
                  <h2 className="font-serif text-2xl text-cream">{b.title}</h2>
                  {itemPrice != null && !m.coming_soon && <PriceTag amount={itemPrice} currency={itemCurrency} className="shrink-0" />}
                </div>
                {b.subtitle && <p className="mt-1 text-sm text-gold/80">{b.subtitle}</p>}
                {(() => {
  const summary = reviewSummaries?.[b.id];

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
                {b.body && <ExpandableText text={b.body} preserveLineBreaks={/poem|poetry/i.test(m.genre ?? "")} className="mt-3 text-sm text-muted-foreground" />}
                {locked ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" className="bg-gold text-primary-foreground hover:opacity-90" onClick={() => setOpenItem(b)}>
                      <Lock className="mr-1 h-3.5 w-3.5" /> Unlock
                    </Button>
                    {bundleActive && email && (
                      <Button size="sm" variant="outline" disabled={claimMut.isPending} onClick={() => claimMut.mutate(b.id)}>
                        {claimMut.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Gift className="mr-1 h-3.5 w-3.5" />} Use free pick
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {isItemLocked(b.meta) && (
                      <p className="mt-3 inline-flex items-center gap-1 text-xs text-gold"><Unlock className="h-3.5 w-3.5" /> Unlocked</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {m.coming_soon ? (
                        <a href={m.notify_url ?? "/#newsletter"} className="inline-flex items-center rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">Notify Me</a>
                      ) : (
                        <>
                          {m.buy_url && <a href={m.buy_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">Buy Now</a>}
                          {m.sample_url && <a href={m.sample_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-cream hover:border-gold/60">Read Sample</a>}
                          {m.review_url && <a href={m.review_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-cream hover:border-gold/60">Leave a Review</a>}
                        </>
                      )}
                    </div>
                  </>
                )}
             <ReviewsSection itemId={b.id} />
              </article>
            );
          })}
          {items?.length === 0 && <p className="text-muted-foreground">No books yet.</p>}
        </div>
      </section>
      {openItem && (() => { const om = (openItem.meta ?? {}) as { price?: number | string; currency?: string }; const ip = om.price != null && om.price !== "" ? Number(om.price) : null; return <UnlockDialog item={openItem} onClose={() => setOpenItem(null)} price={pricing} itemPrice={ip} itemCurrency={om.currency ?? pricing?.currency} />; })()}
    </SiteLayout>
  );
}
