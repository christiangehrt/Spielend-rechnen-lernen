import { Mic, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { buildVoiceCatalog, type VoiceItem } from '../../core/audio/voiceCatalog';
import { clearVoiceClips, deleteVoiceClip, getAllVoiceClips, putVoiceClip, voiceStoreAvailable } from '../../core/audio/voiceStore';
import { GAMES } from '../../games/registry';

const SHORT_MAX = 5; // seconds for words and short sentences
const LONG_MAX = 40; // seconds for game explanations

const pickMime = () => {
  const candidates = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
  try {
    return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
  } catch {
    return '';
  }
};

const recordingSupported = () =>
  typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

/**
 * Parents record numbers and phrases in their own voice. The child then hears
 * the familiar voice instead of the device's speech synthesis.
 */
export function VoiceRecorder() {
  const catalog = useMemo(() => buildVoiceCatalog(GAMES.map((g) => g.meta)), []);
  const essential = useMemo(() => catalog.filter((g) => !g.optional).flatMap((g) => g.items), [catalog]);
  const [recorded, setRecorded] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState<{ key: string; max: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Guards against double taps while the microphone is still starting. */
  const starting = useRef(false);
  const startedAt = useRef(0);

  const refresh = useCallback(async () => {
    const clips = await getAllVoiceClips();
    setRecorded(new Set(clips.map((c) => c.key)));
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [refresh]);

  const nextMissing = essential.find((i) => !recorded.has(i.key)) ?? null;
  const doneCount = essential.filter((i) => recorded.has(i.key)).length;

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  };

  const start = async (item: VoiceItem) => {
    audio.unlock();
    if (recorder.current?.state === 'recording') {
      // Ignore an accidental double tap right after the start.
      if (performance.now() - startedAt.current > 400) stop();
      return;
    }
    if (starting.current) return;
    starting.current = true;
    setError(null);
    try {
      stream.current ??= await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      starting.current = false;
      setError('Kein Zugriff auf das Mikrofon. Bitte in den Browser-Einstellungen erlauben (funktioniert nur über https).');
      return;
    }
    const mime = pickMime();
    const rec = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = async () => {
      setRecording(null);
      const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' });
      if (blob.size < 500) {
        setError('Die Aufnahme war leer. Bitte nochmal versuchen.');
        return;
      }
      try {
        await putVoiceClip(item.key, blob);
        await audio.loadVoice(true);
        await refresh();
        setLastKey(item.key);
        audio.previewRecording(item.key);
      } catch {
        setError('Die Aufnahme konnte nicht gespeichert werden.');
      }
    };
    recorder.current = rec;
    rec.start();
    startedAt.current = performance.now();
    starting.current = false;
    const max = item.long ? LONG_MAX : SHORT_MAX;
    setRecording({ key: item.key, max });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(stop, max * 1000);
  };

  const remove = async (key: string) => {
    await deleteVoiceClip(key);
    await audio.loadVoice(true);
    await refresh();
  };

  const removeAll = async () => {
    if (!confirm('Alle eigenen Aufnahmen löschen?')) return;
    await clearVoiceClips();
    await audio.loadVoice(true);
    await refresh();
  };

  if (!voiceStoreAvailable() || !recordingSupported()) {
    return (
      <p className="parent__note">
        Dieser Browser unterstützt keine Tonaufnahmen. Auf aktuellen Tablets (Safari, Chrome) funktioniert es über die
        installierte App bzw. über https.
      </p>
    );
  }

  const recordButton = (item: VoiceItem) => {
    const active = recording?.key === item.key;
    return (
      <button
        type="button"
        className={`voice__btn voice__btn--rec ${active ? 'voice__btn--active' : ''}`}
        aria-label={active ? 'Aufnahme stoppen' : `„${item.text}“ aufnehmen`}
        disabled={!!recording && !active}
        onClick={() => void start(item)}
      >
        {active ? <Square size={20} fill="currentColor" /> : <Mic size={22} />}
      </button>
    );
  };

  return (
    <div className="voice">
      <p className="parent__note">
        Nehmen Sie Zahlen und Sätze mit Ihrer eigenen Stimme auf – Ihr Kind hört dann Sie statt der Computerstimme.
        Pausen am Anfang und Ende werden automatisch abgeschnitten. Fehlende Aufnahmen spricht weiterhin die
        Computerstimme. Die Aufnahmen bleiben auf diesem Gerät (und sind in der JSON-Sicherung enthalten).
      </p>
      <p className="parent__note">
        Tipp: Schon die Zahlen 0–20 machen den größten Unterschied (ca. 5 Minuten). Einfach auf das Mikrofon tippen,
        sprechen, nochmal tippen – der Assistent springt automatisch zum nächsten Wort.
      </p>

      <div className="voice__assistant">
        <div className="voice__progress">
          <span>
            {doneCount} von {essential.length} wichtigen Aufnahmen
          </span>
          <span className="voice__bar">
            <span style={{ width: `${(doneCount / essential.length) * 100}%` }} />
          </span>
        </div>
        {nextMissing ? (
          <div className="voice__next">
            <span className="voice__say">„{nextMissing.text}“</span>
            {recordButton(nextMissing)}
            {lastKey && recorded.has(lastKey) && !recording && (
              <>
                <button type="button" className="voice__btn" aria-label="Letzte Aufnahme anhören" onClick={() => audio.previewRecording(lastKey)}>
                  <Play size={20} />
                </button>
                <button
                  type="button"
                  className="voice__btn"
                  aria-label="Letzte Aufnahme wiederholen"
                  onClick={() => {
                    const item = essential.find((i) => i.key === lastKey) ?? catalog.flatMap((g) => g.items).find((i) => i.key === lastKey);
                    if (item) void start(item);
                  }}
                >
                  <RotateCcw size={20} />
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="parent__note">Alle wichtigen Aufnahmen sind fertig. Optional: Spielerklärungen und Zahlen bis 100.</p>
        )}
        {recording && (
          <span className="voice__timer" key={recording.key}>
            <span style={{ animationDuration: `${recording.max}s` }} />
          </span>
        )}
        {error && <p className="parent__msg err">{error}</p>}
      </div>

      {catalog.map((group) => {
        const count = group.items.filter((i) => recorded.has(i.key)).length;
        return (
          <details key={group.id} className="voice__group">
            <summary>
              {group.title} <small>({count}/{group.items.length})</small>
              {group.optional && <small> · optional</small>}
            </summary>
            {group.hint && <p className="parent__note">{group.hint}</p>}
            <ul className="voice__list">
              {group.items.map((item) => (
                <li key={item.key} className={recorded.has(item.key) ? 'voice__item voice__item--done' : 'voice__item'}>
                  <span className={`voice__text ${item.long ? 'voice__text--long' : ''}`}>{item.text}</span>
                  {recordButton(item)}
                  <button
                    type="button"
                    className="voice__btn"
                    aria-label="Anhören"
                    disabled={!recorded.has(item.key)}
                    onClick={() => audio.previewRecording(item.key)}
                  >
                    <Play size={20} />
                  </button>
                  <button
                    type="button"
                    className="voice__btn"
                    aria-label="Löschen"
                    disabled={!recorded.has(item.key)}
                    onClick={() => void remove(item.key)}
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </details>
        );
      })}

      {recorded.size > 0 && (
        <button type="button" className="parent__btn parent__btn--danger voice__clear" onClick={() => void removeAll()}>
          <Trash2 size={20} /> Alle Aufnahmen löschen
        </button>
      )}
    </div>
  );
}
