import { ConflictError, NotFoundError, ValidationError } from '../errors';
import type { NewVehicle, Vehicle, VehicleSearchFilters, VehicleUpdate } from '../models/vehicle';
import type { VehicleRepository } from '../repositories/vehicleRepository';

const trimText = <T extends Partial<Record<'make' | 'model' | 'category', string>>>(input: T): T => ({
  ...input,
  ...(input.make !== undefined && { make: input.make.trim() }),
  ...(input.model !== undefined && { model: input.model.trim() }),
  ...(input.category !== undefined && { category: input.category.trim() }),
});

/** Business rules for the vehicle catalogue and its inventory. */
export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  create(input: NewVehicle): Vehicle {
    return this.vehicles.create(trimText(input));
  }

  list(): Vehicle[] {
    return this.vehicles.findAll();
  }

  search(filters: VehicleSearchFilters): Vehicle[] {
    const { minPrice, maxPrice } = filters;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new ValidationError('minPrice cannot be greater than maxPrice');
    }
    return this.vehicles.search(trimText(filters));
  }

  getById(id: number): Vehicle {
    const vehicle = this.vehicles.findById(id);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle ${id} not found`);
    }
    return vehicle;
  }

  update(id: number, changes: VehicleUpdate): Vehicle {
    const updated = this.vehicles.update(id, trimText(changes));
    if (!updated) {
      throw new NotFoundError(`Vehicle ${id} not found`);
    }
    return updated;
  }

  delete(id: number): void {
    if (!this.vehicles.delete(id)) {
      throw new NotFoundError(`Vehicle ${id} not found`);
    }
  }

  /** Sells `amount` units. Fails with 409 if there is not enough stock. */
  purchase(id: number, amount = 1): Vehicle {
    if (!this.vehicles.decrementQuantity(id, amount)) {
      // The atomic update failed: work out why for a helpful error.
      const vehicle = this.getById(id);
      throw new ConflictError(
        vehicle.quantity === 0
          ? `${vehicle.make} ${vehicle.model} is out of stock`
          : `Only ${vehicle.quantity} unit(s) of ${vehicle.make} ${vehicle.model} in stock`,
      );
    }
    return this.getById(id);
  }

  /** Adds `amount` units to the stock. */
  restock(id: number, amount: number): Vehicle {
    if (!this.vehicles.incrementQuantity(id, amount)) {
      throw new NotFoundError(`Vehicle ${id} not found`);
    }
    return this.getById(id);
  }
}
