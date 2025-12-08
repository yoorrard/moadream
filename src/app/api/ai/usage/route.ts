import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const AI_ASSIGN_LIMIT = 1; // 프로젝트당 AI 자동배정 횟수 제한
const AI_ANALYZE_LIMIT = 2; // 프로젝트당 AI 분석 횟수 제한

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');

        if (!projectId || !userId) {
            return NextResponse.json(
                { error: 'projectId and userId are required' },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

        // AI 자동배정 사용 횟수 조회
        const { data: assignUsage, error: assignError } = await supabase
            .from('ai_usage')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .eq('usage_type', 'assign');

        if (assignError) {
            console.error('Assign usage check error:', assignError);
        }

        // AI 분석 사용 횟수 조회
        const { data: analyzeUsage, error: analyzeError } = await supabase
            .from('ai_usage')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .eq('usage_type', 'analyze');

        if (analyzeError) {
            console.error('Analyze usage check error:', analyzeError);
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
