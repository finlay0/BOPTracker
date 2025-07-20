-- ============================================
-- BOP Tracker  –  Full Schema & Security Setup
-- Copy ⁄ paste this into the Supabase SQL editor
-- ============================================

-- 0. Extensions ---------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------------------------
-- 1. Utility Functions (all SECURITY DEFINER)
--------------------------------------------------------------------

-- Generate a unique 6-char join code
CREATE OR REPLACE FUNCTION generate_join_code() RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i     INT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random()*length(chars)+1)::INT, 1);
    END LOOP;
    SELECT EXISTS (SELECT 1 FROM wineries WHERE join_code = code)
      INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END; $$;

-- Per-winery BOP number sequence
CREATE OR REPLACE FUNCTION get_next_bop_number(winery_uuid UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE next_number INTEGER;
BEGIN
  INSERT INTO winery_bop_sequences (winery_id,last_bop_number)
  VALUES (winery_uuid,1)
  ON CONFLICT (winery_id) DO
    UPDATE SET last_bop_number = winery_bop_sequences.last_bop_number + 1
    RETURNING last_bop_number INTO next_number;
  RETURN next_number;
END; $$;

-- Bottle date calculation (skip Sunday)
CREATE OR REPLACE FUNCTION calculate_bottle_date(filter_date DATE)
RETURNS DATE LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF EXTRACT(DOW FROM filter_date + INTERVAL '1 day') = 0
  THEN RETURN filter_date + INTERVAL '2 days';
  ELSE RETURN filter_date + INTERVAL '1 day';
  END IF;
END; $$;

--------------------------------------------------------------------
-- 2. Core Tables
--------------------------------------------------------------------
CREATE TABLE wineries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  join_code  TEXT UNIQUE NOT NULL DEFAULT generate_join_code(),
  timezone   TEXT DEFAULT 'America/Halifax',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  winery_id  UUID REFERENCES wineries(id),
  role       TEXT DEFAULT 'staff' CHECK (role IN ('owner','manager','staff')),
  status     TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE winery_bop_sequences (
  winery_id       UUID PRIMARY KEY REFERENCES wineries(id) ON DELETE CASCADE,
  last_bop_number INTEGER DEFAULT 0
);

CREATE TABLE batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winery_id     UUID NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  bop_number    INTEGER NOT NULL,
  customer      TEXT NOT NULL,
  wine_kit      TEXT NOT NULL,
  kit_weeks     INTEGER NOT NULL CHECK (kit_weeks IN (4,5,6,8)),
  date_of_sale  DATE NOT NULL,
  put_up_date   DATE NOT NULL,
  rack_date     DATE NOT NULL,
  filter_date   DATE NOT NULL,
  bottle_date   DATE NOT NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','done')),
  current_stage TEXT DEFAULT 'put-up',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (winery_id,bop_number)
);

CREATE TABLE support_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winery_id  UUID NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------
-- 3. Indexes
--------------------------------------------------------------------
CREATE INDEX idx_users_winery_id       ON users(winery_id);
CREATE INDEX idx_batches_winery_id     ON batches(winery_id);
CREATE INDEX idx_batches_winery_bop    ON batches(winery_id, bop_number);
CREATE INDEX idx_batches_dates         ON batches(put_up_date, rack_date, filter_date, bottle_date);
CREATE INDEX idx_support_winery_id     ON support_messages(winery_id);
CREATE INDEX idx_support_status        ON support_messages(status);

--------------------------------------------------------------------
-- 4. Row-Level Security
--------------------------------------------------------------------
ALTER TABLE wineries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE winery_bop_sequences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages      ENABLE ROW LEVEL SECURITY;

-- Wineries --------------------------------------------------------
CREATE POLICY "Users view their winery"
  ON wineries FOR SELECT
  USING (id IN (SELECT winery_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Owner control winery"
  ON wineries FOR ALL
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role='owner'));

-- Users -----------------------------------------------------------
CREATE POLICY "View users in same winery"
  ON users FOR SELECT
  USING (winery_id IN (SELECT winery_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users update self"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- BOP Sequences ---------------------------------------------------
CREATE POLICY "View sequence in winery"
  ON winery_bop_sequences FOR ALL
  USING (winery_id IN (SELECT winery_id FROM users WHERE id = auth.uid()));

-- Batches ---------------------------------------------------------
CREATE POLICY "View batches"
  ON batches FOR SELECT
  USING (winery_id IN (SELECT winery_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Insert batches"
  ON batches FOR INSERT
  WITH CHECK (winery_id = (SELECT winery_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Update batches"
  ON batches FOR UPDATE
  USING (winery_id = (SELECT winery_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Delete batches"
  ON batches FOR DELETE
  USING (winery_id = (SELECT winery_id FROM users WHERE id = auth.uid()));

-- Support Messages ------------------------------------------------
CREATE POLICY "View support messages"
  ON support_messages FOR SELECT
  USING (winery_id = (SELECT winery_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Insert support messages"
  ON support_messages FOR INSERT
  WITH CHECK (winery_id = (SELECT winery_id FROM users WHERE id = auth.uid())
              AND user_id  = auth.uid());

--------------------------------------------------------------------
-- 5. Triggers
--------------------------------------------------------------------

-- Auto-calculate batch dates & BOP number
CREATE OR REPLACE FUNCTION calc_batch_dates()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  NEW.bop_number  := get_next_bop_number(NEW.winery_id);
  NEW.rack_date   := NEW.put_up_date + INTERVAL '14 days';
  NEW.filter_date := NEW.rack_date + CASE NEW.kit_weeks
                       WHEN 4 THEN INTERVAL '2 weeks'
                       WHEN 5 THEN INTERVAL '3 weeks'
                       WHEN 6 THEN INTERVAL '4 weeks'
                       WHEN 8 THEN INTERVAL '6 weeks' END;
  NEW.bottle_date := calculate_bottle_date(NEW.filter_date);
  RETURN NEW;
END; $$;
CREATE TRIGGER trigger_calc_dates
BEFORE INSERT OR UPDATE ON batches
FOR EACH ROW EXECUTE FUNCTION calc_batch_dates();

-- Insert user row after auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO users(id) VALUES (NEW.id);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Init BOP sequence for new winery
CREATE OR REPLACE FUNCTION handle_new_winery()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO winery_bop_sequences(winery_id,last_bop_number) VALUES (NEW.id,0);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_winery_created
AFTER INSERT ON wineries
FOR EACH ROW EXECUTE FUNCTION handle_new_winery();

--------------------------------------------------------------------
-- 6. Admin Layer
--------------------------------------------------------------------

-- Am I admin?
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    JOIN auth.users au ON u.id = au.id
    WHERE u.id = auth.uid()
      AND (u.role='owner' OR au.email IN ('ianbpei@gmail.com','finlayabarrett@gmail.com'))
  );
END; $$;

-- Helper: get my admin profile
CREATE OR REPLACE FUNCTION get_admin_user()
RETURNS TABLE (id UUID,email TEXT,role TEXT,winery_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  SELECT u.id, au.email, u.role,
         COALESCE(w.name,'System Admin')
  FROM users u
  JOIN auth.users au ON u.id = au.id
  LEFT JOIN wineries w ON u.winery_id = w.id
  WHERE u.id = auth.uid();
END; $$;

-- Admin dashboards -----------------------------------------------
CREATE OR REPLACE FUNCTION admin_get_all_wineries()
RETURNS TABLE(id UUID,name TEXT,join_code TEXT,timezone TEXT,created_at TIMESTAMPTZ,user_count BIGINT,batch_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  SELECT w.id,w.name,w.join_code,w.timezone,w.created_at,
         COUNT(DISTINCT u.id), COUNT(DISTINCT b.id)
  FROM wineries w
  LEFT JOIN users   u ON w.id=u.winery_id
  LEFT JOIN batches b ON w.id=b.winery_id
  GROUP BY w.id;
END; $$;

CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE(id UUID,email TEXT,role TEXT,status TEXT,winery_name TEXT,created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  SELECT u.id, au.email, u.role, u.status, COALESCE(w.name,'No Winery'), u.created_at
  FROM users u
  JOIN auth.users au ON u.id = au.id
  LEFT JOIN wineries w ON u.winery_id = w.id;
END; $$;

CREATE OR REPLACE FUNCTION admin_get_support_messages()
RETURNS TABLE(id UUID,subject TEXT,message TEXT,status TEXT,user_email TEXT,winery_name TEXT,created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  SELECT sm.id, sm.subject, sm.message, sm.status, 
         au.email as user_email, w.name as winery_name, sm.created_at
  FROM support_messages sm
  JOIN users u       ON sm.user_id = u.id
  JOIN auth.users au ON u.id       = au.id
  JOIN wineries w    ON sm.winery_id = w.id;
END; $$;

-- Admin operations -----------------------------------------------
CREATE OR REPLACE FUNCTION admin_create_winery(winery_name TEXT, winery_timezone TEXT DEFAULT 'America/Halifax')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE new_id UUID;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
  INSERT INTO wineries(name,timezone) VALUES (winery_name,winery_timezone) RETURNING id INTO new_id;
  RETURN new_id;
END; $$;

CREATE OR REPLACE FUNCTION admin_rotate_join_code(winery_uuid UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE new_code TEXT;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
  new_code := generate_join_code();
  UPDATE wineries SET join_code = new_code WHERE id = winery_uuid;
  RETURN new_code;
END; $$;

CREATE OR REPLACE FUNCTION admin_update_support_status(message_id UUID, new_status TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE support_messages SET status = new_status WHERE id = message_id;
  RETURN FOUND;
END; $$;

-- Admin override policies -----------------------------------------
CREATE POLICY "Admins view all wineries"      ON wineries          FOR SELECT USING (is_admin());
CREATE POLICY "Admins modify wineries"        ON wineries          FOR ALL    USING (is_admin());
CREATE POLICY "Admins view all users"         ON users             FOR SELECT USING (is_admin());
CREATE POLICY "Admins view all batches"       ON batches           FOR SELECT USING (is_admin());
CREATE POLICY "Admins view all support msgs"  ON support_messages  FOR SELECT USING (is_admin());
CREATE POLICY "Admins update support msgs"    ON support_messages  FOR UPDATE USING (is_admin());

--------------------------------------------------------------------
-- Done!  Your database is ready for BOP Tracker 🎉
--------------------------------------------------------------------