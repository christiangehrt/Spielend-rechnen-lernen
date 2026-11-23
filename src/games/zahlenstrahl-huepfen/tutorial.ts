import type { TutorialStep } from '../../core/types/game';
import { currentTask, goal, lineWindow } from './engine';
import type { ZhState } from './types';

/** Example jumps that differ from the current task, so the demo never gives the answer away. */
const pickDemo = (s: ZhState) => {
  const [from] = lineWindow(s);
  const plus = s.preset.op === '+';
  const task = currentTask(s);
  // No stone the hand points at may be the result of the current task.
  if (goal(s) === from + 10) return null;
  const candidates: [number, number][] = plus
    ? [[7, 6], [8, 5], [6, 6], [9, 4], [8, 4]]
    : [[13, 5], [12, 4], [14, 6], [11, 3], [12, 5]];
  for (const [rs, amount] of candidates) {
    const start = from + rs;
    const end = plus ? start + amount : start - amount;
    const shown = [start, from + 10, end];
    if (!shown.includes(goal(s)) && !(start === task.start && amount === task.amount)) return { start, amount, ten: from + 10, end, plus };
  }
  return null;
};

export const tutorial = (s: ZhState): TutorialStep[] => {
  const steps: TutorialStep[] = [{ target: '.zh__task', say: 'Hier steht deine Aufgabe.' }];
  const demo = s.preset.max > 10 ? pickDemo(s) : null;
  if (demo) {
    steps.push(
      {
        target: `button[aria-label="Stein ${demo.start}"]`,
        say: `Ein Beispiel: Der Frosch sitzt auf der ${demo.start} und soll ${demo.amount} ${demo.plus ? 'weiter' : 'zurück'} hüpfen.`,
      },
      { target: `button[aria-label="Stein ${demo.ten}"]`, say: `Er springt zuerst bis zur ${demo.ten}.` },
      { target: `button[aria-label="Stein ${demo.end}"]`, say: `Dann noch ${Math.abs(demo.end - demo.ten)} bis zur ${demo.end}. Fertig!` },
    );
  } else {
    steps.push({ target: '.zh__pond', say: 'Tippe auf den Stein, zu dem der Frosch springen soll.' });
  }
  steps.push({ target: '.zh__hops', say: 'Die Punkte zeigen, wie weit der Frosch noch hüpfen muss.' });
  return steps;
};
