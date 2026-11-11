DROP POLICY IF EXISTS "anyone create pending donation" ON public.donations;
CREATE POLICY "anyone create pending donation" ON public.donations
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
GRANT INSERT ON public.donations TO anon, authenticated;
GRANT INSERT ON public.purchases TO anon, authenticated;
