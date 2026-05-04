import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Certification } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import styles from './ContentStyles.module.css';

interface Props {
  data: Certification[];
}

export default function CertificationSection({ data }: Props) {
  return (
    <ScrollReveal>
      <Section
        id="certifications"
        title="Licenses & Certifications"
        subtitle="Professional credentials"
      >
        {data.length === 0 ? (
          <EmptyState icon="📜" message="No certifications yet." />
        ) : (
          <div className={`${styles.grid} ${styles.grid2}`}>
            {data.map((item) => (
              <Card
                key={item.id}
                title={item.name}
                subtitle={item.issuer}
                meta={formatDate(item.issue_date)}
                href={item.credential_url || undefined}
                footer={
                  <>
                    {item.credential_id && (
                      <Badge variant="secondary">ID: {item.credential_id}</Badge>
                    )}
                    {item.credential_url && (
                      <Badge variant="success">Verified ↗</Badge>
                    )}
                  </>
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
