import Link from 'next/link';
import { Button } from '@/components/common';

export default function NotFound() {
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
            <h2>페이지를 찾을 수 없습니다</h2>
            <p style={{ color: '#666' }}>
                요청하신 페이지가 존재하지 않습니다.
            </p>
            <Link href="/">
                <Button>홈으로 돌아가기</Button>
            </Link>
        </div>
    );
}
