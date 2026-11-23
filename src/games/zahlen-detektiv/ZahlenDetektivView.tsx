import { HelpCircle, Play } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { audio } from '../../core/audio/AudioManager';
import type { SpeechPart } from '../../core/audio/phrases';
import { DotPattern } from '../../core/scaffolding/DotPattern';
import type { GameViewProps } from '../../core/types/game';
import { Art } from '../../components/shared/Art';
import { Button } from '../../components/shared/Button';
import { useShake } from '../../components/shared/useShake';
import { answerFor, candidates, currentCase, isDraftComplete, lastQuestion } from './engine';
import type { Question, QuestionKind, ZdAction, ZdState } from './types';
import './ZahlenDetektiv.css';

const KINDS: { kind: QuestionKind; symbol: string; speech: string; parts: SpeechPart[] }[] = [
  { kind: 'gt', symbol: '>', speech: 'Ist sie größer als …?', parts: ['bigger'] },
  { kind: 'lt', symbol: '<', speech: 'Ist sie kleiner als …?', parts: ['smaller'] },
  { kind: 'between', symbol: '↔', speech: 'Liegt sie zwischen … und …?', parts: ['between'] },
  { kind: 'exact', symbol: '🎯', speech: 'Ist es genau …?', parts: ['is_it'] },
];

/** The question as speech parts, e.g. "größer als" + 7 (recordable building blocks). */
const questionParts = (q: Omit<Question, 'answer'>): SpeechPart[] => {
  switch (q.kind) {
    case 'gt':
      return ['bigger', q.a];
    case 'lt':
      return ['smaller', q.a];
    case 'between':
      return ['between', q.a, 'and', q.b!];
    case 'exact':
      return ['is_it', q.a];
  }
};

const symbolOf = (k: QuestionKind) => KINDS.find((x) => x.kind === k)!.symbol;

/** Question symbol; the "exact" question uses the drawn target instead of an emoji. */
function Sym({ kind, size = 34 }: { kind: QuestionKind; size?: number }) {
  return kind === 'exact' ? <Art name="ui.target" size={size} /> : <>{symbolOf(kind)}</>;
}

export function ZahlenDetektivView({ state, dispatch, settings }: GameViewProps<ZdState, ZdAction>) {
  const { shake, shakeClass } = useShake();
  const c = currentCase(state);
  const cands = candidates(state);
  const draft = state.draft;
  const complete = isDraftComplete(draft);
  const last = lastQuestion(state);
  const numbers = Array.from({ length: state.preset.max }, (_, i) => i + 1);
  const wide = state.preset.max <= 20;

  // Speak the answer after each question.
  const spoken = useRef(c.questions.length);
  useEffect(() => {
    if (c.questions.length === spoken.current) return;
    spoken.current = c.questions.length;
    const q = c.questions[c.questions.length - 1];
    if (!q) return;
    const before = state.phase === 'solved' ? [] : candidatesBefore(state);
    const useless = before.length > 0 && before.every((n) => answerFor(q, n) === q.answer);
    if (q.kind === 'exact' && q.answer) {
      audio.play('fanfare');
      void audio.say(...questionParts(q), 'yes', 'found_it');
    } else {
      audio.play(q.answer ? 'success' : 'plop');
      void audio.say(...questionParts(q), q.answer ? 'yes' : 'no', ...(useless ? (['knew_that'] as SpeechPart[]) : []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.questions.length]);

  useEffect(() => {
    if (state.phase === 'asking' && c.questions.length === 0) {
      void audio.say('think_number', state.preset.max);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.caseIndex]);

  const onKind = (kind: QuestionKind, parts: SpeechPart[]) => {
    audio.play('select');
    void audio.say(...parts);
    dispatch({ type: 'SET_KIND', kind });
  };

  const onNumber = (n: number) => {
    if (state.phase !== 'asking') return;
    if (!draft) {
      shake('kinds', 'choose_question');
      return;
    }
    audio.play('select');
    void audio.say(n);
    dispatch({ type: 'PICK', n });
  };

  const onAsk = () => {
    if (!complete) {
      shake('ask', draft ? 'tap_number' : 'choose_question');
      return;
    }
    dispatch({ type: 'ASK' });
  };

  const inDraft = (n: number) => {
    if (!draft || draft.a === null) return false;
    if (draft.kind === 'between') return draft.b === null ? n === draft.a : n >= draft.a && n <= draft.b;
    return n === draft.a;
  };

  const solvedSecret = state.phase === 'solved' ? c.secret : null;

  return (
    <div className="zd">
      <div className={`zd__line ${wide ? 'zd__line--row' : 'zd__line--grid'}`} role="group" aria-label="Zahlen">
        {numbers.map((n) => {
          const possible = cands.includes(n);
          const cls = [
            'zd-num',
            !possible && 'zd-num--out',
            inDraft(n) && 'zd-num--draft',
            possible && cands.length === 1 && 'zd-num--last',
            solvedSecret === n && 'zd-num--secret',
            n % 10 === 0 ? 'zd-num--ten' : n % 5 === 0 ? 'zd-num--five' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button key={n} type="button" className={cls} aria-label={`${n}${possible ? '' : ', ausgeschlossen'}`} onClick={() => onNumber(n)}>
              {n}
            </button>
          );
        })}
      </div>

      <div className="zd__main">
        <div className="zd__detective">
          <div className="zd__cases" aria-label={`Fall ${state.caseIndex + 1} von ${state.cases.length}`}>
            {state.cases.map((_, i) => (
              <span key={i} className={`zd__case ${i < state.caseIndex || (i === state.caseIndex && state.phase !== 'asking') ? 'zd__case--done' : i === state.caseIndex ? 'zd__case--now' : ''}`}>
                <Art name="game.zahlen-detektiv" size={28} />
              </span>
            ))}
          </div>
          <Art name="game.zahlen-detektiv" size={88} />
          {last && state.phase === 'asking' && (
            <div className={`zd__bubble ${last.answer ? 'zd__bubble--yes' : 'zd__bubble--no'}`} key={c.questions.length}>
              <span className="zd__qsym">
                <Sym kind={last.kind} size={30} />
              </span>
              <span>{last.kind === 'between' ? `${last.a}…${last.b}` : last.a}</span>
              <Art name={last.answer ? 'ui.check' : 'ui.cross'} size={40} />
            </div>
          )}
          {state.phase === 'asking' && !last && (
            <div className="zd__bubble">
              <Art name="ui.question" size={40} />
            </div>
          )}
        </div>

        {state.phase === 'asking' ? (
          <div className="zd__builder">
            <div className={`zd__kinds ${shakeClass('kinds')}`}>
              {KINDS.map((k) => (
                <button
                  key={k.kind}
                  type="button"
                  className={`btn btn--big zd__kind ${draft?.kind === k.kind ? 'btn--selected' : ''}`}
                  aria-label={k.speech}
                  aria-pressed={draft?.kind === k.kind}
                  onClick={() => onKind(k.kind, k.parts)}
                >
                  <Sym kind={k.kind} size={52} />
                </button>
              ))}
            </div>
            <div className="zd__draft">
              <span className="zd__slot zd__slot--sym">{draft ? <Sym kind={draft.kind} size={40} /> : '?'}</span>
              <span className={`zd__slot ${draft?.a != null ? 'zd__slot--on' : ''}`}>{draft?.a ?? '…'}</span>
              {draft?.kind === 'between' && <span className={`zd__slot ${draft.b != null ? 'zd__slot--on' : ''}`}>{draft.b ?? '…'}</span>}
              <button
                type="button"
                className={`btn btn--huge ${complete ? 'btn--primary btn--pulse' : 'zd__ask--off'} ${shakeClass('ask')}`}
                aria-label="Frage stellen"
                onClick={onAsk}
              >
                <HelpCircle size={60} strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <div className="zd__solved">
            <span className="zd__secret">{c.secret}</span>
            {settings.showDotPatterns && <DotPattern value={c.secret} size={110} />}
            <span className="zd__count">
              <Art name="ui.question" size={36} /> {c.questions.length}
            </span>
            <Button label={state.caseIndex + 1 < state.cases.length ? 'Nächster Fall' : 'Fertig'} variant="primary" size="huge" pulse onClick={() => dispatch({ type: 'NEXT_CASE' })}>
              <Play size={56} fill="currentColor" strokeWidth={3} />
            </Button>
          </div>
        )}

        <ol className="zd__log" aria-label="Bisherige Fragen">
          {c.questions.map((q, i) => (
            <li key={i} className={q.answer ? 'zd__log--yes' : 'zd__log--no'}>
              <span className="zd__qsym">
                <Sym kind={q.kind} size={20} />
              </span>
              {q.kind === 'between' ? `${q.a}…${q.b}` : q.a}
              <Art name={q.answer ? 'ui.check' : 'ui.cross'} size={22} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Candidates before the most recent question (to detect questions that told us nothing new). */
function candidatesBefore(state: ZdState): number[] {
  const c = currentCase(state);
  const prev = c.questions.slice(0, -1);
  const out: number[] = [];
  for (let n = 1; n <= state.preset.max; n++) if (prev.every((q) => answerFor(q, n) === q.answer)) out.push(n);
  return out;
}
