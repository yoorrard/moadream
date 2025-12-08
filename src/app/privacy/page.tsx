'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function PrivacyPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Image src="/logo.png" alt="모아드림 로고" width={32} height={32} style={{ objectFit: 'contain' }} />
                        </div>
                        <span className={styles.logoText}>모아드림</span>
                    </Link>
                    <Link href="/" className={styles.backButton}>
                        ← 홈으로
                    </Link>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.content}>
                    <h1 className={styles.title}>개인정보처리방침</h1>
                    <p className={styles.lastUpdated}>최종 수정일: 2025년 1월 1일</p>

                    <section className={styles.section}>
                        <h2>1. 개인정보의 수집 및 이용 목적</h2>
                        <p>
                            모아드림(이하 &quot;서비스&quot;)은 다음의 목적을 위하여 개인정보를 처리합니다.
                            처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
                            이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                        </p>
                        <ul>
                            <li><strong>회원 가입 및 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인식별, 회원자격 유지·관리</li>
                            <li><strong>서비스 제공:</strong> 반편성 프로젝트 생성, 학생 정보 관리, 학급 배정 기능 제공</li>
                            <li><strong>서비스 개선:</strong> 서비스 이용 현황 분석 및 서비스 품질 향상</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>2. 수집하는 개인정보의 항목</h2>
                        <p>서비스는 다음의 개인정보 항목을 수집합니다:</p>
                        <ul>
                            <li><strong>필수항목:</strong> Google 계정 정보(이메일 주소, 이름, 프로필 사진)</li>
                            <li><strong>학생 정보:</strong> 이름, 성별, 현재 학급, 생활지도 난이도, 특이사항(교사가 직접 입력)</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>3. 개인정보의 보유 및 이용 기간</h2>
                        <p>
                            개인정보는 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                            단, 관련 법령에 따라 보존할 필요가 있는 경우에는 해당 기간 동안 보존합니다.
                        </p>
                        <ul>
                            <li>회원 탈퇴 시: 즉시 삭제</li>
                            <li>프로젝트 종료 시: 프로젝트 관련 데이터 30일 후 자동 삭제</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>4. 개인정보의 제3자 제공</h2>
                        <p>
                            서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
                            다만, 다음의 경우에는 예외로 합니다:
                        </p>
                        <ul>
                            <li>이용자가 사전에 동의한 경우</li>
                            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>5. 개인정보처리의 위탁</h2>
                        <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다:</p>
                        <ul>
                            <li><strong>Supabase:</strong> 데이터베이스 호스팅 및 인증 서비스</li>
                            <li><strong>Google:</strong> 소셜 로그인 인증 서비스</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>6. 이용자의 권리와 행사 방법</h2>
                        <p>이용자는 다음과 같은 권리를 행사할 수 있습니다:</p>
                        <ul>
                            <li>개인정보 열람 요구</li>
                            <li>오류 등이 있을 경우 정정 요구</li>
                            <li>삭제 요구</li>
                            <li>처리정지 요구</li>
                        </ul>
                        <p>위 권리 행사는 서비스 내 설정 메뉴 또는 이메일을 통해 가능합니다.</p>
                    </section>

                    <section className={styles.section}>
                        <h2>7. 개인정보의 안전성 확보 조치</h2>
                        <p>서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                        <ul>
                            <li>개인정보의 암호화</li>
                            <li>해킹 등에 대비한 기술적 대책</li>
                            <li>접근 권한의 제한</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>8. 개인정보보호책임자</h2>
                        <p>
                            개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한
                            이용자의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.
                        </p>
                        <ul>
                            <li><strong>담당:</strong> 유영재</li>
                            <li><strong>이메일:</strong> manitomanager@gmail.com</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>9. 개인정보처리방침의 변경</h2>
                        <p>
                            이 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라
                            내용의 추가, 삭제 및 수정이 있을 수 있으며, 변경 시에는 홈페이지를 통해 공지할 것입니다.
                        </p>
                    </section>
                </div>
            </main>

            <footer className={styles.footer}>
                <p>© 2025 모아드림. All rights reserved.</p>
            </footer>
        </div>
    );
}
