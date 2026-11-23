import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { useBotTimer } from '../../core/bots/bots';
import type { GameViewProps } from '../../core/types/game';
import { Art } from '../../components/shared/Art';
import { NumberCard } from '../../components/shared/NumberCard';
import { PassAndPlayOverlay } from '../../components/shared/PassAndPlayOverlay';
import { cardPoints, playerPoints, ROW_LIMIT, targetRow } from './engine';
import type { RrAction, RrState } from './types';
import './RaupenReihen.css';

export function RaupenReihenView({ state, dispatch, settings, paused = false }: GameViewProps<RrState, RrAction>) {
  const [picked, setPicked] = useState<number | null>(null);
  const chooser = state.players[state.chooserIndex];
  const current = state.queue[0];
  const profi = state.preset.scoring === 'original';
  const firstStep = useRef(true);

  useEffect(() => setPicked(null), [state.turn, state.chooserIndex]);

  // Reveal step by step (first step waits a bit longer so everyone sees all cards).
  useBotTimer(
    !paused && state.phase === 'reveal' && state.queue.length > 0,
    () => {
      firstStep.current = false;
      dispatch({ type: 'STEP' });
    },
    [state.queue.length, state.turn],
    state.queue.length === state.revealed.length ? 1800 : 1200,
  );

  // Sounds/speech for each placement.
  const lastMoveRef = useRef(state.lastMove);
  useEffect(() => {
    if (!state.lastMove || state.lastMove === lastMoveRef.current) return;
    lastMoveRef.current = state.lastMove;
    audio.play('card');
    if (state.lastMove.took.length > 0) {
      audio.play('whoosh');
      const who = state.players[state.lastMove.player];
      void audio.say({ text: who.kind === 'human' && state.lastMove.player === 0 ? 'Du nimmst die Raupe.' : `${who.name} nimmt die Raupe.` });
    }
  }, [state.lastMove, state.players]);

  useEffect(() => {
    if (state.phase === 'pickRow') void audio.say({ text: 'Deine Karte ist kleiner als alle. Tippe auf eine Raupe, die du nimmst.' });
  }, [state.phase]);

  const choose = () => {
    if (picked === null) return;
    audio.play('card');
    dispatch({ type: 'CHOOSE', card: picked });
  };

  const highlightRow = state.phase === 'reveal' && current ? targetRow(state.rows, current.card) : -1;

  return (
    <div className="rrw">
      <aside className="rrw__players">
        {state.players.map((p, i) => {
          const isCurrent = current?.player === i && state.phase !== 'choose';
          const waiting = state.phase === 'choose' && p.kind === 'human' && p.chosen === null;
          return (
            <div key={p.id} className={`rrw__player ${isCurrent ? 'rrw__player--now' : ''}`}>
              <Art name={p.avatarId} size={48} />
              <span className="rrw__pts" aria-label={`${playerPoints(state, i)} Punkte`}>
                <Art name="game.raupen-reihen" size={24} />
                {playerPoints(state, i)}
              </span>
              {state.phase === 'choose' && (p.kind === 'bot' || p.chosen !== null) && <span className="rrw__ready">✓</span>}
              {waiting && i === state.chooserIndex && <span className="rrw__ready rrw__ready--wait">…</span>}
            </div>
          );
        })}
      </aside>

      <main className="rrw__board">
        {state.phase !== 'choose' && state.revealed.length > 0 && (
          <div className="rrw__revealed">
            {state.revealed.map((r) => {
              const placed = !state.queue.some((q) => q.card === r.card);
              return (
                <div key={r.card} className={`rrw__rev ${placed ? 'rrw__rev--placed' : ''} ${current?.card === r.card ? 'rrw__rev--now' : ''}`}>
                  <Art name={state.players[r.player].avatarId} size={30} />
                  <NumberCard as="div" value={r.card} size="sm" showDots={false} />
                </div>
              );
            })}
          </div>
        )}

        <div className="rrw__rows">
          {state.rows.map((row, ri) => {
            const pickable = state.phase === 'pickRow' && state.players[current?.player ?? 0]?.kind === 'human';
            return (
              <button
                key={ri}
                type="button"
                className={`rrw-row ${highlightRow === ri ? 'rrw-row--target' : ''} ${pickable ? 'rrw-row--pick' : ''} ${
                  state.lastMove?.row === ri && state.lastMove.took.length > 0 ? 'rrw-row--taken' : ''
                }`}
                aria-label={`Raupe ${ri + 1}: ${row.join(', ')}`}
                disabled={!pickable}
                onClick={() => {
                  audio.play('whoosh');
                  dispatch({ type: 'PICK_ROW', row: ri });
                }}
              >
                <span className="rrw-row__head">
                  <Art name="game.raupen-reihen" size={54} />
                </span>
                {row.map((c) => (
                  <span key={c} className="rrw-seg">
                    <NumberCard as="div" value={c} size="sm" showDots={settings.showDotPatterns && c <= 20} />
                    {profi && cardPoints(c, 'original') > 1 && <span className="rrw-seg__pts">{cardPoints(c, 'original')}</span>}
                  </span>
                ))}
                {Array.from({ length: ROW_LIMIT - row.length }, (_, k) => (
                  <span key={`e${k}`} className="rrw-seg rrw-seg--empty" />
                ))}
                <span className="rrw-seg rrw-seg--danger" aria-hidden>
                  6
                </span>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="rrw__hand">
        {state.phase === 'choose' && chooser?.kind === 'human' && !state.handoff ? (
          <>
            <Art name={chooser.avatarId} size={48} />
            <div className="rrw__cards">
              {chooser.hand.map((c) => (
                <NumberCard
                  key={c}
                  value={c}
                  size="md"
                  showDots={settings.showDotPatterns && c <= 20}
                  selected={picked === c}
                  label={`Karte ${c}`}
                  onClick={() => {
                    audio.play('select');
                    void audio.say(c);
                    setPicked((p) => (p === c ? null : c));
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className={`btn btn--huge ${picked !== null ? 'btn--primary btn--pulse' : 'rrw__ok--off'}`}
              aria-label="Karte legen"
              onClick={choose}
            >
              <Check size={56} strokeWidth={3.4} />
            </button>
          </>
        ) : (
          <div className="rrw__cards rrw__cards--waiting">
            {(state.players[0]?.hand ?? []).map((c) => (
              <NumberCard key={c} as="div" value={c} size="sm" showDots={false} dimmed />
            ))}
          </div>
        )}
      </footer>

      {state.phase === 'choose' && state.handoff && chooser && (
        <PassAndPlayOverlay playerName={chooser.name} playerArt={chooser.avatarId} onReady={() => dispatch({ type: 'HANDOFF_DONE' })} />
      )}
    </div>
  );
}
