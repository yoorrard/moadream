'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import { User } from '@/types';
import { User as AuthUser } from '@supabase/supabase-js';
import Button from '@/components/common/Button';

interface HeaderProps {
    user?: User | null;
    authUser?: AuthUser | null;
    onLogout?: () => void;
}

export default function Header({ user, authUser, onLogout }: HeaderProps) {
    // user(profiles) 또는 authUser(세션)가 있으면 로그인 상태로 판단
    const isLoggedIn = !!(user || authUser);
    const displayName = user?.name || authUser?.email?.split('@')[0] || '사용자';

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="8" fill="currentColor" />
                            <path
                                d="M8 20V8L14 12L20 8V20L14 16L8 20Z"
                                fill="white"
                                fillOpacity="0.9"
                            />
                        </svg>
                    </div>
                    <span className={styles.logoText}>모아드림</span>
                </Link>

                <nav className={styles.nav}>
                    {isLoggedIn ? (
                        <>
                            <Link href="/dashboard" className={styles.navLink}>
                                대시보드
                            </Link>
                            <div className={styles.userSection}>
                                <span className={styles.userName}>{displayName} 선생님</span>
                                <Button variant="ghost" size="sm" onClick={onLogout}>
                                    로그아웃
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Link href="/login">
                            <Button variant="primary" size="sm">
                                로그인
                            </Button>
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
