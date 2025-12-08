-- Fix RLS Infinite Recursion
-- The issue is that checking project_members from within RLS invokes RLS again.
-- We must use a SECURITY DEFINER function to bypass RLS for the membership check.

-- 1. Create/Update SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.check_is_project_member(project_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with the privileges of the creator (postgres/admin)
  -- effectively bypassing RLS on project_members table.
  RETURN EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = project_id_param
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Projects Policy
DROP POLICY IF EXISTS "Members can view their projects" ON public.projects;
CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT
  USING (check_is_project_member(id));

-- 3. Update Project Members Policy
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  USING (
    user_id = auth.uid() -- Always allow seeing own row (base case)
    OR
    check_is_project_member(project_id) -- Use secure function for others
  );

-- 4. Force refresh of schema cache (sometimes needed)
NOTIFY pgrst, 'reload config';
