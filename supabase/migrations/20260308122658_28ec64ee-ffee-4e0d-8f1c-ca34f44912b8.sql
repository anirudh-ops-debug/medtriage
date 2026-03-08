
-- Allow all authenticated users to update patients (needed for auto-assignment during registration by nurses)
DROP POLICY IF EXISTS "Doctors/admins update patients" ON public.patients;
CREATE POLICY "Authenticated update patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'doctor'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'nurse'::app_role)
  );
