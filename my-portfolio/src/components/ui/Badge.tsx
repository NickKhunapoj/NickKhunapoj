import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success';
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  const className = [styles.badge, variant !== 'default' ? styles[variant] : '']
    .filter(Boolean)
    .join(' ');

  return <span className={className}>{children}</span>;
}
