-- Emergency Fix: Enable RLS and Fix Function Search Paths
-- Date: 2024-12-08

-- 1. Enable RLS on sensitive tables (CRITICAL SECURITY FIX)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 2. Fix Function Search Paths (Security Definer functions should have fixed search_path)
-- Prevent search_path hijacking
ALTER FUNCTION public.encrypt_text(text) SET search_path = public;
ALTER FUNCTION public.decrypt_text(bytea) SET search_path = public;
ALTER FUNCTION public.encrypt_array(text[]) SET search_path = public;
ALTER FUNCTION public.decrypt_array(bytea) SET search_path = public;

-- Also fix handle_new_user if it exists (from linter warning)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public;
  END IF;
END $$;
