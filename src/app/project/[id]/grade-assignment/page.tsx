'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import styles from './page.module.css';
import { Button, Card, Modal, useToast } from '@/components/common';
import { Sidebar } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Student, Project, BEHAVIOR_OPTIONS, SPECIAL_NOTES_OPTIONS, Relationship } from '@/types';
import { getStudentLevel } from '@/utils/studentUtils';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

interface ClassAnalysis {
    classNumber: number;
    genderBalance: string;
    behaviorAnalysis: string;
    specialNoteAnalysis: string;
    relationshipAnalysis: string;
    difficultyLevel: string;
    summary: string;
}

interface OverallAnalysis {
    genderBalanceScore: string;
    difficultyBalanceScore: string;
    relationshipScore: string;
    overallScore: string;
    strengths: string[];
    improvements: string[];
    recommendations: string;
}

interface AIAnalysisResult {
    classStats: any[];
    aiAnalysis: {
        classAnalyses: ClassAnalysis[];
        overallAnalysis: OverallAnalysis;
    };
}

export default function GradeAssignmentPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { user, authUser, loading: authLoading, initialized } = useAuth();
    const { showToast } = useToast();

    const [project, setProject] = useState<Project | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeStudent, setActiveStudent] = useState<Student | null>(null);

    // 반편성 완료 모달 상태
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
    const [aiAnalyzeRemaining, setAiAnalyzeRemaining] = useState<number>(2);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    // AI 사용 횟수 로드
    const loadAiUsage = async () => {
        const userId = authUser?.id || user?.id;
        if (!userId) return;

        try {
            const response = await fetch(`/api/ai/usage?projectId=${projectId}&userId=${userId}`);
            const data = await response.json();
            if (data.analyze) {
                setAiAnalyzeRemaining(data.analyze.remaining);
            }
        } catch (error) {
            console.error('Failed to load AI usage:', error);
        }
    };

    useEffect(() => {
        if (!initialized) return;

        if (!authUser) {
            router.push('/login');
            return;
        }

        loadData();
        loadAiUsage();
        // 실시간 구독 설정
        const supabase = createClient();
        const subscription = supabase
            .channel('students-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'students', filter: `project_id=eq.${projectId}` },
                () => {
                    loadData();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [authUser, initialized, projectId]);

    const loadData = async () => {
        try {
            const supabase = createClient();

            const { data: projectData } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (projectData) {
                setProject(projectData);
            }

            const { data: studentsData } = await supabase
                .from('students')
                .select('*')
                .eq('project_id', projectId)
                .order('name', { ascending: true });

            setStudents(studentsData || []);

            const { data: relationshipsData } = await supabase
                .from('relationships')
                .select('*')
                .eq('project_id', projectId);

            setRelationships(relationshipsData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const student = students.find((s) => s.id === event.active.id);
        setActiveStudent(student || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveStudent(null);
        const { active, over } = event;

        if (!over) return;

        const studentId = active.id as string;
        const targetClass = over.id === 'unassigned' ? null : parseInt(over.id as string);

        const supabase = createClient();
        await supabase
            .from('students')
            .update({ target_class: targetClass })
            .eq('id', studentId);

        setStudents((prev) =>
            prev.map((s) =>
                s.id === studentId ? { ...s, target_class: targetClass } : s
            )
        );
    };

    // 반편성 완료 처리 - 모달만 열기
    const handleComplete = () => {
        setShowCompleteModal(true);
        setAnalysisResult(null);
    };

    // AI 분석 실행
    const handleAnalyze = async () => {
        const userId = authUser?.id || user?.id;
        if (!userId) return;

        setAnalysisLoading(true);

        try {
            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    students: students.filter(s => s.target_class),
                    relationships,
                    targetClasses: project?.target_classes || 0,
                    projectId,
                    userId,
                }),
            });

            const result = await response.json();
            if (result.error) {
                showToast(result.error, 'error');
                return;
            }
            setAnalysisResult(result);
            showToast('AI 분석이 완료되었습니다.', 'success');

            // 남은 횟수 업데이트
            if (typeof result.remaining === 'number') {
                setAiAnalyzeRemaining(result.remaining);
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            showToast('분석에 실패했습니다.', 'error');
        } finally {
            setAnalysisLoading(false);
        }
    };

    // 개선된 엑셀 다운로드
    const handleExportExcel = () => {
        if (!project) return;

        try {
            const wb = XLSX.utils.book_new();

            // 시트 1: 전체 요약
            const summaryData = [
                ['반편성 결과 요약', '', '', '', ''],
                ['프로젝트명', project.name, '', '', ''],
                ['생성일', new Date().toLocaleDateString('ko-KR'), '', '', ''],
                ['', '', '', '', ''],
                ['학급', '총원', '남학생', '여학생', '갈등관계'],
            ];

            const targetClassGroups = Array.from({ length: project.target_classes }, (_, i) => ({
                classNumber: i + 1,
                students: students.filter((s) => s.target_class === i + 1),
            }));

            targetClassGroups.forEach(({ classNumber, students: classStudents }) => {
                const male = classStudents.filter(s => s.gender === 'male').length;
                const female = classStudents.length - male;
                const studentIds = classStudents.map(s => s.id);
                const conflicts = relationships.filter(
                    r => r.type === 'conflict' &&
                        studentIds.includes(r.student_id) &&
                        studentIds.includes(r.target_student_id)
                ).length;

                summaryData.push([
                    `${classNumber}반`,
                    String(classStudents.length),
                    String(male),
                    String(female),
                    String(conflicts)
                ]);
            });

            const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summaryWs, '요약');

            // 시트 2-N: 각 학급별 명단 (이름순)
            targetClassGroups.forEach(({ classNumber, students: classStudents }) => {
                const sortedStudents = [...classStudents].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

                const classData = [
                    [`${classNumber}반 명단`],
                    ['번호', '이름', '성별', '원 학급'],
                ];

                sortedStudents.forEach((s, index) => {
                    classData.push([
                        String(index + 1),
                        s.name,
                        s.gender === 'male' ? '남' : '여',
                        `${s.current_class}반`
                    ]);
                });

                const classWs = XLSX.utils.aoa_to_sheet(classData);
                XLSX.utils.book_append_sheet(wb, classWs, `${classNumber}반 명단`);
            });

            // 시트: 전체 학생 상세 정보
            const allStudentsData = [
                ['전체 학생 상세 정보'],
                ['진학학급', '이름', '성별', '원학급', '행동특성', '특이사항', '메모'],
            ];

            students
                .filter(s => s.target_class)
                .sort((a, b) => (a.target_class || 0) - (b.target_class || 0) || a.name.localeCompare(b.name, 'ko'))
                .forEach(s => {
                    const behaviors = s.behaviors?.map(b => BEHAVIOR_OPTIONS.find(o => o.id === b)?.label).filter(Boolean).join(', ') || '';
                    const specialNotes = s.special_notes?.map(n => SPECIAL_NOTES_OPTIONS.find(o => o.id === n)?.label).filter(Boolean).join(', ') || '';

                    allStudentsData.push([
                        `${s.target_class}반`,
                        s.name,
                        s.gender === 'male' ? '남' : '여',
                        `${s.current_class}반`,
                        behaviors,
                        specialNotes,
                        s.memo || ''
                    ]);
                });

            const allStudentsWs = XLSX.utils.aoa_to_sheet(allStudentsData);
            XLSX.utils.book_append_sheet(wb, allStudentsWs, '학생상세정보');

            // 시트: 관계 분석
            const relationshipData = [
                ['관계 분석'],
                ['유형', '학생1', '학생1 진학학급', '학생2', '학생2 진학학급', '같은 학급 여부'],
            ];

            relationships.forEach(r => {
                const s1 = students.find(s => s.id === r.student_id);
                const s2 = students.find(s => s.id === r.target_student_id);

                if (s1 && s2) {
                    const sameClass = s1.target_class && s2.target_class && s1.target_class === s2.target_class;
                    relationshipData.push([
                        r.type === 'conflict' ? '갈등' : '우호',
                        s1.name,
                        s1.target_class ? `${s1.target_class}반` : '미배정',
                        s2.name,
                        s2.target_class ? `${s2.target_class}반` : '미배정',
                        sameClass ? '예' : '아니오'
                    ]);
                }
            });

            const relationshipWs = XLSX.utils.aoa_to_sheet(relationshipData);
            XLSX.utils.book_append_sheet(wb, relationshipWs, '관계분석');

            XLSX.writeFile(wb, `${project.name}_반편성결과_${new Date().toISOString().split('T')[0]}.xlsx`);

            showToast('엑셀 파일이 생성되었습니다.', 'success');
        } catch (error) {
            console.error(error);
            showToast('엑셀 다운로드에 실패했습니다.', 'error');
        }
    };

    const allStudents = students;
    const unassignedStudents = allStudents.filter((s) => !s.target_class);
    const targetClassGroups = Array.from({ length: project?.target_classes || 0 }, (_, i) => ({
        classNumber: i + 1,
        students: allStudents.filter((s) => s.target_class === i + 1),
    }));

    const getClassStats = (classStudents: Student[]) => {
        const total = classStudents.length;
        const male = classStudents.filter((s) => s.gender === 'male').length;
        const female = total - male;
        return { total, male, female };
    };

    const getConflictWarnings = (classStudents: Student[]) => {
        const studentIds = classStudents.map((s) => s.id);
        return relationships.filter(
            (r) =>
                r.type === 'conflict' &&
                studentIds.includes(r.student_id) &&
                studentIds.includes(r.target_student_id)
        );
    };

    const getFriendlyMatches = (classStudents: Student[]) => {
        const studentIds = classStudents.map((s) => s.id);
        return relationships.filter(
            (r) =>
                r.type === 'friendly' &&
                studentIds.includes(r.student_id) &&
                studentIds.includes(r.target_student_id)
        );
    };

    const getTotalStats = () => {
        const assigned = students.filter((s) => s.target_class);
        const unassigned = students.filter((s) => !s.target_class);
        return {
            total: students.length,
            assigned: assigned.length,
            unassigned: unassigned.length,
            progress: students.length > 0 ? Math.round((assigned.length / students.length) * 100) : 0,
        };
    };

    // 색상 범례 데이터
    const legendItems = [
        { level: 1, label: '지도 최상', color: '#ef4444', bgColor: '#fef2f2' },
        { level: 2, label: '지도 상', color: '#ea580c', bgColor: '#fff7ed' },
        { level: 3, label: '지도 중', color: '#d97706', bgColor: '#fffbeb' },
        { level: 4, label: '지도 하', color: '#059669', bgColor: '#ecfdf5' },
        { level: 5, label: '양호', color: '#3b82f6', bgColor: '#ffffff' },
    ];

    if (authLoading || loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    const stats = getTotalStats();

    return (
        <div className={styles.container}>
            <Sidebar projectId={projectId} projectName={project?.name || ''} />

            <main className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>학년 반편성</h1>
                        <p className={styles.subtitle}>
                            전체 학급의 반편성 결과를 확인하고 수정하세요.
                        </p>
                    </div>
                    <div className={styles.headerRight}>
                        <Button
                            variant="primary"
                            onClick={handleComplete}
                            disabled={stats.progress < 100}
                        >
                            ✅ 반편성 완료
                        </Button>
                    </div>
                </div>

                {/* 진행 현황 */}
                <Card className={styles.progressCard}>
                    <div className={styles.progressHeader}>
                        <h3>배정 현황</h3>
                        <span className={styles.progressPercent}>{stats.progress}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${stats.progress}%` }}
                        ></div>
                    </div>
                    <div className={styles.progressStats}>
                        <span>전체 {stats.total}명</span>
                        <span className={styles.assigned}>배정 완료 {stats.assigned}명</span>
                        <span className={styles.unassignedStat}>미배정 {stats.unassigned}명</span>
                    </div>
                </Card>

                {/* 색상 범례 */}
                <div className={styles.legend}>
                    <span className={styles.legendLabel}>학생 카드 색상 안내:</span>
                    <div className={styles.legendItems}>
                        {legendItems.map((item) => (
                            <div key={item.level} className={styles.legendItem}>
                                <span
                                    className={styles.legendColor}
                                    style={{ borderLeftColor: item.color, backgroundColor: item.bgColor }}
                                ></span>
                                <span className={styles.legendText}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.legendDivider}></div>
                    <div className={styles.legendRelation}>
                        <span className={styles.legendRelIcon}>⚡</span>
                        <span className={styles.legendRelText}>갈등 관계</span>
                        <span className={styles.legendRelIcon}>💚</span>
                        <span className={styles.legendRelText}>우호 관계</span>
                        <span className={styles.legendNote}>(같은 학급 배정 시 표시)</span>
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className={styles.assignmentBoard}>
                        {/* 미배정 학생 영역 */}
                        <div className={styles.unassignedSection}>
                            <h3 className={styles.sectionTitle}>
                                미배정 학생 ({unassignedStudents.length})
                            </h3>
                            <DroppableArea id="unassigned" className={styles.unassignedArea}>
                                {unassignedStudents.map((student) => (
                                    <DraggableStudent
                                        key={student.id}
                                        student={student}
                                        relationships={relationships}
                                        allStudents={students}
                                    />
                                ))}
                            </DroppableArea>
                        </div>

                        {/* 진학 학급 영역 */}
                        <div className={styles.targetClassesSection}>
                            <h3 className={styles.sectionTitle}>진학 학급</h3>
                            <div className={styles.targetClassesGrid}>
                                {targetClassGroups.map(({ classNumber, students: classStudents }) => {
                                    const classStats = getClassStats(classStudents);
                                    const conflicts = getConflictWarnings(classStudents);
                                    const friendlies = getFriendlyMatches(classStudents);

                                    return (
                                        <div key={classNumber} className={styles.targetClassCard}>
                                            <div className={styles.targetClassHeader}>
                                                <h4 className={styles.targetClassTitle}>{classNumber}반</h4>
                                                <div className={styles.classStats}>
                                                    <span className={styles.statTotal}>총 {classStats.total}명</span>
                                                    <span className={styles.statMale}>남 {classStats.male}</span>
                                                    <span className={styles.statFemale}>여 {classStats.female}</span>
                                                </div>
                                            </div>
                                            {(conflicts.length > 0 || friendlies.length > 0) && (
                                                <div className={styles.relationSummary}>
                                                    {conflicts.length > 0 && (
                                                        <span className={styles.conflictCount}>⚡ {conflicts.length}</span>
                                                    )}
                                                    {friendlies.length > 0 && (
                                                        <span className={styles.friendlyCount}>💚 {friendlies.length}</span>
                                                    )}
                                                </div>
                                            )}
                                            <DroppableArea id={String(classNumber)} className={styles.targetClassArea}>
                                                {classStudents.map((student) => (
                                                    <DraggableStudent
                                                        key={student.id}
                                                        student={student}
                                                        relationships={relationships}
                                                        allStudents={students}
                                                        showCurrentClass
                                                    />
                                                ))}
                                            </DroppableArea>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DragOverlay>
                        {activeStudent && (
                            <div className={styles.dragOverlay}>
                                <StudentCard student={activeStudent} showCurrentClass />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </main>

            {/* 반편성 완료 모달 */}
            <Modal
                isOpen={showCompleteModal}
                onClose={() => setShowCompleteModal(false)}
                title="🎉 반편성 완료"
                size="xl"
            >
                <div className={styles.completeModalContent}>
                    {/* AI 분석 섹션 */}
                    <div className={styles.analysisSection}>
                        <div className={styles.analysisSectionHeader}>
                            <h3 className={styles.analysisSectionTitle}>📊 AI 분석</h3>
                            {!analysisResult && !analysisLoading && (
                                <div className={styles.aiButtonWrapper}>
                                    <Button
                                        variant="secondary"
                                        onClick={handleAnalyze}
                                        disabled={aiAnalyzeRemaining <= 0}
                                    >
                                        🤖 AI 분석 실행
                                    </Button>
                                    <span className={`${styles.aiUsageHint} ${aiAnalyzeRemaining <= 0 ? styles.exhausted : ''}`}>
                                        남은 횟수: {aiAnalyzeRemaining}/2
                                    </span>
                                </div>
                            )}
                        </div>

                        {analysisLoading ? (
                            <div className={styles.analysisLoading}>
                                <div className={styles.spinner}></div>
                                <p>AI가 반편성 결과를 분석 중입니다...</p>
                            </div>
                        ) : analysisResult?.aiAnalysis ? (
                            <>
                                <div className={styles.analysisGrid}>
                                    {analysisResult.aiAnalysis.classAnalyses?.map((analysis) => (
                                        <div key={analysis.classNumber} className={styles.classAnalysisCard}>
                                            <div className={styles.classAnalysisHeader}>
                                                <span className={styles.classAnalysisTitle}>
                                                    {analysis.classNumber}반 분석
                                                </span>
                                                <span className={styles.difficultyBadge} data-level={analysis.difficultyLevel}>
                                                    난이도: {analysis.difficultyLevel}
                                                </span>
                                            </div>
                                            <div className={styles.classAnalysisBody}>
                                                <div className={styles.analysisItem}>
                                                    <span className={styles.analysisLabel}>성별 균형</span>
                                                    <span className={styles.analysisValue}>{analysis.genderBalance}</span>
                                                </div>
                                                <div className={styles.analysisSummary}>
                                                    {analysis.summary}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {analysisResult.aiAnalysis.overallAnalysis && (
                                    <div className={styles.overallAnalysis}>
                                        <div className={styles.overallAnalysisHeader}>
                                            <span className={styles.overallAnalysisTitle}>📋 종합 평가</span>
                                            <span className={styles.overallScore}>
                                                {analysisResult.aiAnalysis.overallAnalysis.overallScore}/10점
                                            </span>
                                        </div>
                                        <div className={styles.overallAnalysisContent}>
                                            <div className={styles.overallItem}>
                                                <span className={styles.overallLabel}>✅ 강점</span>
                                                <ul className={styles.overallList}>
                                                    {analysisResult.aiAnalysis.overallAnalysis.strengths?.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className={styles.overallItem}>
                                                <span className={styles.overallLabel}>⚠️ 개선점</span>
                                                <ul className={styles.overallList}>
                                                    {analysisResult.aiAnalysis.overallAnalysis.improvements?.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className={styles.recommendations}>
                                                <span className={styles.overallLabel}>💡 권장사항</span>
                                                <p>{analysisResult.aiAnalysis.overallAnalysis.recommendations}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={styles.analysisPlaceholder}>
                                <p>🤖 AI 분석 버튼을 클릭하여 반편성 결과를 분석하세요.</p>
                                <p className={styles.analysisPlaceholderSub}>
                                    각 학급의 성별 균형, 행동 특성, 특이사항 분포 등을 종합 분석합니다.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 다운로드 섹션 */}
                    <div className={styles.downloadSection}>
                        <p className={styles.downloadInfo}>
                            📥 반편성 결과를 엑셀 파일로 다운로드하세요. 요약, 학급별 명단, 학생 상세 정보, 관계 분석 시트가 포함됩니다.
                        </p>
                        <div className={styles.downloadButtons}>
                            <Button variant="primary" onClick={handleExportExcel}>
                                📥 엑셀 다운로드
                            </Button>
                            <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
                                닫기
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Droppable Area
function DroppableArea({
    id,
    children,
    className,
}: {
    id: string;
    children: React.ReactNode;
    className?: string;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? styles.dropOver : ''}`}
        >
            {children}
        </div>
    );
}

// Draggable Student
function DraggableStudent({
    student,
    relationships,
    allStudents,
    showCurrentClass = false,
}: {
    student: Student;
    relationships: Relationship[];
    allStudents: Student[];
    showCurrentClass?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: student.id,
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            opacity: isDragging ? 0.5 : 1,
        }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={styles.draggableStudent}
        >
            <StudentCard
                student={student}
                relationships={relationships}
                allStudents={allStudents}
                showCurrentClass={showCurrentClass}
            />
        </div>
    );
}

// Student Card
function StudentCard({
    student,
    relationships = [],
    allStudents = [],
    showCurrentClass = false,
}: {
    student: Student;
    relationships?: Relationship[];
    allStudents?: Student[];
    showCurrentClass?: boolean;
}) {
    // Level & Color
    const { level } = getStudentLevel(student);
    const cardClass = styles[`cardLevel${level}`] || '';

    // Relationship Checks (only for same target class)
    const myRel = relationships.filter(r => r.student_id === student.id || r.target_student_id === student.id);
    const sameClassRels = myRel.filter(r => {
        const partnerId = r.student_id === student.id ? r.target_student_id : r.student_id;
        const partner = allStudents.find(s => s.id === partnerId);
        // Check if both are in same class (target_class) and target_class is set
        return partner &&
            partner.target_class !== null &&
            partner.target_class !== undefined &&
            partner.target_class === student.target_class;
    }).map(r => {
        const partnerId = r.student_id === student.id ? r.target_student_id : r.student_id;
        const partner = allStudents.find(s => s.id === partnerId);
        return { ...r, partnerName: partner?.name };
    });

    return (
        <div className={`${styles.studentCard} ${cardClass}`}>
            <div className={styles.cardHeader}>
                <div className={styles.studentName}>
                    {student.name}
                    {showCurrentClass && (
                        <span className={styles.currentClassBadge}>{student.current_class}반</span>
                    )}
                </div>
                {sameClassRels.length > 0 && (
                    <div className={styles.relIcons}>
                        {sameClassRels.map(r => (
                            <span
                                key={r.id}
                                className={`${styles.relIcon} ${r.type === 'conflict' ? styles.relConflict : styles.relFriendly}`}
                            >
                                {r.type === 'conflict' ? '⚡' : '💚'}
                                <span className={styles.tooltip}>
                                    {r.type === 'conflict' ? '갈등' : '우호'} 관계: {r.partnerName}
                                </span>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.studentMeta}>
                <span className={`${styles.genderBadge} ${styles[student.gender]}`}>
                    {student.gender === 'male' ? '남' : '여'}
                </span>
                {student.behaviors?.slice(0, 2).map((b) => (
                    <span key={b} className={styles.behaviorTag}>
                        {BEHAVIOR_OPTIONS.find((o) => o.id === b)?.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
