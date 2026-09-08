import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useFlood } from '../../context/FloodContext';
import { BASEMAP_3D_SOURCES, DRONE_WAYPOINTS } from '../../constants';

export const GISMap3D: React.FC = () => {
  const { 
    villages, 
    selectedVillageId, 
    selectedVillageData, 
    basemap3D, 
    isDroneFlying, 
    toggleDroneFlying,
    simulation 
  } = useFlood();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map3dInstanceRef = useRef<maplibregl.Map | null>(null);
  const droneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Initialize MapLibre GL 3D Map
  useEffect(() => {
    if (!mapContainerRef.current || map3dInstanceRef.current) return;

    const defaultBasemap = BASEMAP_3D_SOURCES[basemap3D] || BASEMAP_3D_SOURCES.google_hybrid;

    const map3d = new maplibregl.Map({
      container: mapContainerRef.current,
      maxZoom: 18.5,
      minZoom: 2,
      maxPitch: 65,
      maxTileCacheSize: 250,
      style: {
        version: 8,
        sources: {
          'hybrid-satellite-source': {
            type: 'raster',
            tiles: defaultBasemap.tiles,
            tileSize: defaultBasemap.tileSize || 256,
            maxzoom: defaultBasemap.maxzoom || 20,
            attribution: defaultBasemap.attribution
          },
          'terrain-dem': {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 12
          }
        },
        layers: [
          {
            id: 'hybrid-satellite-layer',
            type: 'raster',
            source: 'hybrid-satellite-source',
            minzoom: 0,
            maxzoom: 22
          }
        ],
        terrain: {
          source: 'terrain-dem',
          exaggeration: 1.5
        }
      },
      center: [77.0560, 31.6702],
      zoom: 13,
      pitch: 58,
      bearing: -25
    });

    map3dInstanceRef.current = map3d;

    setTimeout(() => {
      if (map3dInstanceRef.current) {
        map3dInstanceRef.current.resize();
      }
    }, 150);

    map3d.on('load', () => {
      // 3D Flood water polygon source
      map3d.addSource('3d-flood-water-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map3d.addLayer({
        id: '3d-flood-water-fill',
        type: 'fill',
        source: '3d-flood-water-source',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.65
        }
      });

      // 3D Stream source
      map3d.addSource('3d-stream-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map3d.addLayer({
        id: '3d-stream-line-layer',
        type: 'line',
        source: '3d-stream-source',
        paint: {
          'line-color': '#0284c7',
          'line-width': 6,
          'line-opacity': 0.85
        }
      });

      map3d.addLayer({
        id: '3d-stream-pulse-layer',
        type: 'line',
        source: '3d-stream-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3.5,
          'line-opacity': 0.95,
          'line-dasharray': [0, 4, 3]
        }
      });

      // Continuous 3D flow pulse animation
      let step = 0;
      const animatePulse = () => {
        if (map3d.getLayer('3d-stream-pulse-layer')) {
          step = (step + 0.08) % 8;
          try {
            map3d.setPaintProperty('3d-stream-pulse-layer', 'line-dasharray', [step, Math.max(0.1, 4 - step), 4]);
          } catch (_) {}
        }
        animFrameRef.current = requestAnimationFrame(animatePulse);
      };
      animatePulse();
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
      map3d.remove();
      map3dInstanceRef.current = null;
    };
  }, []);

  // 2. Basemap 3D Switcher
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || !map3d.isStyleLoaded()) return;

    const cfg = BASEMAP_3D_SOURCES[basemap3D] || BASEMAP_3D_SOURCES.google_hybrid;

    try {
      if (map3d.getLayer('hybrid-satellite-layer')) {
        map3d.removeLayer('hybrid-satellite-layer');
      }
      if (map3d.getSource('hybrid-satellite-source')) {
        map3d.removeSource('hybrid-satellite-source');
      }

      map3d.addSource('hybrid-satellite-source', {
        type: 'raster',
        tiles: cfg.tiles,
        tileSize: cfg.tileSize || 256,
        maxzoom: cfg.maxzoom || 19,
        attribution: cfg.attribution
      });

      const beforeLayer = map3d.getLayer('3d-flood-water-fill') ? '3d-flood-water-fill' : undefined;
      map3d.addLayer({
        id: 'hybrid-satellite-layer',
        type: 'raster',
        source: 'hybrid-satellite-source',
        minzoom: 0,
        maxzoom: 22
      }, beforeLayer);
    } catch (err) {
      console.warn("3D basemap switch:", err);
    }
  }, [basemap3D]);

  // 3. Update 3D Inundation & River stream lines based on simulation sliders
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d || !map3d.isStyleLoaded()) return;

    const v = selectedVillageData?.village || villages.find(x => x.id === selectedVillageId);
    if (!v) return;

    // Update Stream
    if (v.river_stream && map3d.getSource('3d-stream-source')) {
      const streamGeoJson = v.river_stream.map(pt => [pt[1], pt[0]]);
      const streamWidth = Math.max(6, simulation.water * 4.5 + (simulation.rain > 80 ? 6 : 0));
      (map3d.getSource('3d-stream-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: streamGeoJson },
          properties: { stream_width: streamWidth }
        }]
      });
    }

    // Update Inundation Polygon
    if (v.inundation_polygon && map3d.getSource('3d-flood-water-source')) {
      const polyGeoJson = [v.inundation_polygon.map(pt => [pt[1], pt[0]])];
      (map3d.getSource('3d-flood-water-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: polyGeoJson },
          properties: { water_level: simulation.water }
        }]
      });
    }
  }, [selectedVillageData, selectedVillageId, simulation, villages]);

  // 4. Drone Flythrough Sequence
  useEffect(() => {
    const map3d = map3dInstanceRef.current;
    if (!map3d) return;

    if (isDroneFlying) {
      let wpIdx = 0;
      const flyNext = () => {
        if (!isDroneFlying) return;
        const wp = DRONE_WAYPOINTS[wpIdx];
        map3d.flyTo({
          center: wp.center as [number, number],
          zoom: wp.zoom,
          pitch: wp.pitch,
          bearing: wp.bearing,
          duration: 4500,
          essential: true
        });
        wpIdx = (wpIdx + 1) % DRONE_WAYPOINTS.length;
        droneTimerRef.current = setTimeout(flyNext, 5000);
      };
      flyNext();
    } else {
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
    }

    return () => {
      if (droneTimerRef.current) clearTimeout(droneTimerRef.current);
    };
  }, [isDroneFlying]);

  return (
    <div 
      ref={mapContainerRef} 
      id="gis-map-3d" 
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
};
