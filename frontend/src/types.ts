export type Role = 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

/** Fields an admin fills in when adding a vehicle. */
export interface VehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

/** Fields that can be edited after creation (stock changes go through purchase / restock). */
export type VehicleUpdate = Partial<Omit<VehicleInput, 'quantity'>>;

export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}

export interface FieldError {
  field: string;
  message: string;
}
