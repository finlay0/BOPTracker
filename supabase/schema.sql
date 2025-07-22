-- ============================================
-- BOP Tracker – COMPLETE Database Schema (2025)
-- Paste this entire block into your Supabase SQL editor
-- ============================================

-- 1. Enable extensions -----------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Utility functions & RPCs (all SECURITY DEFINER) ----------------------

-- 2.1 Generate a unique 6-char alphanumeric join code
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  res   TEXT := '';
  i     INT;
BEGIN
  FOR i IN 1..6 LOOP
    res := res || substr(chars, floor(random()*length(chars)+1)::int, 1);
  END LOOP;
  RETURN res;
END;
$$;

-- 2.2 Per-winery sequence: get next BOP number
CREATE OR REPLACE FUNCTION get_next_bop_number(winery_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  next_num INTEGER;
BEGIN
  INSERT INTO winery_bop_sequences(winery_id, last_bop_number)
    VALUES (winery_uuid, 1)
    ON CONFLICT (winery_id) DO
      UPDATE SET last_bop_number = winery_bop_sequences.last_bop_number + 1
      RETURNING last_bop_number INTO next_num;
  RETURN next_num;
END;
$$;

-- 2.3 Calculate rack/filter/bottle dates (skip Sundays)
CREATE OR REPLACE FUNCTION calc_batch_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  rack        DATE;
  filter_date DATE;
  bottle      DATE;
BEGIN
  rack := NEW.put_up_date + INTERVAL '14 days';
  filter_date := rack + CASE NEW.kit_weeks
    WHEN 4 THEN INTERVAL '14 days'
    WHEN 5 THEN INTERVAL '21 days'
    WHEN 6 THEN INTERVAL '28 days'
    WHEN 8 THEN INTERVAL '42 days'
    ELSE INTERVAL '7 days'
  END;
  bottle := filter_date + INTERVAL '1 day';
  IF EXTRACT(DOW FROM bottle) = 0 THEN
    bottle := bottle + INTERVAL '1 day';
  END IF;
  NEW.rack_date   := rack;
  NEW.filter_date := filter_date;
  NEW.bottle_date := bottle;
  RETURN NEW;
END;
$$;

-- 2.4 Auto-assign BOP number if missing
CREATE OR REPLACE FUNCTION set_batch_bop_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.bop_number IS NULL OR NEW.bop_number = 0 THEN
    NEW.bop_number := get_next_bop_number(NEW.winery_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 2.5 RPC to validate join code (before user has winery_id)
CREATE OR REPLACE FUNCTION rpc_validate_join_code(code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  w_id UUID;
BEGIN
  SELECT id INTO w_id FROM wineries WHERE join_code = code;
  IF w_id IS NULL THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;
  RETURN w_id;
END;
$$;

-- 2.6 updated_at helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- 2.7 Auto-create user_profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO user_profiles(id, full_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name',''),
      CASE WHEN NEW.email = 'admin@boptracker.com' THEN 'admin' ELSE 'user' END
    );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'create_user_profile failed for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Core tables -----------------------------------------------------------

-- 3.1 wineries
CREATE TABLE IF NOT EXISTS wineries (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT    NOT NULL,
  join_code       TEXT    NOT NULL UNIQUE DEFAULT generate_join_code(),
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 per-winery sequence
CREATE TABLE IF NOT EXISTS winery_bop_sequences (
  winery_id       UUID    PRIMARY KEY REFERENCES wineries(id) ON DELETE CASCADE,
  last_bop_number INTEGER NOT NULL DEFAULT 0
);

-- 3.3 admin-managed join codes (also for joining)
CREATE TABLE IF NOT EXISTS winery_join_codes (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  winery_id   UUID    NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  code        TEXT    NOT NULL UNIQUE DEFAULT generate_join_code(),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID    REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 user_profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT    NOT NULL,
  first_name      TEXT,
  last_name       TEXT,
  winery_id       UUID    REFERENCES wineries(id) ON DELETE SET NULL,
  role            TEXT    NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
  dark_mode       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 batches
CREATE TABLE IF NOT EXISTS batches (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  winery_id      UUID    NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  bop_number     INTEGER NOT NULL,
  customer       TEXT    NOT NULL,
  customer_email TEXT,
  wine_kit       TEXT    NOT NULL,
  kit_weeks      INTEGER NOT NULL CHECK (kit_weeks IN (4, 5, 6, 8)),
  date_of_sale   DATE    NOT NULL,
  put_up_date    DATE    NOT NULL,
  rack_date      DATE    NOT NULL,
  filter_date    DATE    NOT NULL,
  bottle_date    DATE    NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  current_stage  TEXT    DEFAULT 'put_up' CHECK (current_stage IN ('put_up', 'rack', 'filter', 'bottle')),
  -- Individual stage completion tracking
  put_up_completed    BOOLEAN DEFAULT FALSE,
  rack_completed      BOOLEAN DEFAULT FALSE,
  filter_completed    BOOLEAN DEFAULT FALSE,
  bottle_completed    BOOLEAN DEFAULT FALSE,
  notes          TEXT,
  created_by     UUID    NOT NULL REFERENCES user_profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure BOP numbers are unique within each winery
  UNIQUE(winery_id, bop_number)
);

-- 3.6 support_messages
CREATE TABLE IF NOT EXISTS support_messages (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  winery_id      UUID    NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  user_id        UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject        TEXT    NOT NULL,
  message        TEXT    NOT NULL,
  status         TEXT    NOT NULL CHECK (status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
  priority       TEXT    NOT NULL CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  admin_response TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_profiles_winery_id    ON user_profiles(winery_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_dark_mode ON user_profiles(dark_mode);
CREATE INDEX IF NOT EXISTS idx_join_codes_code            ON winery_join_codes(code);
CREATE INDEX IF NOT EXISTS idx_join_codes_active          ON winery_join_codes(is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_batches_winery_status      ON batches(winery_id, status);
CREATE INDEX IF NOT EXISTS idx_batches_dates_pending      ON batches(put_up_date, rack_date, filter_date, bottle_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_support_messages_status    ON support_messages(winery_id, status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created   ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_winery_id ON batches(winery_id);
CREATE INDEX IF NOT EXISTS idx_batches_dates ON batches(winery_id, put_up_date, rack_date, filter_date, bottle_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(winery_id, status);

-- 5. Enable Row-Level Security ---------------------------------------------
ALTER TABLE wineries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE winery_bop_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE winery_join_codes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages     ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies ----------------------------------------------------------

-- 6.1 user_profiles
CREATE POLICY "Users view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6.2 wineries
CREATE POLICY "Users view their winery" ON wineries
  FOR SELECT USING (
    id = (SELECT winery_id FROM user_profiles WHERE id = auth.uid())
  );
CREATE POLICY "Admins manage wineries" ON wineries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6.3 winery_bop_sequences
CREATE POLICY "Users view sequences" ON winery_bop_sequences
  FOR SELECT USING (
    winery_id = (SELECT winery_id FROM user_profiles WHERE id = auth.uid())
  );
CREATE POLICY "System manage sequences" ON winery_bop_sequences
  FOR ALL USING (true);

-- 6.4 winery_join_codes
CREATE POLICY "Users view active join codes" ON winery_join_codes
  FOR SELECT USING (is_active);
CREATE POLICY "Admins manage join codes" ON winery_join_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6.5 batches
CREATE POLICY "Users view batches" ON batches
  FOR SELECT USING (
    winery_id = (SELECT winery_id FROM user_profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users manage batches" ON batches
  FOR ALL USING (
    winery_id = (SELECT winery_id FROM user_profiles WHERE id = auth.uid())
  );
CREATE POLICY "Admins view all batches" ON batches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6.6 support_messages
CREATE POLICY "Users view support messages" ON support_messages
  FOR SELECT USING (
    winery_id = (SELECT winery_id FROM user_profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users insert support messages" ON support_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    winery_id = (SELECT winery_id FROM user_profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users update own support messages" ON support_messages
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins manage support messages" ON support_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Triggers --------------------------------------------------------------

-- 7.1 updated_at triggers
CREATE TRIGGER tr_update_wineries_updated_at
  BEFORE UPDATE ON wineries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_join_codes_updated_at
  BEFORE UPDATE ON winery_join_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_support_messages_updated_at
  BEFORE UPDATE ON support_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7.2 batch triggers
DROP TRIGGER IF EXISTS tr_set_batch_bop_number ON batches;
CREATE TRIGGER tr_set_batch_bop_number
  BEFORE INSERT ON batches
  FOR EACH ROW EXECUTE FUNCTION set_batch_bop_number();

DROP TRIGGER IF EXISTS tr_calc_batch_dates ON batches;
CREATE TRIGGER tr_calc_batch_dates
  BEFORE INSERT OR UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION calc_batch_dates();

-- 7.3 auth.users trigger
DROP TRIGGER IF EXISTS tr_create_user_profile ON auth.users;
CREATE TRIGGER tr_create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
