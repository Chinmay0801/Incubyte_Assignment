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

export type NewVehicle = Pick<Vehicle, 'make' | 'model' | 'category' | 'price' | 'quantity'>;

/**
 * Fields that may be changed through a regular update. Stock is deliberately
 * excluded: it only changes through the purchase / restock workflows.
 */
export type VehicleUpdate = Partial<Pick<Vehicle, 'make' | 'model' | 'category' | 'price'>>;

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}
