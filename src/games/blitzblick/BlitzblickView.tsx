import { Eye, Play } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { audio } from '../../core/audio/AudioManager';
import type { SpeechPart } from '../../core/audio/phrases';
import { explainQuantity } from '../../core/explain';
import { DotPattern } from '../../core/scaffolding/DotPattern';
import type { GameViewProps } from '../../core/types/game';
import { Button } from '../../components/shared/Button';
import { Dice } from '../../components/shared/Dice';
import { useShake } from '../../components/shared/useShake';
import { currentTask, scatterPositions } from './engine';
import type { BbAction, BbState, BbTask } from './types';
import './Blitzblick.css';

function PatternView({ task }: { task: BbTask }) {
  if (task.pattern === 'dice') return <Dice value={task.n} size={230} />;
  if (task.pattern === 'scatter') {
    return (
      <svg className="bb__scatter" viewBox="0 0 100 100" role="img" aria-label="Punkte">
        {scatterPositions(task.n, task.seed).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="9" className="bb__dot" />
        ))}
      </svg>
    );
  }
  return <DotPattern value={task.n} size={task.n > 10 ? 300 : 380} stack={task.n > 10} className="bb__frame" />;
}

/** Hint after a mistake: the structure without the result ("5 und 2 …"). */
const structureHint = (n: number): SpeechPart[] => (n <= 5 ? ['look'] : n <= 10 ? ['look', 5, 'and', n - 5] : ['look', 10, 'and', n - 10]);

export function BlitzblickView({ state, dispatch, paused = false }: GameViewProps<BbState, BbAction>) {
  const { shake, shakeClass } = useShake();
  const task = currentTask(state);
  const pad = Array.from({ length: state.preset.max }, (_, i) => i + 1);
  // While the tutorial runs the first pattern stays covered (it must not be studied in advance).
  const revealed = (state.phase === 'show' && !paused) || state.phase === 'feedback' || state.misses.length > 0;

  // Flash: show the pattern for showMs, then cover it.
  useEffect(() => {
    if (state.phase !== 'show' || paused) return;
    audio.play('flip');
    const t = setTimeout(() => dispatch({ type: 'SHOWN' }), state.showMs);
    return () => clearTimeout(t);
  }, [state.phase, state.index, state.peeked, state.showMs, paused, dispatch]);

  // Auto-advance after a right first answer.
  const lastAnswer = state.answers[state.answers.length - 1];
  useEffect(() => {
    if (state.phase !== 'feedback' || paused) return;
    const t = setTimeout(() => dispatch({ type: 'NEXT' }), lastAnswer?.correct ? 2200 : 3600);
    return () => clearTimeout(t);
  }, [state.phase, state.index, paused, lastAnswer?.correct, dispatch]);

  const spoken = useRef(-1);
  useEffect(() => {
    if (state.phase !== 'feedback' || spoken.current === state.index) return;
    spoken.current = state.index;
    audio.play(lastAnswer?.correct ? 'success' : 'plop');
    void audio.say(...explainQuantity(task.n));
  }, [state.phase, state.index, lastAnswer?.correct, task.n]);

  const onNumber = (n: number) => {
    if (state.phase !== 'answer') return;
    if (n !== task.n) {
      shake(`n-${n}`, ...structureHint(task.n));
    } else {
      audio.play('select');
    }
    dispatch({ type: 'ANSWER', n });
  };

  return (
    <div className="bb">
      <div className="bb__progress" aria-label={`Aufgabe ${state.index + 1} von ${state.tasks.length}`}>
        {state.tasks.map((_, i) => {
          const a = state.answers[i];
          return <span key={i} className={`bb__pip ${a ? (a.correct ? 'bb__pip--ok' : 'bb__pip--help') : i === state.index ? 'bb__pip--now' : ''}`} />;
        })}
      </div>

      <div className="bb__main">
        <div className={`bb__stage ${state.phase === 'feedback' ? 'bb__stage--done' : ''}`}>
          {revealed ? (
            <div className="bb__pattern" key={`pattern-${state.index}-${state.peeked}`}>
              <PatternView task={task} />
            </div>
          ) : (
            <div className="bb__cover" aria-label="Wie viele waren es?">
              <span>?</span>
            </div>
          )}
          {state.phase === 'show' && !paused && (
            <span className="bb__timer" key={`timer-${state.index}-${state.peeked}`}>
              <span style={{ animationDuration: `${state.showMs}ms` }} />
            </span>
          )}
          {state.phase === 'feedback' && <span className="bb__result">{task.n}</span>}
        </div>

        <div className="bb__side">
          {state.phase === 'answer' && state.misses.length === 0 && (
            <Button label="Nochmal schauen" size="big" className="bb__peek" onClick={() => dispatch({ type: 'PEEK' })}>
              <Eye size={40} strokeWidth={2.6} />
            </Button>
          )}
          {state.phase === 'feedback' && (
            <Button label="Weiter" variant="primary" size="huge" pulse onClick={() => dispatch({ type: 'NEXT' })}>
              <Play size={56} fill="currentColor" strokeWidth={3} />
            </Button>
          )}
        </div>
      </div>

      <div className={`bb__pad ${state.preset.max > 10 ? 'bb__pad--wide' : ''}`} role="group" aria-label="Zahlen">
        {pad.map((n) => (
          <button
            key={n}
            type="button"
            className={`bb__num ${state.misses.includes(n) ? 'bb__num--miss' : ''} ${state.phase === 'feedback' && n === task.n ? 'bb__num--right' : ''} ${shakeClass(`n-${n}`)}`}
            disabled={state.phase !== 'answer' || state.misses.includes(n)}
            aria-label={String(n)}
            onClick={() => onNumber(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
