import { Home, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { navigate } from '../../core/router';
import { clearSession, loadSession, saveSession } from '../../core/storage/sessions';
import { useActiveProfile } from '../../core/storage/appStore';
import type { GameModule, GameSetup } from '../../core/types/game';
import { newSeed } from '../../core/random/rng';
import { getEntry } from '../../games/registry';
import { useGameModule } from '../../games/useGameModule';
import { Art } from '../shared/Art';
import { Button } from '../shared/Button';
import { UndoButton } from '../shared/UndoButton';
import { ResultFlow } from './ResultFlow';
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
  const first = useRef(true);

  useEffect(() => {
    if (!session) navigate({ name: 'lobby', gameId }, true);
  }, [session, gameId]);

  const result = useMemo(() => (state ? mod.result(state) : null), [mod, state]);

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
        <Button label="Erklärung anhören" icon size="big" onClick={() => void audio.say({ text: mod.meta.intro })}>
          <Volume2 size={36} strokeWidth={2.6} />
        </Button>
        <UndoButton enabled={canUndo && !result?.won} onUndo={undo} />
      </header>
      <main className="game__body play-surface">
        <View key={round} state={state} dispatch={dispatch} settings={settings} />
      </main>
      {result && (
        <ResultFlow
          key={round}
          mod={mod}
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
