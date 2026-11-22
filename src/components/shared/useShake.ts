import { useCallback, useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import type { SpeechPart } from '../../core/audio/phrases';

/**
 * Gentle "wrong move" feedback: shake the element with the given key, play the
 * soft hint sound and optionally a neutral spoken hint. No harsh error sound.
 */
export function useShake() {
  const [shaking, setShaking] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake = useCallback((key: string, ...hint: SpeechPart[]) => {
    if (timer.current) clearTimeout(timer.current);
    setShaking(null);
    requestAnimationFrame(() => setShaking(key));
    audio.play('hint');
    if (hint.length) void audio.say(...hint);
    timer.current = setTimeout(() => setShaking(null), 480);
  }, []);
  const cls = useCallback((key: string) => (shaking === key ? 'shake' : ''), [shaking]);
  return { shake, shakeClass: cls };
}
