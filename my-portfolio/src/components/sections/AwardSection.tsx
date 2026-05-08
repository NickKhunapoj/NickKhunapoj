import ScrollReveal from '@/components/ui/ScrollReveal';
import HorizontalShowcase, { ShowcaseCardData } from '@/components/ui/HorizontalShowcase';
import { Award } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface Props {
  data: Award[];
}

export default function AwardSection({ data }: Props) {
  const items: ShowcaseCardData[] = data.map((item) => {
    const gallery = Array.isArray(item.gallery_images) ? item.gallery_images : [];

    const links = [];
    if (item.url) links.push({ label: 'View Award', href: item.url, primary: true });
    if (item.document_url) links.push({ label: 'View Proof PDF', href: item.document_url });

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      date: formatDate(item.award_date),
      icon: '🏆',
      imageUrl: gallery.length > 0 ? gallery[0] : null,
      tags: item.issuer ? [item.issuer] : [],
      href: item.url,
      modalData: {
        icon: '🏆',
        title: item.title,
        date: formatDate(item.award_date),
        description: item.description,
        tags: item.issuer ? [item.issuer] : [],
        images: gallery,
        links,
      },
    };
  });

  return (
    <ScrollReveal>
      <HorizontalShowcase
        id="awards"
        title="Honors & Awards"
        subtitle="Recognitions and achievements"
        items={items}
        emptyIcon="🏆"
        emptyMessage="No awards listed yet."
      />
    </ScrollReveal>
  );
}
