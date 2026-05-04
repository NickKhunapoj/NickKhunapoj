import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.links}>
          <a
            href="https://www.linkedin.com/in/khunapoj-suttenon-76406b1a0/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/NickKhunapoj"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            GitHub
          </a>
          <a href="mailto:Khunapoj.s@gmail.com" className={styles.link}>
            Email
          </a>
        </div>
        <p className={styles.text}>© {year} Khunapoj Suttenon. All rights reserved.</p>
      </div>
    </footer>
  );
}
