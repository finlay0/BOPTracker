-- Enable Row-Level Security for all tables
ALTER TABLE public.wineries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bop_sequences ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- 1. USERS TABLE
-- Users can see and update their own profile.
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 2. WINERIES TABLE
-- Users can only see the winery they belong to.
CREATE POLICY "Users can view their own winery" ON public.wineries
  FOR SELECT USING (id = (SELECT winery_id FROM public.users WHERE id = auth.uid()));

-- 3. BATCHES TABLE
-- Users can only interact with batches belonging to their own winery.
CREATE POLICY "Users can manage batches for their own winery" ON public.batches
  FOR ALL USING (winery_id = (SELECT winery_id FROM public.users WHERE id = auth.uid()));

-- 4. SUPPORT MESSAGES TABLE
-- Users can only interact with support messages for their own winery.
CREATE POLICY "Users can manage support messages for their own winery" ON public.support_messages
  FOR ALL USING (winery_id = (SELECT winery_id FROM public.users WHERE id = auth.uid()));

-- 5. BOP SEQUENCES TABLE
-- This table should not be directly accessible to users. Triggers handle it.
-- We will create a policy that denies all access.
CREATE POLICY "Deny all access to bop_sequences" ON public.bop_sequences
  FOR ALL USING (false);
