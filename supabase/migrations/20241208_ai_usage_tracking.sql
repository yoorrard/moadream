-- AI 사용 횟수 추적 테이블
-- AI 자동 배정: 계정당 각 프로젝트에서 1회
-- AI 분석: 계정당 각 프로젝트에서 2회

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_type TEXT CHECK (usage_type IN ('assign', 'analyze')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자 모두 접근 가능
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.ai_usage;
CREATE POLICY "Enable all access for authenticated users"
  ON public.ai_usage FOR ALL
  USING (auth.role() = 'authenticated');

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_ai_usage_project_user ON public.ai_usage(project_id, user_id, usage_type);
