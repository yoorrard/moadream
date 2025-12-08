'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { Button, Card, Modal, Select, useToast } from '@/components/common';
import { Sidebar } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Student, Project, BEHAVIOR_OPTIONS, Relationship } from '@/types';
import { getStudentLevel } from '@/utils/studentUtils';

export const dynamic = 'force-dynamic';

export default function ClassAssignmentPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { user, authUser, loading: authLoading, initialized } = useAuth();
    const { showToast } = useToast();

    const [project, setProject] = useState<Project | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignedClass, setAssignedClass] = useState<number | null>(null);
    const [activeStudent, setActiveStudent] = useState<Student | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAssignRemaining, setAiAssignRemaining] = useState<number>(1);

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
            if (data.assign) {
                setAiAssignRemaining(data.assign.remaining);
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

            const userId = authUser?.id || user?.id;
            if (userId) {
                const { data: memberData } = await supabase
                    .from('project_members')
                    .select('assigned_class')
                    .eq('project_id', projectId)
                    .eq('user_id', userId)
                    .single();

                if (memberData) {
                    setAssignedClass(memberData.assigned_class);
                }
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

    const handleAIAssign = async () => {
        if (!project || !assignedClass) return;
        const userId = authUser?.id || user?.id;
        if (!userId) return;

        setAiLoading(true);

        try {
            const myStudents = students.filter((s) => s.current_class === assignedClass);
            const currentAssignedClass = assignedClass; // 현재 선택된 학급 저장

            const response = await fetch('/api/ai/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    students: myStudents,
                    relationships,
                    targetClasses: project.target_classes,
                    projectId,
                    userId,
                }),
            });

            const result = await response.json();

            if (result.error) {
                showToast(result.error, 'error');
                return;
            }

            if (result.assignments) {
                const supabase = createClient();
                for (const assignment of result.assignments) {
                    await supabase
                        .from('students')
                        .update({ target_class: assignment.targetClass })
                        .eq('id', assignment.studentId);
                }
                await loadData();
                showToast('AI 배정이 완료되었습니다.', 'success');
                // assignedClass 복원 (loadData 후에도 현재 선택된 학급 유지)
                setAssignedClass(currentAssignedClass);
            }

            // 남은 횟수 업데이트
            if (typeof result.remaining === 'number') {
                setAiAssignRemaining(result.remaining);
            }
        } catch (error) {
            console.error('AI assignment failed:', error);
            showToast('AI 배정에 실패했습니다.', 'error');
        } finally {
            setAiLoading(false);
        }
    };

    const myStudents = assignedClass
        ? students.filter((s) => s.current_class === assignedClass)
        : [];

    const unassignedStudents = myStudents.filter((s) => !s.target_class);
    const targetClassGroups = Array.from({ length: project?.target_classes || 0 }, (_, i) => ({
        classNumber: i + 1,
        students: myStudents.filter((s) => s.target_class === i + 1),
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

    if (authLoading || loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    // 학급 선택 드롭다운
    const handleClassSelect = (classNum: number) => {
        setAssignedClass(classNum);
    };

    // 학급 선택 드롭다운 (assignedClass 없으면 선택 화면)
    if (!assignedClass) {
        const classOptions = [
            { value: '', label: '학급을 선택하세요' },
            ...Array.from({ length: project?.current_classes || 0 }, (_, i) => ({
                value: String(i + 1),
                label: `${i + 1}반`
            }))
        ];

        return (
            <div className={styles.container}>
                <Sidebar projectId={projectId} projectName={project?.name || ''} />
                <main className={styles.main}>
                    <div className={styles.classSelectCard}>
                        <h2>담당 학급 선택</h2>
                        <p>반편성을 진행할 학급을 선택해주세요.</p>
                        <div className={styles.classSelectDropdown}>
                            <Select
                                label=""
                                options={classOptions}
                                value=""
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setAssignedClass(Number(e.target.value));
                                    }
                                }}
                            />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // 색상 범례 데이터
    const legendItems = [
        { level: 1, label: '지도 최상', color: '#ef4444', bgColor: '#fef2f2' },
        { level: 2, label: '지도 상', color: '#ea580c', bgColor: '#fff7ed' },
        { level: 3, label: '지도 중', color: '#d97706', bgColor: '#fffbeb' },
        { level: 4, label: '지도 하', color: '#059669', bgColor: '#ecfdf5' },
        { level: 5, label: '양호', color: '#3b82f6', bgColor: '#ffffff' },
    ];

    // 학급 선택 드롭다운 옵션
    const classSelectOptions = [
        ...Array.from({ length: project?.current_classes || 0 }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1}반`
        }))
    ];

    return (
        <div className={styles.container}>
            <Sidebar
                projectId={projectId}
                projectName={project?.name || ''}
                assignedClass={assignedClass}
            />

            <main className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>학급 내 반편성</h1>
                        <p className={styles.subtitle}>
                            학생들을 진학 학급에 배치하세요.
                        </p>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.classSelector}>
                            <span className={styles.classSelectorLabel}>현재 담당:</span>
                            <Select
                                label=""
                                options={classSelectOptions}
                                value={String(assignedClass)}
                                onChange={(e) => setAssignedClass(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.aiButtonWrapper}>
                            <Button
                                variant="secondary"
                                onClick={handleAIAssign}
                                loading={aiLoading}
                                disabled={aiAssignRemaining <= 0}
                            >
                                ✨ AI 자동 배정
                            </Button>
                            <span className={`${styles.aiUsageHint} ${aiAssignRemaining <= 0 ? styles.exhausted : ''}`}>
                                남은 횟수: {aiAssignRemaining}/1
                            </span>
                        </div>
                    </div>
                </div>

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
                                {targetClassGroups.map((group) => {
                                    const stats = getClassStats(group.students);
                                    const conflicts = getConflictWarnings(group.students);
                                    const friendlies = getFriendlyMatches(group.students);

                                    return (
                                        <div key={group.classNumber} className={styles.targetClassCard}>
                                            <div className={styles.targetClassHeader}>
                                                <h4 className={styles.targetClassTitle}>{group.classNumber}반</h4>
                                                <div className={styles.classStats}>
                                                    <span className={styles.statTotal}>총 {stats.total}명</span>
                                                    <span className={styles.statMale}>남 {stats.male}</span>
                                                    <span className={styles.statFemale}>여 {stats.female}</span>
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
                                            <DroppableArea id={group.classNumber.toString()} className={styles.targetClassArea}>
                                                {group.students.map((student) => (
                                                    <DraggableStudent
                                                        key={student.id}
                                                        student={student}
                                                        relationships={relationships}
                                                        allStudents={students}
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
                                <StudentCard student={activeStudent} relationships={relationships} allStudents={students} />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </main>
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
}: {
    student: Student;
    relationships: Relationship[];
    allStudents: Student[];
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
            <StudentCard student={student} relationships={relationships} allStudents={allStudents} />
        </div>
    );
}

// Student Card
function StudentCard({
    student,
    relationships = [],
    allStudents = [],
}: {
    student: Student;
    relationships?: Relationship[];
    allStudents?: Student[];
}) {
    // Level & Color
    const { level } = getStudentLevel(student);
    const cardClass = styles[`cardLevel${level}`] || '';

    // Relationship Checks
    const myRel = relationships.filter(r => r.student_id === student.id || r.target_student_id === student.id);
    const sameClassRels = myRel.filter(r => {
        const partnerId = r.student_id === student.id ? r.target_student_id : r.student_id;
        const partner = allStudents.find(s => s.id === partnerId);
        // Check if both are in same class (target_class) and not null
        return partner && partner.target_class !== null && partner.target_class !== undefined && partner.target_class === student.target_class;
    }).map(r => {
        const partnerId = r.student_id === student.id ? r.target_student_id : r.student_id;
        const partner = allStudents.find(s => s.id === partnerId);
        return { ...r, partnerName: partner?.name };
    });

    return (
        <div className={`${styles.studentCard} ${cardClass}`}>
            <div className={styles.cardHeader}>
                <div className={styles.studentName}>{student.name}</div>
                {sameClassRels.length > 0 && (
                    <div className={styles.relIcons}>
                        {sameClassRels.map(r => (
                            <span key={r.id} className={`${styles.relIcon} ${r.type === 'conflict' ? styles.relConflict : styles.relFriendly}`}>
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
                {student.student_rank && (
                    <span className={styles.studentRank}>#{student.student_rank}</span>
                )}
                {student.behaviors?.slice(0, 2).map((b) => (
                    <span key={b} className={styles.behaviorTag}>
                        {BEHAVIOR_OPTIONS.find((o) => o.id === b)?.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
