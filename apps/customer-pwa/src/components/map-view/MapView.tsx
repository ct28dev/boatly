'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Anchor, Ship, Navigation, MapPin, Waves } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MapMarker {
  id: string;
  type: 'pier' | 'boat' | 'user';
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
}

export interface MapViewProps {
  markers?: MapMarker[];
  mapboxToken?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
}

const markerIcons: Record<string, React.ElementType> = {
  pier: Anchor,
  boat: Ship,
  user: Navigation,
};

const markerColors: Record<string, string> = {
  pier: 'bg-[#0077b6] text-white',
  boat: 'bg-emerald-500 text-white',
  user: 'bg-blue-600 text-white',
};

export function MapView({
  markers = [],
  mapboxToken,
  center,
  zoom = 12,
  onMarkerClick,
  className,
}: MapViewProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    onMarkerClick?.(marker);
  };

  if (!mapboxToken) {
    return (
      <div
        className={cn(
          'relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd] to-[#90e0ef]',
          className,
        )}
        role="img"
        aria-label="Map view"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-[#0077b6]/20"
                style={{
                  width: `${80 + i * 60}px`,
                  height: `${80 + i * 60}px`,
                  top: `${20 + Math.sin(i) * 30}%`,
                  left: `${15 + Math.cos(i) * 40}%`,
                }}
              />
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
            <svg viewBox="0 0 1440 120" className="w-full h-full" preserveAspectRatio="none">
              <path
                fill="#0077b6"
                d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L0,120Z"
              />
            </svg>
          </div>
        </div>

        {markers.map((marker) => {
          const Icon = markerIcons[marker.type] || MapPin;
          const color = markerColors[marker.type] || 'bg-gray-500 text-white';

          return (
            <motion.button
              key={marker.id}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMarkerClick(marker)}
              className={cn(
                'absolute flex items-center justify-center',
                'w-10 h-10 rounded-full shadow-lg',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                color,
                marker.type === 'user' && 'ring-3 ring-blue-300',
              )}
              style={{
                top: `${30 + ((marker.lat - (center?.lat || 13.7)) * 500) % 60}%`,
                left: `${40 + ((marker.lng - (center?.lng || 100.5)) * 500) % 50}%`,
              }}
              aria-label={`${marker.label}${marker.sublabel ? ` - ${marker.sublabel}` : ''}`}
            >
              <Icon className="h-5 w-5" />
              {marker.type === 'boat' && (
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                />
              )}
            </motion.button>
          );
        })}

        {selectedMarker && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
          >
            <div className="flex items-center gap-2">
              {React.createElement(markerIcons[selectedMarker.type] || MapPin, {
                className: 'h-4 w-4 text-[#0077b6]',
              })}
              <div>
                <p className="text-sm font-semibold text-gray-800">{selectedMarker.label}</p>
                {selectedMarker.sublabel && (
                  <p className="text-xs text-gray-500">{selectedMarker.sublabel}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 backdrop-blur-sm">
          <Waves className="h-4 w-4 text-[#0077b6]" />
          <span className="text-xs font-medium text-gray-600">
            Map placeholder — add Mapbox token to enable
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden', className)}
      role="application"
      aria-label="Interactive map"
    >
      <div id="mapbox-container" className="w-full h-full" />
    </div>
  );
}
