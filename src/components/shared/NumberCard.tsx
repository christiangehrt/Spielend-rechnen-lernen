import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { DotPattern } from '../../core/scaffolding/DotPattern';
import './NumberCard.css';

interface Props {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showDots?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  tone?: 'default' | 'up' | 'down' | 'gold';
  className?: string;
  style?: CSSProperties;
  onPointerDown?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onClick?: () => void;
  label?: string;
  as?: 'button' | 'div';
}

/** Basic number card (CardBase): big numeral plus optional 5/10 dot pattern. */
export function NumberCard({
  value,
  size = 'md',
  showDots = true,
  selected = false,
  dimmed = false,
  tone = 'default',
  className = '',
  style,
  onPointerDown,
  onClick,
  label,
  as = 'button',
}: Props) {
  const cls = `ncard ncard--${size} ncard--${tone} ${selected ? 'ncard--selected' : ''} ${dimmed ? 'ncard--dimmed' : ''} ${className}`;
  const body = (
    <>
      <span className="ncard__value">{value}</span>
      {showDots && <DotPattern value={value} stack size={size === 'lg' ? 88 : size === 'md' ? 70 : 54} className="ncard__dots" />}
    </>
  );
  if (as === 'div') {
    return (
      <div className={cls} style={style} aria-label={label ?? String(value)}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      style={style}
      aria-label={label ?? String(value)}
      aria-pressed={selected}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {body}
    </button>
  );
}
