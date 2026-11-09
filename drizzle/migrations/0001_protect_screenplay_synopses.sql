CREATE TABLE public.script_synopses (
 item_id uuid PRIMARY KEY REFERENCES public.content_items(id) ON DELETE CASCADE,
 synopsis text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.script_synopses TO authenticated;
GRANT ALL ON public.script_synopses TO service_role;
ALTER TABLE public.script_synopses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manages synopses" ON public.script_synopses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.script_synopses (item_id, synopsis) SELECT id, COALESCE(meta->>'synopsis','') FROM public.content_items WHERE collection='script';
CREATE FUNCTION public.store_script_synopsis() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.collection='script' AND NEW.meta ? 'synopsis' THEN
 INSERT INTO public.script_synopses(item_id,synopsis) VALUES(NEW.id,COALESCE(NEW.meta->>'synopsis','')) ON CONFLICT(item_id) DO UPDATE SET synopsis=EXCLUDED.synopsis;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER store_script_synopsis AFTER INSERT OR UPDATE OF meta ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.store_script_synopsis();
CREATE FUNCTION public.strip_public_script_synopsis() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.collection='script' AND NEW.meta ? 'synopsis' THEN
 INSERT INTO public.script_synopses(item_id,synopsis) VALUES(NEW.id,COALESCE(NEW.meta->>'synopsis','')) ON CONFLICT(item_id) DO UPDATE SET synopsis=EXCLUDED.synopsis;
 NEW.meta=NEW.meta-'synopsis';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER store_script_synopsis ON public.content_items;
DROP FUNCTION public.store_script_synopsis();
CREATE OR REPLACE FUNCTION public.strip_public_script_synopsis() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.collection='script' AND NEW.meta ? 'synopsis' THEN
 INSERT INTO public.script_synopses(item_id,synopsis) VALUES(NEW.id,COALESCE(NEW.meta->>'synopsis','')) ON CONFLICT(item_id) DO UPDATE SET synopsis=EXCLUDED.synopsis;
 NEW.meta=NEW.meta-'synopsis';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER strip_public_script_synopsis BEFORE UPDATE OF meta ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.strip_public_script_synopsis();
CREATE OR REPLACE FUNCTION public.capture_new_script_synopsis() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.collection='script' THEN
 INSERT INTO public.script_synopses(item_id,synopsis) VALUES(NEW.id,COALESCE(NEW.meta->>'synopsis','')) ON CONFLICT(item_id) DO NOTHING;
 IF NEW.meta ? 'synopsis' THEN UPDATE public.content_items SET meta=meta-'synopsis' WHERE id=NEW.id; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER capture_new_script_synopsis AFTER INSERT ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.capture_new_script_synopsis();
UPDATE public.content_items SET meta=meta-'synopsis' WHERE collection='script' AND meta ? 'synopsis';
CREATE FUNCTION public.read_script_synopsis(script_id uuid, payment_reference text DEFAULT '') RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE it public.content_items; result text;
BEGIN
 SELECT * INTO it FROM public.content_items WHERE id=script_id AND collection='script' AND published;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF COALESCE(it.meta->>'locked','false')='true' AND NOT EXISTS (
 SELECT 1 FROM public.purchases p JOIN public.unlocks u ON u.email=p.email
 WHERE p.order_ref=payment_reference AND p.status='paid' AND u.item_id=script_id AND (u.expires_at IS NULL OR u.expires_at>now())
 ) THEN RETURN NULL; END IF;
 SELECT synopsis INTO result FROM public.script_synopses WHERE item_id=script_id;
 RETURN COALESCE(NULLIF(btrim(result),''),it.body,'No synopsis available yet.');
END $$;
REVOKE ALL ON FUNCTION public.read_script_synopsis(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_script_synopsis(uuid,text) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.strip_public_script_synopsis() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.capture_new_script_synopsis() FROM PUBLIC;