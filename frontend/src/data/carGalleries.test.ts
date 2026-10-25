import { describe, expect, it } from 'vitest';
import { getCarGallery, getCarSlug } from './carGalleries';

describe('getCarSlug', () => {
  it.each([
    ['Maruti Suzuki', 'Swift', 'maruti-swift'],
    ['BYD', 'Sealion 7', 'byd-sealion-7'],
    ['BYD', 'Seal', 'byd-seal'],
    ['Mahindra', 'BE 6', 'mahindra-be-6'],
    ['Toyota', 'Innova Hycross', 'toyota-innova-hycross'],
  ])('maps %s %s to %s', (make, model, slug) => {
    expect(getCarSlug(make, model)).toBe(slug);
  });

  it('slugifies unknown cars, dropping accents and punctuation', () => {
    expect(getCarSlug('Citroën', 'C3 Aircross!')).toBe('citroen-c3-aircross');
  });
});

describe('getCarGallery', () => {
  it('returns every photo for a known car', () => {
    const photos = getCarGallery('Tata Motors', 'Nexon');

    expect(photos.length).toBeGreaterThan(1);
    expect(photos.every((photo) => photo.startsWith('/car_images/tata-nexon/'))).toBe(true);
  });

  it('falls back to the default image, or nothing, for unknown cars', () => {
    expect(getCarGallery('Ford', 'Model T', '/t.jpg')).toEqual(['/t.jpg']);
    expect(getCarGallery('Ford', 'Model T')).toEqual([]);
  });
});
