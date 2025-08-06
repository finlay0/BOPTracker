-- 24-fix-current-stage-constraint.sql
-- Allows both legacy ('racked', …) and new ('rack', …) stage names
BEGIN;

ALTER TABLE public.batches
  DROP CONSTRAINT IF EXISTS batches_current_stage_check;

ALTER TABLE public.batches
  ADD CONSTRAINT batches_current_stage_check
  CHECK (
    current_stage IN (
      -- new spelling
      'sale', 'put-up', 'rack', 'filter', 'bottle', 'completed',
      -- legacy spelling (keep for historical rows / reports)
      'racked', 'filtered', 'bottled'
    )
  );

COMMIT;