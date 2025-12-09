-- Securely get project by code bypassing RLS
-- This function allows authenticated users to find a project by its code
-- without giving them SELECT access to the entire projects table.

CREATE OR REPLACE FUNCTION public.get_project_by_code(p_code text)
RETURNS SETOF public.projects
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.projects
  WHERE upper(code) = upper(p_code)
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_by_code(text) TO authenticated;

COMMENT ON FUNCTION public.get_project_by_code(text) IS 'Securely lookup project by code for joining';
