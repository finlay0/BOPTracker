-- 23-fix-batch-date-trigger.sql
-- ------------------------------------------------------------------
-- Guarantees Racking = Put-Up + 14 days
--            Filtering = Rack + (kit_weeks-2) weeks
--            Bottling  = Filter + 1 day  (shift Monday if Sunday)
-- Runs AFTER trg_assign_bop_number but before the row is written.
-- ------------------------------------------------------------------

-- 1. Clean up any earlier date triggers (names from old migrations)
DROP TRIGGER IF EXISTS trg_set_batch_dates      ON public.batches;
DROP TRIGGER IF EXISTS set_batch_dates_trigger  ON public.batches;
DROP FUNCTION IF EXISTS public.set_batch_dates();

-- 2. Helper to do the math
CREATE OR REPLACE FUNCTION public.calculate_batch_dates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    filter_weeks int;
BEGIN
    ------------------------------------------------------------------
    -- Put-Up: supplied by client (NEW.date_put_up is NOT NULL)
    ------------------------------------------------------------------

    -- Rack   = Put-Up + 14 days
    NEW.date_rack := NEW.date_put_up + INTERVAL '14 days';

    -- Filter = Rack + (kit_weeks-2) * 7 days
    filter_weeks := NEW.kit_weeks - 2;
    NEW.date_filter := NEW.date_rack + (filter_weeks * INTERVAL '7 days');

    -- Bottle = Filter + 1 day
    NEW.date_bottle := NEW.date_filter + INTERVAL '1 day';

    -- Never bottle on Sunday → push to Monday
    IF EXTRACT(DOW FROM NEW.date_bottle AT TIME ZONE 'America/Halifax') = 0 THEN
        NEW.date_bottle := NEW.date_bottle + INTERVAL '1 day';
    END IF;

    RETURN NEW;
END;
$$;

-- 3. BEFORE-INSERT trigger that calls the helper
DROP TRIGGER IF EXISTS trg_calculate_batch_dates ON public.batches;

CREATE TRIGGER trg_calculate_batch_dates
BEFORE INSERT ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.calculate_batch_dates();