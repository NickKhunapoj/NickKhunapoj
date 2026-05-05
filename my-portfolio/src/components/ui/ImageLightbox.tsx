'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from './MotionProvider';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  alt = 'Enlarged image',
  open,
  onClose,
}: ImageLightboxProps) {
  const { reducedMotion } = useMotion();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Reset index when opening with a new initialIndex
  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Focus the close button for keyboard users
      setTimeout(() => closeBtnRef.current?.focus(), 50);
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, handlePrev, handleNext]);

  const duration = reducedMotion ? 0 : 0.25;

  return (
    <AnimatePresence>
      {open && images.length > 0 && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          {/* Close button */}
          <button
            ref={closeBtnRef}
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close image viewer"
          >
            ✕
          </button>

          {/* Previous */}
          {images.length > 1 && (
            <button
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <motion.div
            className={styles.imageContainer}
            onClick={(e) => e.stopPropagation()}
            key={currentIndex}
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.92 }}
            transition={{ duration }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[currentIndex]}
              alt={`${alt} (${currentIndex + 1} of ${images.length})`}
              className={styles.image}
            />
          </motion.div>

          {/* Next */}
          {images.length > 1 && (
            <button
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              aria-label="Next image"
            >
              ›
            </button>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className={styles.counter}>
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
