-- ADD NOTES COLUMN TO BATCHES TABLE
-- This migration adds a notes column for storing batch-specific notes

-- Add notes column to batches table
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS notes text;

-- Add comment to describe the column
COMMENT ON COLUMN public.batches.notes IS 'Optional notes about the batch, editable by staff'; 