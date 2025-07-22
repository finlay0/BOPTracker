-- 1. NEW USER TRIGGER
-- Automatically creates a public.users profile when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, role)
  VALUES (new.id, 'member'); -- All new users default to 'member' role
  RETURN new;
END;
$$;

-- Create the trigger to fire after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. NEW WINERY TRIGGER
-- Automatically initializes a BOP sequence tracker when a new winery is created.
CREATE OR REPLACE FUNCTION public.handle_new_winery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.bop_sequences (winery_id, last_bop_number)
  VALUES (new.id, 0);
  RETURN new;
END;
$$;

-- Create the trigger to fire after a new winery is inserted
CREATE TRIGGER on_winery_created
  AFTER INSERT ON public.wineries
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_winery();

-- 3. BATCH DATE CALCULATION TRIGGER
-- Automatically calculates racking, filtering, and bottling dates before a new batch is inserted.
CREATE OR REPLACE FUNCTION public.calculate_batch_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  racking_date date;
  filtering_date date;
  bottling_date date;
BEGIN
  -- Rack date is 14 days after put-up
  racking_date := NEW.date_put_up + interval '14 days';

  -- Filter date is (kit_weeks - 2) weeks after racking
  filtering_date := racking_date + (NEW.kit_weeks - 2) * interval '1 week';

  -- Bottle date is 14 days after filtering
  bottling_date := filtering_date + interval '14 days';

  -- If bottling date falls on a Sunday (day 0), move it to Monday (day 1)
  IF EXTRACT(DOW FROM bottling_date) = 0 THEN
    bottling_date := bottling_date + interval '1 day';
  END IF;

  NEW.date_rack := racking_date;
  NEW.date_filter := filtering_date;
  NEW.date_bottle := bottling_date;

  RETURN NEW;
END;
$$;

CREATE TRIGGER before_batch_insert_calculate_dates
  BEFORE INSERT ON public.batches
  FOR EACH ROW EXECUTE PROCEDURE public.calculate_batch_dates();

-- 4. BOP NUMBER ASSIGNMENT TRIGGER
-- Atomically increments the BOP number for the winery and assigns it to the new batch.
CREATE OR REPLACE FUNCTION public.assign_bop_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_bop integer;
BEGIN
  -- Lock the sequence row for this winery, increment, and return the new value
  UPDATE public.bop_sequences
  SET last_bop_number = last_bop_number + 1
  WHERE winery_id = NEW.winery_id
  RETURNING last_bop_number INTO next_bop;

  NEW.bop_number := next_bop;
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_batch_insert_assign_bop
  BEFORE INSERT ON public.batches
  FOR EACH ROW EXECUTE PROCEDURE public.assign_bop_number();
