'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'portfolio-reduced-motion';

/**
 * Custom hook for reduced-motion preference.
 * Merges user toggle (localStorage) with system `prefers-reduced-motion`.
 * Sets `data-reduced-motion` attribute on <html> for CSS selectors.
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  // Initialise from localStorage + system preference
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setReducedMotion(stored === 'true');
    } else {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches);
    }
  }, []);

  // Sync system preference changes (only if user hasn't manually toggled)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setReducedMotion(e.matches);
      }
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Sync attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-reduced-motion',
      reducedMotion ? 'true' : 'false'
    );
  }, [reducedMotion]);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { reducedMotion, toggleReducedMotion };
}
