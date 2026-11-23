import { Check, Lightbulb } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import type { SpeechPart } from '../../core/audio/phrases';
import { DotPattern } from '../../core/scaffolding/DotPattern';
import type { GameViewProps } from '../../core/types/game';
import { Art } from '../../components/shared/Art';
import { Button } from '../../components/shared/Button';
import { Dice } from '../../components/shared/Dice';
import { useShake } from '../../components/shared/useShake';
import { canUseOneDie, hint, mustUseOneDie, penalty, selectedSum, target } from './engine';
import type { KlappenAction, KlappenState } from './types';
import './KlappenZu.css';

const FLAP_COLORS = ['#ef476f', '#ff8c1a', '#f4b400', '#2fa84f', '#2f6fde', '#7b5cd6'];

export function KlappenZuView({ state, dispatch, settings }: GameViewProps<KlappenState, KlappenAction>) {
  const { shake, shakeClass } = useShake();
  const [rolling, setRolling] = useState(false);
  const [hinted, setHinted] = useState<number[]>([]);
  const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goal = target(state);
  const partial = selectedSum(state);
  const complete = state.phase === 'select' && partial === goal;
  const flaps = Array.from({ length: state.preset.maxFlap }, (_, i) => i + 1);

  useEffect(() => () => {
    if (rollTimer.current) clearTimeout(rollTimer.current);
  }, []);

  useEffect(() => {
    if (state.phase === 'over' && !rolling) {
      if (state.open.length === 0) {
        audio.play('fanfare');
        void audio.say('all_shut');
      } else {
        void audio.say('no_more_moves', penalty(state), 'points');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, rolling]);

  const roll = (count: 1 | 2) => {
    if (rolling || state.phase !== 'roll') return;
    audio.play('dice');
    setHinted([]);
    setRolling(true);
    dispatch({ type: 'ROLL', diceCount: count });
    rollTimer.current = setTimeout(() => setRolling(false), 650);
  };

  // Speak the dice sum once the roll animation is done.
  const spokenRoll = useRef<number>(-1);
  useEffect(() => {
    if (rolling || !state.dice || state.phase !== 'select' || spokenRoll.current === state.stats.rolls) return;
    spokenRoll.current = state.stats.rolls;
    const parts: SpeechPart[] = [];
    state.dice.forEach((d, i) => {
      if (i > 0) parts.push('plus');
      parts.push(d);
    });
    if (state.dice.length > 1) parts.push('equals', goal);
    void audio.say(...parts);
  }, [rolling, state.dice, state.phase, state.stats.rolls, goal]);

  const toggle = (value: number) => {
    if (state.phase !== 'select' || rolling || !state.open.includes(value)) return;
    if (!state.selected.includes(value) && partial + value > goal) {
      shake(`flap-${value}`, 'too_much');
      return;
    }
    audio.play('select');
    const next = state.selected.includes(value) ? state.selected.filter((v) => v !== value) : [...state.selected, value];
    const nextSum = next.reduce((a, b) => a + b, 0);
    if (nextSum === goal && next.length > 1) {
      const parts: SpeechPart[] = [];
      next.forEach((v, i) => {
        if (i > 0) parts.push('plus');
        parts.push(v);
      });
      void audio.say(...parts, 'equals', goal);
    } else if (!state.selected.includes(value)) void audio.say(value);
    dispatch({ type: 'TOGGLE', value });
  };

  const confirm = () => {
    if (!complete) {
      shake('sum', 'missing', goal - partial);
      return;
    }
    audio.play('click');
    setTimeout(() => audio.play('click'), 120);
    if (state.selected.length >= 3) audio.play('success');
    setHinted([]);
    dispatch({ type: 'CONFIRM' });
  };

  const showHint = () => {
    const h = hint(state);
    if (h) {
      setHinted(h);
      audio.play('plop');
    }
  };

  const oneDie = canUseOneDie(state);
  const onlyOne = mustUseOneDie(state);

  return (
    <div className="kz">
      <div className="kz__box" role="group" aria-label="Klappen">
        {flaps.map((v) => {
          const open = state.open.includes(v);
          const selected = state.selected.includes(v);
          const justClosed = state.lastClosed.includes(v);
          const cls = [
            'kz-flap',
            open ? 'kz-flap--open' : 'kz-flap--closed',
            selected && 'kz-flap--selected',
            justClosed && 'kz-flap--just',
            hinted.includes(v) && !selected && 'kz-flap--hint',
            shakeClass(`flap-${v}`),
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={v}
              type="button"
              className={cls}
              aria-label={open ? `Klappe ${v}` : `Klappe ${v} ist zu`}
              aria-pressed={selected}
              disabled={!open}
              onClick={() => toggle(v)}
            >
              <span className="kz-flap__num">{v}</span>
              {settings.showDotPatterns && open && <DotPattern value={v} size={52} stack className="kz-flap__dots" />}
            </button>
          );
        })}
      </div>

      <div className="kz__middle">
        <div className="kz__dice" aria-live="polite">
          {state.dice ? (
            <>
              {state.dice.map((d, i) => (
                <Dice key={`${state.stats.rolls}-${i}`} value={d} size={96} rolling={rolling} />
              ))}
              {!rolling && state.dice.length > 1 && <span className="kz__eq">= {goal}</span>}
              {!rolling && state.dice.length === 1 && <span className="kz__eq">{goal}</span>}
            </>
          ) : (
            <Art name="ui.dice" size={96} />
          )}
        </div>

        {state.phase === 'select' && !rolling && (
          <div className={`kz__sum ${shakeClass('sum')}`} aria-label={`${partial} von ${goal}`}>
            <div className="kz__cells">
              {Array.from({ length: goal }, (_, i) => {
                let acc = 0;
                let color: string | undefined;
                for (const v of state.selected) {
                  if (i < acc + v) {
                    color = FLAP_COLORS[(v - 1) % FLAP_COLORS.length];
                    break;
                  }
                  acc += v;
                }
                return <span key={i} className="kz__cell" style={color ? { background: color, borderColor: color } : undefined} />;
              })}
            </div>
            <div className="kz__equation">
              {state.selected.map((v, i) => (
                <span key={v}>
                  {i > 0 && <span className="kz__op">+</span>}
                  <span className="kz__term" style={{ color: FLAP_COLORS[(v - 1) % FLAP_COLORS.length] }}>
                    {v}
                  </span>
                </span>
              ))}
              {!complete && (
                <>
                  {state.selected.length > 0 && <span className="kz__op">+</span>}
                  <span className="kz__placeholder">?</span>
                </>
              )}
              <span className="kz__op">=</span>
              <span className={`kz__term ${complete ? 'kz__term--done' : ''}`}>{goal}</span>
            </div>
          </div>
        )}

        {state.phase === 'over' && !rolling && (
          <div className="kz__over">
            {state.open.length === 0 ? (
              <>
                <Art name="ui.party" size={80} />
                <span>0</span>
              </>
            ) : (
              <>
                <Art name="ui.thinking" size={80} />
                <span>{penalty(state)}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="kz__actions">
        {state.phase === 'roll' && (
          <>
            {!onlyOne && (
              <Button label="Mit zwei Würfeln würfeln" size="huge" variant="primary" pulse onClick={() => roll(2)} sound={false}>
                <Dice value={5} size={54} />
                <Dice value={2} size={54} />
              </Button>
            )}
            {oneDie && (
              <Button
                label="Mit einem Würfel würfeln"
                size="huge"
                variant={onlyOne ? 'primary' : 'blue'}
                pulse={onlyOne}
                onClick={() => roll(1)}
                sound={false}
              >
                <Dice value={3} size={54} />
              </Button>
            )}
          </>
        )}
        {state.phase === 'select' && !rolling && (
          <>
            <Button label="Tipp" size="big" onClick={showHint}>
              <Lightbulb size={40} strokeWidth={2.6} />
            </Button>
            <button
              type="button"
              className={`btn btn--huge ${complete ? 'btn--primary btn--pulse' : 'kz__confirm--off'}`}
              aria-label="Klappen schließen"
              onClick={confirm}
            >
              <Check size={60} strokeWidth={3.4} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
