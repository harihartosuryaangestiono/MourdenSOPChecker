-- =============================================
-- FRESH USERS - DELETE ALL AND CREATE NEW
-- Password: mourden123
-- =============================================

-- Step 1: Hapus semua data lama di auth dan public
DELETE FROM auth.identities 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('owner@mourden.co', 'admin@mourden.co', 'staff1@mourden.co', 'staff2@mourden.co', 'staff3@mourden.co')
);

DELETE FROM public.users 
WHERE email IN ('owner@mourden.co', 'admin@mourden.co', 'staff1@mourden.co', 'staff2@mourden.co', 'staff3@mourden.co');

DELETE FROM auth.users 
WHERE email IN ('owner@mourden.co', 'admin@mourden.co', 'staff1@mourden.co', 'staff2@mourden.co', 'staff3@mourden.co');

-- Step 2: Buat users dengan gen_random_uuid() (UUID random, bukan hardcoded)
WITH new_users AS (
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin
  )
  SELECT 
    gen_random_uuid(),
    email,
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    meta_data,
    false
  FROM (VALUES 
    ('owner@mourden.co', '{"role": "owner", "name": "Owner Mourden"}'::jsonb),
    ('admin@mourden.co', '{"role": "admin", "name": "Admin Mourden"}'::jsonb),
    ('staff1@mourden.co', '{"role": "staff", "name": "Budi Santoso"}'::jsonb),
    ('staff2@mourden.co', '{"role": "staff", "name": "Ani Wijaya"}'::jsonb),
    ('staff3@mourden.co', '{"role": "staff", "name": "Dedi Kurniawan"}'::jsonb)
  ) AS t(email, meta_data)
  RETURNING id, email
)
SELECT * FROM new_users;

-- Step 3: Insert ke public.users (ambil ID dari auth.users yang baru dibuat)
INSERT INTO public.users (id, name, email, role, shift_preference, is_active, created_at, updated_at)
SELECT 
  u.id,
  (u.raw_user_meta_data->>'name')::text as name,
  u.email,
  (u.raw_user_meta_data->>'role')::text as role,
  CASE 
    WHEN u.email = 'owner@mourden.co' THEN 'all'
    WHEN u.email = 'admin@mourden.co' THEN 'all'
    WHEN u.email = 'staff1@mourden.co' THEN 'opening'
    WHEN u.email = 'staff2@mourden.co' THEN 'middle'
    ELSE 'closing'
  END as shift_preference,
  true,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN ('owner@mourden.co', 'admin@mourden.co', 'staff1@mourden.co', 'staff2@mourden.co', 'staff3@mourden.co')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 4: Insert identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  email,
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email IN ('owner@mourden.co', 'admin@mourden.co', 'staff1@mourden.co', 'staff2@mourden.co', 'staff3@mourden.co')
ON CONFLICT (provider_id, provider) DO UPDATE SET
  updated_at = NOW();

-- Verifikasi
SELECT 'Auth users:' as check, count(*) as count FROM auth.users WHERE email LIKE '%@mourden.co'
UNION ALL
SELECT 'Public users:' as check, count(*) as count FROM public.users WHERE email LIKE '%@mourden.co';
