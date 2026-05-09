-- =============================================
-- MANUAL USER SETUP
-- 1. Buat user di Supabase Dashboard dulu
-- 2. Jalankan SQL ini untuk insert ke public.users
-- =============================================

-- Setelah buat user di Dashboard (Authentication → Users → Add User),
-- ganti ID di bawah ini dengan UUID dari user yang baru dibuat.

-- Cara: 
-- 1. Buka https://supabase.com/dashboard/project/ptdtuiuhjkpftukiflcm
-- 2. Authentication → Users → Add User
-- 3. Isi: email, password, centang "Auto-confirm email"
-- 4. Klik user yang baru dibuat → copy UUID
-- 5. Ganti 'PASTE_UUID_HERE' di bawah dengan UUID tersebut

-- Contoh (ganti dengan UUID sebenarnya):
-- Owner: 11111111-1111-1111-1111-111111111111
-- Admin: 22222222-2222-2222-2222-222222222222
-- Staff1: 33333333-3333-3333-3333-333333333333
-- dst

-- Copy UUID dari Dashboard dan paste di sini:
INSERT INTO public.users (id, name, email, role, shift_preference, is_active, created_at, updated_at)
VALUES 
  ('PASTE_OWNER_UUID_HERE', 'Owner Mourden', 'owner@mourden.co', 'owner', 'all', true, NOW(), NOW()),
  ('PASTE_ADMIN_UUID_HERE', 'Admin Mourden', 'admin@mourden.co', 'admin', 'all', true, NOW(), NOW()),
  ('PASTE_STAFF1_UUID_HERE', 'Budi Santoso', 'staff1@mourden.co', 'staff', 'opening', true, NOW(), NOW()),
  ('PASTE_STAFF2_UUID_HERE', 'Ani Wijaya', 'staff2@mourden.co', 'staff', 'middle', true, NOW(), NOW()),
  ('PASTE_STAFF3_UUID_HERE', 'Dedi Kurniawan', 'staff3@mourden.co', 'staff', 'closing', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_preference = EXCLUDED.shift_preference,
  updated_at = NOW();

-- ATAU: Auto-detect UUID dari auth.users yang sudah ada
-- (Jika user sudah dibuat via Dashboard atau API)
INSERT INTO public.users (id, name, email, role, shift_preference, is_active, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  email,
  COALESCE(raw_user_meta_data->>'role', 'staff') as role,
  CASE email
    WHEN 'owner@mourden.co' THEN 'all'
    WHEN 'admin@mourden.co' THEN 'all'
    WHEN 'staff1@mourden.co' THEN 'opening'
    WHEN 'staff2@mourden.co' THEN 'middle'
    ELSE 'closing'
  END as shift_preference,
  true,
  NOW(),
  NOW()
FROM auth.users
WHERE email IN ('owner@mourden.co', 'admin@mourden.co', 'staff1@mourden.co', 'staff2@mourden.co', 'staff3@mourden.co')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_preference = EXCLUDED.shift_preference,
  updated_at = NOW();

-- Verifikasi
SELECT 'Users in auth.users:' as status, count(*) as count FROM auth.users WHERE email LIKE '%@mourden.co'
UNION ALL
SELECT 'Users in public.users:' as status, count(*) as count FROM public.users WHERE email LIKE '%@mourden.co';
