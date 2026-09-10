import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFlood } from '../../context/FloodContext';

export const MapNavControls: React.FC = () => {
  const { viewMode, selectedVillageData, selectedVillageId, villages } = useFlood();
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

  const handleZoomOut = () => {
    if (viewMode === '2d') {
      const map2d = (window as any).leafletMap;
      if (map2d) map2d.zoomOut();
    } else {
      const map3d = (window as any).map3dInstance;
      if (map3d) map3d.zoomOut({ duration: 300 });
    }
  };

  // Single Click: Reset to True North (0°) and standard horizon pitch
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
      {/* 🧭 Interactive Compass Button with Drag-to-Rotate & Double-Click 90° Spin */}
      <button 
        ref={compassRef}
        className="map-nav-btn compass-btn" 
        onClick={handleCompassClick}
        onDoubleClick={handleCompassDoubleClick}
        onMouseDown={handleMouseDown}
        title={viewMode === '3d' ? "Click: Reset North | Double Click: Rotate 90° | Drag: Rotate 360°" : "Reset Center to Village"}
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
        title="Zoom In"
        aria-label="Zoom In"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* ➖ Zoom Out Button */}
      <button 
        className="map-nav-btn" 
        onClick={handleZoomOut}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};
