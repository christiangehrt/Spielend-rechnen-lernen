import { BookOpen, LayoutGrid, Lock, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { navigate } from '../../core/router';
import { useActiveProfile } from '../../core/storage/appStore';
import { clearSession, listSessions } from '../../core/storage/sessions';
import type { LearningGoal } from '../../core/types/game';
import { GAMES, getEntry } from '../../games/registry';
import { Art } from '../shared/Art';
import { Button } from '../shared/Button';
import { HoldButton } from '../shared/HoldButton';
import { StarProgress } from '../shared/StarProgress';
import { unlockParentArea } from '../ParentGate/parentGate';
import { GOALS } from './goals';
import './Hub.css';

export function Hub() {
  const profile = useActiveProfile()!;
  const [filter, setFilter] = useState<LearningGoal | null>(null);
  const [, force] = useState(0);
  const sessions = listSessions(profile.id).filter((s) => getEntry(s.gameId)?.load);
  const latest = sessions[0];
  const latestMeta = latest ? getEntry(latest.gameId)?.meta : undefined;
  const savedIds = new Set(sessions.map((s) => s.gameId));
  const games = GAMES.filter((g) => !filter || g.meta.learningGoals.includes(filter));

  return (
    <div className="screen hub">
      <header className="topbar hub__bar">
        <Button label="Profil wechseln" icon size="big" className="hub__avatar" onClick={() => navigate({ name: 'profiles' })}>
          <Art name={profile.avatarId} size={52} />
        </Button>
        <StarProgress filled={profile.starsTowardNextSticker} total={profile.totalStars} />
        <div className="topbar__spacer" />
        <Button label="Sticker-Album" size="big" variant="blue" speak onClick={() => navigate({ name: 'album' })}>
          <BookOpen size={36} strokeWidth={2.6} />
          <span className="hub__count">{profile.unlockedStickerIds.length}</span>
        </Button>
        <HoldButton
          label="Elternbereich (3 Sekunden halten)"
          onUnlock={() => {
            unlockParentArea();
            navigate({ name: 'parent' });
          }}
        />
      </header>

      {latest && latestMeta && (
        <div className="hub__resume" style={{ ['--game-color' as string]: latestMeta.color }}>
          <Button
            label={`Weiterspielen: ${latestMeta.title}`}
            variant="primary"
            size="big"
            pulse
            speak={['continue']}
            onClick={() => navigate({ name: 'play', gameId: latest.gameId })}
          >
            <Play size={40} fill="currentColor" strokeWidth={3} />
            <Art name={latestMeta.art} size={52} />
          </Button>
          <Button
            label={`Neu starten: ${latestMeta.title}`}
            size="big"
            speak={['new_game']}
            onClick={() => {
              clearSession(profile.id, latest.gameId);
              force((n) => n + 1);
              navigate({ name: 'lobby', gameId: latest.gameId });
            }}
          >
            <RotateCcw size={36} strokeWidth={3} />
          </Button>
        </div>
      )}

      <nav className="hub__filters" aria-label="Lernziele">
        <Button label="Alle Spiele" speak selected={filter === null} className="hub__filter" onClick={() => setFilter(null)}>
          <LayoutGrid size={32} strokeWidth={2.6} />
        </Button>
        {GOALS.map((g) => (
          <Button
            key={g.id}
            label={g.speech}
            speak
            selected={filter === g.id}
            className="hub__filter"
            onClick={() => setFilter((f) => (f === g.id ? null : g.id))}
          >
            <Art name={g.art} size={36} />
          </Button>
        ))}
      </nav>

      <main className="hub__grid screen--scroll">
        {games.map(({ meta, load }) => {
          const ready = !!load;
          return (
            <button
              key={meta.id}
              type="button"
              className={`tile ${ready ? '' : 'tile--locked'}`}
              style={{ ['--game-color' as string]: meta.color }}
              aria-label={ready ? meta.title : `${meta.title} – kommt bald`}
              onClick={() => {
                audio.unlock();
                audio.play('select');
                if (!ready) {
                  void audio.say({ text: `${meta.title} kommt bald!` });
                  return;
                }
                navigate({ name: 'lobby', gameId: meta.id });
              }}
            >
              <span className="tile__art">
                <Art name={meta.art} size={88} />
              </span>
              <span className="tile__title">{meta.title}</span>
              <span className="tile__goals">
                {meta.learningGoals.map((g) => (
                  <Art key={g} name={`goal.${g}`} size={24} />
                ))}
              </span>
              {savedIds.has(meta.id) && (
                <span className="tile__badge" aria-hidden>
                  <Play size={22} fill="currentColor" />
                </span>
              )}
              {!ready && (
                <span className="tile__lock" aria-hidden>
                  <Lock size={26} />
                </span>
              )}
            </button>
          );
        })}
      </main>
    </div>
  );
}
