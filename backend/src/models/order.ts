export interface Order {
  id: number;
  userId: number;
  vehicleId: number;
  make: string;
  model: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchasedAt: string;
  userName?: string;
  userEmail?: string;
}

export interface CreateOrderInput {
  userId: number;
  vehicleId: number;
  quantity: number;
  unitPrice: number;
}
