import { audio } from '../../core/audio/AudioManager';
import type { SpeechPart } from '../../core/audio/phrases';
import { Art } from './Art';
import './Mascot.css';

export type MascotMood = 'happy' | 'cheer' | 'think';

interface Props {
  mood?: MascotMood;
  size?: number;
  /** What Pünktchen says when tapped (random pick per tap). */
  lines?: SpeechPart[][];
  className?: string;
}

/** "Pünktchen" – the app's guide character (five dots in a row on its belly). */
export function Mascot({ mood = 'happy', size = 110, lines, className = '' }: Props) {
  const body = <Art name={`mascot.${mood}`} size={size} />;
  if (!lines?.length) {
    return (
      <span className={`mascot mascot--${mood} ${className}`} aria-hidden>
        {body}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`mascot mascot--${mood} mascot--tap ${className}`}
      aria-label="Pünktchen"
      onClick={() => {
        audio.unlock();
        audio.play('plop');
        void audio.say(...lines[Math.floor(Math.random() * lines.length)]);
      }}
    >
      {body}
    </button>
  );
}
