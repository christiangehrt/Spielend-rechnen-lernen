import type { LearningGoal } from '../../core/types/game';

export const GOALS: { id: LearningGoal; art: string; speech: string }[] = [
  { id: 'addition', art: 'goal.addition', speech: 'Plus rechnen' },
  { id: 'zerlegung', art: 'goal.zerlegung', speech: 'Zahlen zerlegen' },
  { id: 'zahlenstrahl', art: 'goal.zahlenstrahl', speech: 'Zahlenstrahl' },
  { id: 'vergleichen', art: 'goal.vergleichen', speech: 'Größer und kleiner' },
  { id: 'blitzblick', art: 'goal.blitzblick', speech: 'Blitzblick' },
];
