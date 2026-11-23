import { ArrowLeft, Download, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { navigate } from '../../core/router';
import {
  addProfile,
  deleteProfile,
  restoreBackup,
  setActiveProfile,
  updateProfile,
  updateSettings,
  useActiveProfile,
  useAppData,
} from '../../core/storage/appStore';
import { backupFileName, buildBackup, parseBackup } from '../../core/storage/backup';
import { audio } from '../../core/audio/AudioManager';
import { exportVoiceClips, importVoiceClips } from '../../core/audio/voiceStore';
import { VoiceRecorder } from './VoiceRecorder';
import { GameProgressTable, SkillOverview } from './LearningProgress';
import { isPersistent } from '../../core/storage/kv';
import type { NumberRange, ProfileSettings } from '../../core/types/profile';
import { Art } from '../shared/Art';
import { Button } from '../shared/Button';
import { HoldButton } from '../shared/HoldButton';
import { AVATARS } from '../Hub/avatars';
import { isParentAreaUnlocked, lockParentArea, unlockParentArea } from './parentGate';
import './ParentArea.css';

export function ParentArea() {
  const [unlocked, setUnlocked] = useState(isParentAreaUnlocked());
  if (!unlocked) {
    return (
      <div className="screen parent parent--gate">
        <header className="topbar">
          <Button label="Zurück" icon size="big" onClick={() => navigate({ name: 'hub' })}>
            <ArrowLeft size={36} strokeWidth={2.6} />
          </Button>
        </header>
        <div className="parent__gate">
          <p>Elternbereich: Schloss 3 Sekunden gedrückt halten.</p>
          <HoldButton
            label="Elternbereich öffnen"
            onUnlock={() => {
              unlockParentArea();
              setUnlocked(true);
            }}
          />
        </div>
      </div>
    );
  }
  return <ParentContent />;
}

const SETTING_LABELS: { key: keyof Omit<ProfileSettings, 'defaultNumberRange'>; label: string; hint: string }[] = [
  { key: 'showDotPatterns', label: 'Punktemuster auf Karten', hint: '5er-/10er-Feld-Struktur als Zählhilfe' },
  { key: 'showNumberLineHelper', label: 'Mini-Zahlenstrahl', hint: 'Ausklappbare Zahlenstrahl-Hilfe in den Spielen' },
  {
    key: 'adaptiveDifficulty',
    label: 'Schwierigkeit wächst mit',
    hint: 'Nach 3 sicheren Runden wird die nächste Stufe empfohlen, nach 3 schweren eine leichtere (gegen Roboter: Roboter-Stärke)',
  },
  { key: 'soundEnabled', label: 'Geräusche', hint: 'Karten, Klappen, Sterne …' },
  { key: 'speechEnabled', label: 'Sprachausgabe', hint: 'Zahlen und Hinweise werden vorgelesen' },
];

function ParentContent() {
  const app = useAppData();
  const profile = useActiveProfile();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [voices, setVoices] = useState<string[] | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
    const readVoices = () => {
      try {
        const list = globalThis.speechSynthesis?.getVoices() ?? [];
        setVoices(list.filter((v) => v.lang.toLowerCase().startsWith('de')).map((v) => v.name));
      } catch {
        setVoices([]);
      }
    };
    readVoices();
    globalThis.speechSynthesis?.addEventListener?.('voiceschanged', readVoices);
    return () => globalThis.speechSynthesis?.removeEventListener?.('voiceschanged', readVoices);
  }, []);

  if (!profile) return null;
  const s = profile.settings;

  const exportBackup = async () => {
    const voice = await exportVoiceClips().catch(() => []);
    const blob = new Blob([JSON.stringify(buildBackup(app, new Date(), voice), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMessage({
      ok: true,
      text: `Sicherung wurde als JSON-Datei heruntergeladen${voice.length ? ` (inkl. ${voice.length} Sprachaufnahmen)` : ''}.`,
    });
  };

  const importBackup = async (file: File) => {
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      setMessage({ ok: false, text: parsed.reason });
      return;
    }
    const n = parsed.backup.app.profiles.length;
    if (!confirm(`Sicherung mit ${n} Profil(en) laden? Alle aktuellen Profile und Spielstände werden ersetzt.`)) return;
    restoreBackup(parsed.backup);
    if (parsed.backup.voice?.length) {
      await importVoiceClips(parsed.backup.voice).catch(() => undefined);
      await audio.loadVoice(true);
    }
    setMessage({
      ok: true,
      text: `Sicherung geladen: ${n} Profil(e)${parsed.backup.voice?.length ? `, ${parsed.backup.voice.length} Sprachaufnahmen` : ''}.`,
    });
  };

  const requestPersist = async () => {
    try {
      const ok = await navigator.storage?.persist?.();
      setPersisted(!!ok);
    } catch {
      setPersisted(false);
    }
  };

  return (
    <div className="screen parent screen--scroll">
      <header className="topbar parent__bar">
        <Button
          label="Zurück"
          icon
          size="big"
          onClick={() => {
            lockParentArea();
            navigate({ name: 'hub' });
          }}
        >
          <ArrowLeft size={36} strokeWidth={2.6} />
        </Button>
        <h1>Elternbereich</h1>
      </header>

      <div className="parent__content">
        <section className="parent__section">
          <h2>Profil</h2>
          <div className="parent__profiles">
            {app.profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`parent__profile ${p.id === profile.id ? 'parent__profile--on' : ''}`}
                onClick={() => setActiveProfile(p.id)}
              >
                <Art name={p.avatarId} size={44} />
                <span>{p.name || 'Ohne Namen'}</span>
              </button>
            ))}
            <button type="button" className="parent__profile" onClick={() => addProfile('', AVATARS[app.profiles.length % AVATARS.length])}>
              + Neues Profil
            </button>
          </div>
          <label className="parent__field">
            <span>Name</span>
            <input
              type="text"
              value={profile.name}
              maxLength={20}
              onChange={(e) => updateProfile(profile.id, (p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <div className="parent__field">
            <span>Tier</span>
            <div className="parent__avatars">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-label={a}
                  className={`parent__avatar ${profile.avatarId === a ? 'parent__avatar--on' : ''}`}
                  onClick={() => updateProfile(profile.id, (p) => ({ ...p, avatarId: a }))}
                >
                  <Art name={a} size={36} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="parent__section">
          <h2>Einstellungen für {profile.name || 'dieses Profil'}</h2>
          <div className="parent__field">
            <span>Standard-Zahlenraum</span>
            <div className="parent__seg">
              {([10, 20, 100] as NumberRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={s.defaultNumberRange === r ? 'on' : ''}
                  onClick={() => updateSettings(profile.id, { defaultNumberRange: r })}
                >
                  bis {r}
                  {r === 100 ? ' (Profi)' : ''}
                </button>
              ))}
            </div>
          </div>
          {SETTING_LABELS.map(({ key, label, hint }) => (
            <label key={key} className="parent__toggle">
              <input type="checkbox" checked={s[key]} onChange={(e) => updateSettings(profile.id, { [key]: e.target.checked })} />
              <span className="parent__switch" aria-hidden />
              <span>
                {label}
                <small>{hint}</small>
              </span>
            </label>
          ))}
          {voices !== null && (
            <p className="parent__note">
              {voices.length > 0
                ? `Deutsche Stimme gefunden: ${voices[0]}.`
                : 'Auf diesem Gerät wurde (noch) keine deutsche Computerstimme gefunden. Nehmen Sie unten Ihre eigene Stimme auf oder installieren Sie in den Geräte-Einstellungen eine deutsche Stimme – sonst werden Zahlen nicht vorgelesen.'}
            </p>
          )}
        </section>

        <section className="parent__section">
          <h2>Eigene Stimme</h2>
          <VoiceRecorder />
        </section>

        <section className="parent__section">
          <h2>Statistik</h2>
          <GameProgressTable profile={profile} />
          <p className="parent__note">
            Gesamt: {profile.totalStars} Sterne · {profile.unlockedStickerIds.length} Sticker. Punkte bei „Letzte Runden“:
            grün = auf dieser Stufe gut geschafft.
          </p>
        </section>

        <section className="parent__section">
          <h2>Lernstand</h2>
          <SkillOverview profile={profile} />
        </section>

        <section className="parent__section">
          <h2>Sicherung (JSON)</h2>
          <p className="parent__note">
            Safari kann Daten von Web-Apps, die nicht auf dem Home-Bildschirm installiert sind, nach 7 Tagen ohne Nutzung
            löschen. Sichern Sie Profile und Sticker-Album regelmäßig – oder installieren Sie die App: In Safari auf{' '}
            <b>Teilen → Zum Home-Bildschirm</b> tippen (Android/Chrome: Menü → <b>App installieren</b>).
          </p>
          <div className="parent__actions">
            <button type="button" className="parent__btn" onClick={() => void exportBackup()}>
              <Download size={22} /> Sicherung exportieren
            </button>
            <button type="button" className="parent__btn" onClick={() => fileInput.current?.click()}>
              <Upload size={22} /> Sicherung importieren
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importBackup(f);
                e.target.value = '';
              }}
            />
          </div>
          {message && <p className={`parent__msg ${message.ok ? 'ok' : 'err'}`}>{message.text}</p>}
          <p className="parent__note">
            Speicher: {isPersistent() ? 'lokal auf diesem Gerät' : 'nicht verfügbar (privater Modus?) – Daten gehen beim Schließen verloren'}
            {persisted === true && ' · dauerhaft geschützt'}
            {persisted === false && (
              <>
                {' · '}
                <button type="button" className="parent__link" onClick={requestPersist}>
                  dauerhaften Speicher anfragen
                </button>
              </>
            )}
          </p>
        </section>

        <section className="parent__section parent__danger">
          <h2>Profil löschen</h2>
          <button
            type="button"
            className="parent__btn parent__btn--danger"
            onClick={() => {
              if (confirm(`Profil „${profile.name || 'ohne Namen'}“ mit allen Sternen, Stickern und Spielständen löschen?`)) {
                deleteProfile(profile.id);
              }
            }}
          >
            <Trash2 size={22} /> Dieses Profil löschen
          </button>
        </section>

        <section className="parent__section parent__about">
          <h2>Info</h2>
          <p className="parent__note">
            Alle Daten bleiben auf diesem Gerät – kein Konto, keine Werbung, kein Tracking. Die Spiele funktionieren nach dem
            ersten Laden auch offline.
          </p>
          <p className="parent__note">
            Alle Illustrationen, die Leitfigur Pünktchen und die Geräusche wurden für diese App per Code erstellt. Schriften:
            Fredoka &amp; Nunito (SIL Open Font License). Icons: Lucide (ISC).
          </p>
        </section>
      </div>
    </div>
  );
}
