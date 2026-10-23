import { useState, type FormEvent } from 'react';
import type { Vehicle } from '../types';
import { errorMessage } from '../utils/format';

interface RestockFormProps {
  vehicle: Vehicle;
  onSubmit: (units: number) => Promise<void>;
  onCancel: () => void;
}

/** Lets an admin add units to a vehicle's stock. */
export function RestockForm({ vehicle, onSubmit, onCancel }: RestockFormProps) {
  const [units, setUnits] = useState('1');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(units);
    if (!units.trim() || !Number.isInteger(amount) || amount < 1) {
      setFieldError('Enter a whole number of 1 or more');
      return;
    }
    setFieldError(null);
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(amount);
    } catch (err) {
      setError(errorMessage(err));
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="mb-4 font-mono text-xs text-asphalt-300">
        {vehicle.make} {vehicle.model} · {vehicle.quantity} in stock now
      </p>
      <label htmlFor="restock-units" className="field-label">
        Units to add
      </label>
      <input
        id="restock-units"
        type="number"
        min="1"
        step="1"
        className="field-input"
        value={units}
        onChange={(e) => setUnits(e.target.value)}
        aria-invalid={fieldError ? true : undefined}
        aria-describedby={fieldError ? 'restock-units-error' : undefined}
      />
      {fieldError && (
        <p id="restock-units-error" className="mt-1 text-xs text-paint">
          {fieldError}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-paint">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          Restock
        </button>
      </div>
    </form>
  );
}
