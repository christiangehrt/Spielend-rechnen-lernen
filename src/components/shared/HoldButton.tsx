import { Lock } from 'lucide-react';
import { useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';

interface Props {
  onUnlock: () => void;
  durationMs?: number;
  label: string;
}

/** Parent gate: must be held for 3 seconds. Releasing early resets the ring. */
export function HoldButton({ onUnlock, durationMs = 3000, label }: Props) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);

  const stop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setProgress(0);
  };

  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / durationMs);
    setProgress(p);
    if (p >= 1) {
      raf.current = null;
      setProgress(0);
      onUnlock();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <button
      type="button"
      className="hold-btn"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        audio.unlock(false);
        start.current = performance.now();
        raf.current = requestAnimationFrame(tick);
      }}
      onPointerUp={() => {
        if (progress > 0 && progress < 0.3) void audio.say('hold_parent');
        stop();
      }}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden>
        <circle cx="30" cy="30" r={r} fill="#fff" stroke="#e3dccd" strokeWidth="5" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="#2f6fde"
          strokeWidth="5"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
      </svg>
      <Lock size={22} className="hold-btn__icon" />
    </button>
  );
}
