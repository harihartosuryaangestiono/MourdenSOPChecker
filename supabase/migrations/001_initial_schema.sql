-- =============================================
-- MOURDENOPS DATABASE SCHEMA
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

-- Insert default categories
INSERT INTO public.sop_categories (name, description, color, icon) VALUES
('Kebersihan', 'Task kebersihan harian', 'blue', 'sparkles'),
('Peralatan', 'Pengecekan dan perawatan alat', 'amber', 'tool'),
('F&B', 'Food and beverage preparation', 'green', 'coffee'),
('Kasir', 'Operasional kasir dan POS', 'purple', 'credit-card'),
('Keamanan', 'Keamanan dan lockdown', 'red', 'shield-check');

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
-- INDEXES
-- =============================================
CREATE INDEX idx_daily_tasks_date ON public.daily_task_instances(date);
CREATE INDEX idx_daily_tasks_assigned ON public.daily_task_instances(assigned_to);
CREATE INDEX idx_daily_tasks_status ON public.daily_task_instances(status);
CREATE INDEX idx_submissions_task ON public.task_submissions(task_instance_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- =============================================
-- ROW LEVEL SECURITY
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
