import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Clock } from 'lucide-react';

interface SnoozeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnooze: (minutes: number) => Promise<void>;
  title?: string;
}

export const SnoozeModal: React.FC<SnoozeModalProps> = ({
  isOpen,
  onClose,
  onSnooze,
  title = 'Snooze Reminder',
}) => {
  const [loading, setLoading] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(20);

  const handleSnooze = async (minutes: number) => {
    setLoading(true);
    try {
      await onSnooze(minutes);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description="Choose how long to pause repeat alerts for this task.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            type="button"
            variant="outline"
            className="flex flex-col py-3 h-auto border-matte-border bg-matte-elevated/60"
            onClick={() => handleSnooze(5)}
            loading={loading}
          >
            <Clock className="w-3.5 h-3.5 mb-1 text-slate-400" />
            <span className="font-semibold text-slate-200">5 mins</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex flex-col py-3 h-auto border-indigo-500/30 bg-matte-accent-subtle"
            onClick={() => handleSnooze(10)}
            loading={loading}
          >
            <Clock className="w-3.5 h-3.5 mb-1 text-indigo-400" />
            <span className="font-semibold text-indigo-300">10 mins</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex flex-col py-3 h-auto border-matte-border bg-matte-elevated/60"
            onClick={() => handleSnooze(15)}
            loading={loading}
          >
            <Clock className="w-3.5 h-3.5 mb-1 text-slate-400" />
            <span className="font-semibold text-slate-200">15 mins</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex flex-col py-3 h-auto border-matte-border bg-matte-elevated/60"
            onClick={() => handleSnooze(30)}
            loading={loading}
          >
            <Clock className="w-3.5 h-3.5 mb-1 text-slate-400" />
            <span className="font-semibold text-slate-200">30 mins</span>
          </Button>
        </div>

        <div className="pt-3 border-t border-matte-border flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="180"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 rounded-lg border border-matte-border bg-matte-input px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-matte-accent"
          />
          <span className="text-xs text-slate-400">minutes</span>
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto"
            onClick={() => handleSnooze(customMinutes)}
            loading={loading}
          >
            Custom Snooze
          </Button>
        </div>
      </div>
    </Modal>
  );
};
