-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Utility Functions (must come before tables that use them)

-- Join code generator
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random()*length(chars)+1)::int, 1);
    END LOOP;
    SELECT EXISTS (SELECT 1 FROM wineries WHERE join_code = code) INTO exists_already;
    IF NOT exists_already THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- BOP number generator
CREATE OR REPLACE FUNCTION get_next_bop_number(winery_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  INSERT INTO winery_bop_sequences (winery_id, last_bop_number)
  VALUES (winery_uuid, 1)
  ON CONFLICT (winery_id) DO
    UPDATE SET last_bop_number = winery_bop_sequences.last_bop_number + 1
    RETURNING last_bop_number INTO next_number;
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Bottle date calculator (Sunday rule)
CREATE OR REPLACE FUNCTION calculate_bottle_date(filter_date DATE)
RETURNS DATE AS $$
BEGIN
  IF EXTRACT(DOW FROM filter_date + INTERVAL '1 day') = 0 THEN
    RETURN filter_date + INTERVAL '2 days';
  ELSE
    RETURN filter_date + INTERVAL '1 day';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Tables

-- Wineries table (now generate_join_code() exists)
CREATE TABLE wineries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  join_code  TEXT UNIQUE NOT NULL DEFAULT generate_join_code(),
  timezone   TEXT DEFAULT 'America/Halifax',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends auth.users)
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  winery_id   UUID REFERENCES wineries(id),
  role        TEXT DEFAULT 'staff' CHECK (role IN ('owner','manager','staff')),
  status      TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Winery-specific BOP sequence
CREATE TABLE winery_bop_sequences (
  winery_id       UUID PRIMARY KEY REFERENCES wineries(id) ON DELETE CASCADE,
  last_bop_number INTEGER DEFAULT 0
);

-- Batches table
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
  UNIQUE(winery_id, bop_number)
);

-- Support messages
CREATE TABLE support_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winery_id  UUID NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX idx_users_winery_id        ON users(winery_id);
CREATE INDEX idx_batches_winery_id      ON batches(winery_id);
CREATE INDEX idx_batches_winery_bop     ON batches(winery_id, bop_number);
CREATE INDEX idx_batches_dates          ON batches(put_up_date, rack_date, filter_date, bottle_date);
CREATE INDEX idx_support_winery_id      ON support_messages(winery_id);
CREATE INDEX idx_support_status         ON support_messages(status);

-- 5. Row-Level Security
ALTER TABLE wineries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE winery_bop_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages  ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Wineries
CREATE POLICY "Users view their winery" ON wineries
  FOR SELECT USING ( id IN (SELECT winery_id FROM users WHERE id = auth.uid()) );
CREATE POLICY "Admins view all wineries" ON wineries
  FOR ALL USING ( EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner') );

-- Users
CREATE POLICY "View users in their winery" ON users
  FOR SELECT USING ( winery_id IN (SELECT winery_id FROM users WHERE id = auth.uid()) );
CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING ( id = auth.uid() );

-- BOP Sequences
CREATE POLICY "View winery BOP sequence" ON winery_bop_sequences
  FOR ALL USING ( winery_id IN (SELECT winery_id FROM users WHERE id = auth.uid()) );

-- Batches
CREATE POLICY "View batches in winery" ON batches
  FOR SELECT USING ( winery_id IN (SELECT winery_id FROM users WHERE id = auth.uid()) );
CREATE POLICY "Insert batches in winery" ON batches
  FOR INSERT WITH CHECK ( winery_id = (SELECT winery_id FROM users WHERE id = auth.uid()) );
CREATE POLICY "Update batches in winery" ON batches
  FOR UPDATE USING ( winery_id = (SELECT winery_id FROM users WHERE id = auth.uid()) );
CREATE POLICY "Delete batches in winery" ON batches
  FOR DELETE USING ( winery_id = (SELECT winery_id FROM users WHERE id = auth.uid()) );

-- Support Messages
CREATE POLICY "View support messages" ON support_messages
  FOR SELECT USING ( winery_id = (SELECT winery_id FROM users WHERE id = auth.uid()) );
CREATE POLICY "Insert support message" ON support_messages
  FOR INSERT WITH CHECK (
    winery_id = (SELECT winery_id FROM users WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

-- 7. Batch Date Calculation Trigger

-- Trigger: calc_batch_dates
CREATE OR REPLACE FUNCTION calc_batch_dates()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bop_number   := get_next_bop_number(NEW.winery_id);
  NEW.rack_date    := NEW.put_up_date + INTERVAL '14 days';
  NEW.filter_date  := NEW.rack_date + CASE NEW.kit_weeks
                       WHEN 4 THEN INTERVAL '2 weeks'
                       WHEN 5 THEN INTERVAL '3 weeks'
                       WHEN 6 THEN INTERVAL '4 weeks'
                       WHEN 8 THEN INTERVAL '6 weeks'
                       END;
  NEW.bottle_date  := calculate_bottle_date(NEW.filter_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calc_dates
  BEFORE INSERT OR UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION calc_batch_dates();

-- 8. Auth & Admin Triggers

-- New user record on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Initialize BOP sequence for new winery
CREATE OR REPLACE FUNCTION handle_new_winery()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO winery_bop_sequences (winery_id, last_bop_number)
    VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_winery_created
  AFTER INSERT ON wineries
  FOR EACH ROW EXECUTE FUNCTION handle_new_winery(); 