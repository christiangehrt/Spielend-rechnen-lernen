import { describe, expect, it } from 'vitest';
import type { TutorialStep } from '../core/types/game';
import { createGame as bbCreate } from './blitzblick/engine';
import { tutorial as bbTutorial } from './blitzblick/tutorial';
import { createGame as bfCreate } from './blitz-fuenf/engine';
import { tutorial as bfTutorial } from './blitz-fuenf/tutorial';
import { createGame as kzCreate } from './klappen-zu/engine';
import { tutorial as kzTutorial } from './klappen-zu/tutorial';
import { createGame as nrCreate } from './nachbar-reihe/engine';
import { tutorial as nrTutorial } from './nachbar-reihe/tutorial';
import { createGame as rrCreate } from './rauf-runter/engine';
import { tutorial as rrTutorial } from './rauf-runter/tutorial';
import { createGame as rwCreate } from './raupen-reihen/engine';
import { tutorial as rwTutorial } from './raupen-reihen/tutorial';
import { createGame as ssCreate } from './schlummer-schloss/engine';
import { tutorial as ssTutorial } from './schlummer-schloss/tutorial';
import { createGame as vzCreate } from './verliebte-zahlen/engine';
import { tutorial as vzTutorial } from './verliebte-zahlen/tutorial';
import { createGame as zdCreate } from './zahlen-detektiv/engine';
import { tutorial as zdTutorial } from './zahlen-detektiv/tutorial';
import { createGame as zhCreate, goal } from './zahlenstrahl-huepfen/engine';
import { tutorial as zhTutorial } from './zahlenstrahl-huepfen/tutorial';

const humans = [{ name: 'Mia', avatarId: 'a' }];
const bots = [{ name: 'Robo', avatarId: 'b' }];

const check = (steps: TutorialStep[]) => {
  expect(steps.length).toBeGreaterThanOrEqual(3);
  expect(steps.length).toBeLessThanOrEqual(7);
  for (const s of steps) {
    expect(s.say.length).toBeGreaterThan(5);
    expect(s.say.length).toBeLessThan(140); // one short sentence per step
  }
};

describe('tutorials', () => {
  it('exist for all ten games', () => {
    check(bbTutorial(bbCreate('bis10', 1)));
    check(rrTutorial(rrCreate({ presetId: 'zr20', mode: 'solo', players: humans, seed: 1 })));
    check(kzTutorial(kzCreate('klappen9', 1)));
    check(vzTutorial(vzCreate('raster20', 1)));
    check(zhTutorial(zhCreate('plus20', 1)));
    check(zdTutorial(zdCreate('bis20', 1)));
    check(rwTutorial(rwCreate({ presetId: 'zr30', humans, bots: [...bots, ...bots], botLevel: 'anfaenger', seed: 1 })));
    check(nrTutorial(nrCreate({ presetId: 'farben2', humans, bots, botLevel: 'anfaenger', seed: 1 })));
    check(bfTutorial(bfCreate({ humans, bots, botLevel: 'anfaenger', seed: 1 })));
    check(ssTutorial(ssCreate({ presetId: 'junior', humans, bots, botLevel: 'anfaenger', seed: 1 })));
  });

  it('demonstrates a real move in Rauf & Runter (drag a playable card onto a pile)', () => {
    const steps = rrTutorial(rrCreate({ presetId: 'zr20', mode: 'solo', players: humans, seed: 3 }));
    const drag = steps.find((s) => s.to);
    expect(drag?.target).toMatch(/Karte \d+/);
    expect(drag?.to).toMatch(/rr-pile--(asc|desc)/);
  });

  it('never reveals the answer of the current Zahlenstrahl task', () => {
    for (let seed = 1; seed < 200; seed++) {
      for (const preset of ['plus20', 'minus20', 'plus100'] as const) {
        const s = zhCreate(preset, seed);
        const targets = zhTutorial(s).map((t) => t.target ?? '');
        expect(targets).not.toContain(`button[aria-label="Stein ${goal(s)}"]`);
      }
    }
  });
});
