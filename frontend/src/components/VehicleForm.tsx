import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import type { Vehicle, VehicleInput, VehicleUpdate } from '../types';
import { errorMessage, fieldErrorsFrom } from '../utils/format';

interface VehicleFormProps {
  /** When given the form edits this vehicle; otherwise it adds a new one. */
  vehicle?: Vehicle;
  /** Known categories, offered as suggestions. */
  categories?: string[];
  onSubmit: (values: VehicleInput | VehicleUpdate) => Promise<void>;
  onCancel: () => void;
}

type Field = 'make' | 'model' | 'category' | 'price' | 'quantity';
type Values = Record<Field, string>;

const validate = (values: Values, isEdit: boolean): Partial<Record<Field, string>> => {
  const errors: Partial<Record<Field, string>> = {};
  if (!values.make.trim()) errors.make = 'Enter the make';
  if (!values.model.trim()) errors.model = 'Enter the model';
  if (!values.category.trim()) errors.category = 'Enter a category';

  const price = Number(values.price);
  if (!values.price.trim() || !Number.isFinite(price) || price <= 0) errors.price = 'Price must be more than $0';

  const quantity = Number(values.quantity);
  if (!isEdit && (!values.quantity.trim() || !Number.isInteger(quantity) || quantity < 0)) {
    errors.quantity = 'Stock must be a whole number, 0 or more';
  }
  return errors;
};

/** Add / edit form for a vehicle. Stock is only set when adding; later changes go through restock. */
export function VehicleForm({ vehicle, categories = [], onSubmit, onCancel }: VehicleFormProps) {
  const isEdit = vehicle !== undefined;
  const [values, setValues] = useState<Values>({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    price: vehicle ? String(vehicle.price) : '',
    quantity: '1',
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const clientErrors = validate(values, isEdit);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    const base = {
      make: values.make.trim(),
      model: values.model.trim(),
      category: values.category.trim(),
      price: Number(values.price),
    };
    setIsSaving(true);
    try {
      await onSubmit(isEdit ? base : { ...base, quantity: Number(values.quantity) });
    } catch (err) {
      const serverErrors = fieldErrorsFrom(err);
      if (Object.keys(serverErrors).length > 0) setErrors(serverErrors);
      else setFormError(errorMessage(err));
      setIsSaving(false);
    }
  };

  const field = (name: Field, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => {
    const id = `vehicle-${name}`;
    const error = errors[name];
    return (
      <div>
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        <input
          id={id}
          className="field-input"
          value={values[name]}
          onChange={(e) => setValues((current) => ({ ...current, [name]: e.target.value }))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1 text-xs text-paint">
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {field('make', 'Make', { placeholder: 'Toyota', autoComplete: 'off' })}
        {field('model', 'Model', { placeholder: 'Camry', autoComplete: 'off' })}
      </div>
      {field('category', 'Category', { placeholder: 'Sedan', list: 'vehicle-category-options', autoComplete: 'off' })}
      <datalist id="vehicle-category-options">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
      <div className={isEdit ? '' : 'grid grid-cols-2 gap-3'}>
        {field('price', 'Price (USD)', { type: 'number', min: '0', step: '0.01', inputMode: 'decimal', placeholder: '28400' })}
        {!isEdit && field('quantity', 'Units in stock', { type: 'number', min: '0', step: '1', inputMode: 'numeric' })}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-paint">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isEdit ? 'Save changes' : 'Add vehicle'}
        </button>
      </div>
    </form>
  );
}
