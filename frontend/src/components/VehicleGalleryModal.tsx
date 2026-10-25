import { useEffect, useState } from 'react';
import type { Vehicle } from '../types';
import { getCarGallery } from '../data/carGalleries';
import { formatPrice, formatStockNumber } from '../utils/format';

interface VehicleGalleryModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onPurchase?: (vehicle: Vehicle) => void;
  onEnquire?: (vehicle: Vehicle) => void;
  isPurchasing?: boolean;
}

export function VehicleGalleryModal({
  vehicle,
  onClose,
  onPurchase,
  onEnquire,
  isPurchasing = false,
}: VehicleGalleryModalProps) {
  const images = getCarGallery(vehicle.make, vehicle.model, vehicle.imageUrl);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const isSoldOut = vehicle.quantity === 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && images.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
      if (e.key === 'ArrowLeft' && images.length > 1) {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  const activeImage = images[currentIndex] || vehicle.imageUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-lg border border-asphalt-700 bg-asphalt-900 shadow-2xl text-asphalt-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-asphalt-700/80 px-4 py-3 bg-asphalt-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold tracking-wider text-paint">
                {formatStockNumber(vehicle.id)}
              </span>
              <span className="rounded bg-asphalt-800 px-2 py-0.5 font-mono text-[11px] text-asphalt-300">
                {vehicle.category}
              </span>
            </div>
            <h2 id="gallery-modal-title" className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
              {vehicle.make} {vehicle.model}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-asphalt-400 hover:bg-asphalt-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Hero Viewer */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-md bg-asphalt-950 flex items-center justify-center border border-asphalt-800">
            {activeImage && !imageError ? (
              <img
                src={activeImage}
                alt={`${vehicle.make} ${vehicle.model} - photo ${currentIndex + 1}`}
                className="h-full w-full object-cover transition-opacity duration-200"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-asphalt-500">
                <span className="text-4xl">🚗</span>
                <span className="text-sm mt-2">{vehicle.make} {vehicle.model}</span>
              </div>
            )}

            {/* Sold out overlay */}
            {isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/65 backdrop-blur-[2px]">
                <div className="rotate-[-12deg] rounded-md border-4 border-red-500 px-6 py-2 font-display text-3xl font-black tracking-widest text-red-500 uppercase shadow-2xl">
                  Sold Out
                </div>
              </div>
            )}

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-asphalt-950/70 p-2.5 text-white hover:bg-paint hover:text-ink transition-colors backdrop-blur-sm"
                >
                  ◀
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-asphalt-950/70 p-2.5 text-white hover:bg-paint hover:text-ink transition-colors backdrop-blur-sm"
                >
                  ▶
                </button>
              </>
            )}

            {/* Counter badge */}
            {images.length > 0 && (
              <span className="absolute bottom-3 right-3 rounded-md bg-asphalt-950/80 px-2.5 py-1 font-mono text-xs text-asphalt-200 backdrop-blur-sm border border-asphalt-700">
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5">
              {images.map((imgUrl, idx) => (
                <button
                  key={imgUrl}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 aspect-[16/10] w-20 sm:w-24 overflow-hidden rounded border-2 transition-all ${
                    idx === currentIndex
                      ? 'border-paint scale-105 shadow-md'
                      : 'border-asphalt-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Vehicle specs banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md border border-asphalt-700/70 bg-asphalt-950/60 p-3 text-center">
            <div>
              <span className="block text-[11px] font-mono text-asphalt-400 uppercase">Make</span>
              <span className="font-semibold text-white text-sm">{vehicle.make}</span>
            </div>
            <div>
              <span className="block text-[11px] font-mono text-asphalt-400 uppercase">Model</span>
              <span className="font-semibold text-white text-sm">{vehicle.model}</span>
            </div>
            <div>
              <span className="block text-[11px] font-mono text-asphalt-400 uppercase">Body Style</span>
              <span className="font-semibold text-white text-sm">{vehicle.category}</span>
            </div>
            <div>
              <span className="block text-[11px] font-mono text-asphalt-400 uppercase">Available Stock</span>
              <span className={`font-mono font-bold text-sm ${isSoldOut ? 'text-red-400' : 'text-emerald-400'}`}>
                {isSoldOut ? '0 units (Sold out)' : `${vehicle.quantity} units`}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-asphalt-700/80 bg-asphalt-950/80 px-4 py-3">
          <div>
            <span className="block text-xs font-mono text-asphalt-400 uppercase">Ex-Showroom Price</span>
            <span className="font-mono text-2xl font-black text-paint">{formatPrice(vehicle.price)}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onEnquire && (
              <button
                type="button"
                className="btn-ghost flex-1 sm:flex-none border border-asphalt-600 hover:border-paint text-xs sm:text-sm"
                onClick={() => {
                  onClose();
                  onEnquire(vehicle);
                }}
              >
                💬 Enquire with Chinmay
              </button>
            )}

            {onPurchase && (
              <button
                type="button"
                disabled={isSoldOut || isPurchasing}
                className="btn-primary flex-1 sm:flex-none text-xs sm:text-sm"
                onClick={() => onPurchase(vehicle)}
              >
                {isPurchasing ? 'Purchasing...' : isSoldOut ? 'Sold Out' : 'Purchase Vehicle'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
