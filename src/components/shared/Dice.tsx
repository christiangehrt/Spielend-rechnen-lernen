const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

/** Classic die face with pips (no numerals – encourages subitising). */
export function Dice({ value, size = 90, rolling = false }: { value: number; size?: number; rolling?: boolean }) {
  return (
    <svg
      className={`dice ${rolling ? 'dice--rolling' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Würfel ${value}`}
    >
      <rect x="4" y="4" width="92" height="92" rx="20" fill="#fff" stroke="#2b2d42" strokeWidth="5" />
      {(PIPS[value] ?? []).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill="#2b2d42" />
      ))}
    </svg>
  );
}
