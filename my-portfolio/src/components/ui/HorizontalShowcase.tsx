'use client';

import { useRef, useCallback, useState, useEffect, useLayoutEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import DetailModal, { DetailModalData } from './DetailModal';
import styles from './HorizontalShowcase.module.css';

/* ── Public types ── */
export interface ShowcaseCardData {
  id: string;
  title: string;
  description?: string | null;
  date?: string;
  icon?: string;
  imageUrl?: string | null;
  tags?: string[];
  href?: string | null;
  modalData?: DetailModalData;
}

interface HorizontalShowcaseProps {
  id?: string;
  title: string;
  subtitle?: string;
  items: ShowcaseCardData[];
  emptyIcon?: string;
  emptyMessage?: string;
}

/* ── Component ── */
export default function HorizontalShowcase({
  id,
  title,
  subtitle,
  items,
  emptyIcon = '📂',
  emptyMessage = 'Nothing here yet.',
}: HorizontalShowcaseProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<DetailModalData | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Initialize scroll position with the first item centered.
  useLayoutEffect(() => {
    if (!trackRef.current || items.length === 0) return;
    const el = trackRef.current;
    const targetCard = el.children[0] as HTMLElement;
    
    if (targetCard) {
      // Temporarily disable snapping to avoid jumping
      el.style.scrollSnapType = 'none';
      // Center the card in the track
      const centerOffset = (el.clientWidth - targetCard.offsetWidth) / 2;
      el.scrollLeft = targetCard.offsetLeft - centerOffset;
      // Re-enable snapping
      requestAnimationFrame(() => {
        el.style.scrollSnapType = 'x mandatory';
      });
      setActiveIndex(0);
    }
  }, [items.length]);

  // Handle intersection observer to set active item
  useEffect(() => {
    if (!trackRef.current || items.length === 0) return;
    
    // rootMargin '0px -49% 0px -49%' creates a narrow 2% vertical slice in the center
    // Any card that passes through this slice is considered "in the center".
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indexAttr = entry.target.getAttribute('data-original-index');
            if (indexAttr !== null) {
              setActiveIndex(parseInt(indexAttr, 10));
            }
          }
        });
      },
      {
        root: trackRef.current,
        rootMargin: '0px -49% 0px -49%',
        threshold: 0,
      }
    );

    const cards = trackRef.current.querySelectorAll(`.${styles.card}`);
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [items.length]);

  const scrollLeft = useCallback(() => {
    if (trackRef.current) {
      // scroll by roughly one card width; native snapping will correct it to the exact card
      trackRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  }, []);

  if (items.length === 0) {
    return (
      <section id={id} className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>{emptyIcon}</div>
          <p>{emptyMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id={id} className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>

        <div
          ref={trackRef}
          className={styles.track}
          role="region"
          aria-label={`${title} carousel`}
          tabIndex={0}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <ShowcaseCard
                key={item.id}
                item={item}
                originalIndex={index}
                isActive={isActive}
                onOpen={() => {
                  // Only allow opening if it is the currently active (centered) item
                  if (!isActive) {
                    // If they click an inactive item, scroll it to the center instead
                    const cardNodes = trackRef.current?.querySelectorAll(`.${styles.card}`);
                    const targetNode = cardNodes?.[index] as HTMLElement;
                    if (trackRef.current && targetNode) {
                      const centerOffset = (trackRef.current.clientWidth - targetNode.offsetWidth) / 2;
                      trackRef.current.scrollTo({
                        left: targetNode.offsetLeft - centerOffset,
                        behavior: 'smooth'
                      });
                    }
                    return;
                  }

                  if (item.modalData) {
                    setModal(item.modalData);
                  } else if (item.href) {
                    window.open(item.href, '_blank', 'noopener,noreferrer');
                  }
                }}
              />
            );
          })}
        </div>

        {/* Center Bottom Navigation */}
        <div className={styles.navContainer}>
          <button className={styles.navBtn} onClick={scrollLeft} aria-label="Scroll left">
            &larr;
          </button>
          <button className={styles.navBtn} onClick={scrollRight} aria-label="Scroll right">
            &rarr;
          </button>
        </div>
      </section>

      <AnimatePresence>
        {modal && (
          <DetailModal
            data={modal}
            open={true}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Card ── */
function ShowcaseCard({
  item,
  originalIndex,
  isActive,
  onOpen,
}: {
  item: ShowcaseCardData;
  originalIndex: number;
  isActive: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      data-original-index={originalIndex}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
      aria-label={`${isActive ? 'View details: ' : 'Scroll to: '}${item.title}`}
    >
      <div className={styles.cardBg}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className={styles.cardBgImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.cardBgPlaceholder} />
        )}
      </div>

      <div className={styles.cardOverlay} />

      <div className={styles.cardTopRow}>
        {item.icon && <span className={styles.cardIcon}>{item.icon}</span>}
        {item.date && <span className={styles.cardDate}>{item.date}</span>}
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        {item.description && (
          <p className={styles.cardDesc}>{item.description}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className={styles.cardTags}>
            {item.tags.map((tag) => (
              <span key={tag} className={styles.cardTag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
