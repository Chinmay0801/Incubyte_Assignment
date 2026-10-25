import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchFilters } from './SearchFilters';

const setup = () => {
  const onSearch = vi.fn();
  const onReset = vi.fn();
  render(<SearchFilters categories={['SUV', 'Sedan']} onSearch={onSearch} onReset={onReset} />);
  return { onSearch, onReset };
};

describe('SearchFilters', () => {
  it('submits every filter the user filled in', async () => {
    const { onSearch } = setup();

    await userEvent.type(screen.getByLabelText('Make'), 'Toyota');
    await userEvent.type(screen.getByLabelText('Model'), 'RAV');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'SUV');
    await userEvent.type(screen.getByLabelText('Min price'), '1000');
    await userEvent.type(screen.getByLabelText('Max price'), '50000');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith({
      make: 'Toyota',
      model: 'RAV',
      category: 'SUV',
      minPrice: '1000',
      maxPrice: '50000',
    });
  });

  it('lists the available categories plus an "All" option', () => {
    setup();

    const categorySelect = screen.getByLabelText('Category');
    const options = Array.from(categorySelect.querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(['All categories', 'SUV', 'Sedan']);
  });

  it('submits sortBy when selected', async () => {
    const { onSearch } = setup();

    await userEvent.selectOptions(screen.getByLabelText('Sort By'), 'price_asc');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith({
      make: '',
      model: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'price_asc',
    });
  });

  it('blocks a search where min price is above max price', async () => {
    const { onSearch } = setup();

    await userEvent.type(screen.getByLabelText('Min price'), '9000');
    await userEvent.type(screen.getByLabelText('Max price'), '100');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/min price can't be higher than max price/i);
  });

  it('clears all fields and notifies the parent', async () => {
    const { onReset } = setup();
    await userEvent.type(screen.getByLabelText('Make'), 'Ford');

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByLabelText('Make')).toHaveValue('');
    expect(onReset).toHaveBeenCalled();
  });
});
