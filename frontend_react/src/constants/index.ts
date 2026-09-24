// SIH 26192 - Application Constants

export const GOOGLE_MAPS_API_KEY = "AIzaSyAPMWF9BlkHHfGbhX02kATKW2DkfDt3CDo";

export const RISK_COLORS: Record<string, string> = {
  EXTREME: "#8b0000",
  CRITICAL: "#8b0000",
  DANGER: "#ef4444",
  HIGH: "#ef4444",
  WARNING: "#f59e0b",
  MODERATE: "#f59e0b",
  NORMAL: "#10b981",
  LOW: "#10b981",
  NO_DATA: "#94a3b8"
};

export const BASEMAP_2D_TILES = {
  google_floodhub: {
    name: "Vector Road",
    url: `https://{s}.google.com/vt/lyrs=m&hl=en&gl=IN&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
    options: { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '&copy; Cartography Services' },
    isDarkFilter: false
  },
  google_terrain: {
    name: "Terrain Topo",
    url: `https://{s}.google.com/vt/lyrs=p&hl=en&gl=IN&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
    options: { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '&copy; Cartography Services' },
    isDarkFilter: false
  },
  google_satellite: {
    name: "Satellite Imagery",
    url: `https://{s}.google.com/vt/lyrs=y&hl=en&gl=IN&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
    options: { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '&copy; Satellite Imagery' },
    isDarkFilter: false
  },
  google_dark: {
    name: "Dark Tactical",
    url: `https://{s}.google.com/vt/lyrs=m&hl=en&gl=IN&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
    options: { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '&copy; Cartography Services' },
    isDarkFilter: true
  },
  topo: {
    name: "Open Topo",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    options: { maxZoom: 17, subdomains: ['a', 'b', 'c'], attribution: '&copy; OpenStreetMap contributors, SRTM' },
    isDarkFilter: false
  }
};

export const BASEMAP_3D_SOURCES = {
  google_hybrid: {
    name: "Satellite Hybrid 3D",
    tiles: [
      `https://mt0.google.com/vt/lyrs=y&hl=en&gl=IN&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
      `https://mt1.google.com/vt/lyrs=y&hl=en&gl=IN&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
      `https://mt2.google.com/vt/lyrs=y&hl=en&gl=IN&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`,
      `https://mt3.google.com/vt/lyrs=y&hl=en&gl=IN&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: "&copy; Satellite Imagery"
  },
  esri_satellite: {
    name: "ESRI Satellite",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: "&copy; Esri World Imagery"
  },
  topo_3d: {
    name: "3D Contours",
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
    name: "3D Dark",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: "&copy; Esri Dark Gray Base"
  }
};

export const DRONE_WAYPOINTS = [
  { center: [77.0394, 31.6702], zoom: 13.8, pitch: 62, bearing: -35, desc: "Beas River Hydroelectric Gorge (889m)" },
  { center: [77.0510, 31.6765], zoom: 14.5, pitch: 65, bearing: -15, desc: "Downhill Inundation Critical Threat Zone" },
  { center: [77.0420, 31.6750], zoom: 15.0, pitch: 58, bearing: 45, desc: "Evacuation Highway SH-13 Ascent" },
  { center: [77.0360, 31.6780], zoom: 14.8, pitch: 50, bearing: -70, desc: "Safe Ridge Shelter (960m Elev)" }
];
