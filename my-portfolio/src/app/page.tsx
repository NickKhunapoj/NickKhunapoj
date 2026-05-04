import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import ProfileSection from '@/components/sections/ProfileSection';
import EducationSection from '@/components/sections/EducationSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import CertificationSection from '@/components/sections/CertificationSection';
import ProjectSection from '@/components/sections/ProjectSection';
import SkillSection from '@/components/sections/SkillSection';
import CourseSection from '@/components/sections/CourseSection';
import AwardSection from '@/components/sections/AwardSection';
import TestScoreSection from '@/components/sections/TestScoreSection';
import Footer from '@/components/sections/Footer';

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

    if (error) {
      return null;
    }
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
    courses,
    awards,
    testScores,
  ] = await Promise.all([
    getProfile(),
    getData('education'),
    getData('experiences'),
    getData('certifications'),
    getData('projects'),
    getData('skills'),
    getData('courses'),
    getData('awards'),
    getData('test_scores'),
  ]);

  return (
    <>
      <Navbar />
      <Hero profile={profile} />
      <main>
        {/* GROUP 1: About — Profile + Dashboard + Edu/Exp side‑by‑side */}
        <div id="about" style={{ paddingTop: 'var(--nav-height)' }}>
          <ProfileSection profile={profile} />

          {/* Education & Experience in a two‑column row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-md)',
              maxWidth: 'var(--max-width)',
              margin: '0 auto',
              padding: '0 var(--space-lg)',
            }}
            className="edu-exp-grid"
          >
            <EducationSection data={education} />
            <ExperienceSection data={experiences} />
          </div>

          <ProjectSection data={projects} />
          <SkillSection data={skills} />
          <CourseSection data={courses} />
          <TestScoreSection data={testScores} />
        </div>

        <div className="section-divider" />

        {/* GROUP 2: Awards */}
        <div id="awards" style={{ paddingTop: 'var(--nav-height)' }}>
          <AwardSection data={awards} />
        </div>

        <div className="section-divider" />

        {/* GROUP 3: Certifications */}
        <div id="certifications" style={{ paddingTop: 'var(--nav-height)' }}>
          <CertificationSection data={certifications} />
        </div>
      </main>
      <Footer />
    </>
  );
}
