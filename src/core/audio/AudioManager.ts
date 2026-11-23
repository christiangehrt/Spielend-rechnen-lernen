import { clipKeyFor, textFor, type SpeechPart } from './phrases';
import { findAudibleRange } from './trim';
import { getAllVoiceClips } from './voiceStore';

export type UiSound =
  | 'card'
  | 'flip'
  | 'click'
  | 'select'
  | 'plop'
  | 'hint'
  | 'success'
  | 'fanfare'
  | 'chest'
  | 'bell'
  | 'dice'
  | 'jump'
  | 'whoosh';

interface Clip {
  sprite: string;
  start: number;
  duration: number;
}

export interface SoundManifest {
  sprites: Record<string, { src: string }>;
  clips: Record<string, Clip>;
}

type AudioCtor = typeof AudioContext;

const getAudioCtor = (): AudioCtor | null =>
  (globalThis as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor }).AudioContext ??
  (globalThis as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext ??
  null;

const PREFERRED_VOICES = ['anna', 'petra', 'helena', 'katja', 'marlene', 'vicki', 'google deutsch', 'hedda'];

/**
 * Web Audio manager.
 *  - unlock(): call from the first user gesture (iOS/Chrome autoplay policy)
 *  - play(): short UI sounds from the pre-rendered sprite
 *  - say(): speech; own recordings first, then delivered clips, then speechSynthesis
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private manifest: SoundManifest = { sprites: {}, clips: {} };
  private baseUrl = './';
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer | null>>();
  private soundEnabled = true;
  private speechEnabled = true;
  private speechPrimed = false;
  private speechToken = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private speechSources: AudioBufferSourceNode[] = [];
  /** Parents' own recordings, decoded and trimmed. */
  private voice = new Map<string, { buffer: AudioBuffer; start: number; end: number }>();
  private voiceLoading: Promise<void> | null = null;

  configure(opts: { soundEnabled?: boolean; speechEnabled?: boolean }) {
    if (opts.soundEnabled !== undefined) this.soundEnabled = opts.soundEnabled;
    if (opts.speechEnabled !== undefined) {
      this.speechEnabled = opts.speechEnabled;
      if (!opts.speechEnabled) this.stopSpeech();
    }
  }

  setManifest(manifest: SoundManifest, baseUrl: string) {
    this.manifest = manifest;
    this.baseUrl = baseUrl;
    if (this.ctx) this.preload();
  }

  /** True once audio output really runs (the context was resumed inside a user gesture). */
  get isRunning() {
    return this.ctx?.state === 'running';
  }

  get isUnlocked() {
    return this.isRunning && this.speechPrimed;
  }

  /**
   * Call from user gestures. On touch devices only `touchend`/`click`/`keydown`
   * count as activation (not `pointerdown`), so pass `activation = false` for
   * early, non-activating events: the context is created (and sprites decode)
   * but resuming and speech priming are retried on the next real activation.
   * Safe to call repeatedly.
   */
  unlock(activation = true) {
    try {
      const Ctor = getAudioCtor();
      if (!this.ctx && Ctor) {
        this.ctx = new Ctor();
        this.preload();
      }
      if (!activation) return;
      if (this.ctx && this.ctx.state !== 'running') {
        void this.ctx.resume().catch(() => undefined);
        // A one-sample silent buffer fully unlocks output on iOS Safari.
        const silent = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = silent;
        src.connect(this.ctx.destination);
        src.start(0);
      }
      if (!this.speechPrimed && 'speechSynthesis' in globalThis) {
        // Speaking an empty utterance inside a gesture unlocks speech on iOS.
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        globalThis.speechSynthesis.speak(u);
        this.speechPrimed = true;
      }
    } catch {
      /* audio is optional – never break the app */
    }
  }

  private preload() {
    for (const id of Object.keys(this.manifest.sprites)) void this.loadSprite(id);
    void this.loadVoice();
  }

  private decode(data: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = this.ctx!;
    return new Promise<AudioBuffer>((resolve, reject) => {
      // Callback form for older Safari versions.
      const maybe = ctx.decodeAudioData(data, resolve, reject);
      if (maybe && typeof maybe.then === 'function') maybe.then(resolve, reject);
    });
  }

  /** (Re)loads the parents' recordings from IndexedDB. Needs an AudioContext (after the first tap). */
  loadVoice(force = false): Promise<void> {
    if (!this.ctx) return Promise.resolve();
    if (this.voiceLoading && !force) return this.voiceLoading;
    this.voiceLoading = (async () => {
      const clips = await getAllVoiceClips();
      const next = new Map<string, { buffer: AudioBuffer; start: number; end: number }>();
      for (const c of clips) {
        try {
          const buffer = await this.decode(await c.blob.arrayBuffer());
          const { start, end } = findAudibleRange(buffer.getChannelData(0), buffer.sampleRate);
          next.set(c.key, { buffer, start, end });
        } catch {
          /* undecodable recording (e.g. from another browser) – fall back to synthesis */
        }
      }
      this.voice = next;
    })().catch(() => undefined);
    return this.voiceLoading;
  }

  hasRecording(key: string) {
    return this.voice.has(key);
  }

  private playVoice(key: string): number | null {
    const v = this.voice.get(key);
    if (!v || !this.ctx) return null;
    try {
      if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
      const src = this.ctx.createBufferSource();
      src.buffer = v.buffer;
      src.connect(this.ctx.destination);
      src.start(0, v.start, Math.max(0.05, v.end - v.start));
      this.speechSources.push(src);
      src.onended = () => {
        this.speechSources = this.speechSources.filter((x) => x !== src);
      };
      return v.end - v.start;
    } catch {
      return null;
    }
  }

  /** Preview of a single recording in the parent area (ignores the speech setting). */
  previewRecording(key: string) {
    this.stopSpeech();
    this.playVoice(key);
  }

  private loadSprite(id: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(id);
    if (cached) return Promise.resolve(cached);
    const pending = this.loading.get(id);
    if (pending) return pending;
    const sprite = this.manifest.sprites[id];
    if (!sprite || !this.ctx) return Promise.resolve(null);
    const p = fetch(this.baseUrl + sprite.src)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((data) => this.decode(data))
      .then((buf) => {
        this.buffers.set(id, buf);
        return buf;
      })
      .catch(() => null);
    this.loading.set(id, p);
    return p;
  }

  private playClip(key: string): number | null {
    const clip = this.manifest.clips[key];
    if (!clip || !this.ctx) return null;
    const buffer = this.buffers.get(clip.sprite);
    if (!buffer) return null;
    try {
      if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.ctx.destination);
      src.start(0, clip.start, clip.duration);
      this.activeSources.push(src);
      src.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== src);
      };
      return clip.duration;
    } catch {
      return null;
    }
  }

  play(sound: UiSound) {
    if (!this.soundEnabled) return;
    this.playClip(sound);
  }

  hasClip(key: string) {
    return !!this.manifest.clips[key] && this.buffers.has(this.manifest.clips[key].sprite);
  }

  stopSpeech() {
    this.speechToken++;
    for (const src of this.speechSources) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
    this.speechSources = [];
    try {
      if ('speechSynthesis' in globalThis) globalThis.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }

  /**
   * Speaks a sentence built from parts. Consecutive parts without a recorded
   * clip are merged into one natural synthesis utterance. A new call
   * interrupts the previous sentence.
   */
  say(...parts: SpeechPart[]): Promise<void> {
    this.stopSpeech();
    if (!this.speechEnabled || parts.length === 0) return Promise.resolve();
    const token = this.speechToken;
    type Chunk = { voice: string } | { clip: string } | { text: string };
    const chunks: Chunk[] = [];
    for (const part of parts) {
      const key = clipKeyFor(part);
      if (key && this.hasRecording(key)) chunks.push({ voice: key });
      else if (key && this.hasClip(key)) chunks.push({ clip: key });
      else {
        const last = chunks[chunks.length - 1];
        if (last && 'text' in last) last.text += ` ${textFor(part)}`;
        else chunks.push({ text: textFor(part) });
      }
    }
    const run = async () => {
      for (const chunk of chunks) {
        if (token !== this.speechToken) return;
        if ('voice' in chunk) {
          const d = this.playVoice(chunk.voice);
          if (d) await wait(d * 1000 + 60);
        } else if ('clip' in chunk) {
          const d = this.playClip(chunk.clip);
          if (d) await wait(d * 1000 + 40);
        } else {
          await this.synthesize(chunk.text, token);
        }
      }
    };
    return run().catch(() => undefined);
  }

  private pickVoice(): SpeechSynthesisVoice | null | undefined {
    const voices = globalThis.speechSynthesis.getVoices();
    if (voices.length === 0) return undefined; // not loaded yet – rely on utterance.lang
    const german = voices.filter((v) => v.lang?.toLowerCase().startsWith('de'));
    if (german.length === 0) return null; // no German voice: stay silent instead of mispronouncing
    const preferred = german.find((v) => PREFERRED_VOICES.some((name) => v.name.toLowerCase().includes(name)));
    return preferred ?? german.find((v) => v.localService) ?? german[0];
  }

  private synthesize(text: string, token: number): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!('speechSynthesis' in globalThis) || token !== this.speechToken) return resolve();
        const voice = this.pickVoice();
        if (voice === null) return resolve();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'de-DE';
        if (voice) u.voice = voice;
        u.rate = 0.92;
        u.pitch = 1.05;
        const timeout = setTimeout(resolve, 600 + text.length * 120);
        u.onend = u.onerror = () => {
          clearTimeout(timeout);
          resolve();
        };
        globalThis.speechSynthesis.speak(u);
      } catch {
        resolve();
      }
    });
  }
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const audio = new AudioManager();
