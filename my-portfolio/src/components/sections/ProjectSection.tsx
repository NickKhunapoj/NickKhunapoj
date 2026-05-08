import ScrollReveal from '@/components/ui/ScrollReveal';
import HorizontalShowcase, { ShowcaseCardData } from '@/components/ui/HorizontalShowcase';
import { Project } from '@/lib/types';
import { parseJsonArray } from '@/lib/utils';

interface Props {
  data: Project[];
}

export default function ProjectSection({ data }: Props) {
  const items: ShowcaseCardData[] = data.map((item) => {
    const techStack = parseJsonArray(item.tech_stack);
    const highlights = parseJsonArray(item.highlights);
    const gallery = Array.isArray(item.gallery_images) ? item.gallery_images : [];
    const allImages = [...(item.image_url ? [item.image_url] : []), ...gallery];

    const links = [];
    if (item.project_url) links.push({ label: 'Live Demo', href: item.project_url, primary: true });
    if (item.github_url) links.push({ label: 'GitHub', href: item.github_url });
    if (item.document_url) links.push({ label: 'View PDF', href: item.document_url });

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      icon: '🚀',
      imageUrl: item.image_url || (gallery.length > 0 ? gallery[0] : null),
      tags: techStack.slice(0, 5),
      href: item.project_url,
      modalData: {
        icon: '🚀',
        title: item.title,
        description: [
          item.description,
          highlights.length > 0 ? '— ' + highlights.join('\n— ') : null,
        ].filter(Boolean).join('\n\n') || null,
        tags: techStack,
        images: allImages,
        links,
      },
    };
  });

  return (
    <ScrollReveal>
      <HorizontalShowcase
        id="projects"
        title="Projects"
        subtitle="What I've been building"
        items={items}
        emptyIcon="🚀"
        emptyMessage="No projects yet."
      />
    </ScrollReveal>
  );
}
