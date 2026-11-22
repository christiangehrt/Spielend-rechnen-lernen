import { Ruler } from 'lucide-react';
import { useState } from 'react';
import './scaffolding.css';

export interface LineMarker {
  value: number;
  /** Visual style of the marker. */
  tone: 'up' | 'down' | 'select' | 'gold' | 'neutral';
  label?: string;
}

interface Props {
  min: number;
  max: number;
  markers?: LineMarker[];
  /** Start collapsed/expanded. */
  defaultOpen?: boolean;
}

/** Collapsible mini number line (scaffolding). Ticks every 1, big ticks at 5 and 10. */
export function MiniNumberLine({ min, max, markers = [], defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const span = max - min;
  const step = span > 40 ? 10 : 1;
  const ticks: number[] = [];
  for (let v = min; v <= max; v += step) ticks.push(v);
  const pos = (v: number) => `${((v - min) / span) * 100}%`;
  return (
    <div className={`mnl ${open ? 'mnl--open' : ''}`}>
      <button
        type="button"
        className="mnl__toggle"
        aria-label="Zahlenstrahl"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Ruler size={28} />
      </button>
      {open && (
        <div className="mnl__track" aria-hidden="true">
          <div className="mnl__axis" />
          {ticks.map((v) => {
            const big = v % 10 === 0;
            const mid = !big && v % 5 === 0;
            const showLabel = span <= 30 || big;
            return (
              <div key={v} className="mnl__tick-wrap" style={{ left: pos(v) }}>
                <div className={`mnl__tick ${big ? 'mnl__tick--ten' : mid ? 'mnl__tick--five' : ''}`} />
                {showLabel && <div className={`mnl__num ${big || mid ? 'mnl__num--strong' : ''}`}>{v}</div>}
              </div>
            );
          })}
          {markers
            .filter((m) => m.value >= min && m.value <= max)
            .map((m, i) => (
              <div key={`${m.value}-${i}`} className={`mnl__marker mnl__marker--${m.tone}`} style={{ left: pos(m.value) }}>
                {m.label ?? ''}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
