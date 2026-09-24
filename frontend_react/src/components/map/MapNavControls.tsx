import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFlood } from '../../context/FloodContext';

export const MapNavControls: React.FC = () => {
  const { viewMode, selectedVillageData, selectedVillageId, villages, selectVillage } = useFlood();
  const [bearing, setBearing] = useState<number>(0);
  const compassRef = useRef<HTMLButtonElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);

  // Synchronize bearing from MapLibre
  useEffect(() => {
    const checkMap3D = setInterval(() => {
      const map3d = (window as any).map3dInstance;
      if (map3d && typeof map3d.getBearing === 'function') {
        const updateBearing = () => {
          setBearing(map3d.getBearing());
        };
        map3d.on('rotate', updateBearing);
        setBearing(map3d.getBearing());
        clearInterval(checkMap3D);
      }
    }, 300);

    return () => clearInterval(checkMap3D);
  }, []);

  const handleZoomIn = () => {
    if (viewMode === '2d') {
      const map2d = (window as any).leafletMap;
      if (map2d) map2d.zoomIn();
    } else {
      const map3d = (window as any).map3dInstance;
      if (map3d) map3d.zoomIn({ duration: 300 });
    }
  };

  // Minus button: Zoom-out down to full All-India national map limit (zoom level 4)
  const handleZoomOut = () => {
    if (viewMode === '2d') {
      const map2d = (window as any).leafletMap;
      if (map2d) {
        const currentZoom = map2d.getZoom();
        if (currentZoom > 4) {
          map2d.setZoom(Math.max(4, currentZoom - 1));
        }
      }
    } else {
      const map3d = (window as any).map3dInstance;
      if (map3d) {
        const currentZoom = map3d.getZoom();
        if (currentZoom > 4) {
          map3d.easeTo({ zoom: Math.max(4, currentZoom - 1), duration: 300 });
        }
      }
    }
  };

  // Single-click direct zoom out to All-India National Overview (Globe Button)
  const handleFullMap1000km = () => {
    selectVillage(null);
    if (viewMode === '2d') {
      const map2d = (window as any).leafletMap;
      if (map2d) {
        map2d.flyTo([22.5, 78.9], 5, { duration: 1.3 });
      }
    } else {
      const map3d = (window as any).map3dInstance;
      if (map3d) {
        map3d.flyTo({
          center: [78.9, 22.5],
          zoom: 4.8,
          pitch: 20,
          bearing: 0,
          duration: 1500
        });
        setBearing(0);
      }
    }
  };

  // Single Click: Reset to True North (0°) and standard horizon pitch / Village Center
  const handleCompassClick = () => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    if (viewMode === '3d') {
      const map3d = (window as any).map3dInstance;
      if (map3d) {
        map3d.easeTo({
          bearing: 0,
          pitch: 58,
          duration: 800
        });
        setBearing(0);
      }
    } else {
      const map2d = (window as any).leafletMap;
      const v = selectedVillageData?.village || villages.find(x => x.id === selectedVillageId);
      if (map2d) {
        if (v && typeof v.lat === 'number' && typeof v.lng === 'number') {
          map2d.setView([v.lat, v.lng], 13);
        } else {
          map2d.setView([31.74, 77.10], 11);
        }
      }
    }
  };

  // Double Click: Smoothly rotate 90° orbit around current mountain gorge
  const handleCompassDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMode === '3d') {
      const map3d = (window as any).map3dInstance;
      if (map3d) {
        const currentB = map3d.getBearing();
        const nextBearing = (currentB + 90) % 360;
        map3d.easeTo({
          bearing: nextBearing,
          pitch: 60,
          duration: 1000
        });
      }
    }
  };

  // Mouse Drag to Rotate Compass Dial & Map Bearing continuously
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== '3d') return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !compassRef.current) return;
      hasMovedRef.current = true;

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate angle from center to mouse cursor (0 deg = North)
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      const rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;

      const map3d = (window as any).map3dInstance;
      if (map3d) {
        map3d.setBearing(deg);
        setBearing(deg);
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="map-nav-controls" role="group" aria-label="Map Navigation Controls">
      {/* 🧭 Interactive Compass Button */}
      <button 
        ref={compassRef}
        className="map-nav-btn compass-btn" 
        onClick={handleCompassClick}
        onDoubleClick={handleCompassDoubleClick}
        onMouseDown={handleMouseDown}
        title={viewMode === '3d' ? "Click: Reset North | Double Click: Rotate 90° | Drag: Rotate 360°" : "Reset Focus to Village Center"}
        aria-label="Compass Navigation"
      >
        <div 
          className="compass-needle-ring" 
          style={{ transform: `rotate(${-bearing}deg)` }}
        >
          <div className="compass-pointer-north" />
          <div className="compass-pointer-south" />
        </div>
        <span className="compass-north-letter">N</span>
      </button>

      <div className="map-nav-divider" />

      {/* ➕ Zoom In Button */}
      <button 
        className="map-nav-btn" 
        onClick={handleZoomIn}
        title="Zoom In (+)"
        aria-label="Zoom In"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* ➖ Zoom Out Button (Capped at 50 km Limit) */}
      <button 
        className="map-nav-btn" 
        onClick={handleZoomOut}
        title="Zoom Out (Max 100 km limit)"
        aria-label="Zoom Out"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <div className="map-nav-divider" />

      {/* 🇮🇳 All-India National Overview Button */}
      <button 
        className="map-nav-btn full-map-btn" 
        onClick={handleFullMap1000km}
        title="🇮🇳 All-India National Overview (Click to zoom out)"
        aria-label="All-India National Overview"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </button>
    </div>
  );
};
