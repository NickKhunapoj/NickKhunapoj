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

const certificateGroups = [
  {
    type: 'exam',
    title: 'Exam Certifications',
  },
  {
    type: 'completion',
    title: 'Certificate of Completion',
  },
] as const;

function CertificationCard({ item }: { item: Certification }) {
  const gallery = Array.isArray(item.gallery_images) ? item.gallery_images : [];

  return (
    <Card
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
      {gallery.length > 0 && (
        <div className={styles.galleryGrid}>
          {gallery.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`${item.name} photo ${i + 1}`}
              className={styles.galleryImg}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function CertificationSection({ data }: Props) {
  const grouped = certificateGroups.map((group) => ({
    ...group,
    items: data.filter((item) => (item.certificate_type || 'completion') === group.type),
  }));

  return (
    <ScrollReveal>
      <Section
        id="certifications"
        title="Licenses & Certifications"
      >
        {data.length === 0 ? (
          <EmptyState icon="📜" message="No certifications yet." />
        ) : (
          <div className={styles.certGroupList}>
            {grouped.map((group) => (
              group.items.length > 0 && (
                <div key={group.type} className={styles.certGroup}>
                  <div className={styles.certGroupHeader}>
                    <h3>{group.title}</h3>
                  </div>
                  <div className={`${styles.grid} ${styles.grid2}`}>
                    {group.items.map((item) => (
                      <CertificationCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </Section>
    </ScrollReveal>
  );
}
