-- Assign BOP number automatically if the client didn’t supply one
-- (safety-net so the column can never be NULL)

-- 1. Create or replace helper function
CREATE OR REPLACE FUNCTION public.assign_bop_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set the number if the client omitted it (or sent NULL)
  IF NEW.bop_number IS NULL THEN
    NEW.bop_number := public.get_next_bop_number(NEW.winery_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Attach BEFORE INSERT trigger to batches table
DROP TRIGGER IF EXISTS trg_assign_bop_number ON public.batches;
CREATE TRIGGER trg_assign_bop_number
  BEFORE INSERT ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_bop_number();
