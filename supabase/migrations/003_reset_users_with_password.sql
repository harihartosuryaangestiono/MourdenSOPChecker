-- =============================================
-- RESET USERS WITH PASSWORD HASH
-- Password untuk semua user: mourden123
-- Hash: $2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C
-- =============================================

-- Step 1: Hapus data lama (opsional - uncomment kalau mau bersihkan)
-- DELETE FROM public.users WHERE email LIKE '%@mourden.co';
-- DELETE FROM auth.users WHERE email LIKE '%@mourden.co';

-- Step 2: Insert auth.users dengan password hash (GoTrue compatible bcrypt)
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_user_meta_data, 
  created_at, 
  updated_at,
  confirmation_sent_at,
  is_super_admin
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001', 
    'owner@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "owner", "name": "Owner Mourden"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW(),
    false
  ),
  (
    '00000000-0000-0000-0000-000000000002', 
    'admin@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "admin", "name": "Admin Mourden"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW(),
    false
  ),
  (
    '00000000-0000-0000-0000-000000000003', 
    'staff1@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "staff", "name": "Budi Santoso"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW(),
    false
  ),
  (
    '00000000-0000-0000-0000-000000000004', 
    'staff2@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "staff", "name": "Ani Wijaya"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW(),
    false
  ),
  (
    '00000000-0000-0000-0000-000000000005', 
    'staff3@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "staff", "name": "Dedi Kurniawan"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW(),
    false
  )
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = NOW();

-- Step 3: Insert public.users profile
INSERT INTO public.users (
  id, 
  name, 
  email, 
  role, 
  shift_preference, 
  is_active, 
  created_at, 
  updated_at
) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Owner Mourden', 'owner@mourden.co', 'owner', 'all', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Admin Mourden', 'admin@mourden.co', 'admin', 'all', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Budi Santoso', 'staff1@mourden.co', 'staff', 'opening', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'Ani Wijaya', 'staff2@mourden.co', 'staff', 'middle', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'Dedi Kurniawan', 'staff3@mourden.co', 'staff', 'closing', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_preference = EXCLUDED.shift_preference,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Step 4: Insert identities untuk auth (supaya login smooth)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  id,
  id as user_id,
  jsonb_build_object('sub', id, 'email', email),
  'email',
  email,
  NOW(),
  NOW(),
  NOW()
FROM auth.users 
WHERE email LIKE '%@mourden.co'
ON CONFLICT (provider_id, provider) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();

-- Verifikasi data
SELECT 'auth.users created:' as status, count(*) as count 
FROM auth.users 
WHERE email LIKE '%@mourden.co';

SELECT 'public.users created:' as status, count(*) as count 
FROM public.users 
WHERE email LIKE '%@mourden.co';
