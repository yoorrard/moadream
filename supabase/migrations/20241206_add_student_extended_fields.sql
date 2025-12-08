-- Add new columns to students table for extended functionality
-- Run this migration in Supabase SQL Editor

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_number INTEGER;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS original_class INTEGER;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS custom_behavior TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS custom_special_note TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS memo TEXT;

-- Update existing students to set original_class from current_class if null
UPDATE public.students SET original_class = current_class WHERE original_class IS NULL;
