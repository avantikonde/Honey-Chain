
-- ROLES ------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('beekeeper','processor','consumer','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'beekeeper',
  location text,
  organisation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.app_role;
BEGIN
  r := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role',''), 'beekeeper')::public.app_role;
  INSERT INTO public.profiles (id, full_name, role, location)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name',''), r, NEW.raw_user_meta_data ->> 'location')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CORE DOMAIN ------------------------------------------------------------
CREATE TABLE public.apiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  location text NOT NULL,
  region text,
  beekeeper_name text NOT NULL DEFAULT '',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apiary_id uuid NOT NULL REFERENCES public.apiaries(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  location text,
  temperature numeric NOT NULL DEFAULT 34,
  humidity numeric NOT NULL DEFAULT 60,
  weight_kg numeric NOT NULL DEFAULT 40,
  activity_pct numeric NOT NULL DEFAULT 85,
  acoustic_index numeric NOT NULL DEFAULT 62,
  health_score integer NOT NULL DEFAULT 90,
  status text NOT NULL DEFAULT 'healthy',
  is_demo boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hives_apiary_idx ON public.hives(apiary_id);

CREATE TABLE public.sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id uuid NOT NULL REFERENCES public.hives(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  temperature numeric NOT NULL,
  humidity numeric NOT NULL,
  weight_kg numeric NOT NULL,
  activity_pct numeric NOT NULL,
  acoustic_index numeric NOT NULL DEFAULT 60,
  source text NOT NULL DEFAULT 'virtual-simulator'
);
CREATE INDEX sensor_readings_hive_time_idx ON public.sensor_readings(hive_id, recorded_at DESC);

CREATE TABLE public.ai_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id uuid NOT NULL REFERENCES public.hives(id) ON DELETE CASCADE,
  risk_score integer NOT NULL,
  status text NOT NULL,
  title text NOT NULL,
  recommendation text NOT NULL,
  factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_predictions_hive_idx ON public.ai_predictions(hive_id, created_at DESC);

CREATE TABLE public.honey_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code text NOT NULL UNIQUE,
  hive_id uuid REFERENCES public.hives(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  hive_code text NOT NULL DEFAULT '',
  beekeeper_name text NOT NULL DEFAULT '',
  apiary text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  harvest_date date NOT NULL DEFAULT current_date,
  quantity_kg numeric NOT NULL DEFAULT 0,
  honey_type text NOT NULL DEFAULT 'Multiflora',
  extraction_method text NOT NULL DEFAULT 'Cold Extraction',
  quality_status text NOT NULL DEFAULT 'pending',
  stage text NOT NULL DEFAULT 'harvest',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.traceability_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.honey_batches(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor text NOT NULL,
  location text,
  notes text,
  status text NOT NULL DEFAULT 'completed',
  verified boolean NOT NULL DEFAULT true,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX traceability_events_batch_idx ON public.traceability_events(batch_id, occurred_at);

CREATE TABLE public.quality_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.honey_batches(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  value text NOT NULL,
  result text NOT NULL DEFAULT 'passed',
  lab text,
  tested_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quality_tests_batch_idx ON public.quality_tests(batch_id);

CREATE TABLE public.blockchain_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.honey_batches(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.traceability_events(id) ON DELETE SET NULL,
  batch_code text NOT NULL,
  event_type text NOT NULL,
  actor text NOT NULL DEFAULT '',
  data_hash text NOT NULL,
  tx_hash text NOT NULL,
  block_number bigint NOT NULL DEFAULT 0,
  network text NOT NULL DEFAULT 'simulated-evm',
  mode text NOT NULL DEFAULT 'simulated',
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blockchain_records_batch_idx ON public.blockchain_records(batch_id, recorded_at);

-- GRANTS + RLS (public read for traceability, authenticated writes) -------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['apiaries','hives','sensor_readings','ai_predictions','honey_batches','traceability_events','quality_tests','blockchain_records'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "public read %1$s" ON public.%1$I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "auth write %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "auth update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

CREATE POLICY "owner delete apiaries" ON public.apiaries FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owner delete hives" ON public.hives FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owner delete batches" ON public.honey_batches FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- DEMO SEED ---------------------------------------------------------------
INSERT INTO public.apiaries (id, name, location, region, beekeeper_name, is_demo) VALUES
  ('11111111-1111-4111-8111-111111111111','Sahyadri Apiary','Satara, Maharashtra','Maharashtra','Rajesh Patil',true);

INSERT INTO public.hives (id, apiary_id, code, location, temperature, humidity, weight_kg, activity_pct, acoustic_index, health_score, status, is_demo) VALUES
  ('22222222-2222-4222-8222-000000000101','11111111-1111-4111-8111-111111111111','H-101','Block A, Satara',34.2,58,38.4,89,64,95,'healthy',true),
  ('22222222-2222-4222-8222-000000000102','11111111-1111-4111-8111-111111111111','H-102','Block A, Satara',34.6,61,41.8,87,66,92,'healthy',true),
  ('22222222-2222-4222-8222-000000000103','11111111-1111-4111-8111-111111111111','H-103','Block B, Satara',36.9,71,33.2,64,58,71,'attention',true),
  ('22222222-2222-4222-8222-000000000104','11111111-1111-4111-8111-111111111111','H-104','Block B, Satara',38.4,79,29.6,51,49,54,'critical',true);

INSERT INTO public.sensor_readings (hive_id, recorded_at, temperature, humidity, weight_kg, activity_pct, acoustic_index)
SELECT h.id,
       now() - (g || ' hours')::interval,
       round((h.temperature + sin(g/3.0)*0.9 + (random()-0.5)*0.4)::numeric, 1),
       round((h.humidity + cos(g/4.0)*3 + (random()-0.5)*2)::numeric, 0),
       round((h.weight_kg - g*0.06 + (random()-0.5)*0.15)::numeric, 2),
       round((h.activity_pct + sin(g/2.0)*5 + (random()-0.5)*3)::numeric, 0),
       round((h.acoustic_index + cos(g/5.0)*4)::numeric, 0)
FROM public.hives h, generate_series(47, 0, -1) g
WHERE h.is_demo;

INSERT INTO public.ai_predictions (hive_id, risk_score, status, title, recommendation, factors) VALUES
  ('22222222-2222-4222-8222-000000000103',62,'attention','Elevated humidity trend in Hive H-103','Improve ventilation and re-inspect within 48 hours.','["Humidity rising","Activity below baseline"]'::jsonb),
  ('22222222-2222-4222-8222-000000000104',78,'high','Possible colony stress detected in Hive H-104','Inspect hive within the next 24 hours.','["Temperature high","Humidity high","Activity down","Weight decreasing"]'::jsonb);

INSERT INTO public.honey_batches (id, batch_code, hive_id, hive_code, beekeeper_name, apiary, location, harvest_date, quantity_kg, honey_type, extraction_method, quality_status, stage, is_demo) VALUES
  ('33333333-3333-4333-8333-333333333333','HC-2026-00124','22222222-2222-4222-8222-000000000102','H-102','Rajesh Patil','Sahyadri Apiary','Satara, Maharashtra','2026-08-14',24.5,'Multiflora','Cold Extraction','passed','distribution',true);

INSERT INTO public.traceability_events (id, batch_id, event_type, actor, location, notes, occurred_at) VALUES
  ('44444444-4444-4444-8444-000000000001','33333333-3333-4333-8333-333333333333','harvest','Rajesh Patil (Beekeeper)','Satara, Maharashtra','Frames harvested from Hive H-102','2026-08-14T09:20:00Z'),
  ('44444444-4444-4444-8444-000000000002','33333333-3333-4333-8333-333333333333','extraction','Rajesh Patil (Beekeeper)','Satara, Maharashtra','Cold extraction, no heat applied','2026-08-15T11:00:00Z'),
  ('44444444-4444-4444-8444-000000000003','33333333-3333-4333-8333-333333333333','processing','Processing Unit A','Pune, Maharashtra','Filtered and settled','2026-08-16T10:15:00Z'),
  ('44444444-4444-4444-8444-000000000004','33333333-3333-4333-8333-333333333333','quality_check','AgriLab Certified','Pune, Maharashtra','Moisture, HMF and purity within limits','2026-08-18T14:40:00Z'),
  ('44444444-4444-4444-8444-000000000005','33333333-3333-4333-8333-333333333333','packaging','Processing Unit A','Pune, Maharashtra','Packed in 500g glass jars','2026-08-20T09:00:00Z'),
  ('44444444-4444-4444-8444-000000000006','33333333-3333-4333-8333-333333333333','distribution','Sahyadri Distributors','Mumbai, Maharashtra','Dispatched to retail partners','2026-08-22T08:30:00Z');

INSERT INTO public.quality_tests (batch_id, test_name, value, result, lab, tested_at) VALUES
  ('33333333-3333-4333-8333-333333333333','Moisture content','17.2%','passed','AgriLab Certified','2026-08-18T14:40:00Z'),
  ('33333333-3333-4333-8333-333333333333','HMF','12 mg/kg','passed','AgriLab Certified','2026-08-18T14:40:00Z'),
  ('33333333-3333-4333-8333-333333333333','Sucrose','3.1%','passed','AgriLab Certified','2026-08-18T14:40:00Z'),
  ('33333333-3333-4333-8333-333333333333','Adulteration screen','Not detected','passed','AgriLab Certified','2026-08-18T14:40:00Z');

INSERT INTO public.blockchain_records (batch_id, event_id, batch_code, event_type, actor, data_hash, tx_hash, block_number)
SELECT e.batch_id, e.id, 'HC-2026-00124', e.event_type, e.actor,
       encode(digest(e.id::text || e.event_type || e.actor || e.occurred_at::text, 'sha256'),'hex'),
       '0x' || encode(digest('tx' || e.id::text, 'sha256'),'hex'),
       8420000 + (row_number() over (order by e.occurred_at)) * 137
FROM public.traceability_events e WHERE e.batch_id = '33333333-3333-4333-8333-333333333333';
