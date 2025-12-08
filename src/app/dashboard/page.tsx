'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button, Card, CardHeader, CardContent, Modal, Input, Select, useToast } from '@/components/common';
import { Header } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/types';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
    const router = useRouter();
    const { user, authUser, signOut, loading: authLoading, initialized } = useAuth();
    const { showToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    useEffect(() => {
        // 아직 초기화 안됐으면 대기
        if (!initialized) return;

        // 로그인 안되어있으면 로그인 페이지로
        if (!authUser) {
            router.replace('/login');
            return;
        }

        // 프로젝트 로딩
        loadProjects();
    }, [authUser, initialized, router]);

    const loadProjects = async () => {
        if (!authUser) return;

        setProjectsLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('project_members')
                .select(`
          project_id,
          assigned_class,
          projects (*)
        `)
                .eq('user_id', authUser.id);

            if (error) throw error;

            const projectList = data
                ?.filter((item: any) => item.projects !== null)
                .map((item: any) => ({
                    ...item.projects,
                    assigned_class: item.assigned_class,
                })) || [];

            setProjects(projectList);
        } catch (error: any) {
            console.error('Failed to load projects:', error?.message || error);
        } finally {
            setProjectsLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.replace('/');
    };

    const handleDeleteClick = (project: Project) => {
        setProjectToDelete(project);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!projectToDelete) return;

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectToDelete.id);

            if (error) throw error;

            showToast('프로젝트가 삭제되었습니다.', 'success');
            loadProjects();
        } catch (error: any) {
            console.error('Failed to delete project:', error);
            showToast('프로젝트 삭제에 실패했습니다.', 'error');
        } finally {
            setShowDeleteModal(false);
            setProjectToDelete(null);
        }
    };

    // 초기화 전이거나 비로그인 상태면 로딩 표시
    if (!initialized || authLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    // 비로그인 상태 (useEffect에서 리다이렉트 처리 중)
    if (!authUser) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>로그인 페이지로 이동 중...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Header user={user} authUser={authUser} onLogout={handleLogout} />

            <main className={styles.main}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>내 프로젝트</h1>
                        <p className={styles.subtitle}>참여 중인 반편성 프로젝트 목록입니다.</p>
                    </div>
                    <div className={styles.actions}>
                        <Button variant="outline" onClick={() => setShowGuideModal(true)} className={styles.guideButton}>
                            사용법 안내
                        </Button>
                        <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                            프로젝트 참여
                        </Button>
                        <Button onClick={() => setShowCreateModal(true)}>
                            + 새 프로젝트
                        </Button>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
                                <path d="M8 28H56" stroke="currentColor" strokeWidth="2" />
                                <circle cx="16" cy="22" r="2" fill="currentColor" />
                                <circle cx="24" cy="22" r="2" fill="currentColor" />
                                <circle cx="32" cy="22" r="2" fill="currentColor" />
                            </svg>
                        </div>
                        <h3 className={styles.emptyTitle}>아직 참여 중인 프로젝트가 없습니다</h3>
                        <p className={styles.emptyDescription}>
                            새 프로젝트를 만들거나, 참여 코드를 입력하여 프로젝트에 참여하세요.
                        </p>
                        <div className={styles.emptyActions}>
                            <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                                프로젝트 참여
                            </Button>
                            <Button onClick={() => setShowCreateModal(true)}>
                                새 프로젝트 만들기
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.projectGrid}>
                        {projects.map((project: any) => (
                            <Card key={project.id} hover className={styles.projectCard}>
                                <CardHeader>
                                    <div className={styles.projectHeaderTop}>
                                        <h3 className={styles.projectName}>{project.name}</h3>
                                        {project.leader_id === authUser?.id && (
                                            <button
                                                className={styles.deleteButton}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteClick(project);
                                                }}
                                                title="프로젝트 삭제"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <div className={styles.codeContainer}>
                                        <span className={styles.projectCode}>코드: {project.code}</span>
                                        <CopyCodeButton code={project.code} />
                                        {project.leader_id === authUser?.id && (
                                            <span className={styles.leaderBadge}>대표</span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className={styles.projectInfo}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>현재 학급</span>
                                            <span className={styles.infoValue}>{project.current_classes}개</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>진학 학급</span>
                                            <span className={styles.infoValue}>{project.target_classes}개</span>
                                        </div>
                                    </div>
                                    {project.assigned_class && (
                                        <div className={styles.assignedBadge}>
                                            {project.assigned_class}반 담당
                                        </div>
                                    )}
                                    <div className={styles.projectActions}>
                                        <Link href={`/project/${project.id}/students`}>
                                            <Button variant="primary" size="sm" fullWidth>
                                                프로젝트 열기
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* 프로젝트 생성 모달 */}
            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                userId={authUser?.id || ''}
                onSuccess={loadProjects}
            />

            {/* 프로젝트 참여 모달 */}
            <JoinProjectModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                userId={authUser?.id || ''}
                onSuccess={loadProjects}
            />

            {/* 사용법 안내 모달 */}
            <GuideModal
                isOpen={showGuideModal}
                onClose={() => setShowGuideModal(false)}
            />

            {/* 프로젝트 삭제 확인 모달 */}
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setProjectToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                projectName={projectToDelete?.name || ''}
            />
        </div>
    );
}

// 프로젝트 생성 모달 컴포넌트
function CreateProjectModal({
    isOpen,
    onClose,
    userId,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess: () => void;
}) {
    const [name, setName] = useState('');
    const [currentClasses, setCurrentClasses] = useState('3');
    const [targetClasses, setTargetClasses] = useState('3');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdCode, setCreatedCode] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const supabase = createClient();

            // 6자리 코드 생성
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const { data, error: insertError } = await supabase
                .from('projects')
                .insert([
                    {
                        name,
                        code,
                        current_classes: parseInt(currentClasses),
                        target_classes: parseInt(targetClasses),
                        leader_id: userId,
                    },
                ])
                .select()
                .single();

            if (insertError) throw insertError;

            // 리더를 멤버로 추가
            await supabase.from('project_members').insert([
                {
                    project_id: data.id,
                    user_id: userId,
                    assigned_class: null,
                },
            ]);

            setCreatedCode(code);
            onSuccess();
        } catch (err: any) {
            setError(err.message || '프로젝트 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setCurrentClasses('3');
        setTargetClasses('3');
        setError('');
        setCreatedCode('');
        onClose();
    };

    const classOptions = Array.from({ length: 10 }, (_, i) => ({
        value: String(i + 1),
        label: `${i + 1}개`,
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={createdCode ? '프로젝트 생성 완료' : '새 프로젝트 만들기'}
        >
            {createdCode ? (
                <div className={styles.successContent}>
                    <div className={styles.successIcon}>✓</div>
                    <h3>프로젝트가 생성되었습니다!</h3>
                    <p>아래 코드를 동학년 선생님들과 공유하세요.</p>
                    <div className={styles.codeDisplay}>
                        <span className={styles.codeLabel}>참여 코드</span>
                        <span className={styles.codeValue}>{createdCode}</span>
                    </div>
                    <Button onClick={handleClose} fullWidth>
                        확인
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    {error && <div className={styles.errorAlert}>{error}</div>}

                    <Input
                        label="프로젝트 이름"
                        placeholder="예: 2025학년도 3학년 반편성"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        fullWidth
                    />

                    <div className={styles.formRow}>
                        <div className={styles.numberInputGroup}>
                            <label className={styles.numberInputLabel}>현재 학급 수</label>
                            <div className={styles.numberInputWrapper}>
                                <button
                                    type="button"
                                    className={styles.numberBtn}
                                    onClick={() => setCurrentClasses(String(Math.max(1, parseInt(currentClasses) - 1)))}
                                >−</button>
                                <input
                                    type="number"
                                    className={styles.numberInput}
                                    value={currentClasses}
                                    onChange={(e) => setCurrentClasses(e.target.value)}
                                    min="1"
                                    max="20"
                                />
                                <button
                                    type="button"
                                    className={styles.numberBtn}
                                    onClick={() => setCurrentClasses(String(Math.min(20, parseInt(currentClasses) + 1)))}
                                >+</button>
                            </div>
                        </div>
                        <div className={styles.numberInputGroup}>
                            <label className={styles.numberInputLabel}>진학 학급 수</label>
                            <div className={styles.numberInputWrapper}>
                                <button
                                    type="button"
                                    className={styles.numberBtn}
                                    onClick={() => setTargetClasses(String(Math.max(1, parseInt(targetClasses) - 1)))}
                                >−</button>
                                <input
                                    type="number"
                                    className={styles.numberInput}
                                    value={targetClasses}
                                    onChange={(e) => setTargetClasses(e.target.value)}
                                    min="1"
                                    max="20"
                                />
                                <button
                                    type="button"
                                    className={styles.numberBtn}
                                    onClick={() => setTargetClasses(String(Math.min(20, parseInt(targetClasses) + 1)))}
                                >+</button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            취소
                        </Button>
                        <Button type="submit" loading={loading}>
                            프로젝트 생성
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

// 프로젝트 참여 모달 컴포넌트
function JoinProjectModal({
    isOpen,
    onClose,
    userId,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess: () => void;
}) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const supabase = createClient();

            // 프로젝트 찾기
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .eq('code', code.toUpperCase())
                .single();

            if (projectError || !project) {
                throw new Error('유효하지 않은 참여 코드입니다.');
            }

            // 이미 참여했는지 확인
            const { data: existing } = await supabase
                .from('project_members')
                .select('*')
                .eq('project_id', project.id)
                .eq('user_id', userId)
                .single();

            if (existing) {
                throw new Error('이미 참여한 프로젝트입니다.');
            }

            // 멤버로 추가
            const { error: joinError } = await supabase.from('project_members').insert([
                {
                    project_id: project.id,
                    user_id: userId,
                    assigned_class: null,
                },
            ]);

            if (joinError) throw joinError;

            showToast('프로젝트에 참여했습니다.', 'success');
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.message || '프로젝트 참여에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCode('');
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="프로젝트 참여">
            <form onSubmit={handleSubmit} className={styles.modalForm}>
                {error && <div className={styles.errorAlert}>{error}</div>}

                <Input
                    label="참여 코드"
                    placeholder="6자리 코드 입력"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    fullWidth
                />

                <p className={styles.helperText}>
                    대표 교사에게 받은 6자리 참여 코드를 입력하세요.
                </p>

                <div className={styles.modalActions}>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        취소
                    </Button>
                    <Button type="submit" loading={loading}>
                        참여하기
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// 사용법 안내 모달 컴포넌트
function GuideModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: '1. 프로젝트 생성',
            icon: '📁',
            description: '대표 교사가 "새 프로젝트" 버튼을 클릭하여 반편성 프로젝트를 생성합니다.',
            details: [
                '프로젝트 이름 입력 (예: 2025학년도 3학년 반편성)',
                '현재 학급 수와 진학 학급 수 설정',
                '생성된 6자리 참여 코드를 동학년 선생님들과 공유',
            ],
        },
        {
            title: '2. 프로젝트 참여',
            icon: '👥',
            description: '동학년 담임 선생님들이 참여 코드를 입력하여 프로젝트에 참여합니다.',
            details: [
                '"프로젝트 참여" 버튼 클릭',
                '대표 교사에게 받은 6자리 코드 입력',
                '프로젝트에 참여하여 담당 학급 배정 받기',
            ],
        },
        {
            title: '3. 학생 정보 등록',
            icon: '📝',
            description: '각 담임교사가 엑셀 파일로 담당 학급의 학생 정보를 일괄 등록합니다.',
            details: [
                '"학생관리" 탭에서 담당 학급 선택',
                '"엑셀로 학생 등록" 버튼으로 일괄 업로드',
                '이름, 성별, 생활지도 난이도, 분리/동반 배치 정보 입력',
            ],
        },
        {
            title: '4. 반편성 작업',
            icon: '🔄',
            description: '"반편성" 탭에서 드래그 앤 드롭으로 학생들을 새 학급에 배치합니다.',
            details: [
                '학생 카드를 원하는 학급으로 드래그하여 이동',
                '생활지도 난이도에 따른 색상 구분 확인',
                '분리/동반 배치 관계 아이콘 확인',
            ],
        },
        {
            title: '5. 학급배정 완료',
            icon: '✅',
            description: '"학급배정" 탭에서 최종 배정 결과를 확인하고 엑셀로 다운로드합니다.',
            details: [
                '전체 학급별 배정 현황 확인',
                '남녀 비율 및 생활지도 난이도 분포 점검',
                '"배정 완료" 버튼으로 AI 분석 및 엑셀 다운로드',
            ],
        },
    ];

    const handleClose = () => {
        setCurrentStep(0);
        onClose();
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="사용법 안내">
            <div className={styles.guideContent}>
                {/* 진행 표시줄 */}
                <div className={styles.progressBar}>
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`${styles.progressStep} ${index === currentStep ? styles.progressActive : ''} ${index < currentStep ? styles.progressCompleted : ''}`}
                            onClick={() => setCurrentStep(index)}
                        />
                    ))}
                </div>

                {/* 현재 단계 내용 */}
                <div className={styles.stepContent}>
                    <div className={styles.stepIcon}>{steps[currentStep].icon}</div>
                    <h3 className={styles.stepTitle}>{steps[currentStep].title}</h3>
                    <p className={styles.stepDescription}>{steps[currentStep].description}</p>
                    <ul className={styles.stepDetails}>
                        {steps[currentStep].details.map((detail, index) => (
                            <li key={index}>{detail}</li>
                        ))}
                    </ul>
                </div>

                {/* 네비게이션 버튼 */}
                <div className={styles.guideNavigation}>
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                    >
                        이전
                    </Button>
                    <span className={styles.stepIndicator}>
                        {currentStep + 1} / {steps.length}
                    </span>
                    {currentStep === steps.length - 1 ? (
                        <Button onClick={handleClose}>
                            완료
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>
                            다음
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}

// 코드 복사 버튼 컴포넌트
function CopyCodeButton({ code }: { code: string }) {
    const { showToast } = useToast();

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(code);
            showToast('코드가 복사되었습니다.', 'success');
        } catch (err) {
            showToast('복사에 실패했습니다.', 'error');
        }
    };

    return (
        <button className={styles.copyButton} onClick={handleCopy} title="코드 복사">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
        </button>
    );
}

// 프로젝트 삭제 확인 모달 컴포넌트
function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    projectName,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    projectName: string;
}) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="프로젝트 삭제">
            <div className={styles.deleteConfirmContent}>
                <div className={styles.deleteWarningIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                </div>
                <h3 className={styles.deleteConfirmTitle}>정말 삭제하시겠습니까?</h3>
                <p className={styles.deleteConfirmDescription}>
                    <strong>"{projectName}"</strong> 프로젝트를 삭제하면<br />
                    모든 학생 정보와 관계 데이터가 영구적으로 삭제됩니다.
                </p>
                <p className={styles.deleteWarningText}>
                    ⚠️ 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className={styles.deleteConfirmActions}>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        취소
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirm}
                        loading={loading}
                        className={styles.deleteConfirmButton}
                    >
                        삭제하기
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
