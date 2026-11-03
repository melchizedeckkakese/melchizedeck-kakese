import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { uploadMedia } from "@/lib/cms";
import { suggestPalette } from "@/lib/palette.functions";
import { contrastRatio, PALETTE_PAIRS } from "@/lib/contrast";

export function PaletteAssistant({ onApply }: { onApply: (colors: Record<string, string>) => void }) {
  const run = useServerFn(suggestPalette);
  const [goals, setGoals] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ colors: Record<string, string>; rationale: string } | null>(null);

  const go = async () => {
    setLoading(true);
    try {
      const r = await run({ data: { goals, imageUrl: imageUrl || undefined } });
      if ("error" in r) toast.error(r.error);
      else setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-lg border border-gold/40 bg-background/40 p-4">
      <div className="flex items-center gap-2 text-cream"><Sparkles className="h-4 w-4 text-gold" /> <span className="font-serif text-lg">AI colour assistant</span></div>
      <p className="mt-1 text-sm text-muted-foreground">Describe the feeling you want, or add a reference photo. You'll get a matching, easy-to-read palette to review before applying.</p>
      <Textarea rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g. Warm, hopeful and literary; earthy African tones with a bold accent" className="mt-3" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {imageUrl ? (
          <div className="relative">
            <img src={imageUrl} alt="Reference" className="h-16 w-24 rounded border border-border object-cover" />
            <button type="button" aria-label="Remove reference image" onClick={() => setImageUrl("")} className="absolute -right-2 -top-2 rounded-full bg-card p-0.5 border border-border"><X className="h-3 w-3" /></button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent/10">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Add reference image"}
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              setUploading(true);
              try { setImageUrl(await uploadMedia(f)); } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
              finally { setUploading(false); e.target.value = ""; }
            }} />
          </label>
        )}
        <Button type="button" onClick={go} disabled={loading || uploading || (!goals.trim() && !imageUrl)} className="bg-gold text-primary-foreground hover:opacity-90">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Thinking…</> : "Suggest palette"}
        </Button>
      </div>

      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(result.colors).map(([k, v]) => (
              <div key={k} className="text-center text-[10px] text-muted-foreground">
                <div className="h-10 w-14 rounded border border-border" style={{ background: v }} />
                <div className="mt-1">{k}</div><div>{v}</div>
              </div>
            ))}
          </div>
          {result.rationale && <p className="text-sm text-foreground/90">{result.rationale}</p>}
          <ul className="grid gap-1 text-xs">
            {PALETTE_PAIRS.map((p) => {
              const r = contrastRatio(result.colors[p.fg] ?? "", result.colors[p.bg] ?? "");
              const ok = r != null && r >= p.min;
              return (
                <li key={p.label} className="flex items-center gap-2">
                  <span className="rounded px-2 py-0.5" style={{ background: result.colors[p.bg], color: result.colors[p.fg] }}>Aa</span>
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className={ok ? "text-gold" : "text-destructive"}>{r ? `${r.toFixed(1)}:1` : "—"} {ok ? "✓ readable" : `needs ${p.min}:1`}</span>
                </li>
              );
            })}
          </ul>
          <Button type="button" variant="outline" onClick={() => { onApply(result.colors); toast.success("Palette filled in below — review, then Save changes."); }}>Use these colours</Button>
        </div>
      )}
    </div>
  );
}
