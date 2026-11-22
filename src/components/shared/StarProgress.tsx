import { STARS_PER_CHEST } from '../../core/rewards/rewardEngine';
import { Art } from './Art';
import './StarProgress.css';

/** Five star slots toward the next sticker chest. */
export function StarProgress({ filled, total, compact = false }: { filled: number; total?: number; compact?: boolean }) {
  return (
    <div className={`starprog ${compact ? 'starprog--compact' : ''}`} aria-label={`${filled} von ${STARS_PER_CHEST} Sternen bis zur Schatztruhe`}>
      {total !== undefined && (
        <span className="starprog__total">
          <Art name="ui.star" size={compact ? 26 : 32} />
          {total}
        </span>
      )}
      <span className="starprog__slots">
        {Array.from({ length: STARS_PER_CHEST }, (_, i) => (
          <span key={i} className={`starprog__slot ${i < filled ? 'starprog__slot--on' : ''}`}>
            {i < filled ? <Art name="ui.star" size={compact ? 20 : 26} /> : null}
          </span>
        ))}
      </span>
      <Art name="ui.gift" size={compact ? 30 : 38} className="starprog__chest" />
    </div>
  );
}
