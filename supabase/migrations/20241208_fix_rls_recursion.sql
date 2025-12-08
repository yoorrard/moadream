-- Fix infinite recursion in RLS policies by using a SECURITY DEFINER function

-- 1. Create helper function to check project membership safely (bypassing RLS)
CREATE OR REPLACE FUNCTION public.check_is_project_member(project_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM project_members
    WHERE project_id = project_id_param
    AND user_id = auth.uid()
  );
END;
$$;

-- 2. Update project_members policy to use the function
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;

CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  USING (
    check_is_project_member(project_id)
  );

-- 3. Update projects policy to use the function (optimization and safety)
DROP POLICY IF EXISTS "Members can view their projects" ON public.projects;

CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT
  USING (
    check_is_project_member(id)
  );
