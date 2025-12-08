'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button, Card, Input, Modal, Checkbox, Select, useToast } from '@/components/common';
import { Sidebar } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Student, Project, BEHAVIOR_OPTIONS, SPECIAL_NOTES_OPTIONS, Gender, BehaviorType, SpecialNoteType, Relationship } from '@/types';
import { getStudentLevel } from '@/utils/studentUtils';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export default function StudentsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { user, authUser, loading: authLoading, initialized } = useAuth();
    const { showToast } = useToast();

    const [project, setProject] = useState<Project | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);

    useEffect(() => {
        if (!initialized) return;
        if (!authUser) {
            router.push('/login');
            return;
        }
        if (projectId) {
            loadData();
        }
    }, [projectId, authUser, initialized]);

    const loadData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: projectData } = await supabase.from('projects').select('*').eq('id', projectId).single();
            setProject(projectData);

            const { data: studentsData } = await supabase.from('students').select('*').eq('project_id', projectId).order('current_class').order('student_number').order('name');
            setStudents(studentsData || []);

            const { data: relData } = await supabase.from('relationships').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
            setRelationships(relData || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const supabase = createClient();
            await supabase.from('relationships').delete().or(`student_id.eq.${id},target_student_id.eq.${id}`);
            await supabase.from('students').delete().eq('id', id);
            showToast('학생이 삭제되었습니다.', 'success');
            loadData();
        } catch (error) {
            console.error('Error deleting student:', error);
            showToast('삭제에 실패했습니다.', 'error');
        }
    };

    const filteredStudents = selectedClass ? students.filter(s => s.current_class === selectedClass) : students;
    const classStudentCount = selectedClass ? filteredStudents.length : students.length;

    const getTagStyle = (style?: string) => {
        switch (style) {
            case 'danger': return styles.tagDanger;
            case 'warning': return styles.tagWarning;
            case 'success': return styles.tagSuccess;
            case 'neutral': return styles.tagNeutral;
            default: return styles.tagNeutral;
        }
    };

    // Calculate Student Level based on scores
    // Used utility
    const getStudentLevelInfo = (s: Student) => {
        const { level, label } = getStudentLevel(s);
        let style = styles.level5;
        if (level === 1) style = styles.level1;
        if (level === 2) style = styles.level2;
        if (level === 3) style = styles.level3;
        if (level === 4) style = styles.level4;
        return { style, label };
    };

    if (authLoading || loading) {
        return <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>;
    }

    return (
        <div className={styles.container}>
            <Sidebar projectId={projectId} projectName={project?.name || ''} />
            <main className={styles.main}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>학생 관리</h1>
                        <p className={styles.subtitle}>{project?.name}</p>
                    </div>
                    <div className={styles.actions}>
                        <Button variant="outline" onClick={() => setShowUploadModal(true)}>학생 일괄 등록</Button>
                        <Button onClick={() => setShowAddModal(true)}>학생 추가</Button>
                    </div>
                </header>

                <Card className={styles.contentCard}>
                    {/* 학급 필터 */}
                    <div className={styles.filterSection}>
                        <div className={styles.filterRow}>
                            <Select
                                label=""
                                options={[{ value: '', label: '전체 학급' }, ...Array.from({ length: project?.current_classes || 0 }).map((_, i) => ({ value: String(i + 1), label: `${i + 1}반` }))]}
                                value={selectedClass === null ? '' : String(selectedClass)}
                                onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
                            />
                            <span className={styles.studentCount}>{classStudentCount}명</span>
                        </div>
                    </div>

                    {/* 학생 목록 테이블 */}
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>번호</th>
                                    <th>학급</th>
                                    <th>이름</th>
                                    <th>성별</th>
                                    <th>석차</th>
                                    <th>유형</th>
                                    <th>행동특성</th>
                                    <th>특이사항</th>
                                    <th>메모</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr><td colSpan={10} className={styles.emptyRow}>등록된 학생이 없습니다.</td></tr>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const levelInfo = getStudentLevelInfo(student);
                                        return (
                                            <tr key={student.id}>
                                                <td>{student.student_number || '-'}</td>
                                                <td>{student.current_class}반</td>
                                                <td>{student.name}</td>
                                                <td>
                                                    <span className={student.gender === 'male' ? styles.genderMale : styles.genderFemale}>
                                                        {student.gender === 'male' ? '남' : '여'}
                                                    </span>
                                                </td>
                                                <td>{student.student_rank || '-'}</td>
                                                <td>
                                                    <span className={`${styles.levelBadge} ${levelInfo.style}`}>{levelInfo.label}</span>
                                                </td>
                                                <td>
                                                    <div className={styles.tags}>
                                                        {student.behaviors?.map(b => {
                                                            const opt = BEHAVIOR_OPTIONS.find(o => o.id === b);
                                                            return <span key={b} className={`${styles.tag} ${getTagStyle(opt?.style)}`}>{opt?.label}</span>;
                                                        })}
                                                        {student.custom_behavior && <span className={`${styles.tag} ${styles.tagNeutral}`}>{student.custom_behavior}</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.tags}>
                                                        {student.special_notes?.map(n => {
                                                            const opt = SPECIAL_NOTES_OPTIONS.find(o => o.id === n);
                                                            return <span key={n} className={`${styles.tag} ${getTagStyle(opt?.style)}`}>{opt?.label}</span>;
                                                        })}
                                                        {student.custom_special_note && <span className={`${styles.tag} ${styles.tagNeutral}`}>{student.custom_special_note}</span>}
                                                    </div>
                                                </td>
                                                <td className={styles.memoCell}>{student.memo || '-'}</td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <Button variant="ghost" size="sm" onClick={() => setEditingStudent(student)}>수정</Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(student.id)} style={{ color: '#ef4444' }}>삭제</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 관계 관리 섹션 */}
                    <RelationshipSection
                        allStudents={students}
                        relationships={relationships}
                        projectId={projectId}
                        currentClasses={project?.current_classes || 0}
                        selectedClass={selectedClass}
                        onUpdate={loadData}
                    />
                </Card>
            </main>

            <StudentFormModal isOpen={showAddModal || !!editingStudent} onClose={() => { setShowAddModal(false); setEditingStudent(null); }} student={editingStudent} projectId={projectId} currentClasses={project?.current_classes || 3} userId={user?.id || authUser?.id || ''} onSuccess={loadData} />
            <ExcelUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} projectId={projectId} userId={user?.id || authUser?.id || ''} onSuccess={loadData} />
        </div>
    );
}

function RelationshipSection({ allStudents, relationships, projectId, onUpdate, currentClasses, selectedClass }: { allStudents: Student[]; relationships: Relationship[]; projectId: string; onUpdate: () => void; currentClasses: number; selectedClass: number | null; }) {
    const [studentA, setStudentA] = useState('');
    const [targetClass, setTargetClass] = useState<number | null>(null);
    const [studentB, setStudentB] = useState('');
    const [relType, setRelType] = useState<'conflict' | 'friendly'>('conflict');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const sourceStudents = selectedClass ? allStudents.filter(s => s.current_class === selectedClass) : allStudents;
    const targetStudents = targetClass ? allStudents.filter(s => s.current_class === targetClass) : allStudents;

    const handleAdd = async () => {
        if (!studentA || !studentB) { showToast('학생을 선택해주세요.', 'error'); return; }
        if (studentA === studentB) { showToast('동일한 학생을 선택할 수 없습니다.', 'error'); return; }

        setLoading(true);
        try {
            const supabase = createClient();
            await supabase.from('relationships').insert({ project_id: projectId, student_id: studentA, target_student_id: studentB, type: relType });
            setStudentA(''); setStudentB('');
            // Optional: reset target class? No, user might add multiple from same class.
            showToast('관계가 추가되었습니다.', 'success');
            onUpdate();
        } catch (error) {
            console.error(error);
            showToast('관계 추가에 실패했습니다.', 'error');
        } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('삭제하시겠습니까?')) return;
        try {
            const supabase = createClient();
            await supabase.from('relationships').delete().eq('id', id);
            showToast('관계가 삭제되었습니다.', 'success');
            onUpdate();
        } catch (error) {
            console.error(error);
            showToast('관계 삭제에 실패했습니다.', 'error');
        }
    };

    const getName = (id: string) => {
        const s = allStudents.find(s => s.id === id);
        return s ? `${s.current_class}반 ${s.name}` : '삭제된 학생';
    };

    const sourceOptions = [{ value: '', label: '기준 학생 선택' }, ...sourceStudents.map(s => ({ value: s.id, label: `${s.current_class}반 ${s.name}` }))];
    const targetClassOptions = [{ value: '', label: '전체' }, ...Array.from({ length: currentClasses }, (_, i) => ({ value: String(i + 1), label: `${i + 1}반` }))];
    const targetStudentOptions = [{ value: '', label: '대상 학생 선택' }, ...targetStudents.map(s => ({ value: s.id, label: `${s.current_class}반 ${s.name}` }))];

    return (
        <div className={styles.relationSection}>
            <h3 className={styles.sectionTitle}>🔗 관계 관리</h3>

            <div className={styles.relationInputContainer}>
                <div className={styles.relationInputGroup}>
                    <div className={styles.inputLabel}>1. 기준 학생</div>
                    <Select label="" options={sourceOptions} value={studentA} onChange={(e) => setStudentA(e.target.value)} />
                </div>

                <div className={styles.relationArrow}>➜</div>

                <div className={styles.relationInputGroup}>
                    <div className={styles.inputLabel}>2. 관계 유형</div>
                    <div className={styles.relTypeButtons}>
                        <button className={`${styles.relTypeBtn} ${relType === 'conflict' ? styles.conflict : ''}`} onClick={() => setRelType('conflict')}>⚡ 갈등</button>
                        <button className={`${styles.relTypeBtn} ${relType === 'friendly' ? styles.friendly : ''}`} onClick={() => setRelType('friendly')}>💚 우호</button>
                    </div>
                </div>

                <div className={styles.relationArrow}>➜</div>

                <div className={styles.relationInputGroup}>
                    <div className={styles.inputLabel}>3. 대상 학생</div>
                    <div className={styles.targetSelectGroup}>
                        <Select label="" options={targetClassOptions} value={targetClass ? String(targetClass) : ''} onChange={(e) => { setTargetClass(e.target.value ? Number(e.target.value) : null); setStudentB(''); }} />
                        <Select label="" options={targetStudentOptions} value={studentB} onChange={(e) => setStudentB(e.target.value)} />
                    </div>
                </div>

                <div className={styles.addButtonWrapper}>
                    <Button onClick={handleAdd} loading={loading} disabled={!studentA || !studentB}>추가</Button>
                </div>
            </div>

            <div className={styles.relationListContainer}>
                <h4 className={styles.listTitle}>등록된 관계 목록 ({relationships.length})</h4>
                {relationships.length === 0 ? (
                    <div className={styles.emptyRelList}>등록된 관계가 없습니다.</div>
                ) : (
                    <div className={styles.relationList}>
                        {relationships.map(rel => (
                            <div key={rel.id} className={`${styles.relationCard} ${rel.type === 'conflict' ? styles.cardConflict : styles.cardFriendly}`}>
                                <div className={styles.relCardHeader}>
                                    <span className={styles.relTypeIcon}>{rel.type === 'conflict' ? '⚡' : '💚'}</span>
                                    <span className={styles.relTypeText}>{rel.type === 'conflict' ? '갈등 관계' : '우호 관계'}</span>
                                    <button className={styles.relDeleteBtn} onClick={() => handleDelete(rel.id)}>삭제</button>
                                </div>
                                <div className={styles.relCardBody}>
                                    <div className={styles.studentName}>{getName(rel.student_id)}</div>
                                    <div className={styles.relDirection}>↔</div>
                                    <div className={styles.studentName}>{getName(rel.target_student_id)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// StudentFormModal and ExcelUploadModal remain largely same, just ensuring scoring logic works with data
function StudentFormModal({ isOpen, onClose, student, projectId, currentClasses, userId, onSuccess }: { isOpen: boolean; onClose: () => void; student: Student | null; projectId: string; currentClasses: number; userId: string; onSuccess: () => void; }) {
    const [studentNumber, setStudentNumber] = useState('');
    const [name, setName] = useState('');
    const [currentClass, setCurrentClass] = useState('1');
    const [gender, setGender] = useState<Gender>('male');
    const [behaviors, setBehaviors] = useState<BehaviorType[]>([]);
    const [specialNotes, setSpecialNotes] = useState<SpecialNoteType[]>([]);
    const [customBehavior, setCustomBehavior] = useState('');
    const [customSpecialNote, setCustomSpecialNote] = useState('');
    const [memo, setMemo] = useState('');
    const [studentRank, setStudentRank] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    // "Other" checkboxes handling
    const [hasOtherBehavior, setHasOtherBehavior] = useState(false);
    const [hasOtherNote, setHasOtherNote] = useState(false);

    useEffect(() => {
        if (student) {
            setStudentNumber(student.student_number?.toString() || '');
            setName(student.name);
            setCurrentClass(String(student.current_class));
            setGender(student.gender);
            setBehaviors(student.behaviors || []);
            setSpecialNotes(student.special_notes || []);
            setCustomBehavior(student.custom_behavior || '');
            setCustomSpecialNote(student.custom_special_note || '');
            setMemo(student.memo || '');
            setStudentRank(student.student_rank?.toString() || '');
            setHasOtherBehavior(student.behaviors?.includes('other_behavior') || !!student.custom_behavior);
            setHasOtherNote(student.special_notes?.includes('other_note') || !!student.custom_special_note);
        } else {
            setStudentNumber(''); setName(''); setCurrentClass('1'); setGender('male');
            setBehaviors([]); setSpecialNotes([]); setCustomBehavior(''); setCustomSpecialNote(''); setMemo('');
            setStudentRank('');
            setHasOtherBehavior(false); setHasOtherNote(false);
        }
    }, [student, isOpen]);

    const handleBehaviorChange = (id: string, checked: boolean) => {
        if (id === 'other_behavior') {
            setHasOtherBehavior(checked);
        }
        setBehaviors(prev => checked ? [...prev, id] : prev.filter(b => b !== id));
    };

    const handleNoteChange = (id: string, checked: boolean) => {
        if (id === 'other_note') {
            setHasOtherNote(checked);
        }
        setSpecialNotes(prev => checked ? [...prev, id] : prev.filter(n => n !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentNumber) { showToast('번호를 입력해주세요.', 'error'); return; }
        if (!name.trim()) { showToast('이름을 입력해주세요.', 'error'); return; }

        setLoading(true);
        try {
            const supabase = createClient();
            const classNum = parseInt(currentClass);
            const data = {
                name: name.trim(),
                student_number: parseInt(studentNumber),
                current_class: classNum,
                original_class: classNum,
                gender,
                behaviors: behaviors || [],
                special_notes: specialNotes || [],
                custom_behavior: hasOtherBehavior ? customBehavior.trim() : null,
                custom_special_note: hasOtherNote ? customSpecialNote.trim() : null,
                memo: memo.trim() || null,
                student_rank: studentRank ? parseInt(studentRank) : null,
            };
            if (student) {
                await supabase.from('students').update(data).eq('id', student.id);
                showToast('학생 정보가 수정되었습니다.', 'success');
            } else {
                await supabase.from('students').insert([{ ...data, project_id: projectId, created_by: userId }]);
                showToast('학생이 추가되었습니다.', 'success');
            }
            onSuccess(); onClose();
        } catch (err) {
            console.error(err);
            showToast('저장에 실패했습니다.', 'error');
        } finally { setLoading(false); }
    };

    const classOptions = Array.from({ length: currentClasses }, (_, i) => ({ value: String(i + 1), label: `${i + 1}반` }));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={student ? '학생 정보 수정' : '학생 추가'} size="lg">
            <form onSubmit={handleSubmit} className={styles.studentForm}>
                <div className={styles.formRow}>
                    <Input label="번호 (필수)" type="number" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required fullWidth />
                    <Input label="석차 (선택)" type="number" value={studentRank} onChange={(e) => setStudentRank(e.target.value)} placeholder="예: 1" fullWidth />
                </div>
                <div className={styles.formRow}>
                    <Input label="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
                </div>
                <div className={styles.formRow}>
                    <Select label="학급 (필수)" options={classOptions} value={currentClass} onChange={(e) => setCurrentClass(e.target.value)} fullWidth />
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>성별 (필수)</label>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}><input type="radio" checked={gender === 'male'} onChange={() => setGender('male')} /> 남자</label>
                            <label className={styles.radioLabel}><input type="radio" checked={gender === 'female'} onChange={() => setGender('female')} /> 여자</label>
                        </div>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>행동 특성 (선택)</label>
                    <div className={styles.checkboxGrid}>
                        {BEHAVIOR_OPTIONS.map((opt) => (
                            <Checkbox
                                key={opt.id}
                                label={opt.label}
                                checked={behaviors.includes(opt.id as BehaviorType)}
                                onChange={(e) => handleBehaviorChange(opt.id, e.target.checked)}
                            />
                        ))}
                    </div>
                    {hasOtherBehavior && (
                        <div className={styles.customInputFade}>
                            <Input label="기타 행동특성 입력" value={customBehavior} onChange={(e) => setCustomBehavior(e.target.value)} placeholder="내용을 입력하세요" fullWidth />
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>특이사항 (선택)</label>
                    <div className={styles.checkboxGrid}>
                        {SPECIAL_NOTES_OPTIONS.map((opt) => (
                            <Checkbox
                                key={opt.id}
                                label={opt.label}
                                checked={specialNotes.includes(opt.id as SpecialNoteType)}
                                onChange={(e) => handleNoteChange(opt.id, e.target.checked)}
                            />
                        ))}
                    </div>
                    {hasOtherNote && (
                        <div className={styles.customInputFade}>
                            <Input label="기타 특이사항 입력" value={customSpecialNote} onChange={(e) => setCustomSpecialNote(e.target.value)} placeholder="내용을 입력하세요" fullWidth />
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>메모 (선택)</label>
                    <textarea className={styles.textarea} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="학생에 대한 추가 정보를 입력하세요" rows={3} />
                </div>

                <div className={styles.modalActions}>
                    <Button type="button" variant="outline" onClick={onClose}>취소</Button>
                    <Button type="submit" loading={loading}>{student ? '수정하기' : '추가하기'}</Button>
                </div>
            </form>
        </Modal>
    );
}

function ExcelUploadModal({ isOpen, onClose, projectId, userId, onSuccess }: { isOpen: boolean; onClose: () => void; projectId: string; userId: string; onSuccess: () => void; }) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new();

        // 시트 1: 작성 안내
        const guideData = [
            ['📋 학생 명단 작성 안내'],
            [''],
            ['✅ 필수 입력 항목'],
            ['항목', '설명', '입력 방법'],
            ['번호', '학생 번호', '숫자로 입력 (예: 1, 2, 3...)'],
            ['이름', '학생 이름', '한글 이름 입력 (예: 홍길동)'],
            ['학급', '현재 학급', '숫자로 입력 (예: 1, 2, 3...)'],
            ['성별', '학생 성별', '"남" 또는 "여"로 입력'],
            [''],
            ['📌 선택 입력 항목'],
            ['항목', '설명', '입력 방법'],
            ['행동특성(선택)', '학생의 행동 특성', '쉼표로 구분하여 입력'],
            ['', '', '사용 가능 값: 리더십, 활동적, 학습우수, 폭력적, 수업방해, 게임몰입, 왕따가해, 왕따피해, 기타:내용'],
            ['특이사항(선택)', '학생의 특이사항', '쉼표로 구분하여 입력'],
            ['', '', '사용 가능 값: 알레르기, 장애, 다문화, 쌍둥이, 재적학생, 새터민, 기타:내용'],
            ['석차(선택)', '학생의 석차', '숫자로 입력 (예: 1, 5, 10...)'],
            ['메모(선택)', '추가 참고 사항', '자유롭게 입력'],
            [''],
            ['📝 입력 예시'],
            ['- 행동특성: "리더십, 활동적"'],
            ['- 특이사항: "알레르기, 기타:상담필요"'],
            ['- 기타 항목: "기타:내용"과 같이 "기타:" 접두사 사용'],
            [''],
            ['⚠️ 주의사항'],
            ['1. "학생명단" 시트에 데이터를 입력하세요.'],
            ['2. 첫 번째 행(헤더)은 수정하지 마세요.'],
            ['3. 성별은 반드시 "남" 또는 "여"로 입력하세요.'],
        ];
        const guideWs = XLSX.utils.aoa_to_sheet(guideData);
        guideWs['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, guideWs, '작성안내');

        // 시트 2: 학생명단 (입력 시트)
        const templateData = [
            {
                '번호': 1,
                '이름': '(예시) 홍길동',
                '학급': 1,
                '성별': '남',
                '석차(선택)': 3,
                '행동특성(선택)': '리더십, 활동적',
                '특이사항(선택)': '알레르기',
                '메모(선택)': '반장 후보'
            },
            {
                '번호': 2,
                '이름': '(예시) 김영희',
                '학급': 1,
                '성별': '여',
                '석차(선택)': 1,
                '행동특성(선택)': '학습우수',
                '특이사항(선택)': '쌍둥이',
                '메모(선택)': ''
            },
            {
                '번호': 3,
                '이름': '(예시) 박철수',
                '학급': 2,
                '성별': '남',
                '석차(선택)': '',
                '행동특성(선택)': '활동적, 수업방해',
                '특이사항(선택)': '기타:상담필요',
                '메모(선택)': '집중력 향상 필요'
            }
        ];
        const dataWs = XLSX.utils.json_to_sheet(templateData);
        dataWs['!cols'] = [
            { wch: 6 },  // 번호
            { wch: 15 }, // 이름
            { wch: 6 },  // 학급
            { wch: 6 },  // 성별
            { wch: 10 }, // 석차
            { wch: 25 }, // 행동특성
            { wch: 25 }, // 특이사항
            { wch: 30 }, // 메모
        ];
        XLSX.utils.book_append_sheet(wb, dataWs, '학생명단');

        XLSX.writeFile(wb, '모아드림_학생명단_양식.xlsx');
    };


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            try {
                const data = await f.arrayBuffer();
                const wb = XLSX.read(data);
                const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                setPreview(json.slice(0, 5));
            } catch (err) { console.error(err); }
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data);
            const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            const supabase = createClient();

            const toInsert = json.map((row: any) => {
                // Parse behaviors
                const rawBehaviors = (row['행동특성(선택)'] || row['행동특성'] || row['behaviors'] || '').toString();
                const behaviorList: BehaviorType[] = [];
                let customBehavior = '';

                if (rawBehaviors) {
                    const items = rawBehaviors.split(',').map((s: string) => s.trim());
                    items.forEach((item: string) => {
                        if (item.startsWith('기타:')) {
                            behaviorList.push('other_behavior');
                            customBehavior = item.replace('기타:', '').trim();
                        } else {
                            const option = BEHAVIOR_OPTIONS.find(opt => opt.label === item);
                            if (option) {
                                behaviorList.push(option.id as BehaviorType);
                            } else {
                                // If no match, treat as other behavior logic or ignore? 
                                // Let's treat unknown as custom behavior to be safe
                                if (!customBehavior) {
                                    behaviorList.push('other_behavior');
                                    customBehavior = item;
                                } else {
                                    customBehavior += `, ${item}`;
                                }
                            }
                        }
                    });
                }

                // Parse special notes
                const rawNotes = (row['특이사항(선택)'] || row['특이사항'] || row['special_notes'] || '').toString();
                const noteList: SpecialNoteType[] = [];
                let customNote = '';

                if (rawNotes) {
                    const items = rawNotes.split(',').map((s: string) => s.trim());
                    items.forEach((item: string) => {
                        if (item.startsWith('기타:')) {
                            noteList.push('other_note');
                            customNote = item.replace('기타:', '').trim();
                        } else {
                            const option = SPECIAL_NOTES_OPTIONS.find(opt => opt.label === item);
                            if (option) {
                                noteList.push(option.id as SpecialNoteType);
                            } else {
                                if (!customNote) {
                                    noteList.push('other_note');
                                    customNote = item;
                                } else {
                                    customNote += `, ${item}`;
                                }
                            }
                        }
                    });
                }

                return {
                    project_id: projectId,
                    student_number: parseInt(row['번호'] || row['number'] || '0') || null,
                    name: row['이름'] || row['name'] || '',
                    current_class: parseInt(row['학급'] || row['class'] || '1') || 1,
                    original_class: parseInt(row['학급'] || row['class'] || '1') || 1,
                    gender: (row['성별'] === '남' || row['gender'] === 'male') ? 'male' : 'female',
                    behaviors: [...new Set(behaviorList)], // Remove duplicates
                    special_notes: [...new Set(noteList)],
                    custom_behavior: customBehavior || null,
                    custom_special_note: customNote || null,
                    memo: (row['메모(선택)'] || row['메모'] || row['memo'] || '').toString() || null,
                    student_rank: parseInt(row['석차(선택)'] || row['석차'] || row['rank'] || '0') || null,
                    created_by: userId,
                };
            }).filter((s: any) => s.name);

            await supabase.from('students').insert(toInsert);
            showToast('학생 일괄 등록이 완료되었습니다.', 'success');
            onSuccess();
            setFile(null); setPreview([]); onClose();
        } catch (err) {
            console.error(err);
            showToast('업로드에 실패했습니다. 데이터 형식을 확인해주세요.', 'error');
        } finally { setLoading(false); }
    };

    const handleClose = () => { setFile(null); setPreview([]); onClose(); };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="학생 일괄 등록" size="lg">
            <div className={styles.uploadContent}>
                <div className={styles.templateSection}>
                    <p>엑셀 파일로 학생을 일괄 등록할 수 있습니다.</p>
                    <Button variant="outline" onClick={downloadTemplate}>📄 양식 다운로드</Button>
                </div>
                <div className={styles.uploadZone}>
                    <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className={styles.fileInput} id="excel-upload" />
                    <label htmlFor="excel-upload" className={styles.uploadLabel}>{file ? file.name : '파일을 선택하거나 드래그하세요'}</label>
                </div>
                {preview.length > 0 && (
                    <div className={styles.previewSection}>
                        <h4>미리보기 (처음 5명)</h4>
                        <table className={styles.previewTable}>
                            <thead><tr>{Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}</tr></thead>
                            <tbody>{preview.map((r, i) => <tr key={i}>{Object.values(r).map((v: any, j) => <td key={j}>{v}</td>)}</tr>)}</tbody>
                        </table>
                    </div>
                )}
                <div className={styles.modalActions}>
                    <Button type="button" variant="outline" onClick={handleClose}>취소</Button>
                    <Button onClick={handleUpload} loading={loading} disabled={!file}>업로드</Button>
                </div>
            </div>
        </Modal>
    );
}
