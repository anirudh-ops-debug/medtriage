
-- Allow all authenticated users to read profiles (needed to display assigned doctor/nurse names)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Authenticated read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
