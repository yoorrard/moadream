'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

interface SidebarItem {
    icon: React.ReactNode;
    label: string;
    href: string;
}

interface SidebarProps {
    projectId: string;
    projectName: string;
    assignedClass?: number | null;
}

export default function Sidebar({ projectId, projectName, assignedClass }: SidebarProps) {
    const pathname = usePathname();

    const menuItems: SidebarItem[] = [
        {
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            label: '학생 관리',
            href: `/project/${projectId}/students`,
        },
        {
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            label: '학급 내 반편성',
            href: `/project/${projectId}/class-assignment`,
        },
        {
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                        d="M17 10C17 13.866 13.866 17 10 17M17 10C17 6.13401 13.866 3 10 3M17 10H3M10 17C6.13401 17 3 13.866 3 10M10 17C11.6569 17 13 13.866 13 10C13 6.13401 11.6569 3 10 3M10 17C8.34315 17 7 13.866 7 10C7 6.13401 8.34315 3 10 3M3 10C3 6.13401 6.13401 3 10 3"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            ),
            label: '학년 반편성',
            href: `/project/${projectId}/grade-assignment`,
        },
        {
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M7.5 7.5a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2.5 2-2.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="10" cy="14" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                </svg>
            ),
            label: '사용법 안내',
            href: `/project/${projectId}/guide`,
        },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.projectInfo}>
                <h2 className={styles.projectName}>{projectName}</h2>
                {assignedClass && (
                    <span className={styles.assignedClass}>{assignedClass}반 담당</span>
                )}
            </div>

            <nav className={styles.nav}>
                <div className={styles.navSection}>
                    <span className={styles.navSectionTitle}>메뉴</span>
                    <ul className={styles.navList}>
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                    >
                                        <span className={styles.navIcon}>{item.icon}</span>
                                        <span className={styles.navLabel}>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>

            <div className={styles.footer}>
                <Link href="/dashboard" className={styles.backLink}>
                    ← 프로젝트 목록으로
                </Link>
            </div>
        </aside>
    );
}
