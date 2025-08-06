-- Ensure authenticated users can insert batches with bop_number
-- 1. Grant INSERT on table to both anon and authenticated roles
GRANT INSERT ON TABLE public.batches TO authenticated;
GRANT INSERT ON TABLE public.batches TO anon;

-- 2. Add explicit WITH CHECK policy for INSERT so Postgres allows row
DROP POLICY IF EXISTS "Users can insert batches for their own winery" ON public.batches;
CREATE POLICY "Users can insert batches for their own winery" ON public.batches
  FOR INSERT
  WITH CHECK (winery_id = (SELECT winery_id FROM public.users WHERE id = auth.uid()));