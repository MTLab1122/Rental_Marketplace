'use client';

import React, { useState } from 'react';

interface ImageGalleryProps {
  images: Array<{ id: string; url: string; thumbnailUrl?: string | null; caption?: string | null }>;
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const fallback =
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80';
  const displayImages =
    images.length > 0 ? images : [{ id: 'fallback', url: fallback, caption: 'Property Photo' }];
  const currentImage = displayImages[selectedIndex] || displayImages[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      {/* Main Feature Display */}
      <div className="relative aspect-[16/10] bg-navy-950 rounded-m3-lg overflow-hidden group">
        <img
          src={currentImage?.url}
          alt={currentImage?.caption || `${title} photo ${selectedIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setIsZoomed(true)}
        />

        {/* Counter Badge */}
        <div className="absolute bottom-3 right-3 bg-navy-900/80 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-m3-sm border border-navy-700">
          {selectedIndex + 1} / {displayImages.length}
        </div>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-navy-800 flex items-center justify-center shadow-md transition opacity-0 group-hover:opacity-100"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-navy-800 flex items-center justify-center shadow-md transition opacity-0 group-hover:opacity-100"
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayImages.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 h-14 flex-shrink-0 rounded-m3-sm overflow-hidden border-2 transition ${
                selectedIndex === idx
                  ? 'border-peshawar-600 scale-95 shadow-sm'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img.thumbnailUrl || img.url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 text-white font-bold text-2xl p-2"
          >
            ✕
          </button>
          <img
            src={currentImage?.url}
            alt="Zoomed view"
            className="max-w-full max-h-[90vh] object-contain rounded-m3-md"
          />
        </div>
      )}
    </div>
  );
}
