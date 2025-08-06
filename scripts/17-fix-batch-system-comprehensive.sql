-- Comprehensive fix for batch system data flow issues
-- This migration fixes all the critical issues while preserving authentication

-- 1. ADD MISSING COLUMNS TO BATCHES TABLE
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for batches table
DROP TRIGGER IF EXISTS update_batches_updated_at ON public.batches;
CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON public.batches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 2. FIX STATUS AND CURRENT_STAGE CONSTRAINTS
-- Update the constraints to match what the code expects
ALTER TABLE public.batches 
DROP CONSTRAINT IF EXISTS batches_status_check;

ALTER TABLE public.batches 
ADD CONSTRAINT batches_status_check 
CHECK (status IN ('pending', 'completed'));

ALTER TABLE public.batches 
DROP CONSTRAINT IF EXISTS batches_current_stage_check;

ALTER TABLE public.batches 
ADD CONSTRAINT batches_current_stage_check 
CHECK (current_stage IN ('sale', 'put-up', 'racked', 'filtered', 'bottled', 'completed'));

-- Update any existing 'done' status to 'completed'
UPDATE public.batches SET status = 'completed' WHERE status = 'done';

-- Update current_stage values to match interface
UPDATE public.batches SET current_stage = 'racked' WHERE current_stage = 'rack';
UPDATE public.batches SET current_stage = 'filtered' WHERE current_stage = 'filter';
UPDATE public.batches SET current_stage = 'bottled' WHERE current_stage = 'bottle';

-- 3. FIX THE get_next_bop_number FUNCTION (change uuid to bigint)
DROP FUNCTION IF EXISTS public.get_next_bop_number(uuid);

CREATE OR REPLACE FUNCTION public.get_next_bop_number(winery_id_param bigint)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_bop_number integer;
BEGIN
    -- Check if user belongs to the winery (keep authentication check)
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND winery_id = winery_id_param
    ) THEN
        RAISE EXCEPTION 'Access denied: User does not belong to this winery';
    END IF;
    
    -- Increment and get next BOP number
    UPDATE public.bop_sequences 
    SET last_bop_number = last_bop_number + 1
    WHERE winery_id = winery_id_param
    RETURNING last_bop_number INTO next_bop_number;
    
    -- If no sequence exists, create one
    IF next_bop_number IS NULL THEN
        INSERT INTO public.bop_sequences (winery_id, last_bop_number)
        VALUES (winery_id_param, 1)
        RETURNING last_bop_number INTO next_bop_number;
    END IF;
    
    RETURN next_bop_number;
END;
$$;

-- 4. ADD SUPPORT MESSAGES MISSING COLUMNS (if needed)
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add trigger for support_messages table
DROP TRIGGER IF EXISTS update_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER update_support_messages_updated_at
    BEFORE UPDATE ON public.support_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 5. ADD USERS TABLE MISSING COLUMNS (for settings/admin functionality)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. POPULATE EMAIL AND FULL_NAME FROM AUTH.USERS (safely)
UPDATE public.users 
SET 
    email = au.email,
    full_name = au.raw_user_meta_data->>'full_name'
FROM auth.users au 
WHERE public.users.id = au.id 
    AND public.users.email IS NULL;

-- 7. ADD MISSING COLUMNS TO WINERIES (for admin panel)
ALTER TABLE public.wineries 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add trigger for wineries table
DROP TRIGGER IF EXISTS update_wineries_updated_at ON public.wineries;
CREATE TRIGGER update_wineries_updated_at
    BEFORE UPDATE ON public.wineries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. COMMENTS FOR CLARITY
COMMENT ON COLUMN public.batches.customer_email IS 'Optional customer email for notifications';
COMMENT ON COLUMN public.batches.updated_at IS 'Automatically updated timestamp';
COMMENT ON FUNCTION public.get_next_bop_number(bigint) IS 'Gets next BOP number for a winery (fixed to use bigint)';