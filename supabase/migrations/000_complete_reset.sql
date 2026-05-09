-- =============================================
-- MOURDENOPS - COMPLETE DATABASE RESET
-- Drop all tables and recreate from scratch
-- =============================================

-- Step 1: DROP ALL TABLES (CASCADE to remove dependencies)
DROP TABLE IF EXISTS public.task_submissions CASCADE;
DROP TABLE IF EXISTS public.daily_task_instances CASCADE;
DROP TABLE IF EXISTS public.sop_tasks CASCADE;
DROP TABLE IF EXISTS public.sop_templates CASCADE;
DROP TABLE IF EXISTS public.sop_categories CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Also clean auth tables (HAPUS data lama dulu)
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@mourden.co');
DELETE FROM auth.users WHERE email LIKE '%@mourden.co';

-- =============================================
-- STEP 2: CREATE ALL TABLES
-- =============================================

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  avatar_url TEXT,
  phone VARCHAR(20),
  shift_preference VARCHAR(20) DEFAULT 'all' CHECK (shift_preference IN ('opening', 'middle', 'closing', 'all')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOP Categories
CREATE TABLE public.sop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(30) DEFAULT 'amber',
  icon VARCHAR(50) DEFAULT 'clipboard-list',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOP Templates
CREATE TABLE public.sop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  shift VARCHAR(20) NOT NULL CHECK (shift IN ('opening', 'middle', 'closing', 'daily')),
  category_id UUID REFERENCES public.sop_categories(id) ON DELETE SET NULL,
  deadline_time TIME NOT NULL,
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOP Tasks (sub-tasks within each template)
CREATE TABLE public.sop_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_template_id UUID REFERENCES public.sop_templates(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  instruction TEXT,
  photo_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  role_required VARCHAR(20) DEFAULT 'staff' CHECK (role_required IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Task Instances (generated each day from templates)
CREATE TABLE public.daily_task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_task_id UUID REFERENCES public.sop_tasks(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift VARCHAR(20) NOT NULL CHECK (shift IN ('opening', 'middle', 'closing', 'daily')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'rejected')),
  deadline_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Submissions (photo proof records)
CREATE TABLE public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_instance_id UUID REFERENCES public.daily_task_instances(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES public.users(id),
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  notes TEXT,
  admin_note TEXT,
  status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'revision_requested')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(30) CHECK (type IN ('task_due', 'task_overdue', 'submission_review', 'approved', 'rejected', 'revision_requested', 'system')),
  is_read BOOLEAN DEFAULT false,
  related_task_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEP 3: CREATE INDEXES
-- =============================================
CREATE INDEX idx_daily_tasks_date ON public.daily_task_instances(date);
CREATE INDEX idx_daily_tasks_assigned ON public.daily_task_instances(assigned_to);
CREATE INDEX idx_daily_tasks_status ON public.daily_task_instances(status);
CREATE INDEX idx_submissions_task ON public.task_submissions(task_instance_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- =============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, admin/owner reads all
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin_read_all_users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Daily tasks: staff sees own, admin/owner sees all
CREATE POLICY "staff_own_tasks" ON public.daily_task_instances FOR SELECT USING (
  assigned_to = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Submissions: staff submits own, admin/owner reviews all
CREATE POLICY "staff_submit_own" ON public.task_submissions FOR INSERT WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "admin_read_all_submissions" ON public.task_submissions FOR SELECT USING (
  submitted_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "admin_update_submissions" ON public.task_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Notifications: users read own only
CREATE POLICY "own_notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- =============================================
-- STEP 5: INSERT DEFAULT CATEGORIES
-- =============================================
INSERT INTO public.sop_categories (name, description, color, icon) VALUES
('Kebersihan', 'Task kebersihan harian', 'blue', 'sparkles'),
('Peralatan', 'Pengecekan dan perawatan alat', 'amber', 'tool'),
('F&B', 'Food and beverage preparation', 'green', 'coffee'),
('Kasir', 'Operasional kasir dan POS', 'purple', 'credit-card'),
('Keamanan', 'Keamanan dan lockdown', 'red', 'shield-check');

-- =============================================
-- STEP 6: CREATE AUTH USERS WITH PASSWORD HASH
-- Password: mourden123
-- Hash: $2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C
-- =============================================

-- Insert into auth.users (Supabase Auth table)
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_user_meta_data, 
  created_at, 
  updated_at,
  confirmation_sent_at
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111', 
    'owner@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "owner", "name": "Owner Mourden"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222', 
    'admin@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "admin", "name": "Admin Mourden"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333', 
    'staff1@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "staff", "name": "Budi Santoso"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444', 
    'staff2@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "staff", "name": "Ani Wijaya"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555555', 
    'staff3@mourden.co', 
    '$2a$10$zOq6MA59czVurmy6zF5BceNdXOzVrsUbwIWrZskIlxK3x3XINCN5C',
    NOW(), 
    '{"role": "staff", "name": "Dedi Kurniawan"}'::jsonb, 
    NOW(), 
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = NOW();

-- Insert into public.users (profile data)
INSERT INTO public.users (id, name, email, role, shift_preference, is_active, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Owner Mourden', 'owner@mourden.co', 'owner', 'all', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Admin Mourden', 'admin@mourden.co', 'admin', 'all', true, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Budi Santoso', 'staff1@mourden.co', 'staff', 'opening', true, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'Ani Wijaya', 'staff2@mourden.co', 'staff', 'middle', true, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Dedi Kurniawan', 'staff3@mourden.co', 'staff', 'closing', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_preference = EXCLUDED.shift_preference,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Insert identities for auth
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
SELECT 
  id, id, jsonb_build_object('sub', id, 'email', email), 'email', email, NOW(), NOW(), NOW()
FROM auth.users 
WHERE email LIKE '%@mourden.co'
ON CONFLICT (provider_id, provider) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();

-- =============================================
-- STEP 7: CREATE SAMPLE SOP TEMPLATES
-- =============================================

-- Opening SOP Template
WITH kebersihan AS (SELECT id FROM public.sop_categories WHERE name = 'Kebersihan' LIMIT 1),
opening_template AS (
  INSERT INTO public.sop_templates (title, description, shift, category_id, deadline_time, priority, is_active)
  SELECT 'Opening - Pembersihan & Persiapan', 'Task pembukaan untuk membersihkan dan mempersiapkan café', 'opening', id, '08:00:00', 'high', true
  FROM kebersihan
  RETURNING id
)
INSERT INTO public.sop_tasks (sop_template_id, title, instruction, photo_required, order_index, role_required)
SELECT id, 'Bersihkan espresso machine', 'Bersihkan group head, flush water, dan wipe steam wand', true, 1, 'staff' FROM opening_template
UNION ALL SELECT id, 'Cek stok susu', 'Pastikan stok susu cukup untuk shift ini (min 10L)', true, 2, 'staff' FROM opening_template
UNION ALL SELECT id, 'Nyalakan POS system', 'Nyalakan komputer kasir dan cek printer struk', false, 3, 'staff' FROM opening_template
UNION ALL SELECT id, 'Bersihkan meja dan kursi', 'Lap semua meja dan kursi, atur ulang posisi', true, 4, 'staff' FROM opening_template
UNION ALL SELECT id, 'Cek suhu ruangan', 'Pastikan AC berfungsi normal, suhu 22-24°C', false, 5, 'staff' FROM opening_template;

-- Closing SOP Template
WITH closing_template AS (
  INSERT INTO public.sop_templates (title, description, shift, category_id, deadline_time, priority, is_active)
  SELECT 'Closing - Pembersihan Akhir Hari', 'Task penutupan untuk membersihkan café sebelum tutup', 'closing', id, '22:00:00', 'high', true
  FROM public.sop_categories WHERE name = 'Kebersihan' LIMIT 1
  RETURNING id
)
INSERT INTO public.sop_tasks (sop_template_id, title, instruction, photo_required, order_index, role_required)
SELECT id, 'Bersihkan semua meja', 'Lap dan sanitize semua meja dan kursi', true, 1, 'staff' FROM closing_template
UNION ALL SELECT id, 'Simpan bahan baku', 'Masukkan susu, sirup, dan bahan ke kulkas', true, 2, 'staff' FROM closing_template
UNION ALL SELECT id, 'Rekonsiliasi kasir', 'Hitung uang tunai dan cocokkan dengan sistem', false, 3, 'staff' FROM closing_template
UNION ALL SELECT id, 'Bersihkan espresso machine', 'Backflush dengan cleaner, bersihkan drip tray', true, 4, 'staff' FROM closing_template
UNION ALL SELECT id, 'Matikan semua peralatan', 'Matikan oven, mesin kopi, lampu hias, dan AC', true, 5, 'staff' FROM closing_template;

-- =============================================
-- STEP 8: VERIFY CREATION
-- =============================================
SELECT '=== DATABASE RESET COMPLETE ===' as status;
SELECT 'Users created:' as info, COUNT(*) as count FROM public.users;
SELECT 'Categories created:' as info, COUNT(*) as count FROM public.sop_categories;
SELECT 'SOP Templates created:' as info, COUNT(*) as count FROM public.sop_templates;
SELECT 'SOP Tasks created:' as info, COUNT(*) as count FROM public.sop_tasks;
SELECT 'Auth users created:' as info, COUNT(*) as count FROM auth.users WHERE email LIKE '%@mourden.co';
