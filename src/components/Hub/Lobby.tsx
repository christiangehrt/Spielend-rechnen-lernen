import { Home, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { newSeed } from '../../core/random/rng';
import { navigate } from '../../core/router';
import { useActiveProfile } from '../../core/storage/appStore';
import { readJSON, writeJSON } from '../../core/storage/kv';
import { clearSession, loadSession, saveSession } from '../../core/storage/sessions';
import type { GameModule, GameSetup, PlayMode } from '../../core/types/game';
import type { PlayerProfile } from '../../core/types/profile';
import { getEntry } from '../../games/registry';
import { useGameModule } from '../../games/useGameModule';
import { Art } from '../shared/Art';
import { Button } from '../shared/Button';
import './Lobby.css';

export function Lobby({ gameId }: { gameId: string }) {
  const mod = useGameModule(gameId);
  const profile = useActiveProfile();
  const invalid = !getEntry(gameId) || mod === null || !profile;
  useEffect(() => {
    if (invalid) navigate({ name: 'hub' }, true);
  }, [invalid]);
  if (invalid) return null;
  if (mod === undefined) return <div className="loading">⏳</div>;
  return <LobbyInner key={gameId} mod={mod} profile={profile} />;
}

interface LobbyChoice {
  presetId: string;
  mode: PlayMode;
}

const choiceKey = (profileId: string, gameId: string) => `lobby_${profileId}_${gameId}`;

function LobbyInner({ mod, profile }: { mod: GameModule; profile: PlayerProfile }) {
  const gameId = mod.meta.id;
  const saved = loadSession(profile.id, gameId, mod.stateVersion);
  const [choice, setChoice] = useState<LobbyChoice>(() => {
    const stored = readJSON<LobbyChoice>(choiceKey(profile.id, gameId));
    const presetOk = stored && mod.presets.some((p) => p.id === stored.presetId);
    const modeOk = stored && mod.modes.some((m) => m.id === stored.mode);
    return {
      presetId: presetOk ? stored!.presetId : mod.defaultPresetId(profile.settings.defaultNumberRange),
      mode: modeOk ? stored!.mode : mod.modes[0].id,
    };
  });

  useEffect(() => {
    void audio.say({ text: mod.meta.title });
  }, [mod.meta.title]);

  const start = () => {
    writeJSON(choiceKey(profile.id, gameId), choice);
    const mode = mod.modes.find((m) => m.id === choice.mode) ?? mod.modes[0];
    const names = [profile.name || 'Kind', 'Mitspieler', 'Mitspieler 3', 'Mitspieler 4'];
    const setup: GameSetup = {
      presetId: choice.presetId,
      mode: mode.id,
      seed: newSeed(),
      playerNames: names.slice(0, mode.players),
      playerAvatars: [profile.avatarId, 'avatar.bear', 'avatar.owl', 'avatar.cat'].slice(0, mode.players),
    };
    clearSession(profile.id, gameId);
    saveSession({ gameId, profileId: profile.id, stateVersion: mod.stateVersion, setup, state: mod.create(setup) });
    navigate({ name: 'play', gameId });
  };

  return (
    <div className="screen lobby" style={{ ['--game-color' as string]: mod.meta.color }}>
      <header className="topbar">
        <Button label="Zur Startseite" icon size="big" onClick={() => navigate({ name: 'hub' })}>
          <Home size={36} strokeWidth={2.6} />
        </Button>
        <div className="topbar__spacer" />
      </header>
      <div className="lobby__main">
        <section className="lobby__hero">
          <div className="lobby__art">
            <Art name={mod.meta.art} size={150} />
          </div>
          <h1 className="lobby__title">{mod.meta.title}</h1>
          <Button label="Erklärung anhören" size="big" variant="blue" onClick={() => void audio.say({ text: mod.meta.intro })}>
            <Volume2 size={40} strokeWidth={2.6} />
          </Button>
        </section>

        <section className="lobby__options">
          {saved && (
            <div className="lobby__resume">
              <Button label="Weiterspielen" variant="primary" size="huge" pulse speak={['continue']} onClick={() => navigate({ name: 'play', gameId })}>
                <Play size={56} strokeWidth={3} fill="currentColor" />
              </Button>
            </div>
          )}

          <div className="lobby__group" role="radiogroup" aria-label="Schwierigkeit">
            {mod.presets.map((p) => (
              <Button
                key={p.id}
                label={p.speech}
                speak
                selected={choice.presetId === p.id}
                className={`lobby__choice ${p.level === 'profi' ? 'lobby__choice--profi' : ''}`}
                onClick={() => setChoice((c) => ({ ...c, presetId: p.id }))}
              >
                <Art name={p.art} size={44} />
                <span>{p.label}</span>
              </Button>
            ))}
          </div>

          {mod.modes.length > 1 && (
            <div className="lobby__group" role="radiogroup" aria-label="Spielart">
              {mod.modes.map((m) => (
                <Button
                  key={m.id}
                  label={m.speech}
                  speak
                  selected={choice.mode === m.id}
                  className="lobby__choice"
                  onClick={() => setChoice((c) => ({ ...c, mode: m.id }))}
                >
                  <Art name={m.art} size={44} />
                </Button>
              ))}
            </div>
          )}

          <Button
            label={saved ? 'Neues Spiel' : 'Los geht’s'}
            variant={saved ? 'default' : 'primary'}
            size="huge"
            pulse={!saved}
            className="lobby__start"
            onClick={start}
          >
            {saved ? <RotateCcw size={52} strokeWidth={3} /> : <Play size={60} strokeWidth={3} fill="currentColor" />}
          </Button>
        </section>
      </div>
    </div>
  );
}
