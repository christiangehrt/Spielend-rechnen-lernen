import { Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { useBotTimer } from '../../core/bots/bots';
import type { GameViewProps } from '../../core/types/game';
import { Art } from '../../components/shared/Art';
import { Button } from '../../components/shared/Button';
import { NumberCard } from '../../components/shared/NumberCard';
import { Overlay } from '../../components/shared/Overlay';
import { PassAndPlayOverlay } from '../../components/shared/PassAndPlayOverlay';
import { useShake } from '../../components/shared/useShake';
import { ANIMALS, CARD_ART, CARD_NAME, isNumber, kindOf, valueOf } from './cards';
import { classify, points, whoActs } from './engine';
import type { SsAction, SsPlayer, SsState } from './types';
import './SchlummerSchloss.css';

function AnimalToken({ animal, size = 52, onClick, pickable }: { animal: number; size?: number; onClick?: () => void; pickable?: boolean }) {
  const a = ANIMALS[animal];
  const body = (
    <>
      <Art name={a.art} size={size} />
      <span className="ss-animal__pts">{a.points}</span>
    </>
  );
  return onClick ? (
    <button type="button" className={`ss-animal ${pickable ? 'ss-animal--pick' : ''}`} aria-label={`${a.name}, ${a.points} Punkte`} onClick={onClick}>
      {body}
    </button>
  ) : (
    <span className="ss-animal">{body}</span>
  );
}

function ActionCard({ card, selected, onClick, dimmed }: { card: number; selected?: boolean; onClick?: () => void; dimmed?: boolean }) {
  const kind = kindOf(card);
  return (
    <button
      type="button"
      className={`ss-action ss-action--${kind} ${selected ? 'ss-action--selected' : ''} ${dimmed ? 'ss-action--dim' : ''}`}
      aria-label={CARD_NAME[kind]}
      aria-pressed={selected}
      onClick={onClick}
    >
      <Art name={CARD_ART[kind]} size={54} />
    </button>
  );
}

export function SchlummerSchlossView({ state, dispatch, settings }: GameViewProps<SsState, SsAction>) {
  const { shake, shakeClass } = useShake();
  const acting = whoActs(state);
  const actor = state.players[acting];
  const humanToAct = actor?.kind === 'human' && !state.handoff && state.phase !== 'over';
  const handOwnerIndex = state.players[state.active].kind === 'human' ? state.active : state.players.findIndex((p) => p.kind === 'human');
  const handOwner = state.players[Math.max(0, handOwnerIndex)];
  const myTurn = state.phase === 'turn' && state.players[state.active].kind === 'human' && !state.handoff;
  const selection = classify(state, state.selected);

  useBotTimer(actor?.kind === 'bot' && state.phase !== 'over', () => dispatch({ type: 'BOT_STEP' }), [state.phase, state.active, state.eventId, acting]);

  // Speak what happened.
  const seen = useRef(state.eventId);
  useEffect(() => {
    if (state.eventId === seen.current || !state.lastEvent) return;
    seen.current = state.eventId;
    const e = state.lastEvent;
    const isMe = (i: number) => state.players[i].kind === 'human' && i === 0 && state.players.filter((p) => p.kind === 'human').length === 1;
    switch (e.type) {
      case 'wake':
        audio.play('chest');
        void audio.say({ text: `${isMe(e.player) ? 'Du weckst' : `${state.players[e.player].name} weckt`} den ${ANIMALS[e.animal].name}!` });
        break;
      case 'steal':
        audio.play('whoosh');
        void audio.say({ text: `Der Waschbär holt den ${ANIMALS[e.animal].name}!` });
        break;
      case 'sleep':
        audio.play('plop');
        void audio.say({ text: `Der ${ANIMALS[e.animal].name} schläft wieder ein.` });
        break;
      case 'blocked':
        audio.play('bell');
        void audio.say({ text: e.with === 'wachhund' ? 'Der Wachhund passt auf!' : 'Die Trommel hält das Tier wach!' });
        break;
      case 'clown':
        audio.play('flip');
        if (isNumber(e.card)) void audio.say({ text: `Der Clown zeigt eine ${valueOf(e.card)}.` });
        else void audio.say({ text: `Der Clown bringt einen ${CARD_NAME[kindOf(e.card)]}. Spiel nochmal!` });
        break;
      case 'discard':
        audio.play('card');
        if (e.kind === 'equation') {
          const vals = e.cards.map(valueOf).sort((a, b) => a - b);
          const parts: (number | 'plus' | 'equals')[] = [];
          vals.slice(0, -1).forEach((v, i) => {
            if (i > 0) parts.push('plus');
            parts.push(v);
          });
          void audio.say(...parts, 'equals', vals[vals.length - 1]);
          audio.play('success');
        }
        break;
    }
  }, [state.eventId, state.lastEvent, state.players]);

  useEffect(() => {
    if (state.phase === 'chooseSleeping' && humanToAct) void audio.say({ text: 'Tippe auf ein schlafendes Tier.' });
    if (state.phase === 'chooseTarget' && humanToAct) void audio.say({ text: 'Tippe auf ein Tier von den anderen.' });
  }, [state.phase, humanToAct]);

  const select = (card: number) => {
    if (!myTurn) return;
    audio.play('select');
    if (isNumber(card) && !state.selected.includes(card)) void audio.say(valueOf(card));
    else if (!isNumber(card) && !state.selected.includes(card)) void audio.say({ text: CARD_NAME[kindOf(card)] });
    dispatch({ type: 'SELECT', card });
  };

  const playSelected = () => {
    if (selection === 'invalid') {
      shake('play', state.selected.length >= 3 ? { text: 'Die Rechnung stimmt nicht.' } : { text: 'So geht das nicht.' });
      return;
    }
    dispatch({ type: 'PLAY_SELECTED' });
  };

  const sortedSel = [...state.selected].filter(isNumber).map(valueOf).sort((a, b) => a - b);
  const actionSelected = state.selected.length === 1 && !isNumber(state.selected[0]) ? state.selected[0] : null;
  const opponents = state.players.map((p, i) => ({ p, i })).filter(({ i }) => i !== handOwnerIndex);
  const targeting = state.phase === 'chooseTarget' && humanToAct;

  return (
    <div className="ss">
      <aside className="ss__others">
        {opponents.map(({ p, i }) => (
          <PlayerBox key={p.id} player={p} active={i === state.active}>
            {p.animals.map((a) => (
              <AnimalToken
                key={a}
                animal={a}
                size={40}
                pickable={targeting}
                onClick={targeting ? () => dispatch({ type: 'CHOOSE_TARGET', player: i, animal: a }) : undefined}
              />
            ))}
          </PlayerBox>
        ))}
      </aside>

      <main className="ss__castle" aria-label="Schloss">
        {state.castle.map((animal, spot) => {
          const pickable = state.phase === 'chooseSleeping' && humanToAct && animal !== null;
          return (
            <button
              key={spot}
              type="button"
              className={`ss-spot ${animal === null ? 'ss-spot--empty' : ''} ${pickable ? 'ss-spot--pick' : ''}`}
              disabled={!pickable}
              aria-label={animal === null ? 'Leer' : 'Schlafendes Tier'}
              onClick={() => dispatch({ type: 'CHOOSE_SLEEPING', spot })}
            >
              {animal !== null && <Art name="ui.zzz" size={40} />}
            </button>
          );
        })}
      </main>

      <footer className="ss__me">
        <PlayerBox player={handOwner} active={state.active === handOwnerIndex} mine>
          {handOwner.animals.map((a) => (
            <AnimalToken key={a} animal={a} size={40} />
          ))}
        </PlayerBox>

        <div className="ss__hand">
          {handOwner.hand.map((c) =>
            isNumber(c) ? (
              <NumberCard
                key={c}
                value={valueOf(c)}
                size="sm"
                showDots={settings.showDotPatterns}
                selected={state.selected.includes(c)}
                dimmed={!myTurn}
                label={`Zahl ${valueOf(c)}`}
                onClick={() => select(c)}
              />
            ) : (
              <ActionCard key={c} card={c} selected={state.selected.includes(c)} dimmed={!myTurn} onClick={() => select(c)} />
            ),
          )}
        </div>

        <div className={`ss__template ${shakeClass('play')}`}>
          {state.phase === 'turn' ? (
            <>
              {actionSelected !== null ? (
                <span className="ss__tpl-action">
                  <Art name={CARD_ART[kindOf(actionSelected)]} size={48} />
                </span>
              ) : sortedSel.length >= 2 && !(sortedSel.length === 2 && sortedSel[0] === sortedSel[1]) ? (
                <span className={`ss__eq ${selection === 'equation' ? 'ss__eq--ok' : ''}`}>
                  {sortedSel.slice(0, -1).map((v, i) => (
                    <span key={i}>
                      {i > 0 && <span className="ss__op">+</span>}
                      <span className="ss__slot ss__slot--on">{v}</span>
                    </span>
                  ))}
                  <span className="ss__op">=</span>
                  <span className="ss__slot ss__slot--on">{sortedSel[sortedSel.length - 1]}</span>
                </span>
              ) : sortedSel.length === 2 ? (
                <span className="ss__eq ss__eq--ok">
                  <span className="ss__slot ss__slot--on">{sortedSel[0]}</span>
                  <span className="ss__slot ss__slot--on">{sortedSel[1]}</span>
                </span>
              ) : sortedSel.length === 1 ? (
                <span className="ss__eq">
                  <span className="ss__slot ss__slot--on">{sortedSel[0]}</span>
                </span>
              ) : (
                <span className="ss__eq ss__eq--hint">
                  <span className="ss__slot" />
                  <span className="ss__op">+</span>
                  <span className="ss__slot" />
                  <span className="ss__op">=</span>
                  <span className="ss__slot" />
                </span>
              )}
              <button
                type="button"
                className={`btn btn--huge ${myTurn && selection !== 'invalid' ? 'btn--primary btn--pulse' : 'ss__play--off'}`}
                aria-label="Ausspielen"
                disabled={!myTurn}
                onClick={playSelected}
              >
                <Check size={52} strokeWidth={3.4} />
              </button>
            </>
          ) : (
            (state.phase === 'chooseSleeping' || state.phase === 'chooseTarget') &&
            humanToAct &&
            state.pending?.revealed === undefined && (
              <Button label="Abbrechen" size="big" onClick={() => dispatch({ type: 'CANCEL' })}>
                <X size={40} strokeWidth={3} />
              </Button>
            )
          )}
        </div>
      </footer>

      {state.phase === 'counter' && humanToAct && state.pending?.target && (
        <Overlay label="Konter">
          <div className="ss__counter">
            <Art name={CARD_ART[kindOf(state.pending.card)]} size={90} />
            <span className="ss__arrow">→</span>
            <AnimalToken animal={state.pending.target.animal} size={80} />
          </div>
          <div className="overlay__row">
            <Button label={kindOf(state.pending.card) === 'dieb' ? 'Wachhund spielen' : 'Trommel spielen'} variant="primary" size="huge" pulse onClick={() => dispatch({ type: 'COUNTER', use: true })}>
              <Art name={kindOf(state.pending.card) === 'dieb' ? 'card.wachhund' : 'card.trommel'} size={64} />
            </Button>
            <Button label="Nicht kontern" size="huge" onClick={() => dispatch({ type: 'COUNTER', use: false })}>
              <X size={52} strokeWidth={3} />
            </Button>
          </div>
        </Overlay>
      )}

      {state.handoff && (
        <PassAndPlayOverlay
          playerName={state.players[state.active].name}
          playerArt={state.players[state.active].avatarId}
          onReady={() => dispatch({ type: 'HANDOFF_DONE' })}
        />
      )}
    </div>
  );
}

function PlayerBox({ player, active, mine, children }: { player: SsPlayer; active: boolean; mine?: boolean; children: React.ReactNode }) {
  return (
    <div className={`ss-player ${active ? 'ss-player--active' : ''} ${mine ? 'ss-player--mine' : ''}`}>
      <div className="ss-player__head">
        <Art name={player.avatarId} size={44} />
        <span className="ss-player__pts">{points(player)}</span>
        {!mine && (
          <span className="ss-player__cards">
            <Art name="ui.cards" size={20} /> {player.hand.length}
          </span>
        )}
      </div>
      <div className="ss-player__animals">{children}</div>
    </div>
  );
}
