import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const AI_ASSIGN_LIMIT = 1; // 프로젝트당 AI 자동배정 횟수 제한
const AI_ANALYZE_LIMIT = 2; // 프로젝트당 AI 분석 횟수 제한

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        // userId는 이제 신뢰할 수 없는 클라이언트 파라미터가 아닌, 세션에서 가져옵니다.
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!projectId) {
            return NextResponse.json(
                { error: 'projectId is required' },
                { status: 400 }
            );
        }

        // 프로젝트 멤버십 확인 (선택 사항이지만 권장됨)
        // 여기서는 간단히 ai_usage 테이블의 RLS 정책에 의존하거나, 아래처럼 명시적으로 user_id 필터를 사용합니다.

        // AI 자동배정 사용 횟수 조회
        const { data: assignUsage, error: assignError } = await supabase
            .from('ai_usage')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', user.id) // 세션 유저 ID 사용
            .eq('usage_type', 'assign');

        if (assignError) {
            console.error('Assign usage check error:', assignError);
            throw assignError;
        }

        // AI 분석 사용 횟수 조회
        const { data: analyzeUsage, error: analyzeError } = await supabase
            .from('ai_usage')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', user.id) // 세션 유저 ID 사용
            .eq('usage_type', 'analyze');

        if (analyzeError) {
            console.error('Analyze usage check error:', analyzeError);
            throw analyzeError;
        }

        const assignUsed = assignUsage?.length || 0;
        const analyzeUsed = analyzeUsage?.length || 0;

        return NextResponse.json({
            assign: {
                used: assignUsed,
                limit: AI_ASSIGN_LIMIT,
                remaining: AI_ASSIGN_LIMIT - assignUsed,
            },
            analyze: {
                used: analyzeUsed,
                limit: AI_ANALYZE_LIMIT,
                remaining: AI_ANALYZE_LIMIT - analyzeUsed,
            },
        });
    } catch (error: any) {
        console.error('AI usage check error:', error);
        return NextResponse.json(
            { error: error.message || 'AI 사용량 조회에 실패했습니다.' },
            { status: 500 }
        );
    }
}
