-- MINIMAL FIX FOR CONSTRAINT ISSUES
-- This migration only fixes the constraint problems without changing existing data

-- 1. DROP THE PROBLEMATIC CONSTRAINTS
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_current_stage_check;
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_status_check;

-- 2. ADD NEW CONSTRAINTS THAT INCLUDE BOTH OLD AND NEW VALUES
-- This allows existing data to remain as-is while supporting new values
ALTER TABLE public.batches 
ADD CONSTRAINT batches_current_stage_check 
CHECK (current_stage IN (
    -- Old values (keep for existing data)
    'put-up', 'racked', 'filtered', 'bottled',
    -- New values (for new system)
    'sale', 'rack', 'filter', 'bottle', 'completed'
));

ALTER TABLE public.batches 
ADD CONSTRAINT batches_status_check 
CHECK (status IN ('pending', 'completed', 'done'));

-- 3. ADD MISSING COLUMNS
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL; 