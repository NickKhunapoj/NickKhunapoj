import styles from './About.module.css';
import { Profile } from '@/lib/types';
import ScrollReveal from '@/components/ui/ScrollReveal';
import MiniDashboard from './MiniDashboard';

export default function ProfileSection({ profile }: { profile: Profile | null }) {
  if (!profile) return null;

  const imageUrl = profile.profile_image_url || null;

  return (
    <ScrollReveal>
      <section className={styles.about} id="profile">
        <div className={styles.container}>
          {/* Profile card: image + info side by side on desktop */}
          <div className={styles.profileCard}>
            {/* Avatar */}
            <div className={styles.avatarWrapper}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={profile.full_name}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <span className={styles.avatarInitials}>
                    {profile.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className={styles.profileInfo}>
              <h2 className={styles.title}>About Me</h2>
              {profile.short_bio && (
                <div className={styles.bio}>
                  {profile.short_bio.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}

              {/* Details & links */}
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
              </div>

              {/* Resume button */}
              {profile.resume_url && (
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.resumeCard}
                  aria-label="Open resume PDF in a new tab"
                >
                  <span className={styles.resumeIcon}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v5h5" />
                      <path d="M9 13h6" />
                      <path d="M9 17h4" />
                    </svg>
                  </span>
                  <span className={styles.resumeText}>
                    <span className={styles.resumeLabel}>View My Resume</span>
                  </span>
                  <span className={styles.resumeArrow} aria-hidden="true">
                    ↗
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
        <MiniDashboard profile={profile} />
      </section>
    </ScrollReveal>
  );
}
