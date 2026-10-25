import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import * as vehiclesApi from '../api/vehicles';
import type { Order, OrderSummary } from '../types';
import { formatPrice } from '../utils/format';

interface OrdersModalProps {
  token: string;
  isAdmin: boolean;
  onClose: () => void;
}

export function OrdersModal({ token, isAdmin, onClose }: OrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchOrders = async () => {
      try {
        if (isAdmin) {
          const data = await vehiclesApi.getAllOrders(token);
          if (!cancelled) {
            setSummary(data);
            setOrders(data.orders);
          }
        } else {
          const list = await vehiclesApi.getMyOrders(token);
          if (!cancelled) {
            setOrders(list);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load purchase history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [token, isAdmin]);

  const title = isAdmin ? 'Dealership Sales & Orders Ledger' : 'My Purchase History';

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {loading && <p className="py-8 text-center font-mono text-sm text-asphalt-300">Loading orders…</p>}

        {error && <p className="text-sm text-stamp">{error}</p>}

        {isAdmin && summary && (
          <div className="grid grid-cols-2 gap-3 rounded-md border border-asphalt-700 bg-asphalt-950 p-3 font-mono">
            <div>
              <p className="text-[11px] text-asphalt-300 uppercase">Total Revenue</p>
              <p className="text-xl font-bold text-paint">{formatPrice(summary.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-asphalt-300 uppercase">Total Units Sold</p>
              <p className="text-xl font-bold text-sticker">{summary.totalUnitsSold}</p>
            </div>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <p className="py-8 text-center text-sm text-asphalt-300">No purchases recorded yet.</p>
        )}

        {!loading && orders.length > 0 && (
          <div className="overflow-x-auto rounded border border-asphalt-700">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-asphalt-950 text-asphalt-300 border-b border-asphalt-700 uppercase">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Vehicle</th>
                  {isAdmin && <th className="px-3 py-2">Customer</th>}
                  <th className="px-3 py-2 text-right">Units</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-asphalt-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-asphalt-800/40">
                    <td className="px-3 py-2 text-asphalt-500">#{order.id}</td>
                    <td className="px-3 py-2 font-sans font-semibold text-sticker">
                      {order.make} {order.model}
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2 text-asphalt-300">
                        {order.userName || order.userEmail || `User #${order.userId}`}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">{order.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatPrice(order.unitPrice)}</td>
                    <td className="px-3 py-2 text-right font-bold text-paint">{formatPrice(order.totalPrice)}</td>
                    <td className="px-3 py-2 text-asphalt-500">
                      {new Date(order.purchasedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
