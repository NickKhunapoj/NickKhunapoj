'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from '@/components/ui/MotionProvider';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Awards', href: '#awards' },
  { label: 'Stats', href: '/stats' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { reducedMotion, toggleReducedMotion } = useMotion();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Hidden admin access
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = NAV_ITEMS.filter((item) => item.href.startsWith('#')).map((item) => item.href.slice(1));
      let current = '';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  // Close on ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  // Focus trap inside drawer
  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const scrollToSection = useCallback((href: string) => {
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) {
      window.sessionStorage.setItem('pending-scroll-section', id);
      router.push('/');
      return;
    }

    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    setActiveSection(id);

    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [reducedMotion, router]);

  useEffect(() => {
    if (pathname !== '/') return;

    const pendingSection = window.sessionStorage.getItem('pending-scroll-section');
    if (!pendingSection) return;

    window.sessionStorage.removeItem('pending-scroll-section');
    requestAnimationFrame(() => {
      scrollToSection(`#${pendingSection}`);
    });
  }, [pathname, scrollToSection]);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href.startsWith('#')) {
      scrollToSection(href);
    } else {
      router.push(href);
    }
  }, [router, scrollToSection]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    if (newCount >= 3) {
      router.push('/admin/login');
      setClickCount(0);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
        if (newCount === 1) {
          if (pathname === '/') {
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
          } else {
            router.push('/');
          }
        }
      }, 400);
    }
  };

  const duration = reducedMotion ? 0 : 0.3;

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.inner}>
          <a href={pathname === '/' ? '#hero' : '/'} className={styles.logo} onClick={handleLogoClick}>
            <Image
              src="/nickgogogo-logo-circle.png"
              alt="Khunapoj Suttenon"
              width={40}
              height={40}
              priority
              className={styles.logoImage}
            />
          </a>

          {/* Desktop links */}
          <div className={styles.desktopLinks}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`${styles.link} ${
                  item.href.startsWith('/')
                    ? pathname === item.href ? styles.linkActive : ''
                    : activeSection === item.href.slice(1) ? styles.linkActive : ''
                }`}
              >
                {item.label}
              </a>
            ))}

            {/* Reduced-motion toggle (desktop) */}
            <button
              className={styles.motionToggle}
              onClick={toggleReducedMotion}
              aria-label={reducedMotion ? 'Enable animations' : 'Reduce motion'}
              title={reducedMotion ? 'Enable animations' : 'Reduce motion'}
            >
              {reducedMotion ? '⏸' : '✦'}
            </button>
          </div>

          {/* Hamburger button (mobile) */}
          <button
            className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration }}
              onClick={closeMobile}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.div
              ref={drawerRef}
              className={styles.drawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                duration: reducedMotion ? 0 : 0.35,
                ease: [0.32, 0.72, 0, 1],
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              {/* Close button inside drawer */}
              <button
                className={styles.drawerClose}
                onClick={closeMobile}
                aria-label="Close menu"
              >
                ✕
              </button>

              {/* Nav items */}
              <div className={styles.drawerNav}>
                {NAV_ITEMS.map((item, i) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className={`${styles.drawerLink} ${
                      item.href.startsWith('/')
                        ? pathname === item.href ? styles.drawerLinkActive : ''
                        : activeSection === item.href.slice(1) ? styles.drawerLinkActive : ''
                    }`}
                    onClick={(e) => {
                      handleNavClick(e, item.href);
                      closeMobile();
                    }}
                    initial={{ opacity: 0, x: reducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reducedMotion ? 0 : 0.1 + i * 0.06, duration: reducedMotion ? 0 : 0.3 }}
                  >
                    {item.label}
                    {(item.href.startsWith('/') ? pathname === item.href : activeSection === item.href.slice(1)) && (
                      <span className={styles.drawerDot} />
                    )}
                  </motion.a>
                ))}
              </div>

              {/* Drawer footer */}
              <div className={styles.drawerFooter}>
                <button
                  className={styles.drawerMotionToggle}
                  onClick={toggleReducedMotion}
                >
                  {reducedMotion ? '⏸' : '✦'}
                  <span>{reducedMotion ? 'Enable animations' : 'Reduce motion'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
