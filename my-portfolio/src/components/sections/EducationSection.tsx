import { Education } from '@/lib/types';
import { formatDateRange } from '@/lib/utils';
import styles from './EduExp.module.css';

interface Props {
  data: Education[];
}

export default function EducationSection({ data }: Props) {
  return (
    <div className={styles.panel} id="education">
      <h2 className={styles.panelTitle}>Education</h2>
      <p className={styles.panelSubtitle}>Academic background</p>

      {data.length === 0 ? (
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
          No education entries yet.
        </p>
      ) : (
        <div className={styles.entryList}>
          {data.map((item) => (
            <div key={item.id} className={styles.entry}>
              <div className={styles.entryHeader}>
                <h3 className={styles.entryTitle}>{item.institution}</h3>
                <span className={styles.entryMeta}>
                  {formatDateRange(item.start_date, item.end_date)}
                </span>
              </div>
              {[item.degree, item.field].filter(Boolean).join(' in ') && (
                <p className={styles.entrySubtitle}>
                  {[item.degree, item.field].filter(Boolean).join(' in ')}
                </p>
              )}
              {item.location && (
                <p className={styles.entryLocation}>📍 {item.location}</p>
              )}
              {item.description && (
                <p className={styles.entryDesc}>{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
