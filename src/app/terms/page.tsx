'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function TermsPage() {
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
                    <h1 className={styles.title}>이용약관</h1>
                    <p className={styles.lastUpdated}>최종 수정일: 2025년 12월 7일</p>

                    <section className={styles.section}>
                        <h2>제1조 (목적)</h2>
                        <p>
                            이 약관은 모아드림(이하 &quot;서비스&quot;)이 제공하는 반편성 협업 서비스의
                            이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>제2조 (정의)</h2>
                        <ul>
                            <li><strong>&quot;서비스&quot;</strong>란 모아드림이 제공하는 학급 반편성 협업 웹 서비스를 의미합니다.</li>
                            <li><strong>&quot;이용자&quot;</strong>란 이 약관에 따라 서비스가 제공하는 서비스를 이용하는 사용자를 의미합니다.</li>
                            <li><strong>&quot;프로젝트&quot;</strong>란 반편성 작업을 위해 이용자가 생성한 작업 공간을 의미합니다.</li>
                            <li><strong>&quot;학생 정보&quot;</strong>란 이용자가 반편성을 위해 서비스에 입력한 학생 관련 데이터를 의미합니다.</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>제3조 (약관의 효력과 변경)</h2>
                        <p>
                            이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
                            서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며,
                            변경된 약관은 공지 후 효력이 발생합니다.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>제4조 (서비스의 제공)</h2>
                        <p>서비스는 다음과 같은 기능을 제공합니다:</p>
                        <ul>
                            <li>반편성 프로젝트 생성 및 관리</li>
                            <li>학생 정보 등록 및 관리 (엑셀 일괄 업로드 포함)</li>
                            <li>드래그 앤 드롭 방식의 학급 배정</li>
                            <li>동학년 교사 간 협업 기능</li>
                            <li>학급 배정 결과 엑셀 다운로드</li>
                            <li>생활지도 난이도, 분리/동반 배치 관계 시각화</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>제5조 (회원 가입)</h2>
                        <p>
                            이용자는 Google 계정을 통해 서비스에 가입할 수 있습니다.
                            회원 가입 시 이용자는 본 약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>제6조 (이용자의 의무)</h2>
                        <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
                        <ul>
                            <li>허위 정보의 등록</li>
                            <li>타인의 정보 도용</li>
                            <li>서비스의 정상적인 운영을 방해하는 행위</li>
                            <li>서비스를 이용하여 법령 또는 이 약관이 금지하는 행위</li>
                            <li>학생 정보를 서비스 목적 외로 활용하는 행위</li>
                            <li>서비스에서 얻은 정보를 서비스의 사전 승낙 없이 복제, 유통, 상업적으로 이용하는 행위</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>제7조 (학생 정보의 관리)</h2>
                        <p>
                            이용자는 서비스에 입력하는 학생 정보에 대한 관리 책임을 가집니다.
                            학생 정보는 반편성 목적으로만 사용되어야 하며, 이용자는 관련 법령(개인정보보호법 등)을
                            준수하여 학생 정보를 처리해야 합니다.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>제8조 (서비스 이용의 제한)</h2>
                        <p>
                            서비스는 이용자가 본 약관의 내용을 위반하거나, 서비스의 정상적인 운영을 방해한 경우
                            서비스 이용을 제한할 수 있습니다.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>제9조 (서비스의 중단)</h2>
                        <p>
                            서비스는 시스템 점검, 교체 및 고장, 통신 두절 등의 사유가 발생한 경우
                            일시적으로 서비스 제공을 중단할 수 있습니다. 이 경우 가능한 한 사전에 공지합니다.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>제10조 (면책 조항)</h2>
                        <ul>
                            <li>서비스는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
                            <li>서비스는 이용자의 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
                            <li>서비스는 이용자가 입력한 정보의 신뢰성, 정확성에 대해서는 책임을 지지 않습니다.</li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h2>제11조 (저작권)</h2>
                        <p>
                            서비스가 제공하는 서비스, 소프트웨어, 디자인, 로고, 상표 등에 대한 저작권 및
                            지적재산권은 서비스에 귀속됩니다. 이용자가 입력한 학생 정보 등의 데이터에 대한
                            권리는 해당 이용자에게 귀속됩니다.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>제12조 (분쟁 해결)</h2>
                        <p>
                            서비스 이용과 관련하여 분쟁이 발생한 경우, 서비스와 이용자는 분쟁의 해결을 위해
                            성실히 협의합니다. 협의가 이루어지지 않을 경우, 대한민국 법원을 관할 법원으로 합니다.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>부칙</h2>
                        <p>이 약관은 2025년 12월 7일부터 시행됩니다.</p>
                    </section>
                </div>
            </main>

            <footer className={styles.footer}>
                <p>© 2025 모아드림. All rights reserved.</p>
            </footer>
        </div>
    );
}
