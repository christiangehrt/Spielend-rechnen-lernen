import { Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { jitter, useBotTimer } from '../../core/bots/bots';
import type { GameViewProps } from '../../core/types/game';
import { Art } from '../../components/shared/Art';
import { BOT_REACTION, countOf, FRUITS, fruitOf, isMatch, totalCards } from './engine';
import type { BfAction, BfPlayer, BfState } from './types';
import './BlitzFuenf.css';

const PIP_POS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
};

export function FruitCard({ card, size = 150 }: { card: number | null; size?: number }) {
  if (card === null) return <div className="bf-card bf-card--empty" style={{ width: size, height: size * 1.3 }} />;
  const n = countOf(card);
  const icon = Math.round(size * (n > 3 ? 0.3 : 0.36));
  return (
    <div className="bf-card" style={{ width: size, height: size * 1.3 }} aria-label={`${n} Früchte`}>
      {PIP_POS[n].map(([x, y], i) => (
        <span key={i} className="bf-card__fruit" style={{ left: `${x}%`, top: `${y}%` }}>
          <Art name={FRUITS[fruitOf(card)]} size={icon} />
        </span>
      ))}
    </div>
  );
}

const PAUSE_MS = 1600;

export function BlitzFuenfView({ state, dispatch, paused: tutorialOpen = false }: GameViewProps<BfState, BfAction>) {
  const split = state.players.every((p) => p.kind === 'human');
  const [paused, setPaused] = useState(false);
  const pending = useRef<{ player: number; t: number }[]>([]);
  const match = isMatch(state);
  const active = state.players[state.active];

  // Buzz resolution: collect presses for 40 ms and award the earliest timestamp (multi-touch fairness).
  const buzz = useCallback(
    (player: number, t: number) => {
      if (state.phase !== 'playing' || paused) return;
      pending.current.push({ player, t });
      if (pending.current.length > 1) return;
      setTimeout(() => {
        const first = [...pending.current].sort((a, b) => a.t - b.t)[0];
        pending.current = [];
        audio.play('bell');
        dispatch({ type: 'BUZZ', player: first.player });
      }, 40);
    },
    [dispatch, paused, state.phase],
  );

  // Feedback + short pause after every buzz.
  const seenBuzz = useRef(state.buzzCount);
  useEffect(() => {
    if (state.buzzCount === seenBuzz.current || !state.lastBuzz) return;
    seenBuzz.current = state.buzzCount;
    const who = state.players[state.lastBuzz.player];
    if (state.lastBuzz.correct) {
      audio.play('success');
      void audio.say({ text: who.kind === 'human' && !split ? 'Du warst am schnellsten!' : `${who.name} war am schnellsten!` });
    } else {
      void audio.say({ text: 'Falscher Alarm!' });
    }
    setPaused(true);
    const t = setTimeout(() => setPaused(false), PAUSE_MS);
    return () => clearTimeout(t);
  }, [state.buzzCount, state.lastBuzz, state.players, split]);

  // Bot flips its card.
  useBotTimer(!tutorialOpen && state.phase === 'playing' && !paused && active.kind === 'bot', () => {
    audio.play('flip');
    dispatch({ type: 'FLIP', player: state.active });
  }, [state.active, state.flips, state.buzzCount]);

  // Bot reacts to a five (may overlook it at the beginner level).
  const botIndex = state.players.findIndex((p) => p.kind === 'bot');
  const reaction = BOT_REACTION[state.botLevel];
  const [botMisses, setBotMisses] = useState(false);
  useEffect(() => setBotMisses(Math.random() < reaction.miss), [state.flips, reaction.miss]);
  useBotTimer(
    !tutorialOpen && state.phase === 'playing' && !paused && match && botIndex >= 0 && !botMisses,
    () => buzz(botIndex, performance.now()),
    [state.flips, state.buzzCount],
    jitter(reaction.min, reaction.max),
  );

  const flip = (player: number) => {
    if (state.phase !== 'playing' || paused || player !== state.active) return;
    audio.play('flip');
    dispatch({ type: 'FLIP', player });
  };

  const tops = state.players.map((p) => (p.open.length ? p.open[p.open.length - 1] : null));

  const banner = paused && state.lastBuzz && (
    <div className={`bf__banner ${state.lastBuzz.correct ? 'bf__banner--ok' : 'bf__banner--no'}`}>
      <Art name={state.players[state.lastBuzz.player].avatarId} size={44} />
      <Art name={state.lastBuzz.correct ? 'ui.check' : 'ui.cross'} size={44} />
    </div>
  );

  if (split) {
    return (
      <div className="bf bf--split">
        {[1, 0].map((pi) => (
          <Half
            key={pi}
            me={state.players[pi]}
            meIndex={pi}
            other={state.players[1 - pi]}
            tops={[tops[pi], tops[1 - pi]]}
            isActive={state.active === pi && !paused}
            rotated={pi === 1}
            onFlip={() => flip(pi)}
            onBuzz={(e) => buzz(pi, e.timeStamp)}
          />
        ))}
        {banner}
      </div>
    );
  }

  const human = 0;
  const bot = botIndex;
  return (
    <div className="bf">
      <Seat player={state.players[human]} active={state.active === human && !paused} onFlip={() => flip(human)} />
      <div className="bf__table">
        <div className="bf__cards">
          <FruitCard card={tops[human]} />
          <FruitCard card={tops[bot]} />
        </div>
        <button
          type="button"
          className="bf__buzzer"
          aria-label="Blitz-Knopf"
          onPointerDown={(e) => {
            audio.unlock(false);
            buzz(human, e.timeStamp);
          }}
        >
          <Zap size={84} strokeWidth={2.4} fill="currentColor" />
        </button>
      </div>
      <Seat player={state.players[bot]} active={state.active === bot && !paused} />
      {banner}
    </div>
  );
}

function Seat({ player, active, onFlip }: { player: BfPlayer; active: boolean; onFlip?: () => void }) {
  return (
    <div className={`bf__seat ${active ? 'bf__seat--active' : ''}`}>
      <Art name={player.avatarId} size={56} />
      <button
        type="button"
        className={`bf__stack ${active && onFlip ? 'bf__stack--go' : ''}`}
        aria-label={onFlip ? `Karte aufdecken, ${player.stack.length} übrig` : `${player.stack.length} Karten`}
        disabled={!onFlip}
        onClick={onFlip}
      >
        {player.stack.length}
      </button>
      <span className="bf__total">
        <Art name="ui.cards" size={22} /> {totalCards(player)}
      </span>
    </div>
  );
}

function Half({
  me,
  other,
  tops,
  isActive,
  rotated,
  onFlip,
  onBuzz,
}: {
  me: BfPlayer;
  meIndex: number;
  other: BfPlayer;
  tops: [number | null, number | null];
  isActive: boolean;
  rotated: boolean;
  onFlip: () => void;
  onBuzz: (e: ReactPointerEvent) => void;
}) {
  return (
    <div className={`bf-half ${rotated ? 'bf-half--rot' : ''}`}>
      <div className={`bf__seat ${isActive ? 'bf__seat--active' : ''}`}>
        <Art name={me.avatarId} size={44} />
        <button type="button" className={`bf__stack ${isActive ? 'bf__stack--go' : ''}`} aria-label={`${me.name}: Karte aufdecken`} onClick={onFlip}>
          {me.stack.length}
        </button>
        <span className="bf__total">
          <Art name="ui.cards" size={20} /> {totalCards(me)}
        </span>
      </div>
      <div className="bf__cards">
        <FruitCard card={tops[0]} size={104} />
        <FruitCard card={tops[1]} size={104} />
      </div>
      <button type="button" className="bf__buzzer bf__buzzer--half" aria-label={`${me.name}: Blitz-Knopf`} onPointerDown={onBuzz}>
        <Zap size={64} strokeWidth={2.4} fill="currentColor" />
      </button>
      <span className="sr-only">{other.name}</span>
    </div>
  );
}
