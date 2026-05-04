import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Project } from '@/lib/types';
import { parseJsonArray } from '@/lib/utils';
import styles from './ContentStyles.module.css';

interface Props {
  data: Project[];
}

export default function ProjectSection({ data }: Props) {
  return (
    <ScrollReveal>
      <Section id="projects" title="Projects" subtitle="What I've been building">
        {data.length === 0 ? (
          <EmptyState icon="🚀" message="No projects yet." />
        ) : (
          <div className={`${styles.grid} ${styles.grid2}`}>
            {data.map((item) => {
              const techStack = parseJsonArray(item.tech_stack);
              const highlights = parseJsonArray(item.highlights);
              return (
                <Card
                  key={item.id}
                  title={item.title}
                  footer={
                    <>
                      {techStack.map((tech) => (
                        <Badge key={tech}>{tech}</Badge>
                      ))}
                    </>
                  }
                >
                  {item.description && <p>{item.description}</p>}
                  {highlights.length > 0 && (
                    <ul className={styles.highlights}>
                      {highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                  <div className={styles.linkRow} style={{ marginTop: 12 }}>
                    {item.project_url && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.iconLink}
                      >
                        🔗 Live Demo
                      </a>
                    )}
                    {item.github_url && (
                      <a
                        href={item.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.iconLink}
                      >
                        💻 Source
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </ScrollReveal>
  );
}
