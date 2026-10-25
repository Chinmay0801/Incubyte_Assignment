export interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewVehicle = Pick<Vehicle, 'make' | 'model' | 'category' | 'price' | 'quantity'> & {
  imageUrl?: string;
};

/**
 * Fields that may be changed through a regular update. Stock is deliberately
 * excluded: it only changes through the purchase / restock workflows.
 */
export type VehicleUpdate = Partial<Pick<Vehicle, 'make' | 'model' | 'category' | 'price' | 'imageUrl'>>;

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'make_asc' | 'newest';
}
