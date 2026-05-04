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
              const gallery = Array.isArray(item.gallery_images) ? item.gallery_images : [];

              // Combine cover image and gallery for display
              const allImages: string[] = [
                ...(item.image_url ? [item.image_url] : []),
                ...gallery,
              ];

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
                  {/* Cover image */}
                  {item.image_url && (
                    <div className={styles.coverImgWrapper}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className={styles.coverImg}
                      />
                    </div>
                  )}

                  {item.description && <p>{item.description}</p>}
                  {highlights.length > 0 && (
                    <ul className={styles.highlights}>
                      {highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}

                  {/* Gallery images (excluding cover) */}
                  {gallery.length > 0 && (
                    <div className={styles.galleryGrid}>
                      {gallery.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={url}
                          alt={`${item.title} gallery ${i + 1}`}
                          className={styles.galleryImg}
                        />
                      ))}
                    </div>
                  )}

                  <div className={styles.linkRow} style={{ marginTop: 14 }}>
                    {item.github_url && (
                      <a
                        href={item.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.githubBtn}
                        aria-label="View source on GitHub"
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </a>
                    )}
                    {item.project_url && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.demoBtn}
                        aria-label="View live demo"
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        Live Demo
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
