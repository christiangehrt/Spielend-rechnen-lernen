import { assetUrl, useAssets } from '../../core/assets/manifests';

interface Props {
  name: string;
  size?: number;
  className?: string;
  title?: string;
}

/** Renders artwork by manifest key (art.json); falls back to the emoji glyph. */
export function Art({ name, size = 48, className = '', title }: Props) {
  const { art } = useAssets();
  const entry = art[name];
  if (entry?.src) {
    return (
      <img
        className={`art ${className}`}
        src={assetUrl(entry.src)}
        width={size}
        height={size}
        alt={title ?? ''}
        draggable={false}
      />
    );
  }
  return (
    <span className={`art art--emoji ${className}`} style={{ width: size, height: size, fontSize: size * 0.85 }} aria-hidden>
      {entry?.emoji ?? '⬜'}
    </span>
  );
}
