import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: string;
  message?: string;
}

export default function EmptyState({
  icon = '📭',
  message = 'Nothing here yet.',
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>{icon}</span>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
