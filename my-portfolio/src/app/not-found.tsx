import Link from 'next/link';
import styles from './bsod.module.css';

export default function NotFound() {
  return (
    <main className={styles.screen}>
      <section className={styles.panel} aria-labelledby="not-found-title">
        <div className={styles.face} aria-hidden="true">
          :(
        </div>

        <h1 id="not-found-title" className={styles.headline}>
          Your portfolio ran into a page that does not exist.
        </h1>

        <p className={styles.copy}>
          We&apos;re collecting absolutely no useful error info, and then we&apos;ll
          politely send you back to safety.
        </p>

        <p className={`${styles.copy} ${styles.thai}`}>
          หน้านี้หายไปแบบงงๆ น่าจะออกไปซื้อชาเย็นแล้วลืมกลับมา
        </p>

        <p className={styles.progress}>404% complete</p>

        <div className={styles.infoRow}>
          <div className={styles.qr} aria-hidden="true">
            {Array.from({ length: 49 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>

          <div className={styles.details}>
            <p>
              For more information about this issue and possible fixes, visit the
              only page that still knows what it is doing.
            </p>
            <p>
              If you call support, give them this info:
              <br />
              Stop code: PORTFOLIO_PAGE_WENT_TO_LUNCH
            </p>
          </div>
        </div>

        <Link href="/" className={styles.link}>
          Return to Home <span className={styles.blink}>_</span>
        </Link>
      </section>
    </main>
  );
}
