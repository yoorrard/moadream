'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button, Card } from '@/components/common';
import { Sidebar } from '@/components/layout';

export const dynamic = 'force-dynamic';

export default function GuidePage() {
    const params = useParams();
    const projectId = params.id as string;
    const [currentSection, setCurrentSection] = useState(0);

    const sections = [
        {
            id: 'overview',
            title: '개요',
            icon: '📋',
            content: {
                title: '모아드림 사용법 안내',
                description: '모아드림은 동학년 선생님들이 협력하여 학급을 편성할 수 있는 협업 반편성 프로그램입니다.',
                items: [
                    '대표 교사가 프로젝트를 생성하고, 참여 코드를 공유합니다.',
                    '각 담임 선생님이 담당 학급의 학생을 등록합니다.',
                    '드래그 앤 드롭으로 학생들을 진학 학급에 배치합니다.',
                    '모든 배정이 완료되면 결과를 엑셀로 다운로드합니다.',
                ]
            }
        },
        {
            id: 'students',
            title: '학생 관리',
            icon: '👨‍🎓',
            content: {
                title: '학생 정보 등록하기',
                description: '학생 정보를 개별로 추가하거나 엑셀로 일괄 등록할 수 있습니다.',
                items: [
                    '"학생 추가" 버튼: 학생을 한 명씩 등록합니다.',
                    '"학생 일괄 등록" 버튼: 엑셀 파일로 여러 학생을 한 번에 등록합니다.',
                    '엑셀 양식 다운로드 후 양식에 맞게 작성하여 업로드하세요.',
                    '행동특성과 특이사항은 선택 입력 항목입니다.',
                ]
            }
        },
        {
            id: 'class-assignment',
            title: '학급 내 반편성',
            icon: '🏫',
            content: {
                title: '학급 내에서 반편성하기',
                description: '담당 학급 내의 학생들을 진학 학급에 배치합니다.',
                items: [
                    '미배정 학생 목록에서 학생 카드를 드래그합니다.',
                    '원하는 진학 학급 영역에 드롭하여 배치합니다.',
                    '학생 카드 색상은 생활지도 난이도를 나타냅니다.',
                    '⚡ 아이콘은 갈등 관계, 💚 아이콘은 우호 관계를 표시합니다.',
                ]
            }
        },
        {
            id: 'grade-assignment',
            title: '학년 반편성',
            icon: '🌐',
            content: {
                title: '전체 학년 반편성 결과 확인',
                description: '모든 학급의 반편성 결과를 한눈에 확인하고 조정할 수 있습니다.',
                items: [
                    '전체 학급의 배정 현황을 확인합니다.',
                    '학급 간 학생 이동이 필요하면 드래그 앤 드롭으로 조정합니다.',
                    '모든 학생 배정이 완료되면 "반편성 완료" 버튼을 클릭합니다.',
                    'AI 분석을 실행하여 배정 결과를 검토하고 엑셀로 다운로드합니다.',
                ]
            }
        },
        {
            id: 'tips',
            title: '활용 팁',
            icon: '💡',
            content: {
                title: '효율적인 반편성을 위한 팁',
                description: '모아드림을 더 효과적으로 활용하기 위한 팁입니다.',
                items: [
                    '갈등 관계(⚡)로 설정된 학생들은 같은 반 배정 시 경고 표시가 됩니다.',
                    '쌍둥이 등 우호 관계(💚)는 같은 반 배정을 권장합니다.',
                    '학생 카드 색상을 참고하여 각 학급의 생활지도 난이도 균형을 맞추세요.',
                    '반편성 완료 후 AI 분석으로 성별 균형, 난이도 분포 등을 확인하세요.',
                ]
            }
        },
    ];

    return (
        <div className={styles.container}>
            <Sidebar projectId={projectId} projectName="" />

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>사용법 안내</h1>
                    <p className={styles.subtitle}>모아드림 반편성 프로그램 사용 가이드</p>
                </div>

                <div className={styles.guideLayout}>
                    {/* 사이드 네비게이션 */}
                    <nav className={styles.guideNav}>
                        {sections.map((section, index) => (
                            <button
                                key={section.id}
                                className={`${styles.navButton} ${currentSection === index ? styles.navActive : ''}`}
                                onClick={() => setCurrentSection(index)}
                            >
                                <span className={styles.navIcon}>{section.icon}</span>
                                <span className={styles.navText}>{section.title}</span>
                            </button>
                        ))}
                    </nav>

                    {/* 콘텐츠 영역 */}
                    <Card className={styles.guideContent}>
                        <div className={styles.contentHeader}>
                            <span className={styles.contentIcon}>{sections[currentSection].icon}</span>
                            <h2 className={styles.contentTitle}>{sections[currentSection].content.title}</h2>
                        </div>
                        <p className={styles.contentDescription}>
                            {sections[currentSection].content.description}
                        </p>
                        <ul className={styles.contentList}>
                            {sections[currentSection].content.items.map((item, index) => (
                                <li key={index} className={styles.contentItem}>
                                    <span className={styles.itemNumber}>{index + 1}</span>
                                    <span className={styles.itemText}>{item}</span>
                                </li>
                            ))}
                        </ul>

                        {/* 네비게이션 버튼 */}
                        <div className={styles.contentNav}>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                                disabled={currentSection === 0}
                            >
                                ← 이전
                            </Button>
                            <span className={styles.pageIndicator}>
                                {currentSection + 1} / {sections.length}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                                disabled={currentSection === sections.length - 1}
                            >
                                다음 →
                            </Button>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
