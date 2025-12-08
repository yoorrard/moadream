-- Fix project_members INSERT policy
-- Prevent arbitrary users from adding others to projects. Only allow users to join themselves.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all member inserts" ON public.project_members;
DROP POLICY IF EXISTS "Members can add themselves" ON public.project_members; -- In case it exists from previous attempts

-- Create strict policy
CREATE POLICY "Members can join projects"
  ON public.project_members
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );
