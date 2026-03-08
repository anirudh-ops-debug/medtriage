
-- Patient timeline events table
CREATE TABLE public.patient_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'info',
  event_description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.patient_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read timeline" ON public.patient_timeline FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert timeline" ON public.patient_timeline FOR INSERT TO authenticated WITH CHECK (true);

-- Add doctor/nurse assignment columns to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS assigned_doctor_id uuid;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS assigned_nurse_id uuid;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS discharge_date date;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Enable realtime for timeline
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_timeline;
