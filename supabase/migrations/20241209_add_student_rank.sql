-- Add student_rank column for tracking student academic ranking
-- Run this migration in Supabase SQL Editor

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_rank INTEGER;

COMMENT ON COLUMN public.students.student_rank IS '학생 석차 (선택 입력)';
