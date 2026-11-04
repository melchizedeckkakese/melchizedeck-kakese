import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function device(ua: string | null) {
  if (!ua) return "Unknown";
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iPhone/iPad" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "Other";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${br} on ${os}`;
}

function source(ref: string | null) {
  if (!ref) return "Direct";
  try { return new URL(ref).hostname.replace(/^www\./, ""); } catch { return ref; }
}

export function VisitorTracker() {
  const { data, isLoading } = useQuery({
    queryKey: ["site-visits"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_visits").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading visits…</p>;
  const rows = data ?? [];
  const dayAgo = Date.now() - 864e5;
  const today = rows.filter((r) => new Date(r.created_at).getTime() > dayAgo);
  const visitors = new Set(rows.map((r) => r.visitor_key)).size;
  const count = (key: (r: (typeof rows)[number]) => string) => {
    const m: Record<string, number> = {};
    rows.forEach((r) => { const k = key(r); m[k] = (m[k] ?? 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  };
  const labels: Record<string, string> = {};
  let n = 0;
  const label = (k: string) => (labels[k] ??= `Visitor #${++n}`);

  const Box = ({ title, items }: { title: string; items: [string, number][] }) => (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <h3 className="text-xs uppercase tracking-widest text-gold">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm">{items.map(([k, v]) => <li key={k} className="flex justify-between gap-2 text-muted-foreground"><span className="truncate">{k}</span><span className="text-cream">{v}</span></li>)}</ul>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Page views (last 500)", rows.length], ["Last 24 hours", today.length], ["Different devices", visitors]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border/60 bg-card/60 p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">{l}</p><p className="mt-1 font-serif text-3xl text-cream">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Box title="Top pages" items={count((r) => r.path)} />
        <Box title="Countries" items={count((r) => [r.city, r.country].filter(Boolean).join(", ") || "Unknown")} />
        <Box title="Came from" items={count((r) => source(r.referrer))} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/60">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground"><tr>{["When", "Who", "Page", "Place", "Device", "From"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/40 text-muted-foreground">
                <td className="whitespace-nowrap p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3 text-cream">{label(r.visitor_key)}</td>
                <td className="p-3">{r.path}</td>
                <td className="p-3">{[r.city, r.country].filter(Boolean).join(", ") || "—"}</td>
                <td className="p-3">{device(r.user_agent)}</td>
                <td className="p-3">{source(r.referrer)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="p-3">No visits recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Visitors are shown by device and rough location; names and emails are not known unless people contact you.</p>
    </div>
  );
}
