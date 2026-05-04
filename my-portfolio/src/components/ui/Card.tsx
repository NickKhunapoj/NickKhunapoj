'use client';

import { useRef } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  href?: string;
}

export default function Card({ title, subtitle, meta, children, footer, href }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  const content = (
    <div className={styles.cardInner}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>{title}</h3>
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        </div>
        {meta && <span className={styles.cardMeta}>{meta}</span>}
      </div>
      {children && <div className={styles.cardBody}>{children}</div>}
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.card}
        ref={cardRef as unknown as React.Ref<HTMLAnchorElement>}
        onMouseMove={handleMouseMove as unknown as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={styles.card} ref={cardRef} onMouseMove={handleMouseMove}>
      {content}
    </div>
  );
}
