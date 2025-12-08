-- 보안 정책 강화 및 프로젝트 삭제 권한 설정
-- 실행: Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. 기존 정책 삭제
-- ============================================

-- projects 테이블 기존 정책 삭제
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.projects;

-- project_members 테이블 기존 정책 삭제
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.project_members;

-- students 테이블 기존 정책 삭제
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.students;

-- relationships 테이블 기존 정책 삭제
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.relationships;


-- ============================================
-- 2. projects 테이블 세분화된 RLS 정책
-- ============================================

-- 멤버인 프로젝트 조회 가능
CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- 인증된 사용자는 프로젝트 생성 가능
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 리더만 프로젝트 수정 가능
CREATE POLICY "Leaders can update their projects"
  ON public.projects FOR UPDATE
  USING (leader_id = auth.uid());

-- 리더만 프로젝트 삭제 가능
CREATE POLICY "Leaders can delete their projects"
  ON public.projects FOR DELETE
  USING (leader_id = auth.uid());


-- ============================================
-- 3. project_members 테이블 세분화된 RLS 정책
-- ============================================

-- 같은 프로젝트 멤버 조회 가능
CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- 인증된 사용자는 멤버로 참여 가능
CREATE POLICY "Authenticated users can join projects"
  ON public.project_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 본인의 멤버십 수정 가능
CREATE POLICY "Members can update their own membership"
  ON public.project_members FOR UPDATE
  USING (user_id = auth.uid());

-- 본인의 멤버십 삭제 또는 리더가 멤버 삭제 가능
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


-- ============================================
-- 4. students 테이블 세분화된 RLS 정책 (보안 강화)
-- ============================================

-- 프로젝트 멤버만 해당 프로젝트의 학생 조회 가능
CREATE POLICY "Project members can view students"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = students.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버만 학생 추가 가능
CREATE POLICY "Project members can add students"
  ON public.students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = students.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버만 학생 수정 가능
CREATE POLICY "Project members can update students"
  ON public.students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = students.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버만 학생 삭제 가능
CREATE POLICY "Project members can delete students"
  ON public.students FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = students.project_id
      AND project_members.user_id = auth.uid()
    )
  );


-- ============================================
-- 5. relationships 테이블 세분화된 RLS 정책 (보안 강화)
-- ============================================

-- 프로젝트 멤버만 관계 조회 가능
CREATE POLICY "Project members can view relationships"
  ON public.relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.students s ON s.project_id = pm.project_id
      WHERE s.id = relationships.student_id
      AND pm.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버만 관계 추가 가능
CREATE POLICY "Project members can add relationships"
  ON public.relationships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.students s ON s.project_id = pm.project_id
      WHERE s.id = relationships.student_id
      AND pm.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버만 관계 수정 가능
CREATE POLICY "Project members can update relationships"
  ON public.relationships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.students s ON s.project_id = pm.project_id
      WHERE s.id = relationships.student_id
      AND pm.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버만 관계 삭제 가능
CREATE POLICY "Project members can delete relationships"
  ON public.relationships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.students s ON s.project_id = pm.project_id
      WHERE s.id = relationships.student_id
      AND pm.user_id = auth.uid()
    )
  );
