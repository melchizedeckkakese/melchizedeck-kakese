import { useQuery } from "@tanstack/react-query";

const CUR_KEY = "mk_user_currency_v2";
const RATES_KEY = "mk_rates_";

const REGION_CURRENCY: Record<string, string> = { TZ:"TZS", KE:"KES", UG:"UGX", RW:"RWF", BI:"BIF", CD:"CDF", ZA:"ZAR", NG:"NGN", GH:"GHS", ZM:"ZMW", MW:"MWK", MZ:"MZN", ET:"ETB", EG:"EGP", MA:"MAD", US:"USD", CA:"CAD", GB:"GBP", AU:"AUD", NZ:"NZD", IN:"INR", JP:"JPY", CN:"CNY", AE:"AED", SA:"SAR", SE:"SEK", NO:"NOK", DK:"DKK", CH:"CHF", PL:"PLN", BR:"BRL", MX:"MXN", DE:"EUR", FR:"EUR", IT:"EUR", ES:"EUR", NL:"EUR", BE:"EUR", IE:"EUR", PT:"EUR", AT:"EUR", FI:"EUR", GR:"EUR" };

function guessFromBrowser(): string | null {
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const l of langs) {
      const region = l?.split("-")[1]?.toUpperCase();
      if (region && REGION_CURRENCY[region]) return REGION_CURRENCY[region];
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Africa/Dar_es_Salaam") return "TZS";
    if (tz === "Africa/Nairobi") return "KES";
    if (tz === "Africa/Kampala") return "UGX";
    if (tz === "Africa/Kigali") return "RWF";
    if (tz.startsWith("Europe/London")) return "GBP";
    if (tz.startsWith("America/")) return "USD";
  } catch { /* ignore */ }
  return null;
}

async function fetchJson(url: string): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; } finally { clearTimeout(t); }
}

async function detectCurrency(): Promise<string> {
  if (typeof window === "undefined") return "TZS";
  const cached = window.localStorage.getItem(CUR_KEY);
  if (cached && /^[A-Z]{3}$/.test(cached)) return cached;
  const save = (c: string) => { window.localStorage.setItem(CUR_KEY, c); return c; };
  const a = await fetchJson("https://ipwho.is/");
  const c1 = a?.currency?.code;
  if (typeof c1 === "string" && /^[A-Z]{3}$/.test(c1)) return save(c1);
  const b = await fetchJson("https://ipapi.co/json/");
  if (typeof b?.currency === "string" && /^[A-Z]{3}$/.test(b.currency)) return save(b.currency);
  const cc = (a?.country_code || b?.country_code || "").toUpperCase();
  if (REGION_CURRENCY[cc]) return save(REGION_CURRENCY[cc]);
  return guessFromBrowser() ?? "TZS";
}

async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const key = `${RATES_KEY}${from}_${to}`;
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      try {
        const { rate, ts } = JSON.parse(raw);
        if (Date.now() - ts < 12 * 60 * 60 * 1000) return rate;
      } catch { /* ignore */ }
    }
  }
  try {
    const r = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const j = await r.json();
    const rate = j?.rates?.[to];
    if (typeof rate === "number") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify({ rate, ts: Date.now() }));
      }
      return rate;
    }
  } catch { /* ignore */ }
  return 1;
}

export function useLocalPrice(amount: number | undefined | null, baseCurrency: string | undefined) {
  const base = (baseCurrency || "TZS").toUpperCase();
  return useQuery({
    queryKey: ["local-price", base, amount],
    enabled: amount != null,
    staleTime: 12 * 60 * 60 * 1000,
    queryFn: async () => {
      const target = await detectCurrency();
      const rate = await getRate(base, target);
      const converted = (amount ?? 0) * rate;
      return {
        base,
        target,
        converted,
        formatted: formatMoney(converted, target),
        original: formatMoney(amount ?? 0, base),
        isConverted: target !== base,
      };
    },
  });
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString()} ${currency}`;
  }
}
