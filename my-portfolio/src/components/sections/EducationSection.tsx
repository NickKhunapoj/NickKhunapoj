import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Education } from '@/lib/types';
import { formatDateRange } from '@/lib/utils';
import styles from './ContentStyles.module.css';

interface Props {
  data: Education[];
}

export default function EducationSection({ data }: Props) {
  return (
    <ScrollReveal>
      <Section id="education" title="Education" subtitle="My academic background">
        {data.length === 0 ? (
          <EmptyState icon="🎓" message="No education entries yet." />
        ) : (
          <div className={styles.list}>
            {data.map((item) => (
              <Card
                key={item.id}
                title={item.institution}
                subtitle={[item.degree, item.field].filter(Boolean).join(' in ')}
                meta={formatDateRange(item.start_date, item.end_date)}
              >
                {item.location && <p style={{ marginBottom: 8, color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>📍 {item.location}</p>}
                {item.description && <p>{item.description}</p>}
              </Card>
            ))}
          </div>
        )}
      </Section>
    </ScrollReveal>
  );
}
