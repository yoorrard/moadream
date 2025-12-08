'use client';

import { useEffect } from 'react';
import { Button } from '@/components/common';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                gap: '20px',
            }}
        >
            <h2>문제가 발생했습니다</h2>
            <p style={{ color: '#666' }}>
                {error.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <Button onClick={() => reset()}>다시 시도</Button>
        </div>
    );
}
