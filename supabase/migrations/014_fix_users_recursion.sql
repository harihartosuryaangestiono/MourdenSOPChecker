-- =============================================
-- FIX 500 ERROR: INFINITE RECURSION IN RLS
-- =============================================

-- Drop ALL possible policies on users table to ensure no recursive policies are left behind
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "admin_read_all_users" ON public.users;
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_all" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy (Read)
-- Non-recursive: relies on JWT metadata instead of querying the users table again
CREATE POLICY "users_read_policy" ON public.users 
  FOR SELECT USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- 2. UPDATE Policy (Write)
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

-- 3. INSERT Policy (For Trigger and manual inserts)
-- The trigger uses SECURITY DEFINER so it bypasses RLS, but we allow admin/owner to insert just in case
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'owner')
  );

SELECT 'All recursive policies removed and replaced with safe policies!' as status;
