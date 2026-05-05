import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import ProfileSection from '@/components/sections/ProfileSection';
import EducationSection from '@/components/sections/EducationSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import CertificationSection from '@/components/sections/CertificationSection';
import ProjectSection from '@/components/sections/ProjectSection';
import SkillSection from '@/components/sections/SkillSection';
import AwardSection from '@/components/sections/AwardSection';
import TestScoreSection from '@/components/sections/TestScoreSection';
import Footer from '@/components/sections/Footer';
import ScrollReveal from '@/components/ui/ScrollReveal';
import styles from './page.module.css';

async function getData(table: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

async function getProfile() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function Home() {
  const [
    profile,
    education,
    experiences,
    certifications,
    projects,
    skills,
    awards,
    testScores,
  ] = await Promise.all([
    getProfile(),
    getData('education'),
    getData('experiences'),
    getData('certifications'),
    getData('projects'),
    getData('skills'),
    getData('awards'),
    getData('test_scores'),
  ]);

  return (
    <>
      <Navbar />
      <Hero profile={profile} />
      <main id="about" className={styles.main}>

        {/* ── Profile ── */}
        <ProfileSection profile={profile} />

        {/* ── Education + Experience two-column row ── */}
        <ScrollReveal>
          <div className={styles.eduExpRow}>
            <EducationSection data={education} />
            <ExperienceSection data={experiences} />
          </div>
        </ScrollReveal>

        {/* ── Projects carousel ── */}
        <div className={styles.carouselSection}>
          <ProjectSection data={projects} />
        </div>

        {/* ── Skills ── */}
        <SkillSection data={skills} />

        {/* ── Test Scores ── */}
        <TestScoreSection data={testScores} />

        <div className="section-divider" />

        {/* ── Awards carousel ── */}
        <div className={styles.carouselSection} id="awards">
          <AwardSection data={awards} />
        </div>

        <div className="section-divider" />

        {/* ── Certifications ── */}
        <CertificationSection data={certifications} />

      </main>
      <Footer />
    </>
  );
}
