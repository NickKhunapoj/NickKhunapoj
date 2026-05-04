import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Course } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import styles from './ContentStyles.module.css';

interface Props {
  data: Course[];
}

export default function CourseSection({ data }: Props) {
  return (
    <ScrollReveal>
      <Section id="courses" title="Courses" subtitle="Continuous learning">
        {data.length === 0 ? (
          <EmptyState icon="📚" message="No courses listed yet." />
        ) : (
          <div className={`${styles.grid} ${styles.grid3}`}>
            {data.map((item) => (
              <Card
                key={item.id}
                title={item.name}
                subtitle={item.provider || undefined}
                meta={formatDate(item.completion_date)}
                href={item.certificate_url || undefined}
                footer={
                  item.certificate_url ? (
                    <Badge variant="success">Certificate ↗</Badge>
                  ) : undefined
                }
              >
                {item.description && <p>{item.description}</p>}
              </Card>
            ))}
          </div>
        )}
      </Section>
    </ScrollReveal>
  );
}
