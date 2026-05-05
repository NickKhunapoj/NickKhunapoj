import { Experience } from '@/lib/types';
import { formatDateRange, parseJsonArray } from '@/lib/utils';
import styles from './EduExp.module.css';

interface Props {
  data: Experience[];
}

export default function ExperienceSection({ data }: Props) {
  return (
    <div className={styles.panel} id="experience">
      <h2 className={styles.panelTitle}>Experience</h2>
      <p className={styles.panelSubtitle}>Professional journey</p>

      {data.length === 0 ? (
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
          No experience entries yet.
        </p>
      ) : (
        <div className={styles.entryList}>
          {data.map((item) => {
            const highlights = parseJsonArray(item.highlights);
            return (
              <div key={item.id} className={styles.entry}>
                <div className={styles.entryHeader}>
                  <h3 className={styles.entryTitle}>{item.role}</h3>
                  <span className={styles.entryMeta}>
                    {formatDateRange(item.start_date, item.end_date)}
                  </span>
                </div>
                <p className={styles.entrySubtitle}>{item.company}</p>
                {item.location && (
                  <p className={styles.entryLocation}>📍 {item.location}</p>
                )}
                {item.description && (
                  <p className={styles.entryDesc}>{item.description}</p>
                )}
                {highlights.length > 0 && (
                  <div className={styles.highlights}>
                    {highlights.map((h, i) => (
                      <p key={i} className={styles.highlight}>{h}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
