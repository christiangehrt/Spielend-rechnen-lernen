import './scaffolding.css';

interface Props {
  value: number;
  /** Pixel width of one ten-frame. */
  size?: number;
  /** Stack the two ten-frames of 11–20 vertically (for narrow cards). */
  stack?: boolean;
  className?: string;
}

/**
 * Structured dot pattern ("Kraft der 5"): numbers up to 20 are shown as
 * ten-frames (2 rows × 5), first five dots in one colour, next five in a
 * second colour. Larger numbers show tens as bars plus a ten-frame for ones.
 */
export function DotPattern({ value, size = 60, stack = false, className = '' }: Props) {
  const v = Math.max(0, Math.floor(value));
  if (v > 20) {
    const tens = Math.floor(v / 10);
    const ones = v % 10;
    return (
      <span className={`dots dots--big ${className}`} aria-hidden="true">
        <span className="dots__tens" style={{ height: size * 0.42 }}>
          {Array.from({ length: tens }, (_, i) => (
            <span key={i} className={`dots__bar ${i % 2 ? 'dots__bar--alt' : ''}`} />
          ))}
        </span>
        {ones > 0 && <TenFrame filled={ones} size={size * 0.7} />}
      </span>
    );
  }
  const frames = v > 10 ? [10, v - 10] : [v];
  return (
    <span className={`dots ${stack ? 'dots--stack' : ''} ${className}`} aria-hidden="true">
      {frames.map((filled, i) => (
        <TenFrame key={i} filled={filled} size={size} />
      ))}
    </span>
  );
}

function TenFrame({ filled, size }: { filled: number; size: number }) {
  const cell = 20;
  return (
    <svg className="dots__frame" width={size} height={size * 0.4} viewBox="0 0 100 40">
      <rect x="0.5" y="0.5" width="99" height="39" rx="4" className="dots__grid" />
      <line x1="0" y1="20" x2="100" y2="20" className="dots__line" />
      {[1, 2, 3, 4].map((i) => (
        <line key={i} x1={i * cell} y1="0" x2={i * cell} y2="40" className="dots__line" />
      ))}
      {Array.from({ length: 10 }, (_, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        return i < filled ? (
          <circle
            key={i}
            cx={col * cell + cell / 2}
            cy={row * cell + cell / 2}
            r="7"
            className={row === 0 ? 'dots__dot' : 'dots__dot dots__dot--alt'}
          />
        ) : null;
      })}
    </svg>
  );
}
