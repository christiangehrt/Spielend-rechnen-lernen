import { Lightbulb } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import type { SpeechPart } from '../../core/audio/phrases';
import { DotPattern } from '../../core/scaffolding/DotPattern';
import type { GameViewProps } from '../../core/types/game';
import { Art } from '../../components/shared/Art';
import { Button } from '../../components/shared/Button';
import { useShake } from '../../components/shared/useShake';
import { explainOverTen } from '../../core/explain';
import { collectedCount, hint, hiddenCount, isOver, selectedSum, TARGET } from './engine';
import type { VzAction, VzState } from './types';
import './VerliebteZahlen.css';

export function VerliebteZahlenView({ state, dispatch, settings }: GameViewProps<VzState, VzAction>) {
  const { shake, shakeClass } = useShake();
  const [hinted, setHinted] = useState<number[]>([]);
  /** Sum that went over ten – the extra dots are shown in red for a moment. */
  const [overflow, setOverflow] = useState<number | null>(null);
  const overflowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sum = selectedSum(state);
  const over = isOver(state);
  const lastBasketSize = useRef(state.basket.length);

  // React to magpie events
  const seenStolen = useRef(state.lastStolen);
  useEffect(() => {
    if (state.lastStolen === seenStolen.current) return;
    seenStolen.current = state.lastStolen;
    if (!state.lastStolen) return;
    if (state.lastStolen.length > 0) {
      audio.play('whoosh');
      void audio.say('magpie_steals');
    } else {
      void audio.say('magpie_flies');
    }
  }, [state.lastStolen]);

  useEffect(() => {
    if (state.basket.length > lastBasketSize.current) setHinted([]);
    lastBasketSize.current = state.basket.length;
  }, [state.basket.length]);

  useEffect(() => {
    if (over) void audio.say(collectedCount(state) === state.tiles.filter((t) => t.value !== 'magpie').length ? 'great' : 'well_done');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const onTile = (id: number) => {
    const tile = state.tiles[id];
    if (tile.state === 'hidden') {
      audio.play('flip');
      if (typeof tile.value === 'number') void audio.say(tile.value);
      dispatch({ type: 'FLIP', tileId: id });
      return;
    }
    if (tile.state !== 'open' || typeof tile.value !== 'number') return;
    const selected = state.selected.includes(id);
    if (!selected && sum + tile.value > TARGET) {
      const values = [...state.selected.map((sid) => state.tiles[sid].value as number), tile.value];
      shake(`tile-${id}`, ...explainOverTen(values));
      if (overflowTimer.current) clearTimeout(overflowTimer.current);
      setOverflow(sum + tile.value);
      overflowTimer.current = setTimeout(() => setOverflow(null), 1800);
      return;
    }
    if (!selected && sum + tile.value === TARGET) {
      const parts: SpeechPart[] = [];
      [...state.selected, id].forEach((sid, i) => {
        if (i > 0) parts.push('plus');
        parts.push(state.tiles[sid].value as number);
      });
      audio.play('whoosh');
      audio.play(state.selected.length >= 2 ? 'success' : 'plop');
      void audio.say(...parts, 'equals', TARGET);
    } else {
      audio.play('select');
      if (!selected) void audio.say(tile.value);
    }
    dispatch({ type: 'TOGGLE', tileId: id });
  };

  const showHint = () => {
    const h = hint(state);
    if (h) {
      setHinted(h);
      audio.play('plop');
    } else {
      shake('hint', 'flip_more');
    }
  };

  const style = { ['--cols' as string]: state.preset.cols, ['--rows' as string]: state.preset.rows };
  const numberTiles = state.tiles.filter((t) => t.value !== 'magpie').length;

  return (
    <div className="vz">
      <div className="vz__grid" style={style} role="grid" aria-label="Kärtchen">
        {state.tiles.map((t) => {
          const selected = state.selected.includes(t.id);
          const cls = [
            'vz-tile',
            `vz-tile--${t.state}`,
            selected && 'vz-tile--selected',
            hinted.includes(t.id) && t.state === 'open' && !selected && 'vz-tile--hint',
            state.lastStolen?.includes(t.id) && 'vz-tile--stolen-now',
            shakeClass(`tile-${t.id}`),
          ]
            .filter(Boolean)
            .join(' ');
          const gone = t.state === 'collected' || t.state === 'stolen' || t.state === 'gone';
          return (
            <button
              key={t.id}
              type="button"
              className={cls}
              disabled={gone}
              aria-label={t.state === 'hidden' ? 'Verdecktes Kärtchen' : gone ? 'Leer' : String(t.value)}
              aria-pressed={selected}
              onClick={() => onTile(t.id)}
            >
              {t.state === 'open' && typeof t.value === 'number' && (
                <>
                  <span className="vz-tile__num">{t.value}</span>
                  {settings.showDotPatterns && state.preset.cols <= 8 && <DotPattern value={t.value} size={50} className="vz-tile__dots" />}
                </>
              )}
              {t.state === 'hidden' && <span className="vz-tile__back">♥</span>}
              {t.state === 'gone' && state.lastStolen !== null && <Art name="ui.magpie" size={40} className="vz-tile__magpie" />}
            </button>
          );
        })}
      </div>

      <aside className="vz__panel">
        <div className={`vz__sum ${sum === 0 ? '' : 'vz__sum--active'}`} aria-label={`Summe ${sum} von ${TARGET}`}>
          <div className="vz__frame">
            {Array.from({ length: TARGET }, (_, i) => (
              <span key={i} className={`vz__dot ${i < (overflow ?? sum) ? (i < 5 ? 'vz__dot--a' : 'vz__dot--b') : ''}`} />
            ))}
          </div>
          {overflow !== null && (
            <div className="vz__over" aria-label={`${overflow - TARGET} zu viel`}>
              {Array.from({ length: overflow - TARGET }, (_, i) => (
                <span key={i} className="vz__dot vz__dot--over" />
              ))}
            </div>
          )}
          <div className="vz__eq">
            {state.selected.length === 0 ? (
              <span className="vz__q">?</span>
            ) : (
              state.selected.map((id, i) => (
                <span key={id}>
                  {i > 0 && <span className="vz__op">+</span>}
                  {state.tiles[id].value as number}
                </span>
              ))
            )}
            {state.selected.length > 0 && (
              <>
                <span className="vz__op">+</span>
                <span className="vz__q">?</span>
              </>
            )}
            <span className="vz__op">=</span>
            <span>{TARGET}</span>
          </div>
        </div>

        <div className="vz__basket" aria-label={`${collectedCount(state)} Kärtchen im Korb`}>
          <Art name="ui.basket" size={64} />
          <span>
            {collectedCount(state)}
            <small>/{numberTiles}</small>
          </span>
        </div>

        <div className="vz__info">
          <span className="vz__hidden" aria-label={`${hiddenCount(state)} verdeckt`}>
            <span className="vz-mini">♥</span> {hiddenCount(state)}
          </span>
          {state.preset.magpies > 0 && (
            <span className="vz__hidden">
              <Art name="ui.magpie" size={30} /> {state.tiles.filter((t) => t.value === 'magpie' && t.state === 'hidden').length}
            </span>
          )}
        </div>

        <Button label="Tipp" size="big" className={shakeClass('hint')} onClick={showHint}>
          <Lightbulb size={40} strokeWidth={2.6} />
        </Button>
      </aside>
    </div>
  );
}
