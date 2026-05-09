-- =============================================
-- SETUP TEAM ACCOUNTS
-- Create public.users profile for Dashboard-created users
-- =============================================

-- Nonaktifkan RLS sementara untuk avoid recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Insert/Update public.users dari auth.users
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
WHERE au.email IN (
  'hariharto.surya@gmail.com',
  'restu@gmail.com', 
  'daffa.pratama@gmail.com',
  'reyhandiffi@gmail.com',
  'jonathanhenrry@gmail.com'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  shift_preference = EXCLUDED.shift_preference,
  is_active = true,
  updated_at = NOW();

-- Aktifkan kembali RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FIX RLS POLICIES (tanpa infinite recursion)
-- =============================================

-- Drop policies yang lama
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "admin_read_all_users" ON public.users;
DROP POLICY IF EXISTS "staff_own_tasks" ON public.daily_task_instances;
DROP POLICY IF EXISTS "admin_read_all_submissions" ON public.task_submissions;

-- Policy untuk users: read own + admin/owner read all
CREATE POLICY "users_read_own" ON public.users 
  FOR SELECT USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- Policy untuk daily tasks
CREATE POLICY "tasks_select" ON public.daily_task_instances
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- Policy untuk submissions
CREATE POLICY "submissions_select" ON public.task_submissions
  FOR SELECT USING (
    submitted_by = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- =============================================
-- VERIFIKASI
-- =============================================

-- List semua users yang sudah setup
SELECT 
  u.email,
  u.name,
  u.role,
  u.shift_preference,
  CASE 
    WHEN au.encrypted_password IS NOT NULL THEN '✓ Password set'
    ELSE '✗ No password'
  END as password_status
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
ORDER BY 
  CASE u.role 
    WHEN 'owner' THEN 1 
    WHEN 'admin' THEN 2 
    ELSE 3 
  END,
  u.email;

-- Count per role
SELECT role, count(*) as total_users 
FROM public.users 
GROUP BY role 
ORDER BY 
  CASE role 
    WHEN 'owner' THEN 1 
    WHEN 'admin' THEN 2 
    ELSE 3 
  END;
