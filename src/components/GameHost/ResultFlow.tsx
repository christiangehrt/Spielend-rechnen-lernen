import { BookOpen, Check, Home, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { assetUrl, useAssets } from '../../core/assets/manifests';
import { applyStars, computeStarAward, isNewRecord, recordGameStats } from '../../core/rewards/rewardEngine';
import { navigate } from '../../core/router';
import { getActiveProfile, updateProfile, useActiveProfile } from '../../core/storage/appStore';
import type { GameModule, GameResult, GameSetup } from '../../core/types/game';
import type { RewardEventType, StarAward } from '../../core/types/rewards';
import { Art } from '../shared/Art';
import { Button } from '../shared/Button';
import { Overlay } from '../shared/Overlay';
import { StarProgress } from '../shared/StarProgress';
import { Mascot } from '../shared/Mascot';

interface Props {
  mod: GameModule;
  setup: GameSetup;
  result: GameResult;
  canUndo: boolean;
  onUndo: () => void;
  onFinish: () => void;
  onRestart: () => void;
}

const EVENT_ART: Partial<Record<RewardEventType, string>> = {
  STRATEGY_REVERSE_JUMP: 'ui.footprints',
  STRATEGY_EQUATION_BUILT: 'goal.addition',
  STRATEGY_MULTI_SPLIT: 'goal.zerlegung',
  STRATEGY_TEN_BRIDGE: 'game.zahlenstrahl-huepfen',
  STRATEGY_INTERVAL_SPLIT: 'game.zahlen-detektiv',
};

type Phase =
  | { name: 'ask' }
  | { name: 'stars'; award: StarAward; chests: (string | null)[]; record: boolean }
  | { name: 'chest'; chests: (string | null)[]; index: number; opened: boolean };

/**
 * End-of-round flow. A lost round that can still be undone first asks
 * "undo or finish?" so a child can back out of a dead end. Stars are granted
 * exactly once, when the round is accepted.
 */
export function ResultFlow({ mod, setup, result, canUndo, onUndo, onFinish, onRestart }: Props) {
  const askFirst = !result.won && canUndo;
  const [phase, setPhase] = useState<Phase>({ name: 'ask' });
  const awarded = useRef(false);
  const assets = useAssets();
  const profile = useActiveProfile();

  const award = () => {
    if (awarded.current) return;
    awarded.current = true;
    const current = getActiveProfile();
    if (!current) return;
    const starAward = computeStarAward(result);
    const record = isNewRecord(current, mod.meta.id, result);
    const withBots = (mod.modes.find((m) => m.id === setup.mode)?.bots ?? 0) > 0;
    const withStats = recordGameStats(current, mod.meta.id, result, starAward.total, Date.now(), {
      preset: setup.presetId,
      ...(withBots ? { bot: setup.botLevel ?? 'anfaenger' } : {}),
    });
    const outcome = applyStars(
      withStats,
      starAward.total,
      assets.stickers.map((s) => s.id),
    );
    updateProfile(current.id, () => outcome.profile);
    onFinish();
    setPhase({ name: 'stars', award: starAward, chests: outcome.chests, record });
  };

  useEffect(() => {
    if (!askFirst) award();
    else void audio.say({ text: 'Oh, es geht nicht mehr weiter. Willst du zurück?' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase.name === 'ask') {
    if (!askFirst) return null;
    return (
      <Overlay label="Keine Züge mehr">
        <Mascot mood="think" size={120} />
        <div className="result__summary">
          {result.summary.map((s, i) => (
            <span key={i} className="result__chip">
              <Art name={s.art} size={40} /> {s.value}
            </span>
          ))}
        </div>
        <div className="overlay__row">
          <Button label="Rückgängig" variant="orange" size="huge" onClick={onUndo}>
            <Undo2 size={56} strokeWidth={3} />
          </Button>
          <Button label="Fertig" variant="primary" size="huge" onClick={award}>
            <Check size={56} strokeWidth={3} />
          </Button>
        </div>
      </Overlay>
    );
  }

  if (phase.name === 'stars') {
    return (
      <StarsPanel
        result={result}
        award={phase.award}
        record={phase.record}
        filled={profile?.starsTowardNextSticker ?? 0}
        total={profile?.totalStars ?? 0}
        hasChest={phase.chests.length > 0}
        onChest={() => setPhase({ name: 'chest', chests: phase.chests, index: 0, opened: false })}
        onRestart={onRestart}
      />
    );
  }

  const sticker = phase.chests[phase.index];
  const entry = assets.stickers.find((s) => s.id === sticker);
  const last = phase.index >= phase.chests.length - 1;
  return (
    <Overlay label="Schatztruhe">
      {!phase.opened ? (
        <button
          type="button"
          className="chest chest--closed"
          aria-label="Truhe öffnen"
          onClick={() => {
            audio.unlock();
            audio.play('chest');
            void audio.say(sticker ? 'new_sticker' : 'great');
            setPhase({ ...phase, opened: true });
          }}
        >
          <Art name="ui.gift" size={170} />
        </button>
      ) : (
        <div className="chest chest--open">
          {entry ? (
            <img src={assetUrl(entry.src)} width={170} height={170} alt="" className="chest__sticker" draggable={false} />
          ) : (
            <Art name="ui.trophy" size={170} />
          )}
        </div>
      )}
      {phase.opened && (
        <div className="overlay__row">
          {!last ? (
            <Button label="Nächste Truhe" variant="primary" size="huge" onClick={() => setPhase({ ...phase, index: phase.index + 1, opened: false })}>
              <Art name="ui.gift" size={64} />
            </Button>
          ) : (
            <>
              <Button label="Zum Album" variant="blue" size="huge" onClick={() => navigate({ name: 'album' })}>
                <BookOpen size={52} strokeWidth={2.6} />
              </Button>
              <Button label="Nochmal spielen" variant="primary" size="huge" onClick={onRestart}>
                <RotateCcw size={52} strokeWidth={3} />
              </Button>
              <Button label="Zur Startseite" size="huge" onClick={() => navigate({ name: 'hub' })}>
                <Home size={52} strokeWidth={2.6} />
              </Button>
            </>
          )}
        </div>
      )}
    </Overlay>
  );
}

function StarsPanel({
  result,
  award,
  record,
  filled,
  total,
  hasChest,
  onChest,
  onRestart,
}: {
  result: GameResult;
  award: StarAward;
  record: boolean;
  filled: number;
  total: number;
  hasChest: boolean;
  onChest: () => void;
  onRestart: () => void;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    audio.play(result.won ? 'fanfare' : 'success');
    void audio.say(result.won ? 'won' : 'well_done');
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setShown(i);
      audio.play('plop');
      if (i >= award.total) clearInterval(timer);
    }, 420);
    return () => clearInterval(timer);
  }, [award.total, result.won]);
  const strategy = award.events.filter((e) => e.startsWith('STRATEGY_'));
  return (
    <Overlay label={result.won ? 'Gewonnen' : 'Runde vorbei'}>
      <div className="result__hero">
        <Mascot mood={result.won ? 'cheer' : 'happy'} size={110} />
        <Art name={result.won ? 'ui.trophy' : 'ui.party'} size={80} />
      </div>
      {record && (
        <div className="result__record">
          <Art name="ui.medal" size={40} /> Rekord!
        </div>
      )}
      <div className="result__stars" aria-label={`${award.total} Sterne`}>
        {Array.from({ length: award.total }, (_, i) => (
          <span key={i} className={`result__star ${i < shown ? 'result__star--on' : ''}`}>
            <Art name="ui.star" size={64} />
          </span>
        ))}
      </div>
      <div className="result__summary">
        {result.summary.map((s, i) => (
          <span key={i} className="result__chip">
            <Art name={s.art} size={36} /> {s.value}
          </span>
        ))}
        {strategy.map((e) =>
          EVENT_ART[e] ? (
            <span key={e} className="result__chip result__chip--bonus">
              <Art name={EVENT_ART[e]!} size={36} /> +1 <Art name="ui.star" size={26} />
            </span>
          ) : null,
        )}
      </div>
      <StarProgress filled={hasChest ? 5 : filled} total={total} />
      <div className="overlay__row">
        {hasChest ? (
          <Button label="Schatztruhe öffnen" variant="primary" size="huge" pulse onClick={onChest}>
            <Art name="ui.gift" size={70} />
          </Button>
        ) : (
          <>
            <Button label="Nochmal spielen" variant="primary" size="huge" onClick={onRestart}>
              <RotateCcw size={52} strokeWidth={3} />
            </Button>
            <Button label="Zur Startseite" size="huge" onClick={() => navigate({ name: 'hub' })}>
              <Home size={52} strokeWidth={2.6} />
            </Button>
          </>
        )}
      </div>
    </Overlay>
  );
}
