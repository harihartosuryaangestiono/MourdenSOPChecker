-- =============================================
-- USERS WITH REAL EMAIL ADDRESSES
-- Supabase requires valid email domains
-- =============================================

-- Step 1: Delete old fake email users
DELETE FROM auth.identities 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@mourden.co' OR email LIKE '%@example.com'
);

DELETE FROM public.users 
WHERE email LIKE '%@mourden.co' OR email LIKE '%@example.com';

DELETE FROM auth.users 
WHERE email LIKE '%@mourden.co' OR email LIKE '%@example.com';

-- Step 2: Insert users with REAL email addresses
-- Ganti email di bawah dengan email asli yang kamu punya
-- Atau biarkan dan buat user manual di Dashboard dengan email asli

-- Step 3: Auto-create public.users profile untuk user yang sudah ada di auth.users
-- (Setelah buat user manual di Dashboard dengan email asli)
INSERT INTO public.users (id, name, email, role, shift_preference, is_active, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  email,
  COALESCE(raw_user_meta_data->>'role', 'staff') as role,
  COALESCE(raw_user_meta_data->>'shift', 'all') as shift_preference,
  true,
  NOW(),
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verifikasi
SELECT 'Active auth users:' as status, count(*) as count FROM auth.users;
SELECT 'Public profiles:' as status, count(*) as count FROM public.users;
SELECT 'Users without profile:' as status, 
  (SELECT count(*) FROM auth.users) - (SELECT count(*) FROM public.users) as count;
