import styles from './Skeleton.module.css';

interface SkeletonProps {
  count?: number;
}

export default function Skeleton({ count = 3 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonSub} />
          <div className={styles.skeletonBody} />
          <div className={styles.skeletonBody2} />
        </div>
      ))}
    </>
  );
}
