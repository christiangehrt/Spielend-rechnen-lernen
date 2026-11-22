export type ZdPresetId = 'bis10' | 'bis20' | 'bis50' | 'bis100';

export interface ZdPreset {
  id: ZdPresetId;
  max: number;
  cases: number;
  /** Questions per case that still count as a "won" round on average. */
  goodQuestions: number;
}

export type QuestionKind = 'gt' | 'lt' | 'between' | 'exact';

export interface Question {
  kind: QuestionKind;
  a: number;
  b?: number;
  answer: boolean;
}

export interface Draft {
  kind: QuestionKind;
  a: number | null;
  b: number | null;
}

export interface ZdCase {
  secret: number;
  questions: Question[];
}

export interface ZdState {
  preset: ZdPreset;
  cases: ZdCase[];
  caseIndex: number;
  draft: Draft | null;
  phase: 'asking' | 'solved' | 'over';
  stats: { splits: number };
}

export type ZdAction =
  | { type: 'SET_KIND'; kind: QuestionKind }
  | { type: 'PICK'; n: number }
  | { type: 'ASK' }
  | { type: 'NEXT_CASE' }
  | { type: 'CLEAR_DRAFT' };
