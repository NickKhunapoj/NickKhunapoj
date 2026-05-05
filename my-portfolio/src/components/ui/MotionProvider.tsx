'use client';

import { createContext, useContext } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface MotionCtx {
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
}

const MotionContext = createContext<MotionCtx>({
  reducedMotion: false,
  toggleReducedMotion: () => {},
});

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const value = useReducedMotion();
  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

export function useMotion() {
  return useContext(MotionContext);
}
