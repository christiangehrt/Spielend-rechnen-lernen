import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { useBotTimer } from '../../core/bots/bots';
import type { GameViewProps } from '../../core/types/game';
import { Art } from '../../components/shared/Art';
import { PassAndPlayOverlay } from '../../components/shared/PassAndPlayOverlay';
import { useShake } from '../../components/shared/useShake';
import { explainNeighbour } from '../../core/explain';
import { canDraw, canEndTurn, canPlay, colorOf, MAX_DRAWS, START, validCards, valueOf } from './engine';
import type { NrAction, NrState } from './types';
import './NachbarReihe.css';

export const COLORS = [
  { name: 'rot', bg: '#ef476f', dark: '#b8284d', symbol: '♥' },
  { name: 'blau', bg: '#2f6fde', dark: '#1f4fa8', symbol: '●' },
  { name: 'grün', bg: '#2fa84f', dark: '#1f7a37', symbol: '♣' },
  { name: 'gelb', bg: '#f4b400', dark: '#b88700', symbol: '★' },
];

function ColorCard({ card, small = false, selected = false, onClick, label }: { card: number; small?: boolean; selected?: boolean; onClick?: () => void; label?: string }) {
  const c = COLORS[colorOf(card)];
  const style = { ['--cc' as string]: c.bg, ['--cc-dark' as string]: c.dark };
  const content = (
    <>
      <span className="nr-card__val">{valueOf(card)}</span>
      <span className="nr-card__sym">{c.symbol}</span>
    </>
  );
  if (!onClick) return <span className={`nr-card ${small ? 'nr-card--small' : ''}`} style={style}>{content}</span>;
  return (
    <button type="button" className={`nr-card nr-card--hand ${selected ? 'nr-card--selected' : ''}`} style={style} aria-label={label} onClick={onClick}>
      {content}
    </button>
  );
}

export function NachbarReiheView({ state, dispatch, paused = false }: GameViewProps<NrState, NrAction>) {
  const { shake, shakeClass } = useShake();
  const [selected, setSelected] = useState<number | null>(null);
  const me = state.players[state.active];
  const humanTurn = me.kind === 'human' && !state.handoff && state.phase === 'playing';
  const valid = validCards(state);
  const values = Array.from({ length: state.preset.maxNum }, (_, i) => i + 1);

  useEffect(() => setSelected(null), [state.active]);

  useBotTimer(!paused && me.kind === 'bot' && state.phase === 'playing', () => dispatch({ type: 'BOT_STEP' }), [
    state.active,
    state.playedThisTurn,
    state.drawsThisTurn,
  ]);

  const lastPlayed = useRef(state.lastPlayed);
  useEffect(() => {
    if (state.lastPlayed === null || state.lastPlayed === lastPlayed.current) return;
    lastPlayed.current = state.lastPlayed;
    audio.play('card');
    void audio.say(valueOf(state.lastPlayed));
  }, [state.lastPlayed]);

  const play = (card: number) => {
    if (!humanTurn) return;
    if (!canPlay(state, card)) {
      const row = state.rows[colorOf(card)];
      shake(`card-${card}`, ...explainNeighbour(valueOf(card), row, state.preset.maxNum));
      setSelected(null);
      return;
    }
    if (selected !== card) {
      audio.play('select');
      void audio.say(valueOf(card));
      setSelected(card);
      return;
    }
    dispatch({ type: 'PLAY', card });
    setSelected(null);
  };

  const onSlot = (color: number, value: number) => {
    if (selected !== null && colorOf(selected) === color && canPlay(state, selected) && valueOf(selected) === value) {
      dispatch({ type: 'PLAY', card: selected });
      setSelected(null);
    }
  };

  const onDraw = () => {
    if (!humanTurn) return;
    if (!canDraw(state)) {
      shake('deck', valid.length > 0 ? { text: 'Du kannst eine Karte legen!' } : { text: 'Du kannst nicht mehr ziehen.' });
      return;
    }
    audio.play('card');
    dispatch({ type: 'DRAW' });
  };

  const onEnd = () => {
    if (!humanTurn) return;
    if (!canEndTurn(state)) {
      shake('end', valid.length > 0 ? { text: 'Lege zuerst eine Karte.' } : { text: 'Ziehe eine Karte.' });
      return;
    }
    audio.play('select');
    dispatch({ type: 'END_TURN' });
  };

  const selectedTarget = selected !== null && canPlay(state, selected) ? selected : null;
  const human = state.players.find((p) => p.kind === 'human') ?? state.players[0];
  const handOwner = me.kind === 'human' ? me : human;

  return (
    <div className="nr">
      <aside className="nr__players">
        {state.players.map((p, i) => (
          <div key={p.id} className={`nr__player ${i === state.active ? 'nr__player--now' : ''}`}>
            <Art name={p.avatarId} size={44} />
            <span className="nr__count">
              <Art name="ui.cards" size={22} /> {p.hand.length}
            </span>
          </div>
        ))}
        <button
          type="button"
          className={`nr__deck ${humanTurn && canDraw(state) ? 'nr__deck--active' : ''} ${shakeClass('deck')}`}
          aria-label={`Karte ziehen, ${state.deck.length} im Stapel`}
          onClick={onDraw}
        >
          <span>{state.deck.length}</span>
          {humanTurn && state.drawsThisTurn > 0 && (
            <span className="nr__draws">
              {state.drawsThisTurn}/{MAX_DRAWS}
            </span>
          )}
        </button>
      </aside>

      <main className="nr__board">
        {state.rows.map((row, color) => (
          <div key={color} className="nr-row" style={{ ['--cc' as string]: COLORS[color].bg }}>
            {values.map((v) => {
              const placed = row && v >= row.min && v <= row.max;
              const isNext = row ? v === row.min - 1 || v === row.max + 1 : v === START;
              const isTarget = selectedTarget !== null && colorOf(selectedTarget) === color && valueOf(selectedTarget) === v;
              return (
                <button
                  key={v}
                  type="button"
                  className={`nr-slot ${placed ? 'nr-slot--filled' : ''} ${isNext && !placed ? 'nr-slot--next' : ''} ${isTarget ? 'nr-slot--target' : ''} ${
                    v === START ? 'nr-slot--eleven' : ''
                  }`}
                  aria-label={placed ? `${COLORS[color].name} ${v}` : isNext ? `Freies Feld ${v}` : ''}
                  tabIndex={isTarget ? 0 : -1}
                  onClick={() => onSlot(color, v)}
                >
                  {placed ? <ColorCard card={color * 100 + v} small /> : isNext ? <span className="nr-slot__q">{v === START && !row ? '11' : '?'}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </main>

      <footer className="nr__hand">
        <Art name={handOwner.avatarId} size={44} />
        <div className="nr__cards">
          {handOwner.hand.map((c) => (
            <span key={c} className={shakeClass(`card-${c}`)}>
              <ColorCard
                card={c}
                selected={selected === c}
                label={`${COLORS[colorOf(c)].name} ${valueOf(c)}`}
                onClick={() => play(c)}
              />
            </span>
          ))}
        </div>
        <button
          type="button"
          className={`btn btn--huge ${humanTurn && canEndTurn(state) ? 'btn--primary btn--pulse' : 'nr__end--off'} ${shakeClass('end')}`}
          aria-label="Zug beenden"
          onClick={onEnd}
        >
          <Check size={56} strokeWidth={3.4} />
        </button>
      </footer>

      {state.handoff && (
        <PassAndPlayOverlay playerName={me.name} playerArt={me.avatarId} onReady={() => dispatch({ type: 'HANDOFF_DONE' })} />
      )}
    </div>
  );
}
