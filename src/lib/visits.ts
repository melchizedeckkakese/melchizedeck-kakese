import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorKey } from "@/lib/engagement";

const GEO_KEY = "mk-visit-geo";

async function getGeo(): Promise<{ country?: string; city?: string }> {
  try {
    const cached = sessionStorage.getItem(GEO_KEY);
    if (cached) return JSON.parse(cached);
    const r = await fetch("https://ipapi.co/json/");
    const j = await r.json();
    const g = { country: j.country_name as string | undefined, city: j.city as string | undefined };
    sessionStorage.setItem(GEO_KEY, JSON.stringify(g));
    return g;
  } catch {
    return {};
  }
}

/** Logs one row per page view (skips admin/auth pages). */
export function useTrackVisit(pathname: string) {
  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return;
    let cancelled = false;
    (async () => {
      const geo = await getGeo();
      if (cancelled) return;
      await supabase.from("site_visits").insert({
        visitor_key: getVisitorKey(),
        path: pathname.slice(0, 300),
        referrer: document.referrer ? document.referrer.slice(0, 500) : null,
        user_agent: navigator.userAgent.slice(0, 400),
        country: geo.country ?? null,
        city: geo.city ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);
}
