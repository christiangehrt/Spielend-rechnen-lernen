import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children: ReactNode;
  label: string;
  className?: string;
  onBackdrop?: () => void;
}

export function Overlay({ children, label, className = '', onBackdrop }: Props) {
  return createPortal(
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onBackdrop?.();
      }}
    >
      <div className={`overlay__card ${className}`}>{children}</div>
    </div>,
    document.body,
  );
}
