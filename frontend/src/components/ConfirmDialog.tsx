import { useState } from 'react';
import { Modal } from './Modal';
import { errorMessage } from '../utils/format';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/** Asks the user to confirm a destructive action and shows any failure inline. */
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsWorking(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(errorMessage(err));
      setIsWorking(false);
    }
  };

  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-asphalt-300">{message}</p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-paint">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={handleConfirm} disabled={isWorking}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
