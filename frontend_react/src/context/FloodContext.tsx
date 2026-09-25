import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { 
  Village, 
  VillageDetailResponse, 
  RoleMode, 
  ThemeMode,
  ViewMode, 
  Basemap2D, 
  Basemap3D,
  BasinSummary
} from '../types';

interface FloodContextType {
  basins: BasinSummary[];
  activeBasinId: string;
  activeBasin: BasinSummary | null;
  villages: Village[];
  selectedVillageId: string | null;
  selectedVillageData: VillageDetailResponse | null;
  role: RoleMode;
  viewMode: ViewMode;
  basemap2D: Basemap2D;
  basemap3D: Basemap3D;
  isMethodologyOpen: boolean;
  isHydrographOpen: boolean;
  hydrographVillageId: string | null;
  isDroneFlying: boolean;
  theme: ThemeMode;
  
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

  isTourOpen: boolean;
  tourStep: number;
  startTour: () => void;
  closeTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  setTourStep: (step: number) => void;

  // Actions
  setRole: (role: RoleMode) => void;
  toggleTheme: () => void;
  setViewMode: (mode: ViewMode) => void;
  setBasemap2D: (basemap: Basemap2D) => void;
  setBasemap3D: (basemap: Basemap3D) => void;
  switchBasin: (basinId: string) => Promise<void>;
  selectVillage: (id: string | null, preserveSimulation?: boolean) => Promise<void>;
  setMethodologyOpen: (open: boolean) => void;
  setHydrographOpen: (open: boolean, villageId?: string | null) => void;
  toggleDroneFlying: (flying?: boolean) => void;
  toggleLayer: (layerName: keyof FloodContextType['layers'], visible?: boolean) => void;
  setSimulationValue: (key: 'rain' | 'soil' | 'water', value: number) => void;
  applyScenario: (preset: string) => Promise<void>;
  toggleWaterSensor: () => Promise<void>;
  refreshData: () => Promise<void>;
  updateVillagesFromTelemetry: (villages: Village[]) => void;
}

const FloodContext = createContext<FloodContextType | undefined>(undefined);

export const FloodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [basins, setBasins] = useState<BasinSummary[]>([]);
  const [activeBasinId, setActiveBasinId] = useState<string>("BASIN-HP-BEAS");
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [selectedVillageData, setSelectedVillageData] = useState<VillageDetailResponse | null>(null);
  const [role, setRole] = useState<RoleMode>("authority");
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [basemap2D, setBasemap2D] = useState<Basemap2D>("google_floodhub");
  const [basemap3D, setBasemap3D] = useState<Basemap3D>("google_hybrid");
  const [isMethodologyOpen, setMethodologyOpen] = useState<boolean>(false);
  const [isHydrographOpen, setHydrographOpenState] = useState<boolean>(false);
  const [hydrographVillageId, setHydrographVillageId] = useState<string | null>(null);
  const [isDroneFlying, setIsDroneFlying] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);

  const activeBasin = useMemo(() => {
    return basins.find(b => b.basin_id === activeBasinId) || basins[0] || null;
  }, [basins, activeBasinId]);

  const startTour = useCallback(() => {
    setRole('authority');
    setTourStep(0);
    setIsTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsTourOpen(false);
    setTourStep(0);
  }, []);

  const nextTourStep = useCallback(() => {
    setTourStep(prev => prev + 1);
  }, []);

  const prevTourStep = useCallback(() => {
    setTourStep(prev => Math.max(0, prev - 1));
  }, []);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('vigil_theme') as ThemeMode;
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('vigil_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

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

  // Fetch all basins and active basin villages
  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch Basins Catalog
      const basinsRes = await fetch("/api/basins");
      if (basinsRes.ok) {
        const basinsData = await basinsRes.json();
        if (basinsData.basins && Array.isArray(basinsData.basins)) {
          setBasins(basinsData.basins);
        }
      }

      // 2. Fetch Active Basin Villages
      const res = await fetch(`/api/villages?basin_id=${activeBasinId}`);
      const data = await res.json();
      if (data.villages && Array.isArray(data.villages)) {
        setVillages(data.villages);
      }
    } catch (err) {
      console.error("Failed to fetch basins/villages list:", err);
    }
  }, [activeBasinId]);

  const switchBasin = useCallback(async (basinId: string) => {
    setActiveBasinId(basinId);
    setSelectedVillageId(null);
    setSelectedVillageData(null);
    try {
      await fetch("/api/basins/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basin_id: basinId })
      });
      const res = await fetch(`/api/basins/${basinId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.villages && Array.isArray(data.villages)) {
          setVillages(data.villages);
        }
      }
    } catch (err) {
      console.error(`Failed to switch basin to ${basinId}:`, err);
    }
  }, []);

  const updateVillagesFromTelemetry = useCallback((newVillages: Village[]) => {
    if (newVillages && Array.isArray(newVillages)) {
      setVillages(newVillages);
      setSelectedVillageData(prev => {
        if (!prev) return null;
        const matching = newVillages.find(v => v.id === prev.village.id);
        if (!matching) return prev;
        return {
          ...prev,
          village: {
            ...prev.village,
            risk_percentage: matching.risk_percentage,
            risk_level: matching.risk_level,
            risk_badge: matching.risk_badge,
            lead_time_display: matching.lead_time_display
          },
          risk_analysis: {
            ...prev.risk_analysis,
            risk_percentage: matching.risk_percentage,
            risk_level: matching.risk_level,
            risk_badge: matching.risk_badge
          }
        };
      });
    }
  }, []);

  const selectVillage = useCallback(async (villageId: string | null, preserveSimulation: boolean = false) => {
    // If null -> deselect back to All-India mode
    if (!villageId) {
      setSelectedVillageId(null);
      setSelectedVillageData(null);
      return;
    }

    const isSameVillage = villageId === selectedVillageId;
    setSelectedVillageId(villageId);

    try {
      const res = await fetch(`/api/villages/${villageId}`);
      if (!res.ok) return;
      const data: VillageDetailResponse = await res.json();
      setSelectedVillageData(data);

      // Only overwrite slider values from backend telemetry if selecting a different village
      if (!isSameVillage && !preserveSimulation && data.telemetry) {
        setSimulation(prev => ({
          ...prev,
          rain: data.telemetry.rain_1h ?? prev.rain,
          soil: data.telemetry.soil_moisture ?? prev.soil,
          water: data.telemetry.water_level_m !== null ? data.telemetry.water_level_m : prev.water
        }));
      }
    } catch (err) {
      console.error(`Failed to load details for ${villageId}:`, err);
    }
  }, [selectedVillageId]);

  useEffect(() => {
    refreshData();
    // Default starts at All-India National View
    setSelectedVillageId(null);
    setSelectedVillageData(null);
  }, [refreshData]);

  const setHydrographOpen = useCallback((open: boolean, villageId: string | null = null) => {
    setHydrographOpenState(open);
    if (villageId) setHydrographVillageId(villageId);
    else if (open) setHydrographVillageId(selectedVillageId || 'VIL-01');
  }, [selectedVillageId]);

  const toggleDroneFlying = useCallback((flying?: boolean) => {
    setIsDroneFlying(prev => (flying !== undefined ? flying : !prev));
  }, []);

  const toggleLayer = useCallback((layerName: keyof typeof layers, visible?: boolean) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: visible !== undefined ? visible : !prev[layerName]
    }));
  }, []);

  const setSimulationValue = useCallback((key: 'rain' | 'soil' | 'water', value: number) => {
    setSimulation(prev => ({ ...prev, [key]: value, activePreset: "" }));
  }, []);

  const applyScenario = useCallback(async (scenarioName: string) => {
    setSimulation(prev => ({ ...prev, activePreset: scenarioName }));
    const targetVillageId = selectedVillageId || 'VIL-01';
    try {
      await fetch("/api/simulate/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_name: scenarioName })
      });
      await refreshData();
      if (selectedVillageId) {
        await selectVillage(selectedVillageId, false);
      }
    } catch (err) {
      console.error(`Failed to apply scenario ${scenarioName}:`, err);
    }
  }, [refreshData, selectVillage, selectedVillageId]);

  const toggleWaterSensor = useCallback(async () => {
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
      if (selectedVillageId) {
        await selectVillage(selectedVillageId, true);
      }
      await refreshData();
    } catch (err) {
      console.error("Failed to toggle water sensor:", err);
    }
  }, [selectedVillageData, selectVillage, selectedVillageId, refreshData]);

  const contextValue = useMemo<FloodContextType>(() => ({
    basins,
    activeBasinId,
    activeBasin,
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
    isTourOpen,
    tourStep,
    startTour,
    closeTour,
    nextTourStep,
    prevTourStep,
    setTourStep,
    theme,
    layers,
    simulation,
    setRole,
    toggleTheme,
    setViewMode,
    setBasemap2D,
    setBasemap3D,
    switchBasin,
    selectVillage,
    setMethodologyOpen,
    setHydrographOpen,
    toggleDroneFlying,
    toggleLayer,
    setSimulationValue,
    applyScenario,
    toggleWaterSensor,
    refreshData,
    updateVillagesFromTelemetry
  }), [
    basins,
    activeBasinId,
    activeBasin,
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
    isTourOpen,
    tourStep,
    startTour,
    closeTour,
    nextTourStep,
    prevTourStep,
    theme,
    layers,
    simulation,
    toggleTheme,
    switchBasin,
    selectVillage,
    setHydrographOpen,
    toggleDroneFlying,
    toggleLayer,
    setSimulationValue,
    applyScenario,
    toggleWaterSensor,
    refreshData,
    updateVillagesFromTelemetry
  ]);

  return (
    <FloodContext.Provider value={contextValue}>
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
