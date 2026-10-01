import React from 'react';
import { useFlood } from '../../context/FloodContext';
import { GISMap2D } from './GISMap2D';
import { GISMap3D } from './GISMap3D';
import { NullschoolCanvas } from './NullschoolCanvas';
import { MapNavControls } from './MapNavControls';
import { UniversalSearchBar } from './UniversalSearchBar';
import { HazardFilterBar } from './HazardFilterBar';
import { MapLayersControl } from './MapLayersControl';
import { MapWeatherHazardSymbols } from '../weather/MapWeatherHazardSymbols';
import { NationalAlertsDrawer } from '../weather/NationalAlertsDrawer';

export const MapContainer: React.FC = () => {
  const { viewMode } = useFlood();

  return (
    <div className="map-wrapper" id="tour-gis-map">
      {/* 2D Leaflet Tactical Map & Nullschool particles */}
      <div style={{ width: '100%', height: '100%', display: viewMode === '2d' ? 'block' : 'none', position: 'absolute', top: 0, left: 0 }}>
        <GISMap2D />
        <NullschoolCanvas />
      </div>

      {/* 3D WebGL Mountain Terrain Mesh Map */}
      <div style={{ width: '100%', height: '100%', display: viewMode === '3d' ? 'block' : 'none', position: 'absolute', top: 0, left: 0 }}>
        <GISMap3D />
      </div>

      {/* 🌦️ Live National Meteorological & Hazard Map Symbols Layer */}
      <MapWeatherHazardSymbols />

      {/* 🔍 Universal Search Bar (Pan-India Coordinate & Village Spot Analysis) */}
      <UniversalSearchBar />

      {/* 📋 National Disaster Alert Feed Drawer (Right Side - No Overlap) */}
      <NationalAlertsDrawer />

      {/* ⚠️ Hazard Categories Filter Bar (All, Landslides, Flash Floods, Multi-Hazard) */}
      <HazardFilterBar />

      {/* 🌊 Google Maps Style Floating Layers Widget (Positioned right below Hazard Filter) */}
      <MapLayersControl />

      {/* 🧭 Integrated Map Navigation Controls (Top-Left: Compass, Zoom In, Zoom Out, Globe, 2D/3D Mode) */}
      <MapNavControls />
    </div>
  );
};
