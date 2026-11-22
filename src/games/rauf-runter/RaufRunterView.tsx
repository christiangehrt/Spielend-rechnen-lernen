import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { audio } from '../../core/audio/AudioManager';
import { MiniNumberLine, type LineMarker } from '../../core/scaffolding/MiniNumberLine';
import type { GameViewProps } from '../../core/types/game';
import { Art } from '../../components/shared/Art';
import { NumberCard } from '../../components/shared/NumberCard';
import { PassAndPlayOverlay } from '../../components/shared/PassAndPlayOverlay';
import { useDragDrop } from '../../components/shared/useDragDrop';
import { useShake } from '../../components/shared/useShake';
import { activePlayer, canEndTurn, canPlayCard, getRequiredPlays, getTopCard, isReverseJump } from './engine';
import type { Pile, TheGameAction, TheGameState } from './types';
import './RaufRunter.css';

export function RaufRunterView({ state, dispatch, settings }: GameViewProps<TheGameState, TheGameAction>) {
  const { shake, shakeClass } = useShake();
  const player = activePlayer(state);
  const delta = state.preset.reverseJumpDelta;
  const selected = state.selectedCard;
  const required = getRequiredPlays(state);
  const endAllowed = canEndTurn(state);

  const select = (card: number) => {
    if (state.selectedCard !== card) {
      audio.play('select');
      void audio.say(card);
    }
    dispatch({ type: 'SELECT_CARD', card });
  };

  const tryPlay = (card: number, pile: Pile) => {
    if (!canPlayCard(card, pile, delta)) {
      shake(pile.id, 'not_here');
      return;
    }
    const jump = isReverseJump(card, pile, delta);
    audio.play('card');
    if (jump) {
      audio.play('success');
      void audio.say(delta === 5 ? 'five_jump' : 'ten_jump');
    }
    dispatch({ type: 'PLAY_CARD', card, pileId: pile.id });
  };

  const dnd = useDragDrop<number>({
    onDragStart: (card) => {
      if (state.selectedCard !== card) select(card);
    },
    onTap: (card) => select(card),
    onDrop: (card, pileId) => {
      const pile = state.piles.find((p) => p.id === pileId);
      if (pile) tryPlay(card, pile);
    },
  });

  const onPileTap = (pile: Pile) => {
    if (selected === null) {
      audio.play('select');
      void audio.say(getTopCard(pile));
      return;
    }
    tryPlay(selected, pile);
  };

  const onEndTurn = () => {
    if (!endAllowed) {
      const missing = required - state.cardsPlayedThisTurn;
      shake('turn', { text: missing === 1 ? 'Lege noch eine Karte.' : `Lege noch ${missing} Karten.` });
      return;
    }
    audio.play('card');
    dispatch({ type: 'END_TURN' });
  };

  const dragCard = dnd.drag?.item ?? null;
  const activeCard = dragCard ?? selected;

  const markers: LineMarker[] = [
    ...state.piles.map((p) => ({
      value: getTopCard(p),
      tone: (p.direction === 'asc' ? 'up' : 'down') as LineMarker['tone'],
      label: p.direction === 'asc' ? '▲' : '▼',
    })),
    ...(activeCard !== null ? [{ value: activeCard, tone: 'select' as const, label: String(activeCard) }] : []),
  ];
  const lineMax = state.preset.descendingStarts[0];

  const ascPiles = state.piles.filter((p) => p.direction === 'asc');
  const descPiles = state.piles.filter((p) => p.direction === 'desc');

  const renderPile = (pile: Pile) => {
    const top = getTopCard(pile);
    const valid = activeCard !== null && canPlayCard(activeCard, pile, delta);
    const jump = activeCard !== null && isReverseJump(activeCard, pile, delta);
    const hover = dnd.drag?.over === pile.id;
    const cls = [
      'rr-pile',
      `rr-pile--${pile.direction}`,
      valid && 'rr-pile--valid',
      jump && 'rr-pile--jump',
      activeCard !== null && !valid && 'rr-pile--blocked',
      hover && 'rr-pile--hover',
      shakeClass(pile.id),
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <button
        key={pile.id}
        type="button"
        ref={dnd.target(pile.id)}
        className={cls}
        aria-label={`${pile.direction === 'asc' ? 'Aufwärts' : 'Abwärts'}-Stapel, oben liegt ${top}`}
        onClick={() => onPileTap(pile)}
      >
        <span className="rr-pile__head">
          {pile.direction === 'asc' ? <ArrowUp size={34} strokeWidth={3.2} /> : <ArrowDown size={34} strokeWidth={3.2} />}
        </span>
        {pile.cards.length === 0 ? (
          <span className="rr-pile__start">{pile.startValue}</span>
        ) : (
          <NumberCard
            as="div"
            value={top}
            size="lg"
            showDots={settings.showDotPatterns}
            tone={pile.direction === 'asc' ? 'up' : 'down'}
          />
        )}
        {jump && (
          <span className="rr-pile__badge">
            ↩ {pile.direction === 'asc' ? '−' : '+'}
            {delta}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="rr">
      <div className="rr__table">
        <div className="rr__piles">{ascPiles.map(renderPile)}</div>
        <div className="rr__deck" aria-label={`${state.deck.length} Karten im Stapel`}>
          <div className={`rr__deck-stack ${state.deck.length === 0 ? 'rr__deck-stack--empty' : ''}`}>
            <span>{state.deck.length}</span>
          </div>
        </div>
        <div className="rr__piles">{descPiles.map(renderPile)}</div>
      </div>

      {settings.showNumberLineHelper && (
        <div className="rr__helper">
          <MiniNumberLine min={0} max={lineMax} markers={markers} defaultOpen={lineMax <= 20 && window.innerHeight > 600} />
        </div>
      )}

      <div className="rr__handbar">
        <div className="rr__who">
          <Art name={player.avatarId} size={52} />
        </div>
        <div className="rr__hand">
          {player.hand.map((card) => (
            <NumberCard
              key={card}
              value={card}
              size="md"
              showDots={settings.showDotPatterns}
              selected={selected === card}
              dimmed={dragCard === card}
              label={`Karte ${card}`}
              onPointerDown={(e) => dnd.start(e, card)}
            />
          ))}
        </div>
        <div className={`rr__turn ${shakeClass('turn')}`}>
          <div className="rr__needed" aria-label={`${state.cardsPlayedThisTurn} von ${required} Karten gelegt`}>
            {Array.from({ length: Math.max(required, state.cardsPlayedThisTurn) }, (_, i) => (
              <span key={i} className={`rr__dot ${i < state.cardsPlayedThisTurn ? 'rr__dot--on' : ''}`} />
            ))}
          </div>
          <button
            type="button"
            className={`btn btn--big ${endAllowed ? 'btn--primary btn--pulse' : 'rr__end--off'}`}
            aria-label="Zug beenden"
            onClick={onEndTurn}
          >
            <Check size={48} strokeWidth={3.4} />
          </button>
        </div>
      </div>

      {dnd.drag && (
        <div className="drag-ghost" style={{ left: dnd.drag.x, top: dnd.drag.y }}>
          <NumberCard as="div" value={dnd.drag.item} size="md" showDots={settings.showDotPatterns} selected />
        </div>
      )}

      {state.awaitingHandoff && (
        <PassAndPlayOverlay
          playerName={player.name}
          playerArt={player.avatarId}
          onReady={() => dispatch({ type: 'HANDOFF_DONE' })}
        />
      )}
    </div>
  );
}
