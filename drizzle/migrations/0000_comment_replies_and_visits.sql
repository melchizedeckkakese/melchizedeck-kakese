ALTER TABLE public.content_comments ADD COLUMN IF NOT EXISTS admin_reply text, ADD COLUMN IF NOT EXISTS replied_at timestamptz;
GRANT UPDATE ON public.content_comments TO authenticated;
CREATE POLICY "admin reply comments" ON public.content_comments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key text NOT NULL,
  path text NOT NULL,
  referrer text,
  user_agent text,
  country text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.site_visits TO anon, authenticated;
GRANT SELECT, DELETE ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone logs visit" ON public.site_visits FOR INSERT TO anon, authenticated WITH CHECK (length(visitor_key) BETWEEN 8 AND 100 AND length(path) <= 300 AND coalesce(length(referrer),0) <= 500 AND coalesce(length(user_agent),0) <= 400);
CREATE POLICY "admin reads visits" ON public.site_visits FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin deletes visits" ON public.site_visits FOR DELETE TO authenticated USING (public.is_admin());
CREATE INDEX site_visits_created_idx ON public.site_visits (created_at DESC);