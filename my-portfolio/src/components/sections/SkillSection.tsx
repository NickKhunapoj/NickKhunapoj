import Section from '@/components/ui/Section';
import EmptyState from '@/components/ui/EmptyState';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Skill } from '@/lib/types';
import styles from './ContentStyles.module.css';

interface Props {
  data: Skill[];
}

export default function SkillSection({ data }: Props) {
  // Group skills by category
  const grouped = data.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const categories = Object.entries(grouped);

  return (
    <ScrollReveal>
      <Section id="skills" title="Skills" subtitle="Technologies and tools I work with">
        {data.length === 0 ? (
          <EmptyState icon="⚡" message="No skills listed yet." />
        ) : (
          <div className="stagger-children">
            {categories.map(([category, skills]) => (
              <div key={category} className={styles.skillGroup}>
                <h3 className={styles.skillGroupTitle}>{category}</h3>
                <div className={styles.skillTags}>
                  {skills.map((skill) => (
                    <div key={skill.id} className={styles.skillTag}>
                      {skill.icon && <span className={styles.skillIcon}>{skill.icon}</span>}
                      <span>{skill.name}</span>
                      {skill.level && <span className={styles.skillLevel}>· {skill.level}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </ScrollReveal>
  );
}
