import type { Vehicle } from '../types';
import { formatPrice, formatStockNumber } from '../utils/format';

interface VehicleCardProps {
  vehicle: Vehicle;
  isAdmin: boolean;
  /** True while a purchase for this vehicle is in flight. */
  isBusy?: boolean;
  onPurchase: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onRestock: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

/**
 * A vehicle rendered as a dealer window sticker: stock number up top,
 * spec rows in monospace, sticker price at the bottom.
 */
export function VehicleCard({ vehicle, isAdmin, isBusy = false, onPurchase, onEdit, onRestock, onDelete }: VehicleCardProps) {
  const name = `${vehicle.make} ${vehicle.model}`;
  const soldOut = vehicle.quantity === 0;

  return (
    <article
      aria-label={name}
      className="relative flex flex-col overflow-hidden rounded-sm bg-sticker text-ink shadow-[0_1px_0_rgb(0_0_0/0.3),0_12px_24px_-12px_rgb(0_0_0/0.6)]"
    >
      <header className="flex items-center justify-between bg-ink px-4 py-1.5 font-mono text-[11px] tracking-[0.14em] text-sticker uppercase">
        <span>Stock no. {formatStockNumber(vehicle.id)}</span>
        {vehicle.quantity === 1 && <span className="rounded-sm bg-paint px-1.5 text-ink">Last one</span>}
      </header>

      <div className="flex flex-1 flex-col px-4 pt-4 pb-3">
        <p className="font-mono text-xs tracking-[0.12em] text-ink-soft uppercase">{vehicle.make}</p>
        <h3 className="font-display text-3xl leading-none font-extrabold tracking-tight uppercase">{vehicle.model}</h3>

        <dl className="mt-4 divide-y divide-dashed divide-sticker-line border-y border-sticker-line font-mono text-xs">
          <div className="flex justify-between py-1.5">
            <dt className="text-ink-soft">Body style</dt>
            <dd>{vehicle.category}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-ink-soft">On the lot</dt>
            <dd className={soldOut ? 'font-semibold text-stamp' : ''}>
              {soldOut ? 'Sold out' : `${vehicle.quantity} in stock`}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-end justify-between">
          <span className="font-mono text-[11px] tracking-[0.14em] text-ink-soft uppercase">Sticker price</span>
          <span className="font-display text-3xl leading-none font-black tabular-nums">{formatPrice(vehicle.price)}</span>
        </div>
      </div>

      <div className="space-y-2 border-t-2 border-dashed border-sticker-line px-4 py-3">
        <button
          type="button"
          className="btn-primary w-full disabled:bg-sticker-line disabled:text-ink-soft disabled:opacity-100"
          disabled={soldOut || isBusy}
          onClick={() => onPurchase(vehicle)}
          aria-label={`Purchase ${name}`}
        >
          {isBusy ? 'Purchasing…' : 'Purchase'}
        </button>

        {isAdmin && (
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] tracking-[0.1em] uppercase">
            <button type="button" className="rounded-sm border border-sticker-line py-1.5 hover:border-ink" onClick={() => onEdit(vehicle)} aria-label={`Edit ${name}`}>
              Edit
            </button>
            <button type="button" className="rounded-sm border border-sticker-line py-1.5 hover:border-ink" onClick={() => onRestock(vehicle)} aria-label={`Restock ${name}`}>
              Restock
            </button>
            <button type="button" className="rounded-sm border border-sticker-line py-1.5 text-stamp hover:border-stamp" onClick={() => onDelete(vehicle)} aria-label={`Delete ${name}`}>
              Delete
            </button>
          </div>
        )}
      </div>

      {soldOut && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-16 right-3 rotate-[-14deg] rounded-sm border-[3px] border-stamp px-2 py-0.5 font-display text-xl font-black tracking-widest text-stamp uppercase opacity-85 mix-blend-multiply"
        >
          Sold out
        </span>
      )}
    </article>
  );
}
