import { Home, RotateCw, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { navigate } from '../../core/router';
import { clearSession, loadSession, saveSession } from '../../core/storage/sessions';
import { updateProfile, useActiveProfile } from '../../core/storage/appStore';
import type { GameModule, GameSetup, TutorialStep } from '../../core/types/game';
import { newSeed } from '../../core/random/rng';
import { getEntry } from '../../games/registry';
import { useGameModule } from '../../games/useGameModule';
import { Art } from '../shared/Art';
import { Button } from '../shared/Button';
import { UndoButton } from '../shared/UndoButton';
import { ResultFlow } from './ResultFlow';
import { TutorialOverlay } from './TutorialOverlay';
import './GameHost.css';

export function GameHost({ gameId }: { gameId: string }) {
  const mod = useGameModule(gameId);
  const profile = useActiveProfile();
  const invalid = !getEntry(gameId) || mod === null || !profile;
  useEffect(() => {
    if (invalid) navigate({ name: 'hub' }, true);
  }, [invalid]);
  if (invalid) return null;
  if (mod === undefined) return <div className="loading">⏳</div>;
  return <LoadedGame key={`${profile.id}-${gameId}`} mod={mod} profileId={profile.id} />;
}

function LoadedGame({ mod, profileId }: { mod: GameModule; profileId: string }) {
  const profile = useActiveProfile();
  const settings = profile!.settings;
  const gameId = mod.meta.id;
  const [session] = useState(() => loadSession(profileId, gameId, mod.stateVersion));
  const [setup, setSetup] = useState<GameSetup | null>(session?.setup ?? null);
  const [state, setState] = useState<unknown>(session?.state ?? null);
  const [round, setRound] = useState(0);
  const [tutorial, setTutorial] = useState<TutorialStep[] | null>(null);
  const first = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!session) navigate({ name: 'lobby', gameId }, true);
  }, [session, gameId]);

  // Leaving the game silences any sentence that is still being spoken.
  useEffect(() => () => audio.stopSpeech(), []);

  // First time in this game: show how it works.
  useEffect(() => {
    if (!mod.tutorial || profile?.tutorialsSeen.includes(gameId)) return;
    const t = setTimeout(() => {
      if (stateRef.current && !mod.result(stateRef.current)) setTutorial(mod.tutorial!(stateRef.current));
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showTutorial = () => {
    if (mod.tutorial && stateRef.current) setTutorial(mod.tutorial(stateRef.current));
    else void audio.say({ text: mod.meta.intro, key: `intro_${gameId}` });
  };

  const tutorialDone = () => {
    setTutorial(null);
    updateProfile(profileId, (p) => (p.tutorialsSeen.includes(gameId) ? p : { ...p, tutorialsSeen: [...p.tutorialsSeen, gameId] }));
  };

  const result = useMemo(() => (state ? mod.result(state) : null), [mod, state]);
  const [showResult, setShowResult] = useState(false);
  useEffect(() => {
    if (!result) {
      setShowResult(false);
      return;
    }
    const t = setTimeout(() => setShowResult(true), mod.resultDelayMs ?? 700);
    return () => clearTimeout(t);
  }, [result, mod.resultDelayMs]);

  // Auto-resume: persist after every state change (valid moves only change state).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (state && setup) saveSession({ gameId, profileId, stateVersion: mod.stateVersion, setup, state });
  }, [state, setup, gameId, profileId, mod.stateVersion]);

  const dispatch = useCallback((action: unknown) => setState((prev: unknown) => mod.reduce(prev, action)), [mod]);
  const undo = useCallback(() => {
    audio.play('whoosh');
    dispatch(mod.undoAction);
  }, [dispatch, mod]);

  const restart = useCallback(() => {
    if (!setup) return;
    const nextSetup = { ...setup, seed: newSeed() };
    const fresh = mod.create(nextSetup);
    saveSession({ gameId, profileId, stateVersion: mod.stateVersion, setup: nextSetup, state: fresh });
    setSetup(nextSetup);
    setState(fresh);
    setRound((r) => r + 1);
  }, [mod, setup, gameId, profileId]);

  const finish = useCallback(() => clearSession(profileId, gameId), [profileId, gameId]);

  if (!state || !setup) return null;
  const View = mod.View;
  const canUndo = mod.canUndo(state);

  return (
    <div className="game" style={{ ['--game-color' as string]: mod.meta.color }}>
      <header className="topbar game__bar">
        <Button label="Zur Startseite" icon size="big" onClick={() => navigate({ name: 'hub' })}>
          <Home size={36} strokeWidth={2.6} />
        </Button>
        <div className="topbar__title">
          <Art name={mod.meta.art} size={46} />
          <span className="game__title">{mod.meta.title}</span>
        </div>
        <div className="topbar__spacer" />
        <Button label="So geht's" icon size="big" onClick={showTutorial}>
          <Art name="ui.hand" size={40} />
        </Button>
        {mod.hasUndo !== false && <UndoButton enabled={canUndo && !result?.won} onUndo={undo} />}
      </header>
      <main className="game__body play-surface">
        <View key={round} state={state} dispatch={dispatch} settings={settings} paused={!!tutorial} />
      </main>
      <div className="rotate-hint" aria-hidden="true">
        <Smartphone size={90} strokeWidth={2} />
        <RotateCw size={56} strokeWidth={2.6} />
      </div>
      {tutorial && <TutorialOverlay steps={tutorial} onDone={tutorialDone} />}
      {result && showResult && (
        <ResultFlow
          key={round}
          mod={mod}
          setup={setup}
          result={result}
          canUndo={canUndo}
          onUndo={undo}
          onFinish={finish}
          onRestart={restart}
        />
      )}
    </div>
  );
}
