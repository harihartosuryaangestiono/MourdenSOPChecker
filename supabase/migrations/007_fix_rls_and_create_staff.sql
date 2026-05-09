-- =============================================
-- FIX RLS POLICY + CREATE STAFF USER
-- =============================================

-- Step 1: Fix infinite recursion di users policy
-- Drop policy yang bermasalah
DROP POLICY IF EXISTS "admin_read_all_users" ON public.users;
DROP POLICY IF EXISTS "users_read_own" ON public.users;

-- Buat policy yang aman (tanpa recursion)
-- Policy 1: User bisa lihat profile sendiri
CREATE POLICY "users_read_own" ON public.users 
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Admin/Owner bisa lihat semua - menggunakan direct check tanpa subquery recursive
-- Menggunakan auth.uid() dan session role dari JWT metadata
CREATE POLICY "admin_read_all_users" ON public.users 
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'owner') 
    OR auth.uid() = id
  );

-- Alternatif policy (kalau role di raw_user_meta_data):
-- CREATE POLICY "admin_read_all_users" ON public.users 
--   FOR SELECT USING (
--     (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
--     OR auth.uid() = id
--   );

-- Step 2: Nonaktifkan RLS sementara untuk public.users (kalau masih error)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- Lalu re-enable dengan policy yang fixed:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create Staff User
-- Method: Buat user baru dengan email asli atau tambah + pada email existing

-- Option A: Tambah staff dengan email baru (ganti dengan email asli)
-- Contoh: jadi.staff1@gmail.com

-- Option B: Auto-create dari auth.users yang sudah ada
-- Ini akan membuat public.users profile untuk user yang login

INSERT INTO public.users (id, name, email, role, shift_preference, is_active, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'staff') as role,
  COALESCE(au.raw_user_meta_data->>'shift', 'opening') as shift_preference,
  true,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_preference = EXCLUDED.shift_preference,
  updated_at = NOW();

-- Step 4: Update metadata untuk user yang sudah ada (set role kalau belum ada)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "staff"}'::jsonb
WHERE email LIKE '%@gmail.com' 
  AND (raw_user_meta_data->>'role') IS NULL;

-- Step 5: Verifikasi
SELECT 'Users in auth.users:' as check_type, count(*) as count FROM auth.users;
SELECT 'Users in public.users:' as check_type, count(*) as count FROM public.users;
SELECT 'Users with role staff:' as check_type, count(*) as count FROM public.users WHERE role = 'staff';
SELECT 'Users with role admin:' as check_type, count(*) as count FROM public.users WHERE role = 'admin';
SELECT 'Users with role owner:' as check_type, count(*) as count FROM public.users WHERE role = 'owner';

-- List all users
SELECT u.id, u.email, u.role, u.shift_preference 
FROM public.users u 
ORDER BY u.role, u.email;
