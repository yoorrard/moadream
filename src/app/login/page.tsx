'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
    const router = useRouter();
    const { signInWithGoogle, authUser, initialized } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 이미 로그인되어 있으면 대시보드로
    React.useEffect(() => {
        if (initialized && authUser) {
            router.replace('/dashboard');
        }
    }, [initialized, authUser, router]);

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || '구글 로그인에 실패했습니다.');
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <div className={styles.brandContent}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Image src="/logo.png" alt="모아드림 로고" width={40} height={40} style={{ objectFit: 'contain' }} />
                        </div>
                        <span className={styles.logoText}>모아드림</span>
                    </Link>
                    <h1 className={styles.brandTitle}>
                        함께 만드는<br />
                        <span>스마트한 학급 편성</span>
                    </h1>
                    <p className={styles.brandDescription}>
                        동료 교사와 협력하여 최적의 학급을 구성하세요.
                        AI가 도와드립니다.
                    </p>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <h2>로그인</h2>
                        <p>Google 계정으로 시작하세요</p>
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    <Button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        variant="outline"
                        fullWidth
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: 500,
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {loading ? '로그인 중...' : 'Google로 계속하기'}
                    </Button>

                    <p className={styles.terms}>
                        로그인하면 <Link href="/terms">이용약관</Link> 및 <Link href="/privacy">개인정보처리방침</Link>에 동의하는 것으로 간주됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
