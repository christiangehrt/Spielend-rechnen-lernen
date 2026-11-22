import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { audio } from '../../core/audio/AudioManager';
import type { SpeechPart } from '../../core/audio/phrases';

type Variant = 'default' | 'primary' | 'blue' | 'orange' | 'ghost';
type Size = 'normal' | 'big' | 'huge';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: boolean;
  pulse?: boolean;
  selected?: boolean;
  /** Accessible label; also spoken on press when `speak` is set. */
  label: string;
  speak?: SpeechPart[] | boolean;
  sound?: 'select' | 'click' | false;
}

/** Large touch button (≥ 56 px). Plays a soft click and optionally speaks its label. */
export function Button({
  children,
  variant = 'default',
  size = 'normal',
  icon = false,
  pulse = false,
  selected = false,
  label,
  speak,
  sound = 'select',
  className = '',
  onClick,
  ...rest
}: Props) {
  const classes = [
    'btn',
    variant !== 'default' && `btn--${variant}`,
    size !== 'normal' && `btn--${size}`,
    icon && 'btn--icon',
    pulse && 'btn--pulse',
    selected && 'btn--selected',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      aria-pressed={selected || undefined}
      onClick={(e) => {
        audio.unlock();
        if (sound) audio.play(sound);
        if (speak === true) void audio.say({ text: label });
        else if (Array.isArray(speak)) void audio.say(...speak);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
