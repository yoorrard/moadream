-- 모아드림 초기 데이터베이스 스키마
-- 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code CHAR(6) UNIQUE NOT NULL,
  current_classes INT NOT NULL,
  target_classes INT NOT NULL,
  leader_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 멤버 테이블
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  assigned_class INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- 학생 테이블
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_class INT NOT NULL,
  target_class INT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  behaviors TEXT[],
  special_notes TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 학생 관계 테이블 (갈등/우호)
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  target_student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('conflict', 'friendly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, target_student_id)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- profiles 테이블 RLS 정책
-- 회원가입 시 자신의 프로필 생성 허용
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 자신의 프로필 조회 허용
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 자신의 프로필 수정 허용
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- projects 테이블 RLS 정책 (개발 단계에서는 모두 허용)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.projects;
CREATE POLICY "Enable all access for authenticated users"
  ON public.projects FOR ALL
  USING (auth.role() = 'authenticated');

-- project_members 테이블 RLS 정책
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.project_members;
CREATE POLICY "Enable all access for authenticated users"
  ON public.project_members FOR ALL
  USING (auth.role() = 'authenticated');

-- students 테이블 RLS 정책
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.students;
CREATE POLICY "Enable all access for authenticated users"
  ON public.students FOR ALL
  USING (auth.role() = 'authenticated');

-- relationships 테이블 RLS 정책
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.relationships;
CREATE POLICY "Enable all access for authenticated users"
  ON public.relationships FOR ALL
  USING (auth.role() = 'authenticated');
