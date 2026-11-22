import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { audio } from '../../core/audio/AudioManager';
import { Art } from './Art';
import { Button } from './Button';
import { Overlay } from './Overlay';

interface Props {
  playerName: string;
  playerArt: string;
  onReady: () => void;
}

/** Hides the hand between turns so the tablet can be passed to the next player. */
export function PassAndPlayOverlay({ playerName, playerArt, onReady }: Props) {
  useEffect(() => {
    void audio.say({ text: `${playerName}, du bist dran!` });
  }, [playerName]);
  return (
    <Overlay label={`${playerName} ist dran`}>
      <div className="pass">
        <Art name="ui.cards" size={72} />
        <ArrowRight size={56} strokeWidth={3} color="#6b7290" />
        <Art name={playerArt} size={110} />
      </div>
      <div className="pass__name">{playerName}</div>
      <div className="overlay__row">
        <Button label="Los geht's" variant="primary" size="huge" onClick={onReady} pulse>
          <ArrowRight size={56} strokeWidth={3} />
        </Button>
      </div>
    </Overlay>
  );
}
