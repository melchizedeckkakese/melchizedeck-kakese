DROP POLICY IF EXISTS "public read unlocks" ON public.unlocks;
REVOKE SELECT ON public.unlocks FROM anon;

DROP POLICY IF EXISTS "anyone can unlike own device" ON public.content_likes;
DROP POLICY IF EXISTS "public read likes" ON public.content_likes;
REVOKE SELECT, DELETE ON public.content_likes FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_like_stats(_item_ids uuid[], _visitor_key text)
RETURNS TABLE(item_id uuid, like_count bigint, mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.item_id, count(*)::bigint, bool_or(l.visitor_key = _visitor_key)
  FROM public.content_likes l
  WHERE l.item_id = ANY(_item_ids)
  GROUP BY l.item_id
$$;

CREATE OR REPLACE FUNCTION public.unlike_item(_item_id uuid, _visitor_key text)
RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.content_likes
  WHERE item_id = _item_id AND visitor_key = _visitor_key
    AND length(_visitor_key) BETWEEN 8 AND 100
$$;

REVOKE ALL ON FUNCTION public.get_like_stats(uuid[], text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unlike_item(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_like_stats(uuid[], text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlike_item(uuid, text) TO anon, authenticated;