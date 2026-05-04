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
                  href={profile.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.resumeBtn}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"/>
                  </svg>
                  View Resume
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
