import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { startCheckout } from "@/lib/payments.functions";
import { setStoredEmail, storePaymentReference } from "@/lib/locks";
import { useLocalPrice } from "@/lib/currency";
import { SelcomPayPanel, type PayInstructions } from "@/components/site/SelcomPayPanel";

type Props = {
  item: { id: string; title: string };
  onClose: () => void;
  price?: { standard_price?: number; currency?: string };
  itemPrice?: number | null;
  itemCurrency?: string;
  synopsis?: boolean;
};

export function UnlockDialog({ item, onClose, price, itemPrice, itemCurrency, synopsis }: Props) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [manual, setManual] = useState<PayInstructions | null>(null);
  const start = useServerFn(startCheckout);
  const qc = useQueryClient();

  const go = useMutation({
    mutationFn: async () => start({ data: { email, phone, itemId: item.id } }),
    onSuccess: (r) => {
      setStoredEmail(email);
      storePaymentReference(r.orderRef);
      qc.invalidateQueries({ queryKey: ["unlocks", email.trim().toLowerCase()] });
      if (r.manual && (r.manual.payLink || r.manual.qrPayload)) {
        setManual({
          orderRef: r.orderRef,
          amount: Number(r.amount),
          currency: r.currency,
          ...r.manual,
          payLink: r.manual.payLink || r.checkoutUrl || null,
        });
      } else if (r?.checkoutUrl) {
        window.location.href = r.checkoutUrl;
      } else {
        toast.success(`Order ${r.orderRef.slice(0, 8)} created. Once payment is completed you'll get access — refresh this page after paying.`);
        onClose();
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const effectivePrice = itemPrice ?? price?.standard_price ?? null;
  const effectiveCurrency = itemCurrency ?? price?.currency ?? "TZS";
  const standard = price?.standard_price ?? null;
  const qualifiesForBundle = effectivePrice != null && standard != null && effectivePrice >= standard;
  const { data: localized } = useLocalPrice(effectivePrice, effectiveCurrency);
  const priceLabel = effectivePrice != null
    ? (localized?.formatted ?? `${effectivePrice.toLocaleString()} ${effectiveCurrency}`)
    : "the standard price";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-gold"><Lock className="h-5 w-5" /><span className="text-xs uppercase tracking-widest">Unlock</span></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <h3 className="mt-3 font-serif text-2xl text-cream">{item.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Pay {priceLabel} to unlock this work.{qualifiesForBundle ? " Because this meets the standard price, you'll get a 1-hour window to pick one additional book or screenplay for free." : ""}
        </p>
        {localized?.isConverted && (
          <p className="mt-1 text-[11px] text-muted-foreground/80">Charged as {localized.original} — your card may show a small conversion difference.</p>
        )}
        {manual ? (
          <div className="mt-5">
            <SelcomPayPanel info={manual} />
            {synopsis && <Button asChild className="mt-4 w-full" variant="outline">
              <a href={`/scripts/${item.id}`}>Open synopsis after payment</a>
            </Button>}
            <Button variant="outline" className="mt-4 w-full" onClick={onClose}>Done</Button>
          </div>
        ) : (
        <>
        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Phone (for M-Pesa / Tigo Pesa / Airtel Money)</span>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712345678" className="mt-1.5" />
          </label>
        </div>
        <Button
          className="mt-5 w-full bg-gold text-primary-foreground hover:opacity-90"
          disabled={go.isPending || !email.includes("@")}
          onClick={() => go.mutate()}
        >
          {go.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
          Continue to payment
        </Button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Payments are processed by Selcom. Access is tied to your email — enter the same email later to restore access.
        </p>
        </>
        )}
      </div>
    </div>
  );
}
