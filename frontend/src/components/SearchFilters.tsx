import { useState, type FormEvent } from 'react';
import type { VehicleFilters } from '../types';

interface SearchFiltersProps {
  categories: string[];
  onSearch: (filters: VehicleFilters) => void;
  onReset: () => void;
}

type FormFilterFields = 'make' | 'model' | 'category' | 'minPrice' | 'maxPrice' | 'sortBy';
const EMPTY: Record<FormFilterFields, string> = { make: '', model: '', category: '', minPrice: '', maxPrice: '', sortBy: '' };

/** Search bar for make, model, category, price range, and server-side sorting. */
export function SearchFilters({ categories, onSearch, onReset }: SearchFiltersProps) {
  const [filters, setFilters] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof VehicleFilters) => (value: string) => setFilters((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const min = Number(filters.minPrice);
    const max = Number(filters.maxPrice);
    if (filters.minPrice.trim() && filters.maxPrice.trim() && min > max) {
      setError("Min price can't be higher than max price.");
      return;
    }
    setError(null);
    const cleaned: VehicleFilters = {
      make: filters.make,
      model: filters.model,
      category: filters.category,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      ...(filters.sortBy ? { sortBy: filters.sortBy as VehicleFilters['sortBy'] } : {}),
    };
    onSearch(cleaned);
  };

  const handleReset = () => {
    setFilters(EMPTY);
    setError(null);
    onReset();
  };

  return (
    <form role="search" aria-label="Search vehicles" onSubmit={handleSubmit} className="rounded-md border border-asphalt-700 bg-asphalt-800/70 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_0.8fr_0.8fr_1fr_auto]">
        <div>
          <label htmlFor="filter-make" className="field-label">Make</label>
          <input id="filter-make" className="field-input" placeholder="Any make" value={filters.make} onChange={(e) => set('make')(e.target.value)} />
        </div>
        <div>
          <label htmlFor="filter-model" className="field-label">Model</label>
          <input id="filter-model" className="field-input" placeholder="Any model" value={filters.model} onChange={(e) => set('model')(e.target.value)} />
        </div>
        <div>
          <label htmlFor="filter-category" className="field-label">Category</label>
          <select id="filter-category" className="field-input" value={filters.category} onChange={(e) => set('category')(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-min" className="field-label">Min price</label>
          <input id="filter-min" type="number" min="0" inputMode="numeric" className="field-input" placeholder="₹0" value={filters.minPrice} onChange={(e) => set('minPrice')(e.target.value)} />
        </div>
        <div>
          <label htmlFor="filter-max" className="field-label">Max price</label>
          <input id="filter-max" type="number" min="0" inputMode="numeric" className="field-input" placeholder="No limit" value={filters.maxPrice} onChange={(e) => set('maxPrice')(e.target.value)} />
        </div>
        <div>
          <label htmlFor="filter-sort" className="field-label">Sort By</label>
          <select id="filter-sort" className="field-input" value={filters.sortBy} onChange={(e) => set('sortBy')(e.target.value)}>
            <option value="">Default (ID)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="make_asc">Make: A to Z</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-1">
          <button type="submit" className="btn-primary flex-1 lg:flex-none">Search</button>
          <button type="button" className="btn-ghost flex-1 lg:flex-none" onClick={handleReset}>Clear</button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-paint">
          {error}
        </p>
      )}
    </form>
  );
}
