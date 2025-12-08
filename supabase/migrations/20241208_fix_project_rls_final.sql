-- Comprehensive fix for Project RLS
-- Drops potentially conflicting or permissive/broken policies and re-applies strict, standard policies.

-- 1. Projects Table
DROP POLICY IF EXISTS "Allow all project inserts" ON public.projects; -- Remove the suspicious policy
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Leaders can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Leaders can delete their projects" ON public.projects;
-- Cleanup strictly old ones too just in case
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.projects;

-- Re-create
-- (1) SELECT: Members can view
CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- (2) INSERT: Authenticated users can create
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  TO authenticated -- Explicitly restrict to authenticated role
  WITH CHECK (auth.uid() IS NOT NULL);

-- (3) UPDATE: Leaders can update
CREATE POLICY "Leaders can update their projects"
  ON public.projects FOR UPDATE
  USING (leader_id = auth.uid());

-- (4) DELETE: Leaders can delete
CREATE POLICY "Leaders can delete their projects"
  ON public.projects FOR DELETE
  USING (leader_id = auth.uid());


-- 2. Project Members Table
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Members can add themselves" ON public.project_members;
DROP POLICY IF EXISTS "Authenticated users can join projects" ON public.project_members; -- Old name
DROP POLICY IF EXISTS "Members can update their own membership" ON public.project_members;
DROP POLICY IF EXISTS "Members can leave or leaders can remove members" ON public.project_members;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.project_members;

-- (1) SELECT: Members can view members of their projects
CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- (2) INSERT: Members can add THEMSELVES (Standard joining pattern)
CREATE POLICY "Members can add themselves"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- (3) UPDATE: Members can update their own
CREATE POLICY "Members can update their own membership"
  ON public.project_members FOR UPDATE
  USING (user_id = auth.uid());

-- (4) DELETE: Self leave OR Project Leader remove
CREATE POLICY "Members can leave or leaders can remove members"
  ON public.project_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.leader_id = auth.uid()
    )
  );
