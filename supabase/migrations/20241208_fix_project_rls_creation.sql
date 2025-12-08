-- Fix Project Creation and Visibility RLS
-- 1. Create a safer INSERT policy using auth.role()
-- 2. Update SELECT policy to ensure leaders can see their own projects even before member (self-member) rows are added.

-- Projects Table Policies
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view their projects" ON public.projects;
-- Drop potentially stuck ones
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.projects;

-- (1) INSERT: Use auth.role() check which is more standard/robust
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated'); 

-- (2) SELECT: Members OR Leaders
-- This ensures that as soon as you create it (you are leader), you can see it.
-- This is critical for INSERT ... SELECT to work properly.
CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT
  USING (
    auth.uid() = leader_id -- Leader always sees
    OR
    check_is_project_member(id) -- Members see
  );

-- Reload config to ensure changes take effect immediately
NOTIFY pgrst, 'reload config';
