-- =============================================
-- DISABLE RLS SEMENTARA - FIX 500 ERROR
-- =============================================

-- Disable RLS untuk semua tabel yang error
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_task_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Test query yang error
SELECT 'Testing users table...' as test;
SELECT COUNT(*) as user_count FROM public.users;

SELECT 'Testing daily_task_instances table...' as test;
SELECT COUNT(*) as task_count FROM public.daily_task_instances;

-- Enable RLS kembali dengan policy sederhana
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy sederhana tanpa recursion
-- User bisa lihat semua (sementara)
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);

-- Enable RLS untuk daily tasks
ALTER TABLE public.daily_task_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select_all" ON public.daily_task_instances FOR SELECT USING (true);

-- Enable RLS untuk submissions
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_select_all" ON public.task_submissions FOR SELECT USING (true);

-- Enable RLS untuk templates
ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select_all" ON public.sop_templates FOR SELECT USING (true);

-- Enable RLS untuk sop_tasks
ALTER TABLE public.sop_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sop_tasks_select_all" ON public.sop_tasks FOR SELECT USING (true);

-- Enable RLS untuk notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_all" ON public.notifications FOR SELECT USING (true);

-- Verifikasi
SELECT 'RLS Status:' as info, 
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('users', 'daily_task_instances', 'task_submissions');

SELECT 'All tables should work now!' as result;
