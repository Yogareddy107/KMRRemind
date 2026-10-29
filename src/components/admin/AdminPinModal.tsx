import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Lock, AlertCircle } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const CORRECT_PIN = import.meta.env.VITE_ADMIN_PIN || '188199';

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (pin.trim() === CORRECT_PIN) {
        onSuccess();
        onClose();
        setPin('');
      } else {
        setError('Incorrect PIN code. Access denied.');
      }
      setLoading(false);
    }, 250);
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Portal Access"
      description="Enter the 6-digit administration security PIN to access system metrics, all users, push subscribers, and scheduler controls."
      maxWidth="sm"
    >
      <form onSubmit={handleVerify} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-950/40 p-2.5 text-xs text-rose-300 border border-rose-800/60 shadow-matte-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Display Dots */}
        <div className="flex justify-center items-center gap-2.5 py-3">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const hasDigit = pin.length > idx;
            return (
              <div
                key={idx}
                className={`h-3.5 w-3.5 rounded-full border transition-all ${
                  hasDigit
                    ? 'border-indigo-400 bg-matte-accent scale-110 shadow-matte-sm'
                    : 'border-matte-border bg-matte-input'
                }`}
              />
            );
          })}
        </div>

        {/* Direct text input */}
        <div className="relative">
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter PIN (188199)"
            autoFocus
            className="w-full text-center tracking-[0.4em] font-mono text-lg py-2 rounded-xl border border-matte-border bg-matte-input text-slate-100 focus:outline-none focus:ring-1 focus:ring-matte-accent"
          />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => {
                if (item === 'C') setPin('');
                else if (item === '⌫') handleDelete();
                else handleDigitClick(item);
              }}
              className="flex h-10 items-center justify-center rounded-xl bg-matte-elevated border border-matte-border text-xs font-semibold text-slate-200 hover:border-matte-border-focus hover:bg-matte-subtle transition-all active:scale-95 shadow-matte-sm"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex justify-end gap-2 border-t border-matte-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={loading}
            disabled={pin.length < 6}
            icon={<Lock className="w-3.5 h-3.5 mr-1" />}
          >
            Unlock Dashboard
          </Button>
        </div>
      </form>
    </Modal>
  );
};
