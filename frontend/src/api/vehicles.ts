import type { Vehicle, VehicleFilters, VehicleInput, VehicleUpdate } from '../types';
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
