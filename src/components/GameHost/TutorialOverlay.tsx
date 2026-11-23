import { Play, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { audio } from '../../core/audio/AudioManager';
import type { TutorialStep } from '../../core/types/game';
import { Art } from '../shared/Art';
import { Mascot } from '../shared/Mascot';
import './Tutorial.css';

const HAND = 72;
const MIN_STEP_MS = 2600;

interface Geometry {
  index: number;
  rect: DOMRect | null;
  toRect: DOMRect | null;
}

const center = (r: DOMRect | null) =>
  r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

/** Fingertip of the 👆 artwork sits near the top centre of the image. */
const handAt = (p: { x: number; y: number }, scale = 1) => `translate(${p.x - HAND * 0.4}px, ${p.y - 4}px) scale(${scale})`;

/**
 * Show-how tutorial: dims the game, highlights one element per step and lets an
 * animated hand tap it or drag a copy of it to its destination, while a short
 * sentence is spoken. Tapping anywhere skips to the next step.
 */
export function TutorialOverlay({ steps, onDone }: { steps: TutorialStep[]; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [geom, setGeom] = useState<Geometry | null>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const ghostLayer = useRef<HTMLDivElement>(null);
  const step = steps[index];

  const indexRef = useRef(0);
  indexRef.current = index;
  const advance = useCallback(() => {
    if (indexRef.current >= steps.length - 1) setFinished(true);
    else setIndex(indexRef.current + 1);
  }, [steps.length]);

  // Measure the highlighted elements (skip steps whose element is not on screen).
  useLayoutEffect(() => {
    if (finished || !step) return;
    const measure = () => {
      const el = step.target ? document.querySelector(step.target) : null;
      if (step.target && !el) {
        advance();
        return;
      }
      const to = step.to ? document.querySelector(step.to) : null;
      setGeom({ index, rect: el?.getBoundingClientRect() ?? null, toRect: to?.getBoundingClientRect() ?? null });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [index, step, finished, advance]);

  // Animate the hand, speak the sentence, then move on.
  useEffect(() => {
    if (finished || !geom || geom.index !== index || !step) return;
    const hand = handRef.current;
    const anims: Animation[] = [];
    const a = center(geom.rect);
    if (hand && geom.rect && geom.toRect) {
      const b = center(geom.toRect);
      const offsets = [0, 0.12, 0.25, 0.7, 0.82, 1];
      anims.push(
        hand.animate(
          [
            { transform: handAt(a), opacity: 0, offset: offsets[0] },
            { transform: handAt(a), opacity: 1, offset: offsets[1] },
            { transform: handAt(a, 0.82), opacity: 1, offset: offsets[2] },
            { transform: handAt(b, 0.82), opacity: 1, offset: offsets[3] },
            { transform: handAt(b), opacity: 1, offset: offsets[4] },
            { transform: handAt(b), opacity: 0, offset: offsets[5] },
          ],
          { duration: 2600, iterations: Infinity, easing: 'ease-in-out' },
        ),
      );
      const source = step.target ? (document.querySelector(step.target) as HTMLElement | null) : null;
      if (source && ghostLayer.current) {
        const ghost = source.cloneNode(true) as HTMLElement;
        const r = geom.rect;
        Object.assign(ghost.style, {
          position: 'fixed',
          left: `${r.left}px`,
          top: `${r.top}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
          margin: '0',
          pointerEvents: 'none',
        });
        ghost.classList.add('tut__ghost');
        ghostLayer.current.replaceChildren(ghost);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        anims.push(
          ghost.animate(
            [
              { transform: 'translate(0, 0)', opacity: 0, offset: offsets[0] },
              { transform: 'translate(0, 0)', opacity: 0.95, offset: offsets[1] },
              { transform: 'translate(0, -6px) scale(1.05)', opacity: 0.95, offset: offsets[2] },
              { transform: `translate(${dx}px, ${dy}px) scale(1.05)`, opacity: 0.95, offset: offsets[3] },
              { transform: `translate(${dx}px, ${dy}px)`, opacity: 0.95, offset: offsets[4] },
              { transform: `translate(${dx}px, ${dy}px)`, opacity: 0, offset: offsets[5] },
            ],
            { duration: 2600, iterations: Infinity, easing: 'ease-in-out' },
          ),
        );
      }
    } else if (hand && geom.rect) {
      anims.push(
        hand.animate(
          [
            { transform: handAt(a), opacity: 0, offset: 0 },
            { transform: handAt(a), opacity: 1, offset: 0.15 },
            { transform: handAt(a, 0.8), opacity: 1, offset: 0.32 },
            { transform: handAt(a), opacity: 1, offset: 0.48 },
            { transform: handAt(a, 0.8), opacity: 1, offset: 0.66 },
            { transform: handAt(a), opacity: 1, offset: 0.85 },
            { transform: handAt(a), opacity: 0, offset: 1 },
          ],
          { duration: 2200, iterations: Infinity },
        ),
      );
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = performance.now();
    void audio.say({ text: step.say }).then(() => {
      if (cancelled) return;
      const rest = Math.max(0, MIN_STEP_MS - (performance.now() - started));
      timer = setTimeout(() => !cancelled && advance(), rest + 900);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      anims.forEach((x) => x.cancel());
      ghostLayer.current?.replaceChildren();
    };
  }, [geom, index, step, finished, advance]);

  useEffect(() => {
    if (finished) void audio.say({ text: 'Jetzt bist du dran!' });
  }, [finished]);

  const close = () => {
    audio.stopSpeech();
    onDone();
  };

  const rect = !finished && geom?.index === index ? geom.rect : null;
  const toRect = !finished && geom?.index === index ? geom.toRect : null;
  const pad = 10;
  // Keep the caption away from the highlighted element.
  const lowTarget = [rect, toRect].some((r) => r && r.top + r.height / 2 > window.innerHeight * 0.5);

  return createPortal(
    <div
      className={`tut ${rect ? '' : 'tut--dim'}`}
      role="dialog"
      aria-label="So geht's"
      onPointerDown={(e) => {
        if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('tut__spot')) return;
        audio.unlock(false);
        if (finished) close();
        else advance();
      }}
    >
      {rect && (
        <div
          className="tut__spot"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      )}
      {toRect && (
        <div
          className="tut__ring"
          style={{ left: toRect.left - pad, top: toRect.top - pad, width: toRect.width + pad * 2, height: toRect.height + pad * 2 }}
        />
      )}
      <div ref={ghostLayer} className="tut__ghosts" />
      {!finished && (
        <div ref={handRef} className="tut__hand" style={{ opacity: rect ? undefined : 0 }}>
          <Art name="ui.hand" size={HAND} />
        </div>
      )}

      <button type="button" className="btn btn--icon btn--big tut__skip" aria-label="Erklärung schließen" onClick={close}>
        <X size={36} strokeWidth={3} />
      </button>

      {finished ? (
        <div className="tut__done">
          <Mascot mood="cheer" size={130} />
          <button type="button" className="btn btn--huge btn--primary btn--pulse" aria-label="Los geht's" onClick={close}>
            <Play size={60} fill="currentColor" strokeWidth={3} />
          </button>
        </div>
      ) : (
        <div className={`tut__caption ${lowTarget ? 'tut__caption--top' : ''}`} aria-live="polite">
          <span className="tut__row">
            <Mascot size={52} />
            <span className="tut__text">{step?.say}</span>
          </span>
          <span className="tut__dots" aria-hidden>
            {steps.map((_, i) => (
              <span key={i} className={i === index ? 'on' : i < index ? 'done' : ''} />
            ))}
          </span>
        </div>
      )}
    </div>,
    document.body,
  );
}
