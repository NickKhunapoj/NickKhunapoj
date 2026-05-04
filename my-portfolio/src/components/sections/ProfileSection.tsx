import styles from './About.module.css';
import { Profile } from '@/lib/types';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function ProfileSection({ profile }: { profile: Profile | null }) {
  if (!profile || !profile.short_bio) return null;

  return (
    <ScrollReveal>
      <section className={styles.about} id="profile">
        <div className={styles.content}>
          <h2 className={styles.title}>About Me</h2>
          <div className={styles.bio}>
            {profile.short_bio.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {(profile.location || profile.email || profile.website_url) && (
            <div className={styles.details}>
              {profile.location && (
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>📍</span>
                  {profile.location}
                </div>
              )}
              {profile.email && (
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>✉️</span>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </div>
              )}
              {profile.website_url && (
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>🌐</span>
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                    {profile.website_url.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {profile.resume_url && (
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>📄</span>
                  <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                    Resume
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </ScrollReveal>
  );
}
