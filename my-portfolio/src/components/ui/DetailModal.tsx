'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from './MotionProvider';
import styles from './DetailModal.module.css';

export interface DetailModalData {
  icon?: string;
  title: string;
  date?: string;
  description?: string | null;
  tags?: string[];
  images?: string[];
  links?: { label: string; href: string; primary?: boolean }[];
}

interface Props {
  data: DetailModalData | null;
  open: boolean;
  onClose: () => void;
}

export default function DetailModal({ data, open, onClose }: Props) {
  const { reducedMotion } = useMotion();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [activeImg, setActiveImg] = useState(0);

  // Reset active image when new item opened
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => setActiveImg(0));
  }, [open, data]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const dur = reducedMotion ? 0 : 0.2;
  const images = data?.images ?? [];

  return (
    <AnimatePresence>
      {open && data && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Details: ${data.title}`}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.96, y: reducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.96, y: reducedMotion ? 0 : 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              ref={closeBtnRef}
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>

            <div className={styles.body}>
              {/* ── Left: Image / Gallery ── */}
              <div className={styles.imageCol}>
                {images.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images[activeImg]}
                      alt={data.title}
                      className={styles.mainImage}
                    />
                    {images.length > 1 && (
                      <div className={styles.galleryRow}>
                        {images.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={src}
                            alt={`${data.title} thumbnail ${i + 1}`}
                            className={`${styles.galleryThumb} ${i === activeImg ? styles.galleryThumbActive : ''}`}
                            onClick={() => setActiveImg(i)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.imagePlaceholder}>
                    {data.icon ?? '📄'}
                  </div>
                )}
              </div>

              {/* ── Right: Details ── */}
              <div className={styles.detailCol}>
                {/* Header */}
                <div className={styles.detailHeader}>
                  {data.icon && (
                    <div className={styles.detailIcon}>{data.icon}</div>
                  )}
                  <div>
                    <h2 className={styles.detailTitle}>{data.title}</h2>
                    {data.date && (
                      <p className={styles.detailDate}>{data.date}</p>
                    )}
                  </div>
                </div>

                <div className={styles.divider} />

                {/* Description */}
                {data.description && (
                  <p className={styles.detailDesc}>{data.description}</p>
                )}

                {/* Tags */}
                {data.tags && data.tags.length > 0 && (
                  <div className={styles.tagRow}>
                    {data.tags.map((t) => (
                      <span key={t} className={styles.tag}>{t}</span>
                    ))}
                  </div>
                )}

                {/* Links */}
                {data.links && data.links.length > 0 && (
                  <div className={styles.linkRow}>
                    {data.links.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.linkBtn} ${l.primary ? styles.linkBtnPrimary : styles.linkBtnSecondary}`}
                      >
                        {l.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
