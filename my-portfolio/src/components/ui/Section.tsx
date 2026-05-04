import styles from './Section.module.css';

interface SectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function Section({ id, title, subtitle, children }: SectionProps) {
  return (
    <section id={id} className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
