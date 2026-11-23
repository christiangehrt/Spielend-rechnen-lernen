/**
 * Finds the audible part of a recording so clips can be chained without long
 * pauses ("7 – plus – 6"). Returns start/end in seconds incl. a small padding.
 */
export const findAudibleRange = (
  samples: Float32Array,
  sampleRate: number,
  threshold = 0.03,
  padSeconds = 0.06,
): { start: number; end: number } => {
  let first = -1;
  let last = -1;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > threshold) {
      if (first === -1) first = i;
      last = i;
    }
  }
  const duration = samples.length / sampleRate;
  if (first === -1) return { start: 0, end: duration };
  const pad = padSeconds * sampleRate;
  return {
    start: Math.max(0, (first - pad) / sampleRate),
    end: Math.min(duration, (last + pad) / sampleRate),
  };
};
