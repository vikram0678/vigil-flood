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
import { Language, getTranslation, applyGoogleTranslate } from '../utils/translations';

interface FloodContextType {
  basins: BasinSummary[];
  activeBasinId: string;
  activeBasin: BasinSummary | null;
  villages: Village[];
  allVillages: Village[];
  selectedVillageId: string | null;
  selectedVillageData: VillageDetailResponse | null;
  role: RoleMode;
  viewMode: ViewMode;
  basemap2D: Basemap2D;
  basemap3D: Basemap3D;
  isMethodologyOpen: boolean;
  isGeomorphicOpen: boolean;
  setGeomorphicOpen: (open: boolean) => void;
  isHydrographOpen: boolean;
  hydrographVillageId: string | null;
  isDroneFlying: boolean;
  theme: ThemeMode;
  
  // Hazard Category Filter (Google Maps Style)
  hazardFilter: 'ALL' | 'LANDSLIDE' | 'FLASH_FLOOD' | 'MULTI_HAZARD';
  setHazardFilter: (filter: 'ALL' | 'LANDSLIDE' | 'FLASH_FLOOD' | 'MULTI_HAZARD') => void;

  // Layer visibility toggles
  layers: {
    hazardZones: boolean;
    hexGrid: boolean;
    particles: boolean;
    shelters: boolean;
    routes: boolean;
    sensors: boolean;
    streams: boolean;
    stormSymbols: boolean;
    contoursDEM: boolean;
    dopplerRadar: boolean;
    flowArrows: boolean;
    villageLabels: boolean;
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
  // Right Telemetry Panel Collapse (Right slide collapse, collapsed by default)
  isTelemetryCollapsed: boolean;
  setIsTelemetryCollapsed: (collapsed: boolean) => void;
  toggleTelemetryPanel: () => void;

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
  // Loading State
  isLoadingVillages: boolean;
  // Multi-Language Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  // Full-page Tactical Dossier Routing
  activePage: 'command_center' | 'tactical_dossier';
  setActivePage: (page: 'command_center' | 'tactical_dossier') => void;
  dossierVillageId: string;
  setDossierVillageId: (id: string) => void;
  openTacticalDossier: (villageId?: string) => void;
  closeTacticalDossier: () => void;
}

const FloodContext = createContext<FloodContextType | undefined>(undefined);

export const FloodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [basins, setBasins] = useState<BasinSummary[]>([]);
  const [activeBasinId, setActiveBasinId] = useState<string>("ALL");
  const [allVillages, setAllVillages] = useState<Village[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoadingVillages, setIsLoadingVillages] = useState<boolean>(true);
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('vigil_language') as Language;
    return saved === 'hi' ? 'hi' : 'en';
  });
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [selectedVillageData, setSelectedVillageData] = useState<VillageDetailResponse | null>(null);
  const [role, setRoleState] = useState<RoleMode>("authority");
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [basemap2D, setBasemap2D] = useState<Basemap2D>("google_floodhub");
  const [basemap3D, setBasemap3D] = useState<Basemap3D>("google_hybrid");
  const [isMethodologyOpen, setMethodologyOpen] = useState<boolean>(false);
  const [isGeomorphicOpen, setGeomorphicOpen] = useState<boolean>(false);
  const [isHydrographOpen, setHydrographOpenState] = useState<boolean>(false);
  const [hydrographVillageId, setHydrographVillageId] = useState<string | null>(null);
  const [isDroneFlying, setIsDroneFlying] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);

  // Right Telemetry Panel Collapsed by Default (Right slide)
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState<boolean>(true);

  // Full-Page View Navigation ('command_center' | 'tactical_dossier')
  const [activePage, setActivePage] = useState<'command_center' | 'tactical_dossier'>('command_center');
  const [dossierVillageId, setDossierVillageId] = useState<string>('VIL-01');

  const openTacticalDossier = useCallback((villageId?: string) => {
    const targetId = villageId || selectedVillageId || 'VIL-01';
    setDossierVillageId(targetId);
    setActivePage('tactical_dossier');
    window.location.hash = `#/dossier?village=${targetId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedVillageId]);

  const closeTacticalDossier = useCallback(() => {
    setActivePage('command_center');
    if (window.location.hash.includes('dossier')) {
      window.location.hash = '#/';
    }
  }, []);

  // Listen to hash changes (browser back/forward & direct links)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes('dossier')) {
        setActivePage('tactical_dossier');
        const match = hash.match(/village=([A-Za-z0-9_-]+)/);
        if (match && match[1]) {
          setDossierVillageId(match[1]);
        }
      } else {
        setActivePage('command_center');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const toggleTelemetryPanel = useCallback(() => {
    setIsTelemetryCollapsed(prev => !prev);
  }, []);

  const ALL_INDIA_BASIN: BasinSummary = useMemo(() => ({
    basin_id: "ALL",
    name: "All-India Valleys",
    state: "All Monitored States",
    region_type: "National Multi-Basin Network",
    center_coords: [24.5, 78.9],
    default_zoom: 5.2,
    bounding_box: [[8.0, 68.0], [35.0, 97.0]],
    total_villages: 26,
    active_threat_level: "CRITICAL",
    primary_river: "Indus, Ganga, Brahmaputra & Western Ghats",
    hydrology_agency: "Central Water Commission (CWC) & NDMA",
    description: "Unified national triage monitoring across all 4 pilot mountain basins (26 monitored wards)."
  }), []);

  const activeBasin = useMemo(() => {
    if (activeBasinId === "ALL") return ALL_INDIA_BASIN;
    return basins.find(b => b.basin_id === activeBasinId) || basins[0] || null;
  }, [basins, activeBasinId, ALL_INDIA_BASIN]);

  const startTour = useCallback(() => {
    setRole('authority');
    setTourStep(0);
    setIsTourOpen(true);
    setIsTelemetryCollapsed(false);
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

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vigil_language', lang);
    applyGoogleTranslate(lang);
  }, []);

  const t = useCallback((key: string) => {
    return getTranslation(key, language);
  }, [language]);

  const [hazardFilter, setHazardFilter] = useState<'ALL' | 'LANDSLIDE' | 'FLASH_FLOOD' | 'MULTI_HAZARD'>('ALL');

  const [layers, setLayers] = useState({
    hazardZones: true,
    hexGrid: true,
    particles: true,
    shelters: true,
    routes: true,
    sensors: true,
    streams: true,
    stormSymbols: false, // Default false: focus strictly on 26 village hazard pins
    contoursDEM: true,
    dopplerRadar: false,
    flowArrows: true,
    villageLabels: true
  });

  const [simulation, setSimulation] = useState({
    rain: 15,
    soil: 42,
    water: 1.1,
    activePreset: "cloudburst"
  });

  // Fetch all basins and active basin villages
  const refreshData = useCallback(async () => {
    setIsLoadingVillages(true);
    try {
      // 1. Fetch Basins Catalog
      const basinsRes = await fetch("/api/basins");
      if (basinsRes.ok) {
        const basinsData = await basinsRes.json();
        if (basinsData.basins && Array.isArray(basinsData.basins)) {
          setBasins(basinsData.basins);
        }
      }

      // 2. Always fetch All 26 villages for national map markers
      let master: Village[] = [];
      const allRes = await fetch("/api/villages?basin_id=ALL");
      if (allRes.ok) {
        const allData = await allRes.json();
        if (allData.villages && Array.isArray(allData.villages)) {
          master = allData.villages;
          setAllVillages(master);
        }
      }

      // 3. Set Active Basin Villages
      if (activeBasinId === "ALL") {
        setVillages(master);
      } else {
        const res = await fetch(`/api/villages?basin_id=${activeBasinId}`);
        const data = await res.json();
        if (data.villages && Array.isArray(data.villages)) {
          setVillages(data.villages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch basins/villages list:", err);
    } finally {
      setIsLoadingVillages(false);
    }
  }, [activeBasinId]);

  const switchBasin = useCallback(async (basinId: string) => {
    setActiveBasinId(basinId);
    setSelectedVillageId(null);
    setSelectedVillageData(null);
    setIsLoadingVillages(true);
    try {
      if (basinId === "ALL") {
        if (allVillages.length > 0) {
          setVillages(allVillages);
        } else {
          const res = await fetch("/api/villages?basin_id=ALL");
          if (res.ok) {
            const data = await res.json();
            if (data.villages && Array.isArray(data.villages)) {
              setAllVillages(data.villages);
              setVillages(data.villages);
            }
          }
        }
      } else {
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
      }
    } catch (err) {
      console.error(`Failed to switch basin to ${basinId}:`, err);
    } finally {
      setIsLoadingVillages(false);
    }
  }, [allVillages]);

  const updateVillagesFromTelemetry = useCallback((newVillages: Village[]) => {
    if (newVillages && Array.isArray(newVillages)) {
      setAllVillages(prev => {
        if (prev.length === 0) return newVillages;
        return prev.map(oldV => {
          const match = newVillages.find(nv => nv.id === oldV.id);
          return match ? { ...oldV, ...match } : oldV;
        });
      });
      setVillages(prev => {
        if (activeBasinId === "ALL") {
          return newVillages;
        }
        return prev.map(oldV => {
          const match = newVillages.find(nv => nv.id === oldV.id);
          return match ? { ...oldV, ...match } : oldV;
        });
      });
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
  }, [activeBasinId]);

  const selectVillage = useCallback(async (villageId: string | null, preserveSimulation: boolean = false) => {
    // If null -> deselect back to All-India mode
    if (!villageId) {
      setSelectedVillageId(null);
      setSelectedVillageData(null);
      setIsTelemetryCollapsed(true);
      return;
    }

    const isSameVillage = villageId === selectedVillageId;
    setSelectedVillageId(villageId);
    
    // Selecting a village auto-collapses the left panel and opens the right panel
    setIsTelemetryCollapsed(false);

    // Immediately clear stale village detail when switching to a different village
    if (!isSameVillage) {
      setSelectedVillageData(null);
    }

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

  const setRole = useCallback((newRole: RoleMode) => {
    setRoleState(newRole);
    if (newRole === 'citizen') {
      if (!selectedVillageId) {
        const topVillageId = villages.length > 0 ? villages[0].id : (allVillages.length > 0 ? allVillages[0].id : 'VIL-01');
        selectVillage(topVillageId);
      }
    }
  }, [selectedVillageId, villages, allVillages, selectVillage]);

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
    allVillages,
    selectedVillageId,
    selectedVillageData,
    role,
    viewMode,
    basemap2D,
    basemap3D,
    isMethodologyOpen,
    isGeomorphicOpen,
    setGeomorphicOpen,
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
    hazardFilter,
    setHazardFilter,
    layers,
    simulation,
    setRole,
    isTelemetryCollapsed,
    setIsTelemetryCollapsed,
    toggleTelemetryPanel,
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
    updateVillagesFromTelemetry,
    isLoadingVillages,
    language,
    setLanguage,
    t,
    activePage,
    setActivePage,
    dossierVillageId,
    setDossierVillageId,
    openTacticalDossier,
    closeTacticalDossier
  }), [
    basins,
    activeBasinId,
    activeBasin,
    villages,
    allVillages,
    isLoadingVillages,
    language,
    setLanguage,
    t,
    selectedVillageId,
    selectedVillageData,
    role,
    viewMode,
    basemap2D,
    basemap3D,
    isMethodologyOpen,
    isGeomorphicOpen,
    setGeomorphicOpen,
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
    hazardFilter,
    layers,
    simulation,
    isTelemetryCollapsed,
    setIsTelemetryCollapsed,
    toggleTelemetryPanel,
    toggleTheme,
    setRole,
    switchBasin,
    selectVillage,
    setHydrographOpen,
    toggleDroneFlying,
    toggleLayer,
    setSimulationValue,
    applyScenario,
    toggleWaterSensor,
    refreshData,
    updateVillagesFromTelemetry,
    activePage,
    dossierVillageId,
    openTacticalDossier,
    closeTacticalDossier
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
