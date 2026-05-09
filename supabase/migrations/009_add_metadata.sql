-- =============================================
-- UPDATE METADATA UNTUK USER YANG SUDAH ADA
-- Jalankan ini setelah buat user di Dashboard
-- =============================================

-- Update metadata untuk semua 5 user
UPDATE auth.users 
SET raw_user_meta_data = 
  CASE email
    WHEN 'hariharto.surya@gmail.com' THEN '{"role": "admin", "name": "Hari Harto", "shift": "all"}'::jsonb
    WHEN 'restu@gmail.com' THEN '{"role": "staff", "name": "Restu", "shift": "opening"}'::jsonb
    WHEN 'daffa.pratama@gmail.com' THEN '{"role": "staff", "name": "Daffa Pratama", "shift": "middle"}'::jsonb
    WHEN 'reyhandiffi@gmail.com' THEN '{"role": "owner", "name": "Reyhan Diffi", "shift": "all"}'::jsonb
    WHEN 'jonathanhenrry@gmail.com' THEN '{"role": "owner", "name": "Jonathan Henrry", "shift": "all"}'::jsonb
    ELSE raw_user_meta_data
  END,
  updated_at = NOW()
WHERE email IN (
  'hariharto.surya@gmail.com',
  'restu@gmail.com',
  'daffa.pratama@gmail.com',
  'reyhandiffi@gmail.com',
  'jonathanhenrry@gmail.com'
);

-- Note: app_metadata tidak ada di auth.users
-- Role sudah cukup disimpan di raw_user_meta_data
-- RLS policy menggunakan (auth.jwt() -> 'user_metadata' ->> 'role')

-- Verifikasi metadata
SELECT 
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'shift' as shift
FROM auth.users
WHERE email LIKE '%@gmail.com'
ORDER BY email;
