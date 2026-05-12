-- =============================================
-- FIX WRITE POLICIES (INSERT/UPDATE/DELETE)
-- All previous migrations only added SELECT.
-- This migration adds full write access for
-- admin/owner and update access for staff.
-- =============================================

-- ─── sop_categories ────────────────────────
-- RLS was never enabled on this table, so it
-- is open by default. Enable + open SELECT.
ALTER TABLE public.sop_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_all" ON public.sop_categories;
CREATE POLICY "categories_select_all" ON public.sop_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON public.sop_categories;
CREATE POLICY "admin_manage_categories" ON public.sop_categories
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- ─── sop_templates ─────────────────────────
DROP POLICY IF EXISTS "admin_manage_templates" ON public.sop_templates;
CREATE POLICY "admin_manage_templates" ON public.sop_templates
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- ─── sop_tasks ─────────────────────────────
DROP POLICY IF EXISTS "admin_manage_sop_tasks" ON public.sop_tasks;
CREATE POLICY "admin_manage_sop_tasks" ON public.sop_tasks
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- ─── daily_task_instances ──────────────────
-- Admin/owner: full access
DROP POLICY IF EXISTS "admin_manage_task_instances" ON public.daily_task_instances;
CREATE POLICY "admin_manage_task_instances" ON public.daily_task_instances
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- Staff: can update their own assigned tasks
DROP POLICY IF EXISTS "staff_update_own_tasks" ON public.daily_task_instances;
CREATE POLICY "staff_update_own_tasks" ON public.daily_task_instances
  FOR UPDATE USING (assigned_to = auth.uid());

-- ─── task_submissions ──────────────────────
DROP POLICY IF EXISTS "staff_insert_submission" ON public.task_submissions;
CREATE POLICY "staff_insert_submission" ON public.task_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_update_all_submissions" ON public.task_submissions;
CREATE POLICY "admin_update_all_submissions" ON public.task_submissions
  FOR UPDATE USING (
    submitted_by = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- ─── users ─────────────────────────────────
DROP POLICY IF EXISTS "admin_insert_users" ON public.users;
CREATE POLICY "admin_insert_users" ON public.users
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
    OR auth.uid() = id
  );

-- ─── Verify ────────────────────────────────
SELECT 'Write policies applied successfully!' AS status;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('sop_templates','sop_tasks','daily_task_instances','task_submissions','sop_categories')
ORDER BY tablename, cmd;
