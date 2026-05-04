import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Award } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import styles from './ContentStyles.module.css';

interface Props {
  data: Award[];
}

export default function AwardSection({ data }: Props) {
  return (
    <ScrollReveal>
      <Section id="awards" title="Honors & Awards" subtitle="Recognitions and achievements">
        {data.length === 0 ? (
          <EmptyState icon="🏆" message="No awards listed yet." />
        ) : (
          <div className={`${styles.grid} ${styles.grid2}`}>
            {data.map((item) => (
              <Card
                key={item.id}
                title={item.title}
                subtitle={item.issuer || undefined}
                meta={formatDate(item.award_date)}
                href={item.url || undefined}
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
