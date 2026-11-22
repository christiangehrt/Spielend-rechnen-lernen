import { Undo2 } from 'lucide-react';
import { Button } from './Button';

export function UndoButton({ enabled, onUndo }: { enabled: boolean; onUndo: () => void }) {
  return (
    <Button label="Rückgängig" icon size="big" variant="orange" disabled={!enabled} onClick={onUndo} className="undo-btn">
      <Undo2 size={40} strokeWidth={3} />
    </Button>
  );
}
