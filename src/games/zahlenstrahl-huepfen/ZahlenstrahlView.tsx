import { Play } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { audio } from '../../core/audio/AudioManager';
import type { GameViewProps } from '../../core/types/game';
import { Art } from '../../components/shared/Art';
import { Button } from '../../components/shared/Button';
import { useShake } from '../../components/shared/useShake';
import { checkJump, currentTask, goal, jumpedSoFar, lineWindow, remaining } from './engine';
import type { ZhAction, ZhState } from './types';
import './Zahlenstrahl.css';

export function ZahlenstrahlView({ state, dispatch, settings }: GameViewProps<ZhState, ZhAction>) {
  const { shake, shakeClass } = useShake();
  const task = currentTask(state);
  const [from, to] = lineWindow(state);
  const span = to - from;
  const plus = state.preset.op === '+';
  const rest = remaining(state);
  const done = jumpedSoFar(state);
  const pos = (n: number) => `${((n - from) / span) * 100}%`;
  const stones = Array.from({ length: span + 1 }, (_, i) => from + i);
  const lastResult = state.results[state.results.length - 1];

  // Announce each new task.
  const announced = useRef(-1);
  useEffect(() => {
    if (state.phase !== 'jumping' || announced.current === state.taskIndex) return;
    announced.current = state.taskIndex;
    void audio.say(task.start, plus ? 'plus' : 'minus', task.amount);
  }, [state.phase, state.taskIndex, task.start, task.amount, plus]);

  // Celebrate a solved task.
  const celebrated = useRef(-1);
  useEffect(() => {
    if (state.phase !== 'taskDone' || celebrated.current === state.taskIndex) return;
    celebrated.current = state.taskIndex;
    audio.play('success');
    const r = state.results[state.results.length - 1];
    void audio.say(task.start, plus ? 'plus' : 'minus', task.amount, 'equals', goal(state), ...(r?.bridged ? (['ten_jump'] as const) : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.taskIndex]);

  const onStone = (n: number) => {
    if (state.phase !== 'jumping') return;
    const check = checkJump(state, n);
    if (check === 'ok') {
      audio.play('jump');
      dispatch({ type: 'JUMP', to: n });
      return;
    }
    if (check === 'tooFar') shake(`stone-${n}`, 'too_far');
    else if (check === 'tinyStep') shake(`stone-${n}`, { text: 'Mach einen größeren Sprung!' });
    else if (check === 'wrongDirection')
      shake(`stone-${n}`, { text: plus ? 'Der Frosch hüpft nach rechts.' : 'Der Frosch hüpft nach links.' });
  };

  // Jump arcs of the current task.
  let p = task.start;
  const arcs = state.jumps.map((j) => {
    const a = p;
    p += j;
    return { from: Math.min(a, p), to: Math.max(a, p), size: Math.abs(j) };
  });

  return (
    <div className="zh">
      <div className="zh__top">
        <div className="zh__progress" aria-label={`Aufgabe ${state.taskIndex + 1} von ${state.tasks.length}`}>
          {state.tasks.map((_, i) => {
            const r = state.results[i];
            return <span key={i} className={`zh__pip ${r ? (r.bridged ? 'zh__pip--gold' : 'zh__pip--done') : i === state.taskIndex ? 'zh__pip--now' : ''}`} />;
          })}
        </div>

        {state.phase === 'jumping' ? (
          <div className="zh__task">
            <span className="zh__term">{task.start}</span>
            <span className="zh__op">{plus ? '+' : '−'}</span>
            <span className="zh__term">{task.amount}</span>
            <div className="zh__hops" aria-label={`noch ${rest}`}>
              {Array.from({ length: task.amount }, (_, i) => (
                <span key={i} className={`zh__hop ${i < done ? 'zh__hop--used' : ''} ${settings.showDotPatterns && i % 5 === 4 ? 'zh__hop--five' : ''}`} />
              ))}
            </div>
          </div>
        ) : (
          <div className={`zh__task zh__task--done ${lastResult?.bridged ? 'zh__task--bridged' : ''}`}>
            <span className="zh__term">{task.start}</span>
            <span className="zh__op">{plus ? '+' : '−'}</span>
            <span className="zh__term">{task.amount}</span>
            <span className="zh__op">=</span>
            <span className="zh__term zh__term--result">{goal(state)}</span>
            {lastResult?.bridged && (
              <span className="zh__badge">
                <Art name="ui.star" size={30} /> 10
              </span>
            )}
          </div>
        )}

        {state.phase === 'taskDone' && (
          <Button label="Nächste Aufgabe" variant="primary" size="huge" pulse onClick={() => dispatch({ type: 'NEXT_TASK' })}>
            <Play size={56} fill="currentColor" strokeWidth={3} />
          </Button>
        )}
      </div>

      <div className="zh__pond play-surface">
        <div className="zh__line">
          {arcs.map((a, i) => (
            <div key={i} className="zh__arc" style={{ left: pos(a.from), width: `${(a.size / span) * 100}%` }}>
              <span className="zh__arc-label">
                {plus ? '+' : '−'}
                {a.size}
              </span>
            </div>
          ))}
          <div className="zh__frog" style={{ left: pos(state.position) }}>
            <div className="zh__frog-hop" key={`${state.taskIndex}-${state.jumps.length}`}>
              <Art name="game.zahlenstrahl-huepfen" size={64} />
            </div>
          </div>
          {stones.map((n) => {
            const ten = n % 10 === 0;
            const five = !ten && n % 5 === 0;
            const cls = [
              'zh-stone',
              ten && 'zh-stone--ten',
              five && 'zh-stone--five',
              n === task.start && 'zh-stone--start',
              n === state.position && 'zh-stone--here',
              shakeClass(`stone-${n}`),
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button key={n} type="button" className={cls} style={{ left: pos(n) }} aria-label={`Stein ${n}`} onClick={() => onStone(n)}>
                <span className="zh-stone__num">{n}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
