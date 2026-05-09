-- =============================================
-- SEED USERS & DATA FOR MOURDENOPS
-- Run this in Supabase SQL Editor
-- Password untuk semua user: mourden123
-- =============================================

-- Step 1: Insert auth.users dulu (dengan password terenkripsi)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'owner@mourden.co', crypt('mourden123', gen_salt('bf')), NOW(), '{"role": "owner", "name": "Owner Mourden"}'::jsonb, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'admin@mourden.co', crypt('mourden123', gen_salt('bf')), NOW(), '{"role": "admin", "name": "Admin Mourden"}'::jsonb, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'staff1@mourden.co', crypt('mourden123', gen_salt('bf')), NOW(), '{"role": "staff", "name": "Budi Santoso"}'::jsonb, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'staff2@mourden.co', crypt('mourden123', gen_salt('bf')), NOW(), '{"role": "staff", "name": "Ani Wijaya"}'::jsonb, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'staff3@mourden.co', crypt('mourden123', gen_salt('bf')), NOW(), '{"role": "staff", "name": "Dedi Kurniawan"}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert ke public.users (setelah auth.users ada)
INSERT INTO public.users (id, name, email, role, shift_preference, is_active, created_at, updated_at)
VALUES 
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

-- Insert SOP Categories (if not exists)
INSERT INTO public.sop_categories (name, description, color, icon)
VALUES 
  ('Kebersihan', 'Task kebersihan harian', 'blue', 'sparkles'),
  ('Peralatan', 'Pengecekan dan perawatan alat', 'amber', 'tool'),
  ('F&B', 'Food and beverage preparation', 'green', 'coffee'),
  ('Kasir', 'Operasional kasir dan POS', 'purple', 'credit-card'),
  ('Keamanan', 'Keamanan dan lockdown', 'red', 'shield-check')
ON CONFLICT DO NOTHING;

-- Create Opening SOP Template
WITH opening_category AS (
  SELECT id FROM public.sop_categories WHERE name = 'Kebersihan' LIMIT 1
),
new_template AS (
  INSERT INTO public.sop_templates (title, description, shift, category_id, deadline_time, priority, is_active, created_at, updated_at)
  SELECT 
    'Opening - Pembersihan & Persiapan',
    'Task pembukaan untuk membersihkan dan mempersiapkan café',
    'opening',
    id,
    '08:00:00',
    'high',
    true,
    NOW(),
    NOW()
  FROM opening_category
  RETURNING id
)
INSERT INTO public.sop_tasks (sop_template_id, title, description, instruction, photo_required, order_index, role_required)
SELECT 
  id,
  unnest(ARRAY['Bersihkan espresso machine', 'Cek stok susu', 'Nyalakan POS system', 'Bersihkan meja dan kursi', 'Cek suhu ruangan']),
  unnest(ARRAY['Task espresso', 'Task stok', 'Task POS', 'Task kebersihan', 'Task AC']),
  unnest(ARRAY[
    'Bersihkan group head, flush water, dan wipe steam wand',
    'Pastikan stok susu cukup untuk shift ini (min 10L)',
    'Nyalakan komputer kasir dan cek printer struk',
    'Lap semua meja dan kursi, atur ulang posisi',
    'Pastikan AC berfungsi normal, suhu 22-24°C'
  ]),
  unnest(ARRAY[true, true, false, true, false]),
  unnest(ARRAY[1, 2, 3, 4, 5]),
  'staff'
FROM new_template;

-- Create Closing SOP Template
WITH closing_category AS (
  SELECT id FROM public.sop_categories WHERE name = 'Kebersihan' LIMIT 1
),
new_template AS (
  INSERT INTO public.sop_templates (title, description, shift, category_id, deadline_time, priority, is_active, created_at, updated_at)
  SELECT 
    'Closing - Pembersihan Akhir Hari',
    'Task penutupan untuk membersihkan café sebelum tutup',
    'closing',
    id,
    '22:00:00',
    'high',
    true,
    NOW(),
    NOW()
  FROM closing_category
  RETURNING id
)
INSERT INTO public.sop_tasks (sop_template_id, title, description, instruction, photo_required, order_index, role_required)
SELECT 
  id,
  unnest(ARRAY['Bersihkan semua meja', 'Simpan bahan baku', 'Rekonsiliasi kasir', 'Bersihkan espresso machine', 'Matikan semua peralatan']),
  unnest(ARRAY['Task meja', 'Task bahan', 'Task kasir', 'Task espresso', 'Task matikan']),
  unnest(ARRAY[
    'Lap dan sanitize semua meja dan kursi',
    'Masukkan susu, sirup, dan bahan ke kulkas',
    'Hitung uang tunai dan cocokkan dengan sistem',
    'Backflush dengan cleaner, bersihkan drip tray',
    'Matikan oven, mesin kopi, lampu hias, dan AC'
  ]),
  unnest(ARRAY[true, true, false, true, true]),
  unnest(ARRAY[1, 2, 3, 4, 5]),
  'staff'
FROM new_template;
