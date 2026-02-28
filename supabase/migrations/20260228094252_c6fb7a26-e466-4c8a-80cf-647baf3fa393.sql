
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'nurse', 'organ_committee');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  diagnosis TEXT DEFAULT '',
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  barcode TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vitals table
CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  heart_rate INTEGER NOT NULL DEFAULT 72,
  blood_pressure_sys INTEGER NOT NULL DEFAULT 120,
  blood_pressure_dia INTEGER NOT NULL DEFAULT 80,
  spo2 INTEGER NOT NULL DEFAULT 98,
  temperature NUMERIC(4,1) NOT NULL DEFAULT 36.8,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Triage table
CREATE TABLE public.triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  risk_level TEXT NOT NULL DEFAULT 'Stable' CHECK (risk_level IN ('Critical', 'High', 'Moderate', 'Stable')),
  oxygen_drop_risk INTEGER NOT NULL DEFAULT 0,
  cardiac_risk INTEGER NOT NULL DEFAULT 0,
  complications TEXT[] DEFAULT '{}',
  symptoms TEXT[] DEFAULT '{}',
  tests_taken TEXT[] DEFAULT '{}',
  tests_needed TEXT[] DEFAULT '{}',
  medical_history TEXT[] DEFAULT '{}',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organ inventory table
CREATE TABLE public.organ_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organ_name TEXT NOT NULL,
  donor_details TEXT DEFAULT '',
  blood_type TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Matched', 'Allocated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organ allocation table
CREATE TABLE public.organ_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organ_id UUID REFERENCES public.organ_inventory(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  allocated_by UUID REFERENCES auth.users(id),
  allocation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'Pending'
);

-- Reports/files table
CREATE TABLE public.patient_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'uploaded' CHECK (report_type IN ('lab', 'imaging', 'uploaded')),
  file_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organ_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organ_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_reports ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- All authenticated users can read patients, vitals, triage, reports
CREATE POLICY "Authenticated read patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Doctors/admins update patients" ON public.patients FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins delete patients" ON public.patients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read vitals" ON public.vitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert vitals" ON public.vitals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update vitals" ON public.vitals FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated read triage" ON public.triage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert triage" ON public.triage FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Doctors/admins update triage" ON public.triage FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated read organ_inventory" ON public.organ_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctors/admins/organ manage inventory" ON public.organ_inventory FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'organ_committee')
);
CREATE POLICY "Doctors/admins/organ update inventory" ON public.organ_inventory FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'organ_committee')
);

CREATE POLICY "Authenticated read allocations" ON public.organ_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctors/admins/organ manage allocations" ON public.organ_allocations FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'organ_committee')
);
CREATE POLICY "Doctors/admins/organ update allocations" ON public.organ_allocations FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'organ_committee')
);

CREATE POLICY "Authenticated read reports" ON public.patient_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert reports" ON public.patient_reports FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'nurse'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-calculate risk level when vitals are inserted/updated
CREATE OR REPLACE FUNCTION public.calculate_risk_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _risk TEXT;
  _o2_risk INTEGER;
  _cardiac_risk INTEGER;
BEGIN
  -- Critical
  IF NEW.heart_rate < 40 OR NEW.heart_rate > 130 OR
     NEW.blood_pressure_sys < 80 OR NEW.blood_pressure_sys > 180 OR
     NEW.spo2 < 90 OR
     NEW.temperature < 35 OR NEW.temperature > 39.5 THEN
    _risk := 'Critical';
  -- High
  ELSIF (NEW.heart_rate BETWEEN 40 AND 49) OR (NEW.heart_rate BETWEEN 111 AND 130) OR
        (NEW.blood_pressure_sys BETWEEN 80 AND 89) OR (NEW.blood_pressure_sys BETWEEN 161 AND 180) OR
        (NEW.spo2 BETWEEN 90 AND 92) OR
        (NEW.temperature >= 38.5 AND NEW.temperature <= 39.5) THEN
    _risk := 'High';
  -- Moderate
  ELSIF (NEW.heart_rate BETWEEN 91 AND 110) OR
        (NEW.spo2 BETWEEN 93 AND 95) OR
        (NEW.temperature >= 37.5 AND NEW.temperature <= 38.4) THEN
    _risk := 'Moderate';
  ELSE
    _risk := 'Stable';
  END IF;

  -- Calculate risk scores
  _o2_risk := GREATEST(0, LEAST(99, (100 - NEW.spo2) * 5));
  _cardiac_risk := GREATEST(0, LEAST(99, ABS(NEW.heart_rate - 75) + ABS(NEW.blood_pressure_sys - 120)));

  UPDATE public.triage
  SET risk_level = _risk,
      oxygen_drop_risk = _o2_risk,
      cardiac_risk = _cardiac_risk,
      last_updated = now()
  WHERE patient_id = NEW.patient_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_vitals_change
  AFTER INSERT OR UPDATE ON public.vitals
  FOR EACH ROW EXECUTE FUNCTION public.calculate_risk_level();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_organ_inventory_updated_at BEFORE UPDATE ON public.organ_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_vitals_updated_at BEFORE UPDATE ON public.vitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Patient code sequence helper
CREATE SEQUENCE IF NOT EXISTS patient_code_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.patient_code IS NULL OR NEW.patient_code = '' THEN
    NEW.patient_code := 'PT-' || LPAD(nextval('patient_code_seq')::TEXT, 3, '0');
  END IF;
  IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
    NEW.barcode := 'MED' || LPAD(floor(random() * 10000000000)::TEXT, 10, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_patient_code_trigger BEFORE INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION public.generate_patient_code();
