-- =============================================
-- AUTO SYNC NEW USERS (TRIGGER & MANUAL FIX)
-- =============================================

-- 1. Sync any existing users from auth.users that are missing in public.users
INSERT INTO public.users (
  id, 
  name, 
  email, 
  role, 
  shift_preference, 
  is_active, 
  created_at, 
  updated_at
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'staff') as role,
  COALESCE(au.raw_user_meta_data->>'shift', 'all') as shift_preference,
  true,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 2. Create trigger to automatically insert into public.users when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    name, 
    email, 
    role, 
    shift_preference, 
    is_active
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'staff'),
    COALESCE(new.raw_user_meta_data->>'shift', 'all'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Trigger for updating metadata when changed in auth.users
CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS TRIGGER AS $$
BEGIN
  IF new.raw_user_meta_data IS DISTINCT FROM old.raw_user_meta_data THEN
    UPDATE public.users SET
      name = COALESCE(new.raw_user_meta_data->>'name', name),
      role = COALESCE(new.raw_user_meta_data->>'role', role),
      shift_preference = COALESCE(new.raw_user_meta_data->>'shift', shift_preference),
      updated_at = NOW()
    WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

SELECT 'Sync completed and triggers created successfully!' as status;
