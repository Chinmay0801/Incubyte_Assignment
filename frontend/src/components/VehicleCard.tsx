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
  onViewGallery?: (vehicle: Vehicle) => void;
  onEnquire?: (vehicle: Vehicle) => void;
}

/**
 * A vehicle rendered as a dealer window sticker: stock number up top,
 * spec rows in monospace, sticker price at the bottom, and interactive photo gallery.
 */
export function VehicleCard({
  vehicle,
  isAdmin,
  isBusy = false,
  onPurchase,
  onEdit,
  onRestock,
  onDelete,
  onViewGallery,
  onEnquire,
}: VehicleCardProps) {
  const name = `${vehicle.make} ${vehicle.model}`;
  const soldOut = vehicle.quantity === 0;

  return (
    <article
      aria-label={name}
      className="relative flex flex-col overflow-hidden rounded-sm bg-sticker text-ink shadow-[0_1px_0_rgb(0_0_0/0.3),0_12px_24px_-12px_rgb(0_0_0/0.6)] cursor-pointer group"
      onClick={() => onViewGallery?.(vehicle)}
    >
      <header className="flex items-center justify-between bg-ink px-4 py-1.5 font-mono text-[11px] tracking-[0.14em] text-sticker uppercase">
        <span>Stock no. {formatStockNumber(vehicle.id)}</span>
        {vehicle.quantity === 1 && <span className="rounded-sm bg-paint px-1.5 text-ink">Last one</span>}
      </header>

      {vehicle.imageUrl && (
        <div className="relative h-44 w-full overflow-hidden bg-asphalt-950">
          <img
            src={vehicle.imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="rounded bg-ink/85 px-3 py-1 font-mono text-xs font-semibold text-sticker shadow-lg">
              📷 View {name} Gallery
            </span>
          </div>
        </div>
      )}

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

      <div className="space-y-2 border-t-2 border-dashed border-sticker-line px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-primary flex-1 disabled:bg-sticker-line disabled:text-ink-soft disabled:opacity-100"
            disabled={soldOut || isBusy}
            onClick={() => onPurchase(vehicle)}
            aria-label={`Purchase ${name}`}
          >
            {isBusy ? 'Purchasing…' : 'Purchase'}
          </button>
          {onEnquire && (
            <button
              type="button"
              className="rounded-sm border border-sticker-line bg-transparent px-3 py-2 font-mono text-xs font-semibold hover:border-ink hover:bg-ink hover:text-sticker transition-colors"
              onClick={() => onEnquire(vehicle)}
              aria-label={`Enquire about ${name}`}
              title="Enquire with Chinmay"
            >
              Enquire
            </button>
          )}
        </div>

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
