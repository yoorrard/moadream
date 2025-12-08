-- Fix projects INSERT policy to work with anon key (uses public role, not authenticated)
-- Previous policy used 'TO authenticated' which caused RLS violations in production
-- Simplified to only check auth.uid() IS NOT NULL (ownership enforced on UPDATE/DELETE)
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;

CREATE POLICY "Authenticated users can create projects"
  ON public.projects
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix project_members INSERT policy
DROP POLICY IF EXISTS "Members can add themselves" ON public.project_members;

CREATE POLICY "Members can add themselves"
  ON public.project_members
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix ai_usage policy to use public role
DROP POLICY IF EXISTS "Authenticated users can manage ai_usage" ON public.ai_usage;

CREATE POLICY "Authenticated users can manage ai_usage"
  ON public.ai_usage
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix profiles SELECT policy (remove redundant authenticated policy)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
