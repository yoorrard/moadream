import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { Student, Relationship } from '@/types';
import { createClient } from '@/lib/supabase/server';

const AI_ASSIGN_LIMIT = 1; // 프로젝트당 AI 자동배정 횟수 제한

export async function POST(request: NextRequest) {
    try {
        const { students, relationships, targetClasses, projectId } = await request.json();

        // 1. 인증된 Supabase 클라이언트 생성
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
                { error: 'ProjectId is required' },
                { status: 400 }
            );
        }

        // 2. 사용 횟수 확인 (RLS 적용된 상태에서 조회)
        const { data: usageData, error: usageError } = await supabase
            .from('ai_usage')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', user.id) // 세션 유저 ID 강제
            .eq('usage_type', 'assign');

        if (usageError) {
            console.error('Usage check error:', usageError);
            throw usageError;
        }

        const usedCount = usageData?.length || 0;
        const remaining = AI_ASSIGN_LIMIT - usedCount;

        if (remaining <= 0) {
            return NextResponse.json(
                { error: 'AI 자동배정 횟수를 모두 사용했습니다. (1회 제한)', remaining: 0 },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
당신은 초등학교 반편성 전문가입니다. 다음 학생들을 ${targetClasses}개의 진학 학급에 최적으로 배정해주세요.

## 배정 원칙
1. 성별 균형: 각 학급에 남녀 학생 수가 균등해야 합니다.
2. 행동 특성 분산: 리더십, 산만함 등 특정 특성이 한 학급에 몰리지 않게 합니다.
3. 갈등 관계 분리: conflict 관계인 학생들은 다른 학급에 배치합니다.
4. 우호 관계 고려: friendly 관계는 가능하면 같은 학급에 배치하되, 필수는 아닙니다.
5. 특이사항 분산: 쌍둥이는 분리, 특별관리 학생은 분산합니다.

## 학생 데이터
${JSON.stringify(students, null, 2)}

## 관계 데이터 (student_id와 target_student_id 사이의 관계)
${JSON.stringify(relationships, null, 2)}

## 응답 형식
다음 JSON 형식으로만 응답하세요:
{
  "assignments": [
    { "studentId": "학생ID", "targetClass": 배정학급번호 },
    ...
  ],
  "reasoning": "배정 이유 간략 설명"
}
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // JSON 추출
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const aiResult = JSON.parse(jsonMatch[0]);

        // 3. 사용 기록 저장 (인증된 사용자로 저장)
        const { error: insertError } = await supabase
            .from('ai_usage')
            .insert({
                project_id: projectId,
                user_id: user.id, // 세션 유저 ID 강제
                usage_type: 'assign'
            });

        if (insertError) {
            console.error('Usage insert error:', insertError);
            // 기록 저장 실패해도 결과는 반환? 아니면 에러? 
            // 여기서는 사용자가 이득을 볼 수 없게 에러 처리가 안전하지만, AI 비용은 이미 발생함.
            // 클라이언트에게 알리기 위해 에러를 로깅하고 진행하거나 에러를 던질 수 있음. 
            // 일단 로깅만 하고 진행 (사용자 경험 우선)
        }

        return NextResponse.json({ ...aiResult, remaining: remaining - 1 });
    } catch (error: any) {
        console.error('AI assignment error:', error);
        return NextResponse.json(
            { error: error.message || 'AI 배정에 실패했습니다.' },
            { status: 500 }
        );
    }
}
