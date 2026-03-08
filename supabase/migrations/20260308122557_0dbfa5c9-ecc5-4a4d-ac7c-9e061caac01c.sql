
-- Allow all authenticated users to read user_roles (needed to find doctors/nurses for auto-assignment)
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Authenticated read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);
