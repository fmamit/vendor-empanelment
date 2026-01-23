-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create simple open policies for profiles
CREATE POLICY "Allow all authenticated to read profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated to update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Create simple open policies for user_roles
CREATE POLICY "Allow all authenticated to read roles"
ON public.user_roles FOR SELECT TO authenticated
USING (true);

-- Admin insert/update/delete for user_roles (using has_role function)
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));