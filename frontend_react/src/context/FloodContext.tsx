import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Village, 
  VillageDetailResponse, 
  RoleMode, 
  ViewMode, 
  Basemap2D, 
  Basemap3D 
} from '../types';

interface FloodContextType {
  villages: Village[];
  selectedVillageId: string;
  selectedVillageData: VillageDetailResponse | null;
  role: RoleMode;
  viewMode: ViewMode;
  basemap2D: Basemap2D;
  basemap3D: Basemap3D;
  isMethodologyOpen: boolean;
  isHydrographOpen: boolean;
  hydrographVillageId: string | null;
  isDroneFlying: boolean;
  
  // Layer visibility toggles
  layers: {
    hazardZones: boolean;
    hexGrid: boolean;
    particles: boolean;
    shelters: boolean;
    routes: boolean;
    sensors: boolean;
    streams: boolean;
  };

  // What-If Simulation State
  simulation: {
    rain: number;
    soil: number;
    water: number;
    activePreset: string;
  };

  // Actions
  setRole: (role: RoleMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setBasemap2D: (basemap: Basemap2D) => void;
  setBasemap3D: (basemap: Basemap3D) => void;
  selectVillage: (id: string, fly?: boolean) => Promise<void>;
  setMethodologyOpen: (open: boolean) => void;
  setHydrographOpen: (open: boolean, villageId?: string | null) => void;
  toggleDroneFlying: (flying?: boolean) => void;
  toggleLayer: (layerName: keyof FloodContextType['layers'], visible?: boolean) => void;
  setSimulationValue: (key: 'rain' | 'soil' | 'water', value: number) => void;
  applyScenario: (preset: string) => Promise<void>;
  toggleWaterSensor: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const FloodContext = createContext<FloodContextType | undefined>(undefined);

export const FloodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string>("VIL-01");
  const [selectedVillageData, setSelectedVillageData] = useState<VillageDetailResponse | null>(null);
  const [role, setRole] = useState<RoleMode>("authority");
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [basemap2D, setBasemap2D] = useState<Basemap2D>("google_floodhub");
  const [basemap3D, setBasemap3D] = useState<Basemap3D>("google_hybrid");
  const [isMethodologyOpen, setMethodologyOpen] = useState<boolean>(false);
  const [isHydrographOpen, setHydrographOpenState] = useState<boolean>(false);
  const [hydrographVillageId, setHydrographVillageId] = useState<string | null>(null);
  const [isDroneFlying, setIsDroneFlying] = useState<boolean>(false);

  const [layers, setLayers] = useState({
    hazardZones: true,
    hexGrid: true,
    particles: true,
    shelters: true,
    routes: true,
    sensors: true,
    streams: true
  });

  const [simulation, setSimulation] = useState({
    rain: 15,
    soil: 42,
    water: 1.1,
    activePreset: "cloudburst"
  });

  // Fetch initial villages and selected village detail
  const refreshData = async () => {
    try {
      const res = await fetch("/api/villages");
      const data = await res.json();
      if (data.villages && Array.isArray(data.villages)) {
        setVillages(data.villages);
      }
    } catch (err) {
      console.error("Failed to fetch villages list:", err);
    }
  };

  const selectVillage = async (villageId: string) => {
    setSelectedVillageId(villageId);
    try {
      const res = await fetch(`/api/villages/${villageId}`);
      const data: VillageDetailResponse = await res.json();
      setSelectedVillageData(data);
      if (data.telemetry) {
        setSimulation(prev => ({
          ...prev,
          rain: data.telemetry.rain_1h || 0,
          soil: data.telemetry.soil_moisture || 0,
          water: data.telemetry.water_level_m !== null ? data.telemetry.water_level_m : 1.0
        }));
      }
    } catch (err) {
      console.error(`Failed to load details for ${villageId}:`, err);
    }
  };

  useEffect(() => {
    refreshData().then(() => {
      selectVillage("VIL-01");
    });
  }, []);

  const setHydrographOpen = (open: boolean, villageId: string | null = null) => {
    setHydrographOpenState(open);
    if (villageId) setHydrographVillageId(villageId);
    else if (open) setHydrographVillageId(selectedVillageId);
  };

  const toggleDroneFlying = (flying?: boolean) => {
    setIsDroneFlying(prev => (flying !== undefined ? flying : !prev));
  };

  const toggleLayer = (layerName: keyof typeof layers, visible?: boolean) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: visible !== undefined ? visible : !prev[layerName]
    }));
  };

  const setSimulationValue = (key: 'rain' | 'soil' | 'water', value: number) => {
    setSimulation(prev => ({ ...prev, [key]: value, activePreset: "" }));
  };

  const applyScenario = async (preset: string) => {
    setSimulation(prev => ({ ...prev, activePreset: preset }));
    try {
      const res = await fetch(`/api/simulate/${preset.toLowerCase()}`);
      const data = await res.json();
      if (data.telemetry) {
        setSimulation(prev => ({
          ...prev,
          rain: data.telemetry.rain_1h || 0,
          soil: data.telemetry.soil_moisture || 0,
          water: data.telemetry.water_level_m || 1.0,
          activePreset: preset
        }));
      }
      await selectVillage(selectedVillageId);
      await refreshData();
    } catch (err) {
      console.error(`Failed to apply scenario ${preset}:`, err);
    }
  };

  const toggleWaterSensor = async () => {
    try {
      const isCurrentlyOffline = selectedVillageData?.sensor_health?.sensors?.find(s => (s.sensor_type || '').toLowerCase().includes("water"))?.status === "OFFLINE";
      const newStatus = isCurrentlyOffline ? "ONLINE" : "OFFLINE";
      await fetch("/api/sensors/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensor_id: `SENS-PND-WTR-01`,
          status: newStatus
        })
      });
      await selectVillage(selectedVillageId);
      await refreshData();
    } catch (err) {
      console.error("Failed to toggle water sensor:", err);
    }
  };

  return (
    <FloodContext.Provider
      value={{
        villages,
        selectedVillageId,
        selectedVillageData,
        role,
        viewMode,
        basemap2D,
        basemap3D,
        isMethodologyOpen,
        isHydrographOpen,
        hydrographVillageId,
        isDroneFlying,
        layers,
        simulation,
        setRole,
        setViewMode,
        setBasemap2D,
        setBasemap3D,
        selectVillage,
        setMethodologyOpen,
        setHydrographOpen,
        toggleDroneFlying,
        toggleLayer,
        setSimulationValue,
        applyScenario,
        toggleWaterSensor,
        refreshData
      }}
    >
      {children}
    </FloodContext.Provider>
  );
};

export const useFlood = (): FloodContextType => {
  const context = useContext(FloodContext);
  if (!context) {
    throw new Error("useFlood must be used within a FloodProvider");
  }
  return context;
};
