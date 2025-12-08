import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { Student, Relationship, BEHAVIOR_OPTIONS, SPECIAL_NOTES_OPTIONS } from '@/types';
import { createClient } from '@/lib/supabase/server';

const AI_ANALYZE_LIMIT = 2; // 프로젝트당 AI 분석 횟수 제한

interface ClassAnalysisRequest {
    students: Student[];
    relationships: Relationship[];
    targetClasses: number;
    projectId: string;
    // userId removed as it's fetched from session
}

export async function POST(request: NextRequest) {
    try {
        const { students, relationships, targetClasses, projectId }: ClassAnalysisRequest = await request.json();

        // Supabase 클라이언트 생성 (서버 사이드 - 쿠키 기반 인증)
        const supabase = await createClient();

        // 세션 사용자 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        const userId = user.id;

        // 프로젝트 멤버십 확인 (보안 강화)
        const { data: memberData, error: memberError } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .single();

        if (memberError || !memberData) {
            return NextResponse.json(
                { error: '해당 프로젝트에 대한 접근 권한이 없습니다.' },
                { status: 403 }
            );
        }

        // 사용 횟수 확인
        const { data: usageData, error: usageError } = await supabase
            .from('ai_usage')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .eq('usage_type', 'analyze');

        if (usageError) {
            console.error('Usage check error:', usageError);
        }

        const usedCount = usageData?.length || 0;
        const remaining = AI_ANALYZE_LIMIT - usedCount;

        if (remaining <= 0) {
            return NextResponse.json(
                { error: 'AI 분석 횟수를 모두 사용했습니다. (2회 제한)', remaining: 0 },
                { status: 400 }
            );
        }

        // 학급별 학생 그룹화
        const classGroups: Record<number, Student[]> = {};
        for (let i = 1; i <= targetClasses; i++) {
            classGroups[i] = students.filter(s => s.target_class === i);
        }

        // 각 학급별 통계 계산
        const classStats = Object.entries(classGroups).map(([classNum, classStudents]) => {
            const male = classStudents.filter(s => s.gender === 'male').length;
            const female = classStudents.length - male;

            // 행동 특성 분포
            const behaviorCounts: Record<string, number> = {};
            classStudents.forEach(s => {
                s.behaviors?.forEach(b => {
                    behaviorCounts[b] = (behaviorCounts[b] || 0) + 1;
                });
            });

            // 특이사항 분포
            const specialNoteCounts: Record<string, number> = {};
            classStudents.forEach(s => {
                s.special_notes?.forEach(n => {
                    specialNoteCounts[n] = (specialNoteCounts[n] || 0) + 1;
                });
            });

            // 관계 분석
            const studentIds = classStudents.map(s => s.id);
            const conflictsInClass = relationships.filter(
                r => r.type === 'conflict' &&
                    studentIds.includes(r.student_id) &&
                    studentIds.includes(r.target_student_id)
            );
            const friendliesInClass = relationships.filter(
                r => r.type === 'friendly' &&
                    studentIds.includes(r.student_id) &&
                    studentIds.includes(r.target_student_id)
            );

            // 지도 난이도 점수 계산
            let totalDifficultyScore = 0;
            classStudents.forEach(s => {
                s.behaviors?.forEach(b => {
                    const opt = BEHAVIOR_OPTIONS.find(o => o.id === b);
                    if (opt) totalDifficultyScore += opt.score;
                });
                s.special_notes?.forEach(n => {
                    const opt = SPECIAL_NOTES_OPTIONS.find(o => o.id === n);
                    if (opt) totalDifficultyScore += opt.score;
                });
            });

            // 석차 통계 계산
            const rankedStudents = classStudents.filter(s => s.student_rank != null && s.student_rank > 0);
            const ranks = rankedStudents.map(s => s.student_rank as number);
            const rankStats = ranks.length > 0 ? {
                count: ranks.length,
                min: Math.min(...ranks),
                max: Math.max(...ranks),
                avg: Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length * 10) / 10,
            } : null;

            return {
                classNumber: parseInt(classNum),
                total: classStudents.length,
                male,
                female,
                behaviorCounts,
                specialNoteCounts,
                conflictCount: conflictsInClass.length,
                friendlyCount: friendliesInClass.length,
                difficultyScore: totalDifficultyScore,
                rankStats,
            };
        });

        // AI 분석 요청
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
당신은 초등학교 반편성 전문 컨설턴트입니다. 다음 반편성 결과를 분석하고 종합 평가를 제공해주세요.

## 학급별 현황
${JSON.stringify(classStats, null, 2)}

## 행동 특성 옵션 정보 (점수가 높을수록 지도가 어려움)
${JSON.stringify(BEHAVIOR_OPTIONS.map(b => ({ id: b.id, label: b.label, score: b.score })), null, 2)}

## 특이사항 옵션 정보
${JSON.stringify(SPECIAL_NOTES_OPTIONS.map(n => ({ id: n.id, label: n.label, score: n.score })), null, 2)}

## 분석 요청 사항
1. 각 학급의 성별 균형 평가
2. 행동 특성 분포의 적절성 평가
3. 특이 사항 분포 분석
4. 갈등/우호 관계 현황 분석
5. 각 학급의 지도 난이도 비교
6. 석차 분포 균형 분석 (석차가 있는 학생들의 학급별 분포)
7. 종합 평가 및 권장사항

## 응답 형식 (반드시 이 JSON 형식으로만 응답)
{
  "classAnalyses": [
    {
      "classNumber": 1,
      "genderBalance": "균형 상태 설명",
      "behaviorAnalysis": "행동 특성 분석",
      "specialNoteAnalysis": "특이사항 분석",
      "relationshipAnalysis": "관계 분석",
      "rankAnalysis": "석차 분포 분석 (석차 데이터가 있는 경우)",
      "difficultyLevel": "상/중/하",
      "summary": "학급 요약 (2-3문장)"
    }
  ],
  "overallAnalysis": {
    "genderBalanceScore": "전체 성별 균형 점수 (1-10)",
    "difficultyBalanceScore": "학급간 지도 난이도 균형 점수 (1-10)",
    "relationshipScore": "관계 배치 적절성 점수 (1-10)",
    "rankBalanceScore": "석차 분포 균형 점수 (1-10, 석차 데이터가 있는 경우)",
    "overallScore": "종합 점수 (1-10)",
    "strengths": ["강점1", "강점2"],
    "improvements": ["개선점1", "개선점2"],
    "recommendations": "종합 권장사항 (3-4문장)"
  }
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

        // 사용 기록 저장
        const { error: insertError } = await supabase
            .from('ai_usage')
            .insert({
                project_id: projectId,
                user_id: userId,
                usage_type: 'analyze'
            });

        if (insertError) {
            console.error('Usage insert error:', insertError);
        }

        return NextResponse.json({
            classStats,
            aiAnalysis: aiResult,
            remaining: remaining - 1,
        });
    } catch (error: any) {
        console.error('AI analysis error:', error);
        return NextResponse.json(
            { error: error.message || 'AI 분석에 실패했습니다.' },
            { status: 500 }
        );
    }
}
