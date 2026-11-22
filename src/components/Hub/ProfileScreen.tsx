import { ArrowLeft, Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { navigate } from '../../core/router';
import { addProfile, setActiveProfile, useAppData } from '../../core/storage/appStore';
import { Art } from '../shared/Art';
import { Button } from '../shared/Button';
import { AVATARS } from './avatars';
import './ProfileScreen.css';

/**
 * First run: welcome + avatar choice (no reading needed, name is optional).
 * Later: profile picker with "+" to add another child.
 */
export function ProfileScreen({ firstRun }: { firstRun: boolean }) {
  const app = useAppData();
  const [creating, setCreating] = useState(firstRun);

  if (creating) {
    return (
      <CreateProfile
        firstRun={firstRun}
        onCancel={firstRun ? undefined : () => setCreating(false)}
        onDone={() => navigate({ name: 'hub' }, true)}
      />
    );
  }

  return (
    <div className="screen profiles">
      <header className="topbar">
        <Button label="Zurück" icon size="big" onClick={() => navigate({ name: 'hub' })}>
          <ArrowLeft size={36} strokeWidth={2.6} />
        </Button>
      </header>
      <main className="profiles__list screen--scroll">
        {app.profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`profiles__card ${p.id === app.activeProfileId ? 'profiles__card--active' : ''}`}
            aria-label={p.name || 'Profil'}
            onClick={() => {
              audio.play('select');
              if (p.name) void audio.say({ text: `Hallo ${p.name}!` });
              setActiveProfile(p.id);
              navigate({ name: 'hub' });
            }}
          >
            <Art name={p.avatarId} size={110} />
            <span className="profiles__name">{p.name}</span>
            <span className="profiles__stars">
              <Art name="ui.star" size={26} /> {p.totalStars}
            </span>
          </button>
        ))}
        <button type="button" className="profiles__card profiles__card--add" aria-label="Neues Profil" onClick={() => setCreating(true)}>
          <Plus size={80} strokeWidth={3} />
        </button>
      </main>
    </div>
  );
}

function CreateProfile({ firstRun, onCancel, onDone }: { firstRun: boolean; onCancel?: () => void; onDone: () => void }) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('');
  return (
    <div className="screen profiles screen--scroll">
      {onCancel && (
        <header className="topbar">
          <Button label="Zurück" icon size="big" onClick={onCancel}>
            <ArrowLeft size={36} strokeWidth={2.6} />
          </Button>
        </header>
      )}
      <main className="create">
        {firstRun && (
          <div className="create__welcome">
            <Art name="game.rauf-runter" size={64} />
            <Art name="game.klappen-zu" size={64} />
            <Art name="game.zahlenstrahl-huepfen" size={64} />
            <h1>Spielend rechnen lernen</h1>
          </div>
        )}
        <div className="create__avatars" role="radiogroup" aria-label="Wähle dein Tier">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              className={`create__avatar ${avatar === a ? 'create__avatar--on' : ''}`}
              aria-label={a.replace('avatar.', '')}
              aria-pressed={avatar === a}
              onClick={() => {
                audio.unlock();
                audio.play('plop');
                setAvatar(a);
              }}
            >
              <Art name={a} size={72} />
            </button>
          ))}
        </div>
        <label className="create__name">
          <span className="sr-only">Name (optional, für Eltern)</span>
          <input
            type="text"
            value={name}
            maxLength={20}
            placeholder="Name (optional)"
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </label>
        <Button
          label="Fertig"
          variant="primary"
          size="huge"
          pulse={!!avatar}
          disabled={!avatar}
          onClick={() => {
            if (!avatar) return;
            addProfile(name.trim(), avatar);
            audio.play('success');
            onDone();
          }}
        >
          <Check size={60} strokeWidth={3.2} />
        </Button>
      </main>
    </div>
  );
}
