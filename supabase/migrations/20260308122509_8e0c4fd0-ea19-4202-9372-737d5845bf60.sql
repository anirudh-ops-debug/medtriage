
-- Allow nurses to also update triage (needed for saving symptoms during registration)
DROP POLICY IF EXISTS "Doctors/admins update triage" ON public.triage;
CREATE POLICY "Doctors/admins/nurses update triage"
  ON public.triage FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'doctor'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'nurse'::app_role)
  );
