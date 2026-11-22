import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface Options<T> {
  /** Called when a drag ends over a target (snap zone included). */
  onDrop: (item: T, targetId: string) => void;
  /** Called for a short press without movement (tap-to-select). */
  onTap?: (item: T) => void;
  /** Called once when the pointer starts dragging an item. */
  onDragStart?: (item: T) => void;
  /** Extra pixels around each target that still count as a hit (generous snap zones). */
  snap?: number;
}

interface DragState<T> {
  item: T;
  x: number;
  y: number;
  over: string | null;
}

const DRAG_THRESHOLD = 10;

/**
 * Pointer-based drag & drop that works for touch, pen and mouse. Supports
 * both drag-to-place and tap-to-select (the tap is reported via onTap).
 */
export function useDragDrop<T>({ onDrop, onTap, onDragStart, snap = 40 }: Options<T>) {
  const targets = useRef(new Map<string, HTMLElement>());
  const [drag, setDrag] = useState<DragState<T> | null>(null);
  const opts = useRef({ onDrop, onTap, onDragStart, snap });
  opts.current = { onDrop, onTap, onDragStart, snap };
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanup.current?.(), []);

  const hitTest = (x: number, y: number): string | null => {
    let best: { id: string; dist: number } | null = null;
    for (const [id, el] of targets.current) {
      const r = el.getBoundingClientRect();
      const s = opts.current.snap;
      if (x >= r.left - s && x <= r.right + s && y >= r.top - s && y <= r.bottom + s) {
        const dist = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (!best || dist < best.dist) best = { id, dist };
      }
    }
    return best?.id ?? null;
  };

  const start = useCallback((e: ReactPointerEvent, item: T) => {
    if (e.button !== undefined && e.button > 0) return;
    cleanup.current?.();
    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;
    let dragging = false;

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      if (!dragging && Math.hypot(ev.clientX - startX, ev.clientY - startY) > DRAG_THRESHOLD) {
        dragging = true;
        opts.current.onDragStart?.(item);
      }
      if (dragging) {
        ev.preventDefault();
        setDrag({ item, x: ev.clientX, y: ev.clientY, over: hitTest(ev.clientX, ev.clientY) });
      }
    };
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      finish();
      if (dragging) {
        const target = ev.type === 'pointercancel' ? null : hitTest(ev.clientX, ev.clientY);
        if (target) opts.current.onDrop(item, target);
      } else if (ev.type === 'pointerup') {
        opts.current.onTap?.(item);
      }
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      cleanup.current = null;
      setDrag(null);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    cleanup.current = finish;
  }, []);

  const target = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) targets.current.set(id, el);
      else targets.current.delete(id);
    },
    [],
  );

  return { start, target, drag };
}
