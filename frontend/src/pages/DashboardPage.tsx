import { useCallback, useEffect, useMemo, useState } from 'react';
import * as vehiclesApi from '../api/vehicles';
import { ApiError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EnquiryModal } from '../components/EnquiryModal';
import { Modal } from '../components/Modal';
import { OrdersModal } from '../components/OrdersModal';
import { RestockForm } from '../components/RestockForm';
import { SearchFilters } from '../components/SearchFilters';
import { Toast, type ToastMessage } from '../components/Toast';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleForm } from '../components/VehicleForm';
import { VehicleGalleryModal } from '../components/VehicleGalleryModal';
import { useAuth } from '../context/useAuth';
import type { Vehicle, VehicleFilters, VehicleInput, VehicleUpdate } from '../types';
import { errorMessage, formatStockNumber } from '../utils/format';

type Dialog =
  | { kind: 'add' }
  | { kind: 'edit'; vehicle: Vehicle }
  | { kind: 'restock'; vehicle: Vehicle }
  | { kind: 'delete'; vehicle: Vehicle }
  | { kind: 'orders' }
  | { kind: 'gallery'; vehicle: Vehicle }
  | { kind: 'enquiry'; vehicle?: Vehicle };

const nameOf = (vehicle: Vehicle) => `${vehicle.make} ${vehicle.model}`;
const plural = (count: number, singular: string, pluralForm = `${singular}s`) => `${count} ${count === 1 ? singular : pluralForm}`;

const sortedUnique = (values: string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

/** The lot: every vehicle as a window sticker, with search, purchasing and admin tools. */
export function DashboardPage() {
  const { token, isAdmin, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = useCallback((kind: ToastMessage['kind'], text: string) => setToast({ id: Date.now(), kind, text }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  /** Signs out on an expired session. Returns true when the error was handled that way. */
  const handleAuthError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return true;
      }
      return false;
    },
    [logout],
  );

  // Bumping this re-runs the load effect (retry, clearing filters).
  const [loadRequest, setLoadRequest] = useState(0);

  useEffect(() => {
    let cancelled = false;
    vehiclesApi.listVehicles(token!).then(
      (list) => {
        if (cancelled) return;
        setVehicles(list);
        setCategories(sortedUnique(list.map((v) => v.category)));
        setIsFiltered(false);
        setStatus('ready');
      },
      (error: unknown) => {
        if (cancelled || handleAuthError(error)) return;
        setLoadError(errorMessage(error));
        setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [token, handleAuthError, loadRequest]);

  const reload = () => {
    setStatus('loading');
    setLoadRequest((n) => n + 1);
  };

  const handleSearch = async (filters: VehicleFilters) => {
    try {
      setVehicles(await vehiclesApi.searchVehicles(token!, filters));
      setIsFiltered(true);
    } catch (error) {
      if (!handleAuthError(error)) notify('error', errorMessage(error));
    }
  };

  const replaceVehicle = (updated: Vehicle) => setVehicles((list) => list.map((v) => (v.id === updated.id ? updated : v)));

  const handlePurchase = async (vehicle: Vehicle) => {
    setPurchasingId(vehicle.id);
    try {
      const updated = await vehiclesApi.purchaseVehicle(token!, vehicle.id);
      replaceVehicle(updated);
      notify(
        'success',
        updated.quantity === 0
          ? `Purchased ${nameOf(updated)}. That was the last one.`
          : `Purchased ${nameOf(updated)}. ${updated.quantity} left on the lot.`,
      );
    } catch (error) {
      if (!handleAuthError(error)) notify('error', errorMessage(error));
    } finally {
      setPurchasingId(null);
    }
  };

  /** Runs an admin action from a dialog; errors are re-thrown so the dialog can show them. */
  const runDialogAction = async (action: () => Promise<string>) => {
    try {
      const message = await action();
      setDialog(null);
      notify('success', message);
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const handleCreate = (input: VehicleInput | VehicleUpdate) =>
    runDialogAction(async () => {
      const created = await vehiclesApi.createVehicle(token!, input as VehicleInput);
      setVehicles((list) => [...list, created]);
      setCategories((current) => sortedUnique([...current, created.category]));
      return `Added ${nameOf(created)} to the lot.`;
    });

  const handleUpdate = (vehicle: Vehicle) => (changes: VehicleInput | VehicleUpdate) =>
    runDialogAction(async () => {
      const updated = await vehiclesApi.updateVehicle(token!, vehicle.id, changes);
      replaceVehicle(updated);
      return `Saved changes to ${nameOf(updated)}.`;
    });

  const handleRestock = (vehicle: Vehicle) => (units: number) =>
    runDialogAction(async () => {
      const updated = await vehiclesApi.restockVehicle(token!, vehicle.id, units);
      replaceVehicle(updated);
      return `Restocked ${nameOf(updated)}. ${updated.quantity} in stock.`;
    });

  const handleDelete = (vehicle: Vehicle) => () =>
    runDialogAction(async () => {
      await vehiclesApi.deleteVehicle(token!, vehicle.id);
      setVehicles((list) => list.filter((v) => v.id !== vehicle.id));
      return `Deleted ${nameOf(vehicle)}.`;
    });

  const shown = useMemo(() => (inStockOnly ? vehicles.filter((v) => v.quantity > 0) : vehicles), [vehicles, inStockOnly]);
  const totalUnits = vehicles.reduce((sum, v) => sum + v.quantity, 0);
  const summary = isFiltered
    ? `${plural(vehicles.length, 'match', 'matches')} · ${plural(totalUnits, 'unit')}`
    : `${plural(vehicles.length, 'model')} · ${plural(totalUnits, 'unit')} on the lot`;

  return (
    <main className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-5xl leading-none font-black tracking-tight uppercase sm:text-6xl">
            <span className="bay-line h-10" aria-hidden="true" />
            The lot
          </h1>
          {status === 'ready' && <p className="mt-2 font-mono text-xs tracking-[0.12em] text-asphalt-300 uppercase">{summary}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-ghost text-xs uppercase tracking-wider text-paint border-paint/40 hover:bg-paint/10"
            onClick={() => setDialog({ kind: 'enquiry' })}
            title="Enquire with Chinmay (+91 90000 00000)"
          >
            💬 Enquire
          </button>
          <button
            type="button"
            className="btn-ghost text-xs uppercase tracking-wider"
            onClick={() => setDialog({ kind: 'orders' })}
          >
            {isAdmin ? 'Sales Ledger' : 'My Purchases'}
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                className="btn-ghost text-xs uppercase tracking-wider"
                onClick={async () => {
                  try {
                    await vehiclesApi.downloadInventoryCsv(token!);
                    notify('success', 'Downloaded inventory CSV.');
                  } catch (err) {
                    notify('error', errorMessage(err));
                  }
                }}
              >
                Export CSV
              </button>
              <button type="button" className="btn-primary" onClick={() => setDialog({ kind: 'add' })}>
                Add vehicle
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <SearchFilters categories={categories} onSearch={handleSearch} onReset={reload} />
      </div>

      <div className="mt-4 flex items-center justify-end">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-asphalt-300">
          <input type="checkbox" className="size-4 accent-paint" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
          In stock only
        </label>
      </div>

      <section aria-label="Vehicles" className="mt-4">
        {status === 'loading' && (
          <p role="status" className="py-16 text-center font-mono text-sm text-asphalt-300">
            Loading inventory…
          </p>
        )}

        {status === 'error' && (
          <div className="rounded-md border border-stamp/60 bg-stamp/10 px-6 py-10 text-center">
            <p role="alert" className="text-sticker">
              {loadError}
            </p>
            <button type="button" className="btn-ghost mt-4" onClick={reload}>
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && shown.length === 0 && (
          <EmptyLot isFiltered={isFiltered} hasHiddenSoldOut={inStockOnly && vehicles.length > 0} canAdd={isAdmin} onAdd={() => setDialog({ kind: 'add' })} />
        )}

        {status === 'ready' && shown.length > 0 && (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((vehicle) => (
              <li key={vehicle.id}>
                <VehicleCard
                  vehicle={vehicle}
                  isAdmin={isAdmin}
                  isBusy={purchasingId === vehicle.id}
                  onPurchase={handlePurchase}
                  onEdit={(v) => setDialog({ kind: 'edit', vehicle: v })}
                  onRestock={(v) => setDialog({ kind: 'restock', vehicle: v })}
                  onDelete={(v) => setDialog({ kind: 'delete', vehicle: v })}
                  onViewGallery={(v) => setDialog({ kind: 'gallery', vehicle: v })}
                  onEnquire={(v) => setDialog({ kind: 'enquiry', vehicle: v })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialog?.kind === 'add' && (
        <Modal title="Add vehicle" onClose={() => setDialog(null)}>
          <VehicleForm categories={categories} onSubmit={handleCreate} onCancel={() => setDialog(null)} />
        </Modal>
      )}
      {dialog?.kind === 'edit' && (
        <Modal title="Edit vehicle" onClose={() => setDialog(null)}>
          <VehicleForm vehicle={dialog.vehicle} categories={categories} onSubmit={handleUpdate(dialog.vehicle)} onCancel={() => setDialog(null)} />
        </Modal>
      )}
      {dialog?.kind === 'restock' && (
        <Modal title="Restock vehicle" onClose={() => setDialog(null)}>
          <RestockForm vehicle={dialog.vehicle} onSubmit={handleRestock(dialog.vehicle)} onCancel={() => setDialog(null)} />
        </Modal>
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete vehicle?"
          message={`${nameOf(dialog.vehicle)} (stock no. ${formatStockNumber(dialog.vehicle.id)}) will be removed from the inventory. This can't be undone.`}
          confirmLabel="Delete vehicle"
          onConfirm={handleDelete(dialog.vehicle)}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'orders' && (
        <OrdersModal token={token!} isAdmin={isAdmin} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'gallery' && (
        <VehicleGalleryModal
          vehicle={dialog.vehicle}
          onClose={() => setDialog(null)}
          onPurchase={(v) => {
            setDialog(null);
            handlePurchase(v);
          }}
          onEnquire={(v) => setDialog({ kind: 'enquiry', vehicle: v })}
          isPurchasing={purchasingId === dialog.vehicle.id}
        />
      )}
      {dialog?.kind === 'enquiry' && (
        <EnquiryModal
          vehicle={dialog.vehicle}
          onClose={() => setDialog(null)}
          onSuccess={(msg) => notify('success', msg)}
        />
      )}

      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </main>
  );
}

interface EmptyLotProps {
  isFiltered: boolean;
  hasHiddenSoldOut: boolean;
  canAdd: boolean;
  onAdd: () => void;
}

function EmptyLot({ isFiltered, hasHiddenSoldOut, canAdd, onAdd }: EmptyLotProps) {
  const [title, hint] = hasHiddenSoldOut
    ? ['Everything here is sold out.', 'Turn off "In stock only" to see sold-out vehicles.']
    : isFiltered
      ? ['No vehicles match these filters.', 'Try a wider price range or clear the filters.']
      : ['The lot is empty.', canAdd ? 'Add the first vehicle to start selling.' : 'Check back once new stock arrives.'];

  return (
    <div className="rounded-md border-2 border-dashed border-asphalt-700 px-6 py-16 text-center">
      <p className="font-display text-3xl font-extrabold tracking-wide uppercase">{title}</p>
      <p className="mt-2 text-sm text-asphalt-300">{hint}</p>
      {canAdd && !isFiltered && !hasHiddenSoldOut && (
        <button type="button" className="btn-primary mt-6" onClick={onAdd}>
          Add the first vehicle
        </button>
      )}
    </div>
  );
}
