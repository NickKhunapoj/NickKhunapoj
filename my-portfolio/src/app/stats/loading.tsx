import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';
import styles from './stats.module.css';

export default function StatsLoading() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Public GitHub Profile</p>
          <h1>GitHub Stats</h1>
          <p>Loading GitHub stats...</p>
        </section>

        <div className={styles.loadingGrid} aria-label="Loading GitHub stats">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={styles.skeletonCard} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
