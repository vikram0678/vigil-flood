// SIH 26192 - Flash Flood Early Warning Dashboard Application Logic
let map = null;
let map3d = null;
let is3DMode = false;
let currentBaseLayer = null;
let villageMarkers = {};
let villageMarkers3D = [];
let shelterLayerGroup = null;
let routeLayerGroup = null;
let hazardZoneLayerGroup = null;
let streamLayerGroup = null;
let sensorLayerGroup = null;

let currentVillageId = "VIL-01";
let allVillages = [];
let ws = null;
let isAudioEnabled = false;

// Color mapping constants
const RISK_COLORS = {
  LOW: "#10b981",
  MODERATE: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444"
};

// Basemap Tile Configurations (Google Maps & Topo Layers)
const BASEMAP_TILES = {
  google_terrain: {
    url: "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    options: { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '&copy; Google Maps' },
    isDarkFilter: false // Real Google Mountain Elevation Shading & Contours
  },
  google_satellite: {
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    options: { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '&copy; Google Maps' },
    isDarkFilter: false // High-Res Google Satellite with Village Labels & Roads
  },
  google_dark: {
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    options: { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '&copy; Google Maps' },
    isDarkFilter: true // Google Roads in Dark Command Mode
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    options: { maxZoom: 17, attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM' },
    isDarkFilter: false
  }
};

// 3D Mountain Mesh Tile Sources (CORS-Enabled & Multi-Provider Backup)
const BASEMAP_3D_SOURCES = {
  esri_satellite: {
    name: "High-Res 3D Satellite",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: "&copy; Esri World Imagery"
  },
  google_hybrid: {
    name: "Google Hybrid 3D",
    tiles: [
      "https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      "https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      "https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
    ],
    tileSize: 256,
    maxzoom: 20,
    attribution: "&copy; Google Maps"
  },
  topo_3d: {
    name: "3D Topo Contours",
    tiles: [
      "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
      "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
      "https://c.tile.opentopomap.org/{z}/{x}/{y}.png"
    ],
    tileSize: 256,
    maxzoom: 17,
    attribution: "&copy; OpenTopoMap"
  },
  dark_3d: {
    name: "3D Dark Tactical",
    tiles: [
      "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
    ],
    tileSize: 512,
    maxzoom: 19,
    attribution: "&copy; CARTO"
  }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  fetchInitialData(true);
  initWebSocket();
  setupEventListeners();
});

// 1. Initialize Leaflet GIS Map
function initMap() {
  const mandiCoords = [31.74, 77.10];
  map = L.map("gis-map", {
    zoomControl: true,
    attributionControl: false
  }).setView(mandiCoords, 11);

  // Initialize Layer Groups
  shelterLayerGroup = L.layerGroup().addTo(map);
  routeLayerGroup = L.layerGroup().addTo(map);
  hazardZoneLayerGroup = L.layerGroup().addTo(map);
  streamLayerGroup = L.layerGroup().addTo(map);
  sensorLayerGroup = L.layerGroup().addTo(map);

  // Set default basemap to Google Mountain Terrain
  setBasemap("google_terrain");

  // Add scale control
  L.control.scale({ position: "bottomleft" }).addTo(map);

  // Click-to-Get Real-Time DEM Elevation from Open-Meteo API
  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;

    // Create instant loading popup with close button enabled
    const popup = L.popup({
      closeButton: false, // We use our custom styled close button in the header
      autoClose: true,
      closeOnClick: false,
      className: "custom-elevation-popup"
    })
      .setLatLng([lat, lng])
      .setContent(`
        <div class="elevation-popup-card">
          <div class="elev-popup-header">
            <div class="elev-popup-title">📡 Querying 30m DEM...</div>
            <button onclick="map.closePopup();" class="elev-close-btn" title="Close">&times;</button>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); padding:4px 0;">📍 ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>
        </div>
      `)
      .openOn(map);

    try {
      // Call backend elevation proxy (which calls Open-Meteo API)
      const res = await fetch(`/api/terrain/elevation?lat=${lat}&lng=${lng}`);
      const data = await res.json();

      popup.setContent(`
        <div class="elevation-popup-card">
          <div class="elev-popup-header">
            <div class="elev-popup-title">⛰️ Topographic Spot Analysis</div>
            <button onclick="map.closePopup();" class="elev-close-btn" title="Close">&times;</button>
          </div>
          <div class="elev-popup-grid">
            <div>
              <div class="elev-popup-label">ELEVATION (DEM)</div>
              <div class="elev-popup-val">${data.elevation_m} m</div>
            </div>
            <div>
              <div class="elev-popup-label">TERRAIN ZONE</div>
              <div style="font-size:0.75rem; font-weight:700; color:${data.zone_color};">${data.terrain_zone}</div>
            </div>
          </div>
          <div class="elev-popup-coords">📍 ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>
          <div style="font-size:0.65rem; color:var(--text-muted); margin-top:4px;">Source: ${data.source}</div>
        </div>
      `);
    } catch (err) {
      console.error("Elevation fetch error:", err);
    }
  });
}

// 1B. Initialize MapLibre GL JS 3D Mountain Terrain Mesh with Real Place Names & Labels
function init3DMap() {
  if (map3d) return;

  try {
    const defaultBasemap = BASEMAP_3D_SOURCES.google_hybrid;
    map3d = new maplibregl.Map({
      container: "gis-map-3d",
      maxZoom: 18.5,
      minZoom: 2,
      maxPitch: 80,
      style: {
        version: 8,
        sources: {
          // 1. High-Resolution Google Hybrid Satellite with Village Names, Roads & Places
          "hybrid-satellite-source": {
            type: "raster",
            tiles: defaultBasemap.tiles,
            tileSize: defaultBasemap.tileSize || 256,
            maxzoom: defaultBasemap.maxzoom || 20,
            attribution: defaultBasemap.attribution
          },
          // 2. Free Global 3D DEM Terrarium Elevation Mesh
          "terrain-dem": {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
            ],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 15
          }
        },
        layers: [
          {
            id: "hybrid-satellite-layer",
            type: "raster",
            source: "hybrid-satellite-source",
            minzoom: 0,
            maxzoom: 22
          }
        ],
        terrain: {
          source: "terrain-dem",
          exaggeration: 1.5 // Enhanced 1.5x Himalayan Mountain Relief
        }
      },
      center: [77.0560, 31.6702], // Pandoh (Real Beas Riverbed)
      zoom: 13,
      pitch: 65, // 3D Camera Tilt
      bearing: -25 // 3D Angle
    });

    // Add 3D Navigation & Tilt Controls
    map3d.addControl(new maplibregl.NavigationControl({
      visualizePitch: true
    }), "top-left");

    // Click-to-Get Real-Time 30m DEM Elevation in 3D Mode
    let popup3d = null;
    map3d.on("click", async (e) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;

      if (popup3d) popup3d.remove();

      popup3d = new maplibregl.Popup({
        offset: 15,
        closeButton: false,
        className: "custom-elevation-popup-3d"
      })
        .setLngLat([lng, lat])
        .setHTML(`
          <div class="elevation-popup-card">
            <div class="elev-popup-header">
              <div class="elev-popup-title">📡 Querying 30m DEM...</div>
              <button onclick="if(window.currentPopup3D) window.currentPopup3D.remove();" class="elev-close-btn" title="Close">&times;</button>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); padding:4px 0;">📍 ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>
          </div>
        `)
        .addTo(map3d);

      window.currentPopup3D = popup3d;

      try {
        const res = await fetch(`/api/terrain/elevation?lat=${lat}&lng=${lng}`);
        const data = await res.json();

        popup3d.setHTML(`
          <div class="elevation-popup-card">
            <div class="elev-popup-header">
              <div class="elev-popup-title">⛰️ Topographic Spot Analysis</div>
              <button onclick="if(window.currentPopup3D) window.currentPopup3D.remove();" class="elev-close-btn" title="Close">&times;</button>
            </div>
            <div class="elev-popup-grid">
              <div>
                <div class="elev-popup-label">ELEVATION (DEM)</div>
                <div class="elev-popup-val">${data.elevation_m} m</div>
              </div>
              <div>
                <div class="elev-popup-label">TERRAIN ZONE</div>
                <div style="font-size:0.75rem; font-weight:700; color:${data.zone_color};">${data.terrain_zone}</div>
              </div>
            </div>
            <div class="elev-popup-coords">📍 ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>
            <div style="font-size:0.65rem; color:var(--text-muted); margin-top:4px;">Source: ${data.source}</div>
          </div>
        `);
      } catch (err) {
        console.error("3D elevation fetch error:", err);
      }
    });

    // Add 3D Inundation Water Surface & River Stream Layers when loaded
    map3d.on("load", () => {
      // 1. Dynamic 3D Flood Inundation Polygon Source
      map3d.addSource("3d-flood-water-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });

      // 2. Dynamic 3D River Stream Line Source
      map3d.addSource("3d-stream-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });

      // 3. 3D Flood Inundation Surface Fill (Glows & Expands on Terrain)
      map3d.addLayer({
        id: "3d-flood-water-fill",
        type: "fill",
        source: "3d-flood-water-source",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "water_level"],
            1.0, "rgba(2, 132, 199, 0.45)",
            3.0, "rgba(6, 182, 212, 0.65)",
            5.0, "rgba(239, 68, 68, 0.75)"
          ],
          "fill-opacity": 0.85
        }
      });

      // 4. 3D Inundation Outline Stroke
      map3d.addLayer({
        id: "3d-flood-water-outline",
        type: "line",
        source: "3d-flood-water-source",
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "water_level"],
            1.0, "#38bdf8",
            3.0, "#f59e0b",
            5.0, "#ef4444"
          ],
          "line-width": 3
        }
      });

      // 5. 3D Base River Stream Surge Line
      map3d.addLayer({
        id: "3d-stream-line-layer",
        type: "line",
        source: "3d-stream-source",
        paint: {
          "line-color": "#0284c7",
          "line-width": ["get", "stream_width"],
          "line-opacity": 0.85
        }
      });

      // 6. 3D Animated Downhill River Flow Pulse Layer
      map3d.addLayer({
        id: "3d-stream-pulse-layer",
        type: "line",
        source: "3d-stream-source",
        paint: {
          "line-color": "#ffffff",
          "line-width": 3.5,
          "line-opacity": 0.95,
          "line-dasharray": [0, 4, 3]
        }
      });

      start3DStreamFlowAnimation();
      render3DMarkers(allVillages);
      update3DFloodSimulation();
    });
  } catch (e) {
    console.error("MapLibre 3D Init Error:", e);
  }
}

// 3D River Stream Continuous Flow Animation Loop
let streamAnimFrame = null;
let streamDashStep = 0;
function start3DStreamFlowAnimation() {
  if (streamAnimFrame) cancelAnimationFrame(streamAnimFrame);
  function animate() {
    if (map3d && map3d.getLayer("3d-stream-pulse-layer")) {
      streamDashStep = (streamDashStep + 0.08) % 8;
      const d1 = streamDashStep;
      const d2 = Math.max(0.1, 4 - d1);
      const d3 = 4;
      try {
        map3d.setPaintProperty("3d-stream-pulse-layer", "line-dasharray", [d1, d2, d3]);
      } catch (err) { }
    }
    streamAnimFrame = requestAnimationFrame(animate);
  }
  streamAnimFrame = requestAnimationFrame(animate);
}

// Update 3D Dynamic Rising Water Simulation Based on Sliders / Current Telemetry
function update3DFloodSimulation() {
  if (!map3d) return;

  const curV = allVillages.find(v => v.id === currentVillageId);
  if (!curV) return;

  const waterSliderVal = parseFloat(document.getElementById("slider-water")?.value || 1.1);
  const rainSliderVal = parseFloat(document.getElementById("slider-rain")?.value || 15);

  // 1. Update 3D River Stream Line Width & Surge (Ordered from High Upstream -> Low Downstream)
  if (map3d.getSource("3d-stream-source") && curV.river_stream) {
    const streamGeoJson = curV.river_stream.map(pt => [pt[1], pt[0]]);
    const streamWidth = Math.max(6, waterSliderVal * 4.5 + (rainSliderVal > 80 ? 6 : 0));

    map3d.getSource("3d-stream-source").setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: streamGeoJson
          },
          properties: {
            stream_width: streamWidth
          }
        }
      ]
    });
  }

  // 2. Update 3D Inundation Catchment Flood Polygon
  if (map3d.getSource("3d-flood-water-source") && curV.hazard_zones) {
    const polyCoords = curV.hazard_zones.red_inundation_polygon || [];
    if (polyCoords.length > 0) {
      const geoJsonRing = polyCoords.map(pt => [pt[1], pt[0]]);
      geoJsonRing.push([polyCoords[0][1], polyCoords[0][0]]);

      map3d.getSource("3d-flood-water-source").setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [geoJsonRing]
            },
            properties: {
              water_level: waterSliderVal
            }
          }
        ]
      });
    }
  }
}

// Render 3D Markers & Floating Place Labels on MapLibre
function render3DMarkers(villages) {
  if (!map3d || !villages.length) return;

  // Clear previous 3D markers
  villageMarkers3D.forEach(m => m.remove());
  villageMarkers3D = [];

  villages.forEach(v => {
    // A. Village 3D Floating Name Badge
    const el = document.createElement("div");
    el.className = "marker-3d-village-badge";
    el.innerHTML = `
      <div class="badge-3d-bubble">
        <span class="badge-3d-dot"></span>
        <span><b>${v.name}</b> (${v.elevation_m}m)</span>
      </div>
    `;
    el.onclick = () => selectVillage(v.id);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([v.lng, v.lat])
      .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(`
        <div style="font-family:sans-serif; padding:4px;">
          <div style="font-weight:700; color:#0284c7;">🏔️ ${v.name} (${v.ward})</div>
          <div style="font-size:11px;">Elevation: <b>${v.elevation_m}m</b> | Slope: <b>${v.slope_deg}°</b></div>
          <div style="font-size:11px; color:#ef4444; font-weight:700; margin-top:2px;">Threat: ${v.risk_percentage}% (${v.risk_level})</div>
        </div>
      `))
      .addTo(map3d);

    villageMarkers3D.push(marker);

    // B. Safe Ridge Shelter 3D Marker (High Ground)
    const shelters = v.safe_shelters || [];
    shelters.forEach(s => {
      const shelterEl = document.createElement("div");
      shelterEl.className = "marker-3d-shelter-badge";
      shelterEl.innerHTML = `
        <div class="shelter-3d-bubble">
          ⛺ <b>${s.name}</b> (${s.elevation_m}m)
        </div>
      `;
      const shelterMarker = new maplibregl.Marker({ element: shelterEl })
        .setLngLat([s.lng, s.lat])
        .addTo(map3d);

      villageMarkers3D.push(shelterMarker);
    });

    // Helper: Compute geographic bearing (0-360 deg) from (lat1, lon1) to (lat2, lon2)
    function getBearing(lat1, lon1, lat2, lon2) {
      const toRad = deg => (deg * Math.PI) / 180;
      const toDeg = rad => (rad * 180) / Math.PI;
      const phi1 = toRad(lat1);
      const phi2 = toRad(lat2);
      const deltaLambda = toRad(lon2 - lon1);
      const y = Math.sin(deltaLambda) * Math.cos(phi2);
      const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
      const brng = toDeg(Math.atan2(y, x));
      return (brng + 360) % 360;
    }

    const HYDRO_STREAM_ARROW_SVG = `
  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg" class="hydro-vector-svg">
    <path d="M16 28 L16 4" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M7 13 L16 3 L25 13" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 20 L16 13 L22 20" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  </svg>
`;

    // Generate evenly-spaced streamline sample points & bearings along the downhill river path
    function getDownhillFlowArrowPoints(streamCoords) {
      if (!streamCoords || streamCoords.length < 2) return [];
      // streamCoords in pilot_villages.json are already normalized from highest elevation to lowest elevation
      const downhillPts = streamCoords;
      const arrowPoints = [];

      for (let i = 0; i < downhillPts.length - 1; i++) {
        const p1 = downhillPts[i];
        const p2 = downhillPts[i + 1];
        const bearing = getBearing(p1[0], p1[1], p2[0], p2[1]);

        // Add multiple spaced vector arrows along each segment (at 30% and 70%)
        [0.30, 0.70].forEach(ratio => {
          const lat = p1[0] + (p2[0] - p1[0]) * ratio;
          const lng = p1[1] + (p2[1] - p1[1]) * ratio;
          arrowPoints.push({ lat, lng, bearing, segIndex: i, ratio });
        });
      }
      return arrowPoints;
    }

    // C. 3D Flow Direction Badges along River Canyon (🌊 Downhill Flow)
    if (v.river_stream && v.river_stream.length > 1) {
      const downhillStream = v.river_stream;
      const pts = v.river_stream;
      const midIdx = Math.floor(pts.length / 2);
      const midPt = pts[midIdx];

      // 1. Central Floating Flow Banner (Billboarded to Viewport)
      const flowEl = document.createElement("div");
      flowEl.className = "marker-3d-flow-badge";
      flowEl.innerHTML = `
        <div class="badge-3d-flow-bubble">
          <span>🌊 FLOOD FLOW: DOWNHILL GORGE</span>
          <span class="flow-arrow-icon">➤➤➤</span>
        </div>
      `;
      const flowMarker = new maplibregl.Marker({ element: flowEl, rotationAlignment: 'viewport' })
        .setLngLat([midPt[1], midPt[0]])
        .addTo(map3d);
      villageMarkers3D.push(flowMarker);

      // 2. Multiple Evenly-Spaced Downhill Direction Arrows Locked to 3D Terrain
      const flowArrows = getDownhillFlowArrowPoints(v.river_stream);
      flowArrows.forEach((pt, idx) => {
        const chevronEl = document.createElement("div");
        chevronEl.className = "marker-3d-chevron-badge";
        chevronEl.innerHTML = `<div class="badge-3d-chevron" title="Downhill Flow #${idx + 1} (${Math.round(pt.bearing)}° Bearing)">${HYDRO_STREAM_ARROW_SVG}</div>`;
        const chevronMarker = new maplibregl.Marker({
          element: chevronEl,
          rotationAlignment: 'map',
          pitchAlignment: 'map',
          rotation: pt.bearing
        })
          .setLngLat([pt.lng, pt.lat])
          .addTo(map3d);
        villageMarkers3D.push(chevronMarker);
      });

      // 3. Upstream & Downstream 3D Elevation Badges
      const upperPt = downhillStream[0];
      const lowerPt = downhillStream[downhillStream.length - 1];

      const upEl = document.createElement("div");
      upEl.className = "marker-3d-endpoint-badge";
      upEl.innerHTML = `<div class="hydro-endpoint-3d-bubble upstream">🏔️ Upstream Ridge ➔</div>`;
      const upMarker = new maplibregl.Marker({ element: upEl, rotationAlignment: 'viewport' })
        .setLngLat([upperPt[1], upperPt[0]])
        .addTo(map3d);
      villageMarkers3D.push(upMarker);

      const downEl = document.createElement("div");
      downEl.className = "marker-3d-endpoint-badge";
      downEl.innerHTML = `<div class="hydro-endpoint-3d-bubble downstream">🌊 Gorge Basin (${v.elevation_m}m) ➔</div>`;
      const downMarker = new maplibregl.Marker({ element: downEl, rotationAlignment: 'viewport' })
        .setLngLat([lowerPt[1], lowerPt[0]])
        .addTo(map3d);
      villageMarkers3D.push(downMarker);
    }
  });
}

// Switch between 2D Tactical and 3D Mountain Mesh Views
function switchViewMode(mode) {
  is3DMode = mode === "3d";

  const map2DDiv = document.getElementById("gis-map");
  const map3DDiv = document.getElementById("gis-map-3d");
  const section2D = document.getElementById("basemap-section-2d");
  const section3D = document.getElementById("basemap-section-3d");

  document.querySelectorAll(".view-mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === mode);
  });

  if (is3DMode) {
    map2DDiv.style.display = "none";
    map3DDiv.style.display = "block";
    section2D.style.display = "none";
    section3D.style.display = "block";

    init3DMap();
    setTimeout(() => {
      if (map3d) {
        map3d.resize();
        render3DMarkers(allVillages);
        update3DFloodSimulation();
        const curV = allVillages.find(v => v.id === currentVillageId);
        if (curV) {
          map3d.flyTo({ center: [curV.lng, curV.lat], zoom: 13.2, pitch: 65, bearing: -25 });
        }
      }
    }, 150);
  } else {
    map2DDiv.style.display = "block";
    map3DDiv.style.display = "none";
    section2D.style.display = "block";
    section3D.style.display = "none";

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 100);
  }
}

// 2. Basemap Switcher Handler
function setBasemap(type) {
  const cfg = BASEMAP_TILES[type] || BASEMAP_TILES.dark;

  if (currentBaseLayer) {
    map.removeLayer(currentBaseLayer);
  }

  currentBaseLayer = L.tileLayer(cfg.url, cfg.options).addTo(map);

  const mapContainer = document.getElementById("gis-map");
  if (cfg.isDarkFilter) {
    mapContainer.classList.add("map-dark-filter");
  } else {
    mapContainer.classList.remove("map-dark-filter");
  }

  // Update active button state
  document.querySelectorAll(".basemap-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.basemap === type);
  });
}

// 2B. 3D Mountain Mesh Basemap Switcher Handler
function setBasemap3D(type) {
  if (!map3d) return;
  const cfg = BASEMAP_3D_SOURCES[type] || BASEMAP_3D_SOURCES.esri_satellite;

  document.querySelectorAll(".basemap-3d-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.basemap3d === type);
  });

  try {
    if (map3d.getLayer("hybrid-satellite-layer")) {
      map3d.removeLayer("hybrid-satellite-layer");
    }
    if (map3d.getSource("hybrid-satellite-source")) {
      map3d.removeSource("hybrid-satellite-source");
    }

    map3d.addSource("hybrid-satellite-source", {
      type: "raster",
      tiles: cfg.tiles,
      tileSize: cfg.tileSize || 256,
      maxzoom: cfg.maxzoom || 19,
      attribution: cfg.attribution
    });

    const beforeLayer = map3d.getLayer("3d-flood-water-fill") ? "3d-flood-water-fill" : undefined;
    map3d.addLayer({
      id: "hybrid-satellite-layer",
      type: "raster",
      source: "hybrid-satellite-source",
      minzoom: 0,
      maxzoom: 22
    }, beforeLayer);
  } catch (err) {
    console.error("3D basemap switch error:", err);
  }
}

// 3. Fetch Initial Telemetry & Villages
async function fetchInitialData(isFirstLoad = false) {
  try {
    const res = await fetch("/api/villages");
    const data = await res.json();
    allVillages = data.villages || [];
    renderVillageList(allVillages);
    updateMapMarkers(allVillages);
    updateThreatIndex(allVillages);

    // Select first village ONLY on initial page load
    if (isFirstLoad && allVillages.length > 0) {
      selectVillage(allVillages[0].id, true);
    }

    // Update 3D markers if in 3D mode
    if (is3DMode && map3d) {
      render3DMarkers(allVillages);
      update3DFloodSimulation();
    }
  } catch (err) {
    console.error("Error fetching villages:", err);
  }
}

// 4. Render Threat-Ranked Disaster Triage List in Left Panel
function renderVillageList(villages) {
  const container = document.getElementById("village-list-container");
  if (!container) return;
  container.innerHTML = "";

  // Sort automatically by threat percentage descending (Highest Risk First)
  const sortedVillages = [...villages].sort((a, b) => (b.risk_percentage || 0) - (a.risk_percentage || 0));

  sortedVillages.forEach((v, index) => {
    const card = document.createElement("div");
    const isCritical = v.risk_level === "CRITICAL" || v.risk_percentage >= 85;
    const isSelected = v.id === currentVillageId;

    card.className = `village-card ${isSelected ? "selected" : ""} ${isCritical ? "critical-pulse-card" : ""}`;
    card.id = `card-${v.id}`;
    card.onclick = () => selectVillage(v.id, true);

    const badgeClass = `badge-${v.risk_level.toLowerCase()}`;
    const rankLabel = `#${index + 1}`;

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="village-rank-badge" title="Triage Threat Rank">${rankLabel}</span>
        <div class="village-info">
          <h4>${v.name}</h4>
          <div class="village-meta">Elev: ${v.elevation_m}m | Slope: ${v.slope_deg}°</div>
          <div class="village-shelter-preview">
            <span>⏳ ${v.lead_time_display || "10-30 min"}</span>
            <span>•</span>
            <span>⛺ ${v.primary_shelter || "Safe Ridge"}</span>
          </div>
        </div>
      </div>
      <div class="risk-badge ${badgeClass}">
        ${v.risk_badge} ${v.risk_percentage}%
      </div>
    `;
    container.appendChild(card);
  });
}

// 5. Update Leaflet Map Markers & Polygons
function updateMapMarkers(villages) {
  villages.forEach(v => {
    const color = RISK_COLORS[v.risk_level] || "#10b981";

    // Custom Pulsating Circle Marker
    if (!villageMarkers[v.id]) {
      const circle = L.circleMarker([v.lat, v.lng], {
        radius: 12,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8
      }).addTo(map);

      circle.bindTooltip(`<b>${v.name}</b><br>Risk: ${v.risk_percentage}% (${v.risk_level})`, {
        permanent: false,
        direction: "top"
      });

      circle.on("click", () => selectVillage(v.id, true));
      villageMarkers[v.id] = circle;
    } else {
      villageMarkers[v.id].setStyle({
        fillColor: color,
        radius: v.risk_level === "CRITICAL" ? 16 : 12
      });
      villageMarkers[v.id].setTooltipContent(`<b>${v.name}</b><br>Risk: ${v.risk_percentage}% (${v.risk_level})`);
    }
  });
}

// 6. Select a Village & Load Deep-Dive Analysis
async function selectVillage(villageId, flyCamera = true) {
  currentVillageId = villageId;

  // Highlight card in list
  document.querySelectorAll(".village-card").forEach(c => c.classList.remove("selected"));
  const selectedCard = document.getElementById(`card-${villageId}`);
  if (selectedCard) selectedCard.classList.add("selected");

  try {
    const res = await fetch(`/api/villages/${villageId}`);
    const data = await res.json();
    renderVillageDetail(data);
    renderMapGISOverlays(data);

    // ONLY fly camera if explicitly requested (e.g. user clicked a different village)
    if (flyCamera) {
      if (is3DMode && map3d) {
        map3d.flyTo({
          center: [data.village.lng, data.village.lat],
          zoom: 13.2,
          pitch: 65,
          bearing: -30,
          essential: true
        });
      }
    }

    // Always update 3D flood polygon without rebuilding all DOM markers during slider drags
    if (is3DMode && map3d) {
      if (flyCamera) {
        render3DMarkers(allVillages);
      }
      update3DFloodSimulation();
    }
  } catch (err) {
    console.error("Error loading village details:", err);
  }
}

// 7. Render Deep-Dive Telemetry, AI Risk, XAI, and Action Engine
function renderVillageDetail(data) {
  const v = data.village;
  const tel = data.telemetry;
  const risk = data.risk_analysis;
  const lead = data.lead_time;
  const health = data.sensor_health;
  const action = data.action_plan;

  // Header
  document.getElementById("detail-village-name").innerText = `${v.name} (${v.ward})`;
  document.getElementById("detail-village-meta").innerText =
    `Elevation: ${v.elevation_m}m | Slope: ${v.slope_deg}° | Stream Dist: ${v.distance_to_stream_m}m | Pop: ${v.population}`;

  // Risk Banner
  const banner = document.getElementById("risk-banner");
  banner.className = `banner-risk ${risk.risk_level}`;
  document.getElementById("risk-pct-large").innerText = `${risk.risk_percentage}%`;
  document.getElementById("risk-level-large").innerText = `${risk.risk_badge} ${risk.risk_level}`;
  document.getElementById("risk-model-badge").innerText = `Model: ${risk.model_type} (${Math.round(risk.confidence_score * 100)}% Conf)`;
  document.getElementById("lead-time-large").innerText = lead.window_display;

  // Dual-Hazard Breakdown (Inundation vs Debris Slope Failure)
  const floodPct = Math.min(100, Math.round(risk.risk_percentage * 0.95 + (tel.water_level_m ? tel.water_level_m * 8 : 0)));
  const slopePct = Math.min(100, Math.round(risk.risk_percentage * 0.85 + (v.slope_deg * 0.5) + (tel.soil_moisture * 0.2)));

  document.getElementById("val-flood-pct").innerText = `${floodPct}%`;
  document.getElementById("bar-flood-pct").style.width = `${floodPct}%`;
  document.getElementById("val-slope-pct").innerText = `${slopePct}%`;
  document.getElementById("bar-slope-pct").style.width = `${slopePct}%`;

  // Telemetry Gauges
  document.getElementById("tel-rain").innerText = `${tel.rain_1h || 0} mm/h`;
  document.getElementById("tel-soil").innerText = `${tel.soil_moisture || 0}%`;
  document.getElementById("tel-water").innerText = tel.water_level_m !== null ? `${tel.water_level_m} m` : "OFFLINE ⚠️";
  document.getElementById("tel-tilt").innerText = `${tel.tilt_deg || 0}°`;

  // Explainable AI (XAI)
  renderExplainability(risk.explainability);

  // Sensor Health Status
  renderSensorHealth(health.sensors, health.data_health_pct);

  // Action & Evacuation Directives
  renderActionPlan(action);

  // Update What-If Sliders with current telemetry
  document.getElementById("slider-rain").value = tel.rain_1h || 0;
  document.getElementById("val-rain").innerText = `${tel.rain_1h || 0} mm/h`;
  document.getElementById("slider-soil").value = tel.soil_moisture || 0;
  document.getElementById("val-soil").innerText = `${tel.soil_moisture || 0}%`;
  document.getElementById("slider-water").value = tel.water_level_m || 1.0;
  document.getElementById("val-water").innerText = `${tel.water_level_m || 1.0} m`;

  // Citizen view sync
  renderCitizenView(v, risk, lead, action);
}

// 8. Render Explainable AI (XAI) Feature Attribution
function renderExplainability(factors) {
  const container = document.getElementById("xai-container");
  container.innerHTML = "";

  factors.forEach(f => {
    const row = document.createElement("div");
    row.className = "xai-bar-row";
    row.innerHTML = `
      <div class="xai-bar-label-row">
        <span>${f.factor}</span>
        <span style="font-weight:700; color: var(--accent-cyan);">${f.contribution_pct}%</span>
      </div>
      <div class="xai-bar-track">
        <div class="xai-bar-fill" style="width: ${f.contribution_pct}%;"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

// 9. Render Sensor Health Matrix
function renderSensorHealth(sensors, healthPct) {
  const container = document.getElementById("sensor-matrix-container");
  document.getElementById("health-pct-badge").innerText = `${healthPct}% Data Health`;
  container.innerHTML = "";

  sensors.forEach(s => {
    const item = document.createElement("div");
    item.className = "sensor-item";
    item.innerHTML = `
      <div>
        <div style="font-weight:600;">${s.sensor_type.toUpperCase()}</div>
        <div style="font-size:0.68rem; color:var(--text-muted);">${s.sensor_id}</div>
      </div>
      <div class="sensor-state-badge ${s.status}">
        ${s.status}
      </div>
    `;
    container.appendChild(item);
  });
}

// 10. Render Action Plan & SMS Broadcast
function renderActionPlan(action) {
  const container = document.getElementById("action-plan-container");
  container.innerHTML = `
    <div class="action-title">📢 ${action.headline}</div>
    <div style="font-size:0.75rem; color:var(--accent-cyan); margin-bottom:6px; font-weight:600;">
      Tier: ${action.escalation_tier}
    </div>
  `;

  action.recommended_actions.forEach(act => {
    const item = document.createElement("div");
    item.className = "action-item";
    item.innerText = act;
    container.appendChild(item);
  });

  document.getElementById("sms-preview").innerText = action.simulated_sms_broadcast;
}

// 11. Render All GIS Overlays (Hazard Zones, Shelters, Routes, Streams, Sensors)
function renderMapGISOverlays(data) {
  const v = data.village;
  const isCritical = data.risk_analysis.risk_level === "CRITICAL";

  // Clear previous layers
  shelterLayerGroup.clearLayers();
  routeLayerGroup.clearLayers();
  hazardZoneLayerGroup.clearLayers();
  streamLayerGroup.clearLayers();
  sensorLayerGroup.clearLayers();

  // A. Hazard Area Inundation & Slope Polygons (Red, Orange, Green Zones)
  if (v.hazard_zones) {
    const zones = v.hazard_zones;

    // 🔴 Red Inundation Zone (Riverside Flash Flood Buffer)
    if (zones.red_inundation_polygon) {
      const redPoly = L.polygon(zones.red_inundation_polygon, {
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: isCritical ? 0.55 : 0.35,
        weight: isCritical ? 3 : 2,
        dashArray: isCritical ? "4, 6" : null
      });
      redPoly.bindTooltip("<b>🔴 Red Hazard Zone</b><br>High Flash Flood & Inundation Risk", { sticky: true });
      hazardZoneLayerGroup.addLayer(redPoly);
    }

    // 🟠 Orange Slope Zone (Steep Landslide Runoff Zone)
    if (zones.orange_slope_polygon) {
      const orangePoly = L.polygon(zones.orange_slope_polygon, {
        color: "#f97316",
        fillColor: "#f97316",
        fillOpacity: 0.25,
        weight: 1.5
      });
      orangePoly.bindTooltip("<b>🟠 Orange Buffer Zone</b><br>Steep Slope & Debris Flow Risk", { sticky: true });
      hazardZoneLayerGroup.addLayer(orangePoly);
    }

    // 🟢 Green Safe Ridge Zone (Relief Shelter Safe Area)
    if (zones.green_safe_polygon) {
      const greenPoly = L.polygon(zones.green_safe_polygon, {
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.3,
        weight: 2
      });
      greenPoly.bindTooltip("<b>🟢 Green Safe Zone</b><br>Elevated Ground / Safe Relief Area", { sticky: true });
      hazardZoneLayerGroup.addLayer(greenPoly);
    }
  }

  // B. River Drainage Streams (🌊 Multi-layer Hydrodynamic Flow + Spaced Downhill Arrows)
  if (v.river_stream && v.river_stream.length > 1) {
    const downhillStream = v.river_stream;

    // 1. Base Wide River Channel (Deep River Blue)
    const baseStreamLine = L.polyline(v.river_stream, {
      color: "#0369a1",
      weight: 12,
      opacity: 0.85
    });
    baseStreamLine.bindTooltip(`<b>🌊 River Drainage Channel</b><br>Flow Direction: <b>Downhill into Gorge (${v.elevation_m}m)</b><br>Downstream Velocity: <b>25–35 km/h</b>`, { sticky: true });
    streamLayerGroup.addLayer(baseStreamLine);

    // 2. Inner Hydrodynamic Core Track (Vibrant Cyan)
    const coreStreamLine = L.polyline(v.river_stream, {
      color: "#06b6d4",
      weight: 6,
      opacity: 0.9
    });
    streamLayerGroup.addLayer(coreStreamLine);

    // 3. Continuous Animated Downhill Pulse Line (White fluid particle stream)
    const pulseLine = L.polyline(downhillStream, {
      color: "#ffffff",
      weight: 3.5,
      opacity: 0.95,
      className: "animated-stream-flow-pulse"
    });
    streamLayerGroup.addLayer(pulseLine);

    // 4. Multiple Evenly-Spaced Downhill Flow Direction Arrows along the River
    const flowArrows = getDownhillFlowArrowPoints(v.river_stream);
    flowArrows.forEach((pt, idx) => {
      const arrowMarker = L.marker([pt.lat, pt.lng], {
        icon: L.divIcon({
          className: "hydro-arrow-marker-wrapper",
          html: `<div class="flow-stream-chevron" style="transform: rotate(${pt.bearing}deg);" title="Downhill River Flow #${idx + 1} (${Math.round(pt.bearing)}° Bearing)">${HYDRO_STREAM_ARROW_SVG}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        }),
        zIndexOffset: 900
      });
      streamLayerGroup.addLayer(arrowMarker);
    });

    // 5. Central Flow Direction Pill Banner in 2D
    const midIdx = Math.floor(v.river_stream.length / 2);
    const midCoord = v.river_stream[midIdx];
    const flowBadgeMarker = L.marker(midCoord, {
      icon: L.divIcon({
        className: "flow-badge-wrapper",
        html: `<div class="flow-direction-2d-badge"><span>🌊 FLOOD FLOW: DOWNHILL GORGE</span><span class="flow-arrow-icon">➤➤➤</span></div>`,
        iconSize: [210, 30],
        iconAnchor: [105, 15]
      }),
      zIndexOffset: 1000
    });
    streamLayerGroup.addLayer(flowBadgeMarker);

    // 6. Upstream Inflow & Downstream Gorge Endpoint Badges
    const upperPt = downhillStream[0];
    const lowerPt = downhillStream[downhillStream.length - 1];

    const upstreamBadge = L.marker(upperPt, {
      icon: L.divIcon({
        className: "endpoint-badge-wrapper",
        html: `<div class="hydro-endpoint-badge upstream">🏔️ Upstream Ridge ➔</div>`,
        iconSize: [160, 24],
        iconAnchor: [80, 28]
      }),
      zIndexOffset: 950
    });
    streamLayerGroup.addLayer(upstreamBadge);

    const downstreamBadge = L.marker(lowerPt, {
      icon: L.divIcon({
        className: "endpoint-badge-wrapper",
        html: `<div class="hydro-endpoint-badge downstream">🌊 Gorge Basin (${v.elevation_m}m) ➔</div>`,
        iconSize: [160, 24],
        iconAnchor: [90, -8]
      }),
      zIndexOffset: 950
    });
    streamLayerGroup.addLayer(downstreamBadge);
  }

  // C. Safe Relief Shelters (⛺ Sleek Compact Pin)
  const shelters = v.safe_shelters || [];
  shelters.forEach(s => {
    const shelterMarker = L.marker([s.lat, s.lng], {
      icon: L.divIcon({
        className: "custom-shelter-pin",
        html: `<div class="shelter-pin-badge">⛺</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })
    });
    shelterMarker.bindTooltip(`
      <div style="font-family:sans-serif; padding:2px;">
        <div style="font-weight:700; color:#10b981;">⛺ ${s.name}</div>
        <div style="font-size:11px; color:#cbd5e1;">Capacity: <b>${s.capacity}</b> people | Elev: <b>${s.elevation_m}m</b></div>
        <div style="font-size:10px; color:#34d399; margin-top:2px;">Status: DESIGNATED SAFE REFUGE</div>
      </div>
    `, { sticky: true, direction: "top" });
    shelterLayerGroup.addLayer(shelterMarker);
  });

  // D. Evacuation Routes (🛣️)
  const routes = v.evacuation_routes || [];
  routes.forEach(r => {
    const isSafe = r.safety_score > 50;
    const pathCoords = r.path || [[v.lat, v.lng], [shelters[0]?.lat || v.lat, shelters[0]?.lng || v.lng]];

    const routeLine = L.polyline(pathCoords, {
      color: isSafe ? "#10b981" : "#ef4444",
      weight: 3.5,
      dashArray: isSafe ? "6, 8" : "2, 6",
      opacity: 0.9
    });
    routeLine.bindTooltip(`<b>${r.name}</b><br>Status: ${r.status}`, { sticky: true });
    routeLayerGroup.addLayer(routeLine);
  });

  // E. Real-Time IoT Sensor Nodes (📡 Sleek Compact Sensor Pin)
  const sensors = v.sensor_locations || [];
  sensors.forEach(sens => {
    const sensorMarker = L.marker([sens.lat, sens.lng], {
      icon: L.divIcon({
        className: "custom-sensor-pin",
        html: `<div class="sensor-pin-badge">📡</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    });
    sensorMarker.bindTooltip(`
      <div style="font-family:sans-serif; padding:2px;">
        <div style="font-weight:700; color:#38bdf8;">📡 ${sens.type} Node</div>
        <div style="font-size:11px; color:#cbd5e1;">ID: <code>${sens.id}</code></div>
        <div style="font-size:10px; color:#10b981;">Status: LIVE TELEMETRY STREAMING</div>
      </div>
    `, { sticky: true, direction: "top" });
    sensorLayerGroup.addLayer(sensorMarker);
  });
}

// 12. Render Citizen Public View
function renderCitizenView(v, risk, lead, action) {
  const header = document.getElementById("citizen-header");
  header.className = `citizen-alert-header banner-risk ${risk.risk_level}`;
  document.getElementById("cit-village").innerText = v.name;
  document.getElementById("cit-status").innerText = risk.risk_level;
  document.getElementById("cit-time").innerText = lead.window_display;
  document.getElementById("cit-shelter").innerText = action.primary_shelter ? action.primary_shelter.name : "High Ridge School";
  document.getElementById("cit-route").innerText = action.recommended_route ? action.recommended_route.name : "Upper Highway";
}

// 13. Update Threat Index Meter
function updateThreatIndex(villages) {
  if (!villages.length) return;
  const avgRisk = Math.round(villages.reduce((acc, v) => acc + v.risk_percentage, 0) / villages.length);
  document.getElementById("threat-meter-val").innerText = `${avgRisk}%`;
  document.getElementById("threat-bar-fill").style.width = `${avgRisk}%`;
}

// 14. Interactive Controls & Event Listeners
function setupEventListeners() {
  // A0. 2D / 3D View Switcher Buttons
  document.querySelectorAll(".view-mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.view;
      switchViewMode(mode);
    });
  });

  // A. Basemap Switcher Buttons (2D)
  document.querySelectorAll(".basemap-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const basemapType = btn.dataset.basemap;
      setBasemap(basemapType);
    });
  });

  // A2. Basemap Switcher Buttons (3D Mountain Mesh)
  document.querySelectorAll(".basemap-3d-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const basemapType = btn.dataset.basemap3d;
      setBasemap3D(basemapType);
    });
  });

  // B. Layer Visibility Filter Checkboxes
  document.getElementById("filter-hazard-zones").addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(hazardZoneLayerGroup);
    else map.removeLayer(hazardZoneLayerGroup);
  });

  document.getElementById("filter-shelters").addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(shelterLayerGroup);
    else map.removeLayer(shelterLayerGroup);
  });

  document.getElementById("filter-routes").addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(routeLayerGroup);
    else map.removeLayer(routeLayerGroup);
  });

  document.getElementById("filter-sensors").addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(sensorLayerGroup);
    else map.removeLayer(sensorLayerGroup);
  });

  document.getElementById("filter-streams").addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(streamLayerGroup);
    else map.removeLayer(streamLayerGroup);
  });

  // C. What-If Preset Buttons
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const scenario = btn.dataset.scenario;
      await applyScenario(scenario);
    });
  });

  // D. What-If Sliders (Debounced to prevent WebGL context overload)
  const rainSlider = document.getElementById("slider-rain");
  const soilSlider = document.getElementById("slider-soil");
  const waterSlider = document.getElementById("slider-water");
  let simDebounceTimer = null;

  const sendCustomUpdate = () => {
    const rain = parseFloat(rainSlider.value);
    const soil = parseFloat(soilSlider.value);
    const water = parseFloat(waterSlider.value);

    document.getElementById("val-rain").innerText = `${rain} mm/h`;
    document.getElementById("val-soil").innerText = `${soil}%`;
    document.getElementById("val-water").innerText = `${water} m`;

    // 1. Instantly update 3D rising flood simulation on WebGL GPU canvas (60fps smooth)
    if (is3DMode && map3d) {
      update3DFloodSimulation();
    }

    // 2. Debounce backend ML inference call to 120ms to avoid network/DOM thrashing
    clearTimeout(simDebounceTimer);
    simDebounceTimer = setTimeout(async () => {
      try {
        await fetch("/api/simulate/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            village_id: currentVillageId,
            rain_1h: rain,
            soil_moisture: soil,
            water_level_m: water,
            water_level_rise_rate: (water - 1.0) * 0.4
          })
        });
        selectVillage(currentVillageId, false);
      } catch (e) {
        console.error(e);
      }
    }, 120);
  };

  rainSlider.addEventListener("input", sendCustomUpdate);
  soilSlider.addEventListener("input", sendCustomUpdate);
  waterSlider.addEventListener("input", sendCustomUpdate);

  // E. Role Switcher
  document.querySelectorAll(".role-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".role-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const role = btn.dataset.role;
      if (role === "citizen") {
        document.getElementById("authority-view").style.display = "none";
        document.getElementById("citizen-view").style.display = "block";
      } else {
        document.getElementById("authority-view").style.display = "grid";
        document.getElementById("citizen-view").style.display = "none";
      }
    });
  });

  // F. Sensor Outage Toggle Button
  const toggleBtn = document.getElementById("btn-toggle-water-sensor");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", async () => {
      try {
        const isOffline = toggleBtn.dataset.state === "offline";
        const newStatus = isOffline ? "ONLINE" : "OFFLINE";
        await fetch("/api/sensors/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sensor_id: `SENS-PND-WTR-01`,
            status: newStatus
          })
        });
        toggleBtn.dataset.state = newStatus.toLowerCase();
        toggleBtn.innerText = isOffline ? "Disconnect Water Sensor" : "Reconnect Water Sensor";
        selectVillage(currentVillageId);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // G. Scientific Methodology Modal Controls
  const modal = document.getElementById("methodology-modal");
  const openModalBtn = document.getElementById("btn-open-methodology");
  const closeModalBtn = document.getElementById("btn-close-methodology");

  if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
      modal.classList.add("active");
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  // Close when clicking on backdrop
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }

  // Modal Tab Switching
  document.querySelectorAll(".modal-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".modal-tab-pane").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetTab = btn.dataset.tab;
      const targetPane = document.getElementById(targetTab);
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

// Apply Scenario Preset
async function applyScenario(scenarioName) {
  try {
    await fetch("/api/simulate/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_name: scenarioName })
    });
    await fetchInitialData(false);
    selectVillage(currentVillageId, false);

    // Update 3D rising water simulation
    if (is3DMode) {
      setTimeout(update3DFloodSimulation, 200);
    }
  } catch (e) {
    console.error("Error applying scenario:", e);
  }
}

// 15. Initialize WebSocket Telemetry Stream
function initWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

  ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "TELEMETRY_PULSE") {
        updateMapMarkers(data.villages);
        updateThreatIndex(data.villages);
      }
    } catch (e) {
      console.error("WS error:", e);
    }
  };

  ws.onclose = () => {
    setTimeout(initWebSocket, 4000);
  };
}
