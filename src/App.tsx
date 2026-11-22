import { useEffect, useState } from 'react';
import { audio } from './core/audio/AudioManager';
import { AssetsContext, BASE_URL, loadManifests, type Manifests } from './core/assets/manifests';
import { useRoute } from './core/router';
import { useActiveProfile, useAppData } from './core/storage/appStore';
import { GameHost } from './components/GameHost/GameHost';
import { Hub } from './components/Hub/Hub';
import { Lobby } from './components/Hub/Lobby';
import { ProfileScreen } from './components/Hub/ProfileScreen';
import { ParentArea } from './components/ParentGate/ParentArea';
import { StickerAlbum } from './components/StickerAlbum/StickerAlbum';

export function App() {
  const [manifests, setManifests] = useState<Manifests | null>(null);
  const app = useAppData();
  const profile = useActiveProfile();
  const route = useRoute();

  useEffect(() => {
    loadManifests().then((m) => {
      audio.setManifest(m.sounds, BASE_URL);
      setManifests(m);
    });
  }, []);

  // Audio unlock (iOS / Chrome autoplay policy): pointerdown only prepares the
  // AudioContext; touchend/click/keydown are real activations. Listeners stay
  // until audio output actually runs.
  useEffect(() => {
    const prepare = () => audio.unlock(false);
    const activate = () => {
      audio.unlock(true);
      if (audio.isUnlocked) {
        // resume() is async – check again shortly before removing the listeners
        setTimeout(() => {
          if (audio.isUnlocked) remove();
        }, 300);
      }
    };
    const events = ['touchend', 'click', 'keydown'] as const;
    const remove = () => {
      window.removeEventListener('pointerdown', prepare, true);
      events.forEach((e) => window.removeEventListener(e, activate, true));
    };
    window.addEventListener('pointerdown', prepare, true);
    events.forEach((e) => window.addEventListener(e, activate, true));
    return remove;
  }, []);

  useEffect(() => {
    if (profile) audio.configure({ soundEnabled: profile.settings.soundEnabled, speechEnabled: profile.settings.speechEnabled });
  }, [profile]);

  if (!manifests) return <div className="app"><div className="loading">⏳</div></div>;

  let screen;
  if (app.profiles.length === 0 || !profile) screen = <ProfileScreen firstRun={app.profiles.length === 0} />;
  else if (route.name === 'parent') screen = <ParentArea />;
  else if (route.name === 'profiles') screen = <ProfileScreen firstRun={false} />;
  else if (route.name === 'album') screen = <StickerAlbum />;
  else if (route.name === 'lobby') screen = <Lobby gameId={route.gameId} />;
  else if (route.name === 'play') screen = <GameHost gameId={route.gameId} />;
  else screen = <Hub />;

  return (
    <AssetsContext.Provider value={manifests}>
      <div className="app">{screen}</div>
    </AssetsContext.Provider>
  );
}
