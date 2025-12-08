import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Image src="/logo.jpg" alt="모아드림 로고" width={32} height={32} style={{ borderRadius: '8px' }} />
            </div>
            <span className={styles.logoText}>모아드림</span>
          </div>
          <nav className={styles.nav}>
            <Link href="/login" className={styles.navButton}>
              로그인
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGradient}></div>
          <div className={styles.heroPattern}></div>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>✨</span>
            교사를 위한 스마트 솔루션
          </div>
          <h1 className={styles.title}>
            함께 만들어가는
            <br />
            <span className={styles.titleHighlight}>스마트 반편성</span>
          </h1>
          <p className={styles.subtitle}>
            모아드림과 함께라면 동학년 선생님들과 실시간으로 협업하며
            <br />
            학생들의 특성을 고려한 최적의 학급 편성이 가능합니다.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/login" className={styles.primaryButton}>
              바로 시작하기
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresHeader}>
          <h2 className={styles.featuresTitle}>왜 모아드림인가요?</h2>
          <p className={styles.featuresSubtitle}>
            반편성의 모든 과정을 더 쉽고 효율적으로
          </p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="22" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="16" cy="22" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M12.5 12.5L14.5 19.5M19.5 12.5L17.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>실시간 협업</h3>
            <p className={styles.featureDescription}>
              동학년 담임선생님들과 함께 프로젝트에 참여하여 학생 배치 현황을 실시간으로 확인하세요.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="8" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M9 16L13 19L23 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>스마트 분석</h3>
            <p className={styles.featureDescription}>
              생활지도 난이도와 분리/동반 배치 관계를 시각화하여 균형 잡힌 학급 배정을 도와드립니다.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 6V26M6 16H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>드래그 앤 드롭</h3>
            <p className={styles.featureDescription}>
              직관적인 인터페이스로 학생을 원하는 학급에 쉽게 배치하세요.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L6 9V15C6 21.63 10.28 27.79 16 29C21.72 27.79 26 21.63 26 15V9L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M12 16L15 19L20 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>데이터 보안</h3>
            <p className={styles.featureDescription}>
              학생 정보는 암호화되어 안전하게 보호되며, 프로젝트 종료 시 자동으로 삭제됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className={styles.steps}>
        <div className={styles.stepsHeader}>
          <h2 className={styles.stepsTitle}>간단한 3단계</h2>
          <p className={styles.stepsSubtitle}>
            복잡한 반편성, 이제 쉽게 해결하세요
          </p>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>프로젝트 생성</h3>
            <p className={styles.stepDescription}>
              대표 교사가 학년 프로젝트를 생성하고 참여 코드를 공유합니다.
            </p>
          </div>
          <div className={styles.stepDivider}></div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>학생 등록 및 반편성</h3>
            <p className={styles.stepDescription}>
              각 담임선생님이 엑셀로 학생을 등록하고 드래그 앤 드롭으로 학급을 배정합니다.
            </p>
          </div>
          <div className={styles.stepDivider}></div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>결과 확인 및 완료</h3>
            <p className={styles.stepDescription}>
              학급배정 결과를 확인하고 분석 리포트와 함께 엑셀로 다운로드합니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            지금 바로 시작하세요
          </h2>
          <p className={styles.ctaSubtitle}>
            더 효율적인 반편성을 경험해보세요.
          </p>
          <Link href="/login" className={styles.ctaButton}>
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerTop}>
            <div className={styles.footerLogo}>
              <div className={styles.logoIcon}>
                <Image src="/logo.jpg" alt="모아드림 로고" width={24} height={24} style={{ borderRadius: '6px' }} />
              </div>
              <span>모아드림</span>
            </div>
            <div className={styles.footerLinks}>
              <Link href="/privacy" className={styles.footerLink}>개인정보처리방침</Link>
              <span className={styles.footerDivider}>|</span>
              <Link href="/terms" className={styles.footerLink}>이용약관</Link>
            </div>
          </div>
          <p className={styles.footerText}>
            © 2025 모아드림. 교사를 위한 스마트 반편성 솔루션.
          </p>
        </div>
      </footer>
    </div>
  );
}
