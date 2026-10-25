import type { Order, OrderSummary, Vehicle, VehicleFilters, VehicleInput, VehicleUpdate } from '../types';
import { apiRequest } from './client';

export const listVehicles = (token: string) => apiRequest<Vehicle[]>('/api/vehicles', { token });

/** Searches with the given filters, leaving out blank values. */
export const searchVehicles = (token: string, filters: VehicleFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  });
  return apiRequest<Vehicle[]>(`/api/vehicles/search?${params}`, { token });
};

export const createVehicle = (token: string, input: VehicleInput) =>
  apiRequest<Vehicle>('/api/vehicles', { method: 'POST', body: input, token });

export const updateVehicle = (token: string, id: number, changes: VehicleUpdate) =>
  apiRequest<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: changes, token });

export const deleteVehicle = (token: string, id: number) =>
  apiRequest<void>(`/api/vehicles/${id}`, { method: 'DELETE', token });

export const purchaseVehicle = (token: string, id: number, quantity = 1) =>
  apiRequest<Vehicle>(`/api/vehicles/${id}/purchase`, { method: 'POST', body: { quantity }, token });

export const restockVehicle = (token: string, id: number, quantity: number) =>
  apiRequest<Vehicle>(`/api/vehicles/${id}/restock`, { method: 'POST', body: { quantity }, token });

export const getMyOrders = (token: string) => apiRequest<Order[]>('/api/orders/my', { token });

export const getAllOrders = (token: string) => apiRequest<OrderSummary>('/api/orders', { token });

export const downloadInventoryCsv = async (token: string): Promise<void> => {
  const res = await fetch('/api/vehicles/export/csv', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to export inventory CSV');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dealership_inventory.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
