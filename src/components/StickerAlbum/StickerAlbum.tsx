import { Home, Minus, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { assetUrl, useAssets } from '../../core/assets/manifests';
import { navigate } from '../../core/router';
import { newId } from '../../core/storage/appData';
import { updateProfile, useActiveProfile } from '../../core/storage/appStore';
import type { PlacedSticker } from '../../core/types/rewards';
import { Art } from '../shared/Art';
import { Button } from '../shared/Button';
import './StickerAlbum.css';

const BASE_SIZE = 12; // sticker width in % of the scene width at scale 1
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.6;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Gesture =
  | { kind: 'new'; stickerId: string; pointerId: number; startX: number; startY: number; moved: boolean }
  | { kind: 'move'; instanceId: string; pointerId: number; startX: number; startY: number; moved: boolean; offX: number; offY: number }
  | { kind: 'pinch'; instanceId: string; startDist: number; startScale: number };

export function StickerAlbum() {
  const profile = useActiveProfile()!;
  const { themes, stickers } = useAssets();
  const [sceneId, setSceneId] = useState(themes[0]?.id ?? 'jungle');
  const [selected, setSelected] = useState<string | null>(null); // placed instance
  const [armed, setArmed] = useState<string | null>(null); // tray sticker for tap-to-place
  const [ghost, setGhost] = useState<{ stickerId: string; x: number; y: number } | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const theme = themes.find((t) => t.id === sceneId) ?? themes[0];
  const placed = profile.placedStickers.filter((p) => p.sceneId === sceneId);
  const unlocked = stickers.filter((s) => profile.unlockedStickerIds.includes(s.id));
  const srcOf = (id: string) => stickers.find((s) => s.id === id)?.src;

  const save = (fn: (list: PlacedSticker[]) => PlacedSticker[]) =>
    updateProfile(profile.id, (p) => ({ ...p, placedStickers: fn(p.placedStickers) }));

  const toScene = (x: number, y: number) => {
    const r = sceneRef.current!.getBoundingClientRect();
    return { x: ((x - r.left) / r.width) * 100, y: ((y - r.top) / r.height) * 100, inside: x >= r.left && x <= r.right && y >= r.top && y <= r.bottom };
  };

  const place = (stickerId: string, x: number, y: number) => {
    const pos = toScene(x, y);
    if (!pos.inside) return;
    const instance: PlacedSticker = {
      instanceId: newId(),
      stickerId,
      sceneId,
      xPercent: clamp(pos.x, 0, 100),
      yPercent: clamp(pos.y, 0, 100),
      scale: 1,
    };
    save((list) => [...list, instance]);
    setSelected(instance.instanceId);
    audio.play('plop');
  };

  // ----- tray: drag a sticker up into the scene, or tap to arm it -----
  const onTrayDown = (e: ReactPointerEvent, stickerId: string) => {
    audio.unlock(false);
    gesture.current = { kind: 'new', stickerId, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false };
    const move = (ev: PointerEvent) => {
      const g = gesture.current;
      if (!g || g.kind !== 'new' || ev.pointerId !== g.pointerId) return;
      if (!g.moved && Math.hypot(ev.clientX - g.startX, ev.clientY - g.startY) > 10) g.moved = true;
      if (g.moved) setGhost({ stickerId, x: ev.clientX, y: ev.clientY });
    };
    const up = (ev: PointerEvent) => {
      const g = gesture.current;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      setGhost(null);
      gesture.current = null;
      if (!g || g.kind !== 'new' || ev.type === 'pointercancel') return;
      if (g.moved) place(stickerId, ev.clientX, ev.clientY);
      else {
        audio.play('select');
        setArmed((a) => (a === stickerId ? null : stickerId));
        setSelected(null);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  // ----- scene: move, pinch, tap-to-place -----
  const onStickerDown = (e: ReactPointerEvent, sticker: PlacedSticker) => {
    e.stopPropagation();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    sceneRef.current?.setPointerCapture?.(e.pointerId);
    if (pointers.current.size === 2 && selected === sticker.instanceId) return startPinch(sticker);
    const pos = toScene(e.clientX, e.clientY);
    gesture.current = {
      kind: 'move',
      instanceId: sticker.instanceId,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      offX: pos.x - sticker.xPercent,
      offY: pos.y - sticker.yPercent,
    };
  };

  const startPinch = (sticker: PlacedSticker) => {
    const [a, b] = [...pointers.current.values()];
    gesture.current = { kind: 'pinch', instanceId: sticker.instanceId, startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1, startScale: sticker.scale };
  };

  const onSceneDown = (e: ReactPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const sel = placed.find((p) => p.instanceId === selected);
    if (pointers.current.size === 2 && sel) {
      startPinch(sel);
      return;
    }
    if (armed) {
      place(armed, e.clientX, e.clientY);
      setArmed(null);
      return;
    }
    setSelected(null);
  };

  const onSceneMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const scale = clamp((g.startScale * Math.hypot(a.x - b.x, a.y - b.y)) / g.startDist, MIN_SCALE, MAX_SCALE);
      save((list) => list.map((p) => (p.instanceId === g.instanceId ? { ...p, scale } : p)));
    } else if (g.kind === 'move' && e.pointerId === g.pointerId) {
      if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 6) g.moved = true;
      if (!g.moved) return;
      const pos = toScene(e.clientX, e.clientY);
      save((list) =>
        list.map((p) =>
          p.instanceId === g.instanceId ? { ...p, xPercent: clamp(pos.x - g.offX, 0, 100), yPercent: clamp(pos.y - g.offY, 0, 100) } : p,
        ),
      );
    }
  };

  const onSceneUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (g?.kind === 'move' && e.pointerId === g.pointerId) {
      if (!g.moved) {
        audio.play('select');
        setSelected((s) => (s === g.instanceId ? null : g.instanceId));
      } else setSelected(g.instanceId);
      gesture.current = null;
    } else if (g?.kind === 'pinch' && pointers.current.size < 2) {
      gesture.current = null;
    }
  };

  const changeScale = (factor: number) => {
    if (!selected) return;
    save((list) => list.map((p) => (p.instanceId === selected ? { ...p, scale: clamp(p.scale * factor, MIN_SCALE, MAX_SCALE) } : p)));
  };

  const remove = () => {
    if (!selected) return;
    save((list) => list.filter((p) => p.instanceId !== selected));
    setSelected(null);
    audio.play('whoosh');
  };

  return (
    <div className="screen album">
      <header className="topbar">
        <Button label="Zur Startseite" icon size="big" onClick={() => navigate({ name: 'hub' })}>
          <Home size={36} strokeWidth={2.6} />
        </Button>
        <div className="album__count">
          <Art name="ui.album" size={40} /> {unlocked.length}/{stickers.length}
        </div>
        <div className="topbar__spacer" />
        <nav className="album__tabs" aria-label="Szenen">
          {themes.map((t) => (
            <Button
              key={t.id}
              label={t.name}
              speak
              selected={t.id === sceneId}
              icon
              size="big"
              className="album__tab"
              style={{ ['--tab-color' as string]: t.color }}
              onClick={() => {
                setSceneId(t.id);
                setSelected(null);
              }}
            >
              <Art name={t.art} size={44} />
            </Button>
          ))}
        </nav>
      </header>

      <main className="album__stage">
        <div
          ref={sceneRef}
          className={`album__scene play-surface ${armed ? 'album__scene--armed' : ''}`}
          style={{ backgroundImage: theme ? `url(${assetUrl(theme.src)})` : undefined }}
          onPointerDown={onSceneDown}
          onPointerMove={onSceneMove}
          onPointerUp={onSceneUp}
          onPointerCancel={onSceneUp}
        >
          {placed.map((p) => {
            const src = srcOf(p.stickerId);
            if (!src) return null;
            return (
              <img
                key={p.instanceId}
                src={assetUrl(src)}
                alt=""
                draggable={false}
                className={`album__placed ${selected === p.instanceId ? 'album__placed--on' : ''}`}
                style={{ left: `${p.xPercent}%`, top: `${p.yPercent}%`, width: `${BASE_SIZE * p.scale}%` }}
                onPointerDown={(e) => onStickerDown(e, p)}
              />
            );
          })}
          {selected && (
            <div className="album__tools" onPointerDown={(e) => e.stopPropagation()}>
              <Button label="Kleiner" icon onClick={() => changeScale(0.8)}>
                <Minus size={30} strokeWidth={3} />
              </Button>
              <Button label="Größer" icon onClick={() => changeScale(1.25)}>
                <Plus size={30} strokeWidth={3} />
              </Button>
              <Button label="Entfernen" icon variant="orange" onClick={remove}>
                <Trash2 size={28} strokeWidth={2.6} />
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="album__tray" aria-label="Deine Sticker">
        {unlocked.length === 0 && (
          <div className="album__empty">
            <Art name="ui.gift" size={48} />
            <Art name="ui.star" size={36} />
            <Art name="ui.star" size={36} />
            <Art name="ui.star" size={36} />
            <Art name="ui.star" size={36} />
            <Art name="ui.star" size={36} />
          </div>
        )}
        {unlocked.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`album__item ${armed === s.id ? 'album__item--armed' : ''}`}
            aria-label="Sticker"
            onPointerDown={(e) => onTrayDown(e, s.id)}
          >
            <img src={assetUrl(s.src)} alt="" draggable={false} />
          </button>
        ))}
      </footer>

      {ghost && (
        <img className="album__ghost" src={assetUrl(srcOf(ghost.stickerId) ?? '')} alt="" style={{ left: ghost.x, top: ghost.y }} />
      )}
    </div>
  );
}
