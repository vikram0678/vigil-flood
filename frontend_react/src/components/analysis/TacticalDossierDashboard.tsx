import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useFlood } from '../../context/FloodContext';
import {
  HISTORICAL_DISASTER_DATABASE,
  getSeverityColor,
  getDisasterTypeIcon,
  getTotalCasualties,
  type VillageHistoricalData,
  type HistoricalIncident
} from '../../data/historicalDisasterData';

interface TacticalDossierDashboardProps {
  onBack: () => void;
}

export const TacticalDossierDashboard: React.FC<TacticalDossierDashboardProps> = ({ onBack }) => {
  const {
    selectedVillageId,
    selectedVillageData,
    selectVillage,
    dossierVillageId,
    setDossierVillageId,
    villages
  } = useFlood();

  const [activeSection, setActiveSection] = useState<'overview' | 'evacuation' | 'hydrology' | 'history' | 'matrix'>('overview');
  const [expandedIncident, setExpandedIncident] = useState<number | null>(0);
  const [basinFilter, setBasinFilter] = useState<string>('ALL');
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'IN_PROGRESS' | 'MOVING' | 'OVERDUE'>('ALL');
  const [acknowledgedTasks, setAcknowledgedTasks] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(null);
  const [liveClock, setLiveClock] = useState<string>('08:42:16');
  const [incidentLogOpen, setIncidentLogOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [matrixFilterTab, setMatrixFilterTab] = useState<'ALL' | 'CRITICAL' | 'ALERT' | 'NOMINAL'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const miniMapContainerRef = useRef<HTMLDivElement | null>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);

  // Currently inspected village ID
  const currentVillageId = dossierVillageId || selectedVillageId || 'VIL-16';

  // Synchronize internal ID with context
  const handleSelectVillage = (villageId: string) => {
    setDossierVillageId(villageId);
    selectVillage(villageId);
    window.location.hash = `#/dossier?village=${villageId}`;
    setExpandedIncident(0);
  };

  const historicalData: VillageHistoricalData = useMemo(() => {
    return HISTORICAL_DISASTER_DATABASE[currentVillageId] || HISTORICAL_DISASTER_DATABASE['VIL-01'];
  }, [currentVillageId]);

  // Real-time clock simulator
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Matched village metadata from villages list
  const activeVillageMeta = useMemo(() => {
    const found = villages.find(v => v.id === currentVillageId);
    const lat = found?.lat ?? historicalData.evacuation_assets.shelters[0]?.lat ?? 31.67;
    const lng = found?.lng ?? historicalData.evacuation_assets.shelters[0]?.lng ?? 77.05;
    return {
      id: currentVillageId,
      name: found?.name || historicalData.village_name,
      ward: found?.ward || 'Ward 4',
      lat,
      lng,
      elevation_m: found?.elevation_m || 944,
      population: found?.population || 5650,
      risk_percentage: found?.risk_percentage || 84,
      risk_level: found?.risk_level || 'CRITICAL',
      lead_time_display: found?.lead_time_display || '28 - 53 min'
    };
  }, [villages, currentVillageId, historicalData]);

  const casualties = getTotalCasualties(currentVillageId);
  const isSelectedActive = selectedVillageId === currentVillageId;
  const riskPct = isSelectedActive
    ? (selectedVillageData?.risk_analysis?.risk_percentage || activeVillageMeta.risk_percentage || 84)
    : (activeVillageMeta.risk_percentage || historicalData.catchment_profile.vulnerability_index || 78);
  const isHighRisk = riskPct >= 70;

  // Cleanly separate River Name and Village Reach Sector for senior executive UI/UX
  const riverDetails = useMemo(() => {
    const raw = historicalData.catchment_profile?.primary_river || 'Mandakini River';
    const parenMatch = raw.match(/^([^(]+)(?:\(([^)]+)\))?/);
    let mainRiver = parenMatch ? parenMatch[1].trim() : raw;
    let reachInfo = parenMatch && parenMatch[2] ? parenMatch[2].trim() : `${historicalData.village_name} Sector Reach`;
    if (!/(river|nullah|khad|ganga|stream)/i.test(mainRiver)) {
      mainRiver = `${mainRiver} River`;
    }
    return { river: mainRiver, reach: reachInfo };
  }, [historicalData]);

  // Basin options
  const basinOptions = [
    { id: 'ALL', label: 'All Basins (26 Pilot Villages)' },
    { id: 'BEAS', label: 'Beas Valley (HP — 11 Villages)' },
    { id: 'TEESTA', label: 'Teesta Basin (Sikkim — 5 Villages)' },
    { id: 'MANDAKINI', label: 'Mandakini Valley (UK — 5 Villages)' },
    { id: 'RISHIGANGA', label: 'Rishiganga & Dhauliganga (UK — 5 Villages)' },
    { id: 'WAYANAD', label: 'Chaliyar Basin (KL — 5 Villages)' },
  ];

  // Filtered villages list for dropdown and matrix
  const filteredVillagesList = useMemo(() => {
    return Object.entries(HISTORICAL_DISASTER_DATABASE).filter(([id, data]) => {
      let matchesBasin = true;
      if (basinFilter === 'BEAS') matchesBasin = data.state.includes('Himachal') || id.startsWith('VIL-0') || id === 'VIL-10' || id === 'VIL-11';
      else if (basinFilter === 'TEESTA') matchesBasin = data.state.includes('Sikkim');
      else if (basinFilter === 'MANDAKINI') matchesBasin = data.district === 'Rudraprayag';
      else if (basinFilter === 'RISHIGANGA') matchesBasin = data.district === 'Chamoli';
      else if (basinFilter === 'WAYANAD') matchesBasin = data.state.includes('Kerala');

      let matchesSearch = true;
      if (matrixSearch.trim()) {
        const query = matrixSearch.toLowerCase();
        matchesSearch = data.village_name.toLowerCase().includes(query) ||
          data.district.toLowerCase().includes(query) ||
          data.state.toLowerCase().includes(query);
      }
      return matchesBasin && matchesSearch;
    });
  }, [basinFilter, matrixSearch]);

  // Leaflet Map Initializer for Overview and Hydrology sections
  useEffect(() => {
    // Only mount map if active section is overview or hydrology
    if (activeSection !== 'overview' && activeSection !== 'hydrology') {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!miniMapContainerRef.current) return;

      const lat = activeVillageMeta.lat || 31.67;
      const lng = activeVillageMeta.lng || 77.05;

      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }

      try {
        const map = L.map(miniMapContainerRef.current, {
          center: [lat, lng],
          zoom: activeSection === 'hydrology' ? 13 : 12,
          zoomControl: false,
          attributionControl: false
        });

        // Clean, watermark-free OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Village Center Pulsing Radar Marker
        const pulseHtml = `
          <div class="uod-map-pulse-marker ${isHighRisk ? 'critical' : 'nominal'}">
            <div class="uod-marker-ping"></div>
            <div class="uod-marker-dot"></div>
            <div class="uod-marker-label">${historicalData.village_name} • ${riskPct}%</div>
          </div>
        `;

        const villageIcon = L.divIcon({
          className: 'uod-custom-div-icon',
          html: pulseHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([lat, lng], { icon: villageIcon }).addTo(map);

        // Add Shelter Markers & Evacuation Line
        const shelters = historicalData.evacuation_assets.shelters || [];
        const routePoints: [number, number][] = [[lat, lng]];

        shelters.forEach((s) => {
          if (s.lat && s.lng) {
            routePoints.push([s.lat, s.lng]);
            const shelterIcon = L.divIcon({
              className: 'uod-shelter-div-icon',
              html: `<div class="uod-shelter-pin" title="${s.name} (${s.capacity} persons)">⛺</div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            });
            L.marker([s.lat, s.lng], { icon: shelterIcon })
              .bindPopup(`<b>${s.name}</b><br/>Capacity: ${s.capacity} persons<br/>Elev: ${s.elevation_m}m`)
              .addTo(map);
          }
        });

        if (routePoints.length > 1) {
          L.polyline(routePoints, {
            color: '#0284c7',
            weight: 3,
            dashArray: '6, 6',
            opacity: 0.85
          }).addTo(map);
        }

        miniMapInstanceRef.current = map;
        setTimeout(() => map.invalidateSize(), 200);
      } catch (err) {
        console.warn('Mini-map initialization deferred:', err);
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
    };
  }, [currentVillageId, activeVillageMeta, isHighRisk, riskPct, historicalData, activeSection]);

  // Selected incident for photo view
  const currentIncident = historicalData.incidents[expandedIncident ?? 0] || historicalData.incidents[0];

  // Priority task list
  const defaultTasks = [
    {
      id: 'task-1',
      title: 'Clear Riverside Ward before dam gate release',
      meta: 'TEAM ALPHA • ETA 08:18 • SH-13 CROSSING',
      status: 'IN PROGRESS',
      type: 'IN_PROGRESS'
    },
    {
      id: 'task-2',
      title: 'Move clinic patients to Senior School Shelter',
      meta: 'MEDICAL-2 • 2 AMBULANCES DISPATCHED',
      status: 'MOVING',
      type: 'MOVING'
    },
    {
      id: 'task-3',
      title: 'Close NH-3 at Bridge Checkpoint to civilian traffic',
      meta: 'POLICE-1 • MANDI TRAFFIC CELL • ACK PENDING',
      status: 'OVERDUE',
      type: 'OVERDUE'
    },
    {
      id: 'task-4',
      title: 'Deploy inflatable rescue rafts to Ward 2 lower reach',
      meta: 'NDRF SQUAD 3 • STAGING AT DAM WEIR',
      status: 'IN PROGRESS',
      type: 'IN_PROGRESS'
    },
    {
      id: 'task-5',
      title: 'Sound secondary warning sirens across Beas suspension bridge',
      meta: 'HOME GUARDS • 3 SIRENS ARMED',
      status: 'OVERDUE',
      type: 'OVERDUE'
    }
  ];

  const filteredTasks = defaultTasks.filter(t => {
    if (taskFilter === 'ALL') return true;
    return t.type === taskFilter;
  });

  const toggleTaskAck = (id: string) => {
    setAcknowledgedTasks(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div
      className="bg-[#050811] text-slate-100 antialiased min-h-screen flex flex-col selection:bg-sky-500 selection:text-white w-full"
      style={{ fontFamily: "'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* C4ISR TACTICAL SITUATION STRIP (STRICT SINGLE LINE MATCHING SCREENSHOT 3) */}
      <div
        className="sticky top-[68px] z-40 bg-[#070c18]/95 backdrop-blur-md border-b border-slate-800/80 px-3 lg:px-6 py-2 w-full flex flex-nowrap items-center justify-between gap-3 overflow-x-auto no-scrollbar shadow-md whitespace-nowrap text-xs"
        style={{ fontFamily: "'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {/* Left: Back / Home Arrow + Sector Identity + Live Telemetry */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Back arrow / Home symbol pointing to main dashboard (Screenshot 3 requirement) */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-sky-700/70 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 hover:text-white transition-all text-xs font-semibold shrink-0 cursor-pointer shadow-sm group"
            title="Return to Main Geospatial Dashboard"
            style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform text-sky-400">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-300">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="hidden md:inline font-bold">Main Map</span>
          </button>

          <div className="h-4 w-px bg-slate-800 shrink-0"></div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <span className="text-slate-500 font-semibold" style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}>SECTOR HQ:</span>
            <span className="text-slate-300 font-semibold uppercase" style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}>{historicalData.state.split(',')[0]}</span>
            <span className="text-slate-600">/</span>
            <div className="relative group shrink-0">
              <select
                value={currentVillageId}
                onChange={(e) => handleSelectVillage(e.target.value)}
                className="appearance-none bg-sky-950/70 border border-sky-800/80 text-sky-300 font-bold px-2 py-0.5 pr-5 rounded cursor-pointer hover:border-sky-500 focus:outline-none text-[11px] uppercase tracking-wide"
                title="Switch Monitored Sector"
                style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
              >
                {filteredVillagesList.map(([id, data]) => (
                  <option key={id} value={id} className="bg-slate-900 text-slate-200">
                    {data.village_name.toUpperCase()} SECTOR ({data.district})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none text-[14px]">
                arrow_drop_down
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 shrink-0"></div>

          {/* Telemetry Clock (JetBrains Mono with tabular-nums) */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] shrink-0"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontVariantNumeric: "tabular-nums" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-sans" style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}>TELEMETRY:</span>
            <span className="text-emerald-400 font-bold tracking-tight">{liveClock} UTC</span>
          </div>
        </div>

        {/* Center: Situation Ribbon Tabs (Inter Font) */}
        <div className="flex items-center gap-1 shrink-0 text-xs" style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}>
          <button
            type="button"
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold border transition-all cursor-pointer ${activeSection === 'overview'
              ? 'bg-slate-800 text-sky-400 border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent'
              }`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Command Overview [Live]
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 rounded whitespace-nowrap text-[11px] border transition-all cursor-pointer ${activeSection === 'evacuation'
              ? 'bg-slate-800 text-sky-400 font-semibold border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent'
              }`}
            onClick={() => setActiveSection('evacuation')}
          >
            Evacuation Logistics (OP-03)
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 rounded whitespace-nowrap text-[11px] border transition-all cursor-pointer ${activeSection === 'hydrology'
              ? 'bg-slate-800 text-sky-400 font-semibold border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent'
              }`}
            onClick={() => setActiveSection('hydrology')}
          >
            Hydrology &amp; Geology (06)
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 rounded whitespace-nowrap text-[11px] border transition-all cursor-pointer ${activeSection === 'history'
              ? 'bg-slate-800 text-sky-400 font-semibold border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent'
              }`}
            onClick={() => setActiveSection('history')}
          >
            Forensic Precedent (2023)
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 rounded whitespace-nowrap text-[11px] border transition-all cursor-pointer ${activeSection === 'matrix'
              ? 'bg-slate-800 text-sky-400 font-semibold border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent'
              }`}
            onClick={() => setActiveSection('matrix')}
          >
            Village Matrix (26 Sectors)
          </button>
        </div>

        {/* Right: Operational Status (JetBrains Mono for metrics) */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
          <div>
            <span className="text-slate-500 uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>TASK LOAD:</span>
            <span className="text-slate-200 font-semibold ml-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums" }}>5 Active</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-rose-400 font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums" }}>2 Overdue</span>
          </div>
          <div className="w-px h-3 bg-slate-800"></div>
          <div>
            <span className="text-slate-500 uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>NEXT MODEL RUN:</span>
            <span className="text-sky-400 font-bold ml-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums" }}>T-04m 12s</span>
          </div>
        </div>
      </div>

      {/* OVERALL EVACUATION DASHBOARD VIEWPORT WITH CHATGPT SIDEBAR */}
      <div className="flex-1 w-full max-w-[1850px] mx-auto p-3 lg:p-5 min-w-0">
        <div className="flex items-start gap-3 lg:gap-5 min-w-0">
          {/* CHATGPT-STYLE SIDEBAR (SCROLLS NATURALLY WITH WINDOW SCROLLING) */}
          {!isSidebarOpen ? (
            /* COLLAPSED RAIL (EXACTLY MATCHING IMAGE 1 ICONS) */
            <aside className="chatgpt-outline-rail shrink-0" aria-label="Command Overview Rail">
              {/* 1st button: [ ▯ ] Collapse/Expand Toggle Button (Image 2) */}
              <div className="chatgpt-rail-item">
                <button
                  type="button"
                  className="chatgpt-rail-btn group"
                  onClick={() => setIsSidebarOpen(true)}
                  title="Expand Command Sidebar"
                  aria-label="Expand Command Sidebar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-white transition-colors">
                    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                </button>
                <div className="chatgpt-rail-tooltip-right">Expand Command Sidebar</div>
              </div>

              {/* Thin Divider */}
              <div className="w-5 h-px bg-slate-800/80 my-0.5"></div>

              {/* 2nd button: ✎ Evacuation Logistics (OP-03) — Clicking expands panel (as requested) */}
              <div className="chatgpt-rail-item">
                <button
                  type="button"
                  className={`chatgpt-rail-btn ${activeSection === 'evacuation' ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-sm' : ''}`}
                  onClick={() => {
                    setActiveSection('evacuation');
                    setIsSidebarOpen(true);
                  }}
                  title="Evacuation Logistics (OP-03)"
                  aria-label="Evacuation Logistics (OP-03)"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
                <div className="chatgpt-rail-tooltip-right">Evacuation Logistics (OP-03)</div>
              </div>

              {/* 3rd button: 🔍 Village Matrix (26 Sectors) */}
              <div className="chatgpt-rail-item">
                <button
                  type="button"
                  className={`chatgpt-rail-btn ${activeSection === 'matrix' ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-sm' : ''}`}
                  onClick={() => {
                    setActiveSection('matrix');
                    setIsSidebarOpen(true);
                  }}
                  title="Village Matrix (26 Sectors)"
                  aria-label="Village Matrix (26 Sectors)"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
                <div className="chatgpt-rail-tooltip-right">Village Matrix (26 Sectors)</div>
              </div>

              {/* 4th button: 🖼️ Forensic Precedent (2023) */}
              <div className="chatgpt-rail-item">
                <button
                  type="button"
                  className={`chatgpt-rail-btn ${activeSection === 'history' ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-sm' : ''}`}
                  onClick={() => {
                    setActiveSection('history');
                    setIsSidebarOpen(true);
                  }}
                  title="Forensic Precedent (2023)"
                  aria-label="Forensic Precedent (2023)"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="14" height="14" rx="2" />
                    <path d="M7 21h12a2 2 0 0 0 2-2V7" />
                    <polyline points="7 13 10 10 14 14" />
                    <circle cx="7.5" cy="7.5" r="1.5" />
                  </svg>
                </button>
                <div className="chatgpt-rail-tooltip-right">Forensic Precedent (2023)</div>
              </div>

              {/* 5th button: @ Hydrology & Geology (06) */}
              <div className="chatgpt-rail-item">
                <button
                  type="button"
                  className={`chatgpt-rail-btn ${activeSection === 'hydrology' ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-sm' : ''}`}
                  onClick={() => {
                    setActiveSection('hydrology');
                    setIsSidebarOpen(true);
                  }}
                  title="Hydrology & Geology (06)"
                  aria-label="Hydrology & Geology (06)"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                  </svg>
                </button>
                <div className="chatgpt-rail-tooltip-right">Hydrology &amp; Geology (06)</div>
              </div>

              {/* 6th button: 🔭 Command Overview [Live] */}
              <div className="chatgpt-rail-item">
                <button
                  type="button"
                  className={`chatgpt-rail-btn ${activeSection === 'overview' ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-sm' : ''}`}
                  onClick={() => {
                    setActiveSection('overview');
                    setIsSidebarOpen(true);
                  }}
                  title="Command Overview [Live]"
                  aria-label="Command Overview [Live]"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44" />
                    <path d="m13.56 11.747 4.332-.924" />
                    <path d="m16 21-3.105-6.21" />
                    <path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a2 2 0 0 1 2.425 1.455l.727 2.91a2 2 0 0 1-1.455 2.425l-1.09.272a2 2 0 0 1-2.425-1.455z" />
                    <path d="m6 21 3.105-6.21" />
                    <path d="M12 13v8" />
                  </svg>
                </button>
                <div className="chatgpt-rail-tooltip-right">Command Overview [Live]</div>
              </div>
            </aside>
          ) : (
            /* EXPANDED SIDEBAR PANEL FIXED IN SAME POSITION (SCREENSHOT 3) */
            <aside
              className="chatgpt-expanded-panel shrink-0 space-y-3"
              aria-label="Command Panel Expanded"
              style={{ fontFamily: "'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            >
              {/* Top Row: [ ← Back ] and [ ▯ ] Collapse Icon (Screenshot 3) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-sky-500/50 bg-sky-950/40 hover:bg-sky-900/60 text-sky-400 hover:text-sky-200 transition-all font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group"
                  title="Return to Main Dashboard"
                  style={{ fontFamily: "'Inter', 'Outfit', -apple-system, sans-serif" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-700/70 bg-slate-800/40 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                  title="Collapse Sidebar"
                  aria-label="Collapse Sidebar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                </button>
              </div>

              {/* Card 1: BASIN (Screenshot 3) */}
              <div className="bg-[#091224] border border-slate-800/80 rounded-xl p-3 space-y-1.5 hover:border-slate-700/80 transition-colors">
                <div
                  className="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                  style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                >
                  BASIN
                </div>
                <div className="relative">
                  <select
                    value={basinFilter}
                    onChange={(e) => setBasinFilter(e.target.value)}
                    className="w-full appearance-none bg-transparent text-white font-bold text-xs pr-6 cursor-pointer focus:outline-none"
                    style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                  >
                    {basinOptions.map(b => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[15px]">
                    unfold_more
                  </span>
                </div>
                <div
                  className="text-[10px] text-slate-500 font-semibold"
                  style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontVariantNumeric: "tabular-nums" }}
                >
                  BASIN CP-04 • 14 STATIONS ACTIVE
                </div>
              </div>

              {/* Card 2: ACTIVE VILLAGE (Screenshot 3) */}
              <div className="bg-[#091224] border border-slate-800/80 rounded-xl p-3 space-y-1.5 hover:border-slate-700/80 transition-colors">
                <div
                  className="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                  style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                >
                  ACTIVE VILLAGE
                </div>
                <div className="relative">
                  <select
                    value={currentVillageId}
                    onChange={(e) => handleSelectVillage(e.target.value)}
                    className="w-full appearance-none bg-transparent text-sky-400 font-extrabold text-xs pr-6 cursor-pointer focus:outline-none"
                    style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                  >
                    {filteredVillagesList.map(([id, data]) => (
                      <option key={id} value={id} className="bg-slate-900 text-slate-200">
                        {data.village_name} ({data.state.split(',')[0]})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[15px]">
                    unfold_more
                  </span>
                </div>
                <div
                  className="text-xs text-slate-400 font-medium"
                  style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                >
                  {historicalData.state.split(',')[0]} • {historicalData.district}
                </div>
              </div>

              {/* Card 3: CURRENT RISK (Category & Big Percentage Display Only) */}
              <div className={`bg-[#091224] border border-slate-800/80 rounded-xl p-4 space-y-3 ${riskPct >= 70 ? 'border-l-4 border-l-rose-500' : riskPct >= 45 ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'
                }`}>
                <div
                  className="flex items-center gap-2 text-sm font-bold text-slate-300 tracking-wider uppercase"
                  style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                >
                  <span className={riskPct >= 70 ? 'text-rose-400' : riskPct >= 45 ? 'text-amber-400' : 'text-emerald-400'}>⚠️</span>
                  <span>CURRENT RISK</span>
                </div>
                <div
                  className={`text-xl sm:text-2xl font-black tracking-wide uppercase ${riskPct >= 70 ? 'text-rose-400' : riskPct >= 45 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                >
                  {activeVillageMeta.risk_level || (riskPct >= 70 ? 'CRITICAL' : riskPct >= 45 ? 'MODERATE' : 'NOMINAL')}
                </div>
                <div
                  className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-none"
                  style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontVariantNumeric: "tabular-nums" }}
                >
                  {riskPct}%
                </div>
              </div>

              {/* Quick Navigation Sections inside expanded sidebar */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div
                  className="text-[10px] uppercase tracking-wider text-slate-500 px-1 pb-1 font-semibold"
                  style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                >
                  SECTIONS
                </div>
                {[
                  { id: 'overview', label: 'Command Overview [Live]' },
                  { id: 'evacuation', label: 'Evacuation Logistics (OP-03)' },
                  { id: 'hydrology', label: 'Hydrology & Geology (06)' },
                  { id: 'history', label: 'Forensic Precedent (2023)' },
                  { id: 'matrix', label: 'Village Matrix (26 Sectors)' },
                ].map(sec => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id as any)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${activeSection === sec.id
                      ? 'bg-sky-950/60 text-sky-400 font-bold border border-sky-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                      }`}
                    style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                  >
                    <span>{sec.label}</span>
                    {activeSection === sec.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    )}
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* MAIN CONTENT VIEWPORT */}
          <div className="flex-1 min-w-0">
            {activeSection === 'overview' && (
              <main className="space-y-5 min-w-0">
                {/* ZONE 1: EXECUTIVE INCIDENT BRIEFING & PRIMARY THREAT ASSESSMENT */}
                <section className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-5 lg:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                  <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>
                  <div className="absolute left-1/3 -bottom-32 w-80 h-80 rounded-full bg-sky-500/5 blur-3xl pointer-events-none"></div>
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch relative z-10">
                    {/* Left: Village Identity & Current Weather Condition */}
                    <div className="xl:col-span-7 flex flex-col justify-center space-y-4">
                      {/* Village Name (Big Font) & District/State (Smaller Font) */}
                      <div className="space-y-1">
                        <h1
                          className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase"
                          style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                        >
                          {historicalData.village_name}
                        </h1>
                        <div
                          className="text-base sm:text-lg font-semibold text-slate-300 tracking-wide flex items-center gap-2"
                          style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
                        >
                          <span>{historicalData.district}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-sky-400">{historicalData.state.split(',')[0]}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-red-400 font-semibold">INDIA</span>
                        </div>
                      </div>

                      {/* Current Weather Condition & Live Telemetry (Rain / Cloudburst / River) */}
                      <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">⛈️</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                              Current Weather &amp; Hydrologic Condition
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-950/80 text-sky-400 border border-sky-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                            LIVE WEATHER FETCH
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {/* Weather / Rain / Cloudburst Condition */}
                          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700/80 transition-colors">
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Weather Condition</div>
                              <div className="text-sm font-bold text-white mt-1 leading-snug">
                                {riskPct >= 70 ? 'Cloudburst / Extreme Rain' : riskPct >= 45 ? 'Heavy Monsoon Rain' : 'Moderate Rainfall'}
                              </div>
                            </div>
                            <div className="text-[11px] font-mono font-medium text-amber-400 flex items-center gap-1.5 pt-1.5 border-t border-slate-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              <span>{riskPct >= 70 ? 'High Flash Flood Threat' : 'Active Precipitation'}</span>
                            </div>
                          </div>

                          {/* Live Rain Rate */}
                          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700/80 transition-colors">
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Rainfall Intensity</div>
                              <div className="text-sm font-bold font-mono text-cyan-300 mt-1">
                                {selectedVillageData?.telemetry?.rain_1h ? `${selectedVillageData.telemetry.rain_1h} mm/h` : riskPct >= 70 ? '38.5 mm/h' : riskPct >= 45 ? '18.2 mm/h' : '4.5 mm/h'}
                              </div>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60">
                              {selectedVillageData?.telemetry?.rain_6h ? `${selectedVillageData.telemetry.rain_6h} mm (6h accum)` : riskPct >= 70 ? '118 mm (6h accum)' : '42 mm (6h accum)'}
                            </div>
                          </div>

                          {/* Monitored River & Village Sector Reach */}
                          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700/80 transition-colors">
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Monitored River Basin</div>
                              <div className="text-sm font-bold text-white mt-1 leading-snug break-words">
                                {riverDetails.river}
                              </div>
                              <div className="text-[11px] font-semibold text-sky-400 flex items-center gap-1.5 mt-1">
                                <span className="text-[11px]">📍</span>
                                <span className="break-words font-medium">{riverDetails.reach}</span>
                              </div>
                            </div>
                            <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1.5 pt-1.5 border-t border-slate-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              <span>{riskPct >= 70 ? 'Rapid Surge (+0.21 m/h)' : 'Elevated Stream Flow'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center/Right: Primary Threat Engine (5 Cols) */}
                    <div className="xl:col-span-5 rounded-lg bg-slate-950/80 border border-rose-900/60 p-4 lg:p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider uppercase text-rose-400">
                            <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                            PRIMARY THREAT ENGINE
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            MODEL: VF-RAPID (08:40 UTC)
                          </span>
                        </div>

                        <div>
                          <div className="text-sm sm:text-base font-bold text-white tracking-tight">
                            {historicalData.catchment_profile?.recurring_threat || 'Subsidence + Slope Failure + Flash Flood'}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 font-sans">
                            Coupled geomorphic-hydrologic trigger breach pattern detected
                          </p>
                        </div>

                        {/* Threat Index Meter */}
                        <div className="p-3 rounded bg-slate-900/70 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider font-semibold">Calculated Threat Index</span>
                            <span className="text-rose-400 font-mono font-bold text-sm">{riskPct}% CRITICAL</span>
                          </div>

                          {/* Segmented Progress Bar */}
                          <div className="grid grid-cols-5 gap-1.5 h-2">
                            <div className="rounded-sm bg-emerald-500/80"></div>
                            <div className="rounded-sm bg-emerald-500/80"></div>
                            <div className="rounded-sm bg-amber-500/90"></div>
                            <div className="rounded-sm bg-rose-600"></div>
                            <div className="rounded-sm bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.7)]"></div>
                          </div>

                          <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>0-20 Nominal</span>
                            <span>40-60 Advisory</span>
                            <span className="text-rose-400 font-semibold">80+ Breach Imminent</span>
                          </div>
                        </div>

                        {/* Threat Parameters */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Debris Mass Estimate</div>
                            <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">~1.4M m³</div>
                          </div>
                          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Peak Crest Window</div>
                            <div className="text-sm font-mono font-bold text-rose-400 mt-0.5">T+32 min</div>
                          </div>
                        </div>
                      </div>

                      <button
                        className="w-full py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-sky-400 text-xs font-semibold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                        type="button"
                        onClick={() => showToast('⚡ SIMULATION INITIALIZED — Hydrodynamic mesh recalculating peak crest window')}
                      >
                        <span className="material-symbols-outlined text-[15px]">analytics</span>
                        <span>Launch Simulation Run Diagnostics</span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* ZONE 2: MISSION-CRITICAL 4-PILLAR KPI BANNER */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Pillar 1: Exposed Population */}
                  <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-[11px]">Exposed Population</span>
                      <span className="material-symbols-outlined text-rose-400 text-[18px]">group_remove</span>
                    </div>
                    <div className="my-2.5">
                      <div className="text-2xl font-bold font-mono text-rose-400 tracking-tight">
                        {Math.round(activeVillageMeta.population * 0.68).toLocaleString()}
                      </div>
                      <div className="text-[11px] font-mono text-rose-300/80 mt-0.5">68% of sector zone</div>
                    </div>
                    <div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: '68%' }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        {activeVillageMeta.population.toLocaleString()} Total Sector Base
                      </span>
                    </div>
                  </div>

                  {/* Pillar 2: Geomorphic Vulnerability */}
                  <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-[11px]">Geomorphic Vulnerability</span>
                      <span className="material-symbols-outlined text-rose-400 text-[18px]">landslide</span>
                    </div>
                    <div className="my-2.5">
                      <div className="text-2xl font-bold font-mono text-rose-400 tracking-tight">
                        {riskPct}<span className="text-sm font-normal text-slate-400">%</span>
                      </div>
                      <div className="text-[11px] font-mono text-rose-300/80 mt-0.5">High Risk Slope Escarpment</div>
                    </div>
                    <div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full" style={{ width: `${riskPct}%` }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">Factor of Safety: 1.04</span>
                    </div>
                  </div>

                  {/* Pillar 3: Evacuation Shelter Clearance */}
                  <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-[11px]">Shelter Space / Deficit</span>
                      <span className="material-symbols-outlined text-sky-400 text-[18px]">night_shelter</span>
                    </div>
                    <div className="my-2.5">
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold font-mono text-sky-400 tracking-tight">
                          {historicalData.evacuation_assets.shelters[0]?.capacity || 300}
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          / {Math.round(activeVillageMeta.population * 0.68).toLocaleString()} cap
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-rose-400 font-semibold mt-0.5">
                        {Math.max(0, Math.round(activeVillageMeta.population * 0.68) - (historicalData.evacuation_assets.shelters[0]?.capacity || 300)).toLocaleString()} PAX Shelter Deficit
                      </div>
                    </div>
                    <div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full" style={{ width: '8%' }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block truncate">
                        {historicalData.evacuation_assets.shelters[0]?.name || 'Block Office Staging Complex'}
                      </span>
                    </div>
                  </div>

                  {/* Pillar 4: Road Cutoff Lead Time */}
                  <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-[11px]">Road Cutoff Lead Time</span>
                      <span className="material-symbols-outlined text-amber-400 text-[18px]">timer_off</span>
                    </div>
                    <div className="my-2.5">
                      <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
                        {activeVillageMeta.lead_time_display || '23–48 min'}
                      </div>
                      <div className="text-[11px] font-mono text-amber-300/80 mt-0.5">Kund Bypass Highway Corridor</div>
                    </div>
                    <div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '42%' }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">Single Arterial Egress Route</span>
                    </div>
                  </div>
                </section>

                {/* ZONE 3: OPERATIONAL COMMAND DECK (BALANCED 60/40 MASTER GRID) */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* SAMEJ GROUND ZERO FIELD REPORT & FORENSIC EVIDENCE CARD */}
                  {currentVillageId === 'VIL-11' && (
                    <div
                      className="col-span-12 lg:col-span-12 w-full rounded-2xl p-6 shadow-xl space-y-4 border transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderColor: '#bae6fd',
                        color: '#0f172a'
                      }}
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">📸</span>
                          <div>
                            <div className="text-[10px] font-bold tracking-wider text-sky-700 uppercase font-mono">
                              GROUND ZERO FORENSIC FIELD DOSSIER • SAMEJ VILLAGE
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                              Tragic Demise of Samej Village | Loss & Resilience
                            </h3>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500 text-white shadow-sm">
                          JULY 31, 2024 DISASTER ARCHIVE
                        </span>
                      </div>

                      {/* Article Narrative */}
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        Nestled on the border of Shimla’s Rampur and Kullu, Samej Village was once a vibrant Himalayan community with schools, temples, and a primary health center. On midnight of <strong>July 31st, 2024</strong>, sudden cloudburst floodwaters obliterated 15 houses on the Rampur side, leaving only one house standing amidst the mud and rubble.
                      </p>

                      {/* 3 Images Gallery Grid */}
                      <div>
                        <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <span>📷 Field Evidence Gallery (Click to Zoom)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { src: '/disaster_photos/samej/samjeVillage_1.webp', title: 'Flood Mudflow Surge', desc: 'Debris deposits burying village reach' },
                            { src: '/disaster_photos/samej/samjeVillage_2.webp', title: 'Structural Obliteration', desc: 'Single remaining standing house' },
                            { src: '/disaster_photos/samej/samjeVillage_3.webp', title: 'Survivor Relief Camps', desc: 'Makeshift tents on high ridges' }
                          ].map((img, i) => (
                            <div
                              key={i}
                              onClick={() => setLightboxImage({ url: img.src, caption: `${img.title} — ${img.desc}` })}
                              className="group relative rounded-xl overflow-hidden border border-sky-200 bg-white shadow-sm hover:shadow-md transition-all cursor-zoom-in"
                            >
                              <div className="h-32 w-full overflow-hidden bg-slate-200">
                                <img
                                  src={img.src}
                                  alt={img.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="p-2 bg-white">
                                <div className="text-[11px] font-bold text-slate-800">{img.title}</div>
                                <div className="text-[10px] text-slate-500 line-clamp-1">{img.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Key Ground Facts Footer */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sky-200/80 text-[11px]">
                        <div className="bg-white/80 p-2 rounded-lg border border-sky-100">
                          <span className="text-slate-500 text-[10px] block">Houses Destroyed</span>
                          <span className="font-bold text-rose-600">15 / 16 (94%)</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-sky-100">
                          <span className="text-slate-500 text-[10px] block">Public Facilities</span>
                          <span className="font-bold text-amber-700">PHC & School Lost</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-sky-100">
                          <span className="text-slate-500 text-[10px] block">Current Shelter</span>
                          <span className="font-bold text-sky-800">Relief Tents</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-sky-100">
                          <span className="text-slate-500 text-[10px] block">Status</span>
                          <span className="font-bold text-emerald-700">Active Recovery</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LEFT MASTER COLUMN: TACTICAL ACTION & LOGISTICS (60% / Span 7) */}
                  <div className="lg:col-span-7 space-y-5 w-full">
                    {/* COMPONENT A: EVACUATION OPERATIONS (OP-03) */}
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-lg backdrop-blur-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                            <span className="material-symbols-outlined text-[20px]">transfer_within_a_station</span>
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-white tracking-tight uppercase">Evacuation Operations</h2>
                            <div className="text-[11px] font-mono text-slate-400">
                              OP-ORDER: VF-PDH-03 • {historicalData.catchment_profile?.primary_river ? `${historicalData.catchment_profile.primary_river.toUpperCase()} BASIN` : 'MANDAKINI VALLEY'}
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          PHASE 2 — ACTIVE
                        </span>
                      </div>

                      {/* 3 Metric Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Teams Deployed</div>
                          <div className="text-2xl font-bold font-mono text-white mt-1">12 <span className="text-xs font-normal text-slate-400">/ 15</span></div>
                          <div className="text-[11px] font-medium text-sky-400 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                            Sectors B, D Active
                          </div>
                        </div>

                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Civilians Cleared</div>
                          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                            2,115 <span className="text-xs font-normal text-slate-400">/ {Math.round(activeVillageMeta.population * 0.68).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '55%' }}></div>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">55% Progress Target</div>
                        </div>

                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Medical Priority Casework</div>
                          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">48</div>
                          <div className="text-[11px] font-medium text-rose-300 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            Elderly / Infirm / Stretcher
                          </div>
                        </div>
                      </div>

                      {/* Staging Hub Logistics Bar */}
                      <div className="rounded bg-slate-950/80 border border-slate-800/90 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sky-400 text-[18px]">domain</span>
                            <span className="text-xs font-bold text-slate-200">
                              Designated Shelter: {historicalData.evacuation_assets.shelters[0]?.name || 'Okhimath Block Office Complex'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            FACILITY SECURE
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-mono uppercase text-slate-400 block">Cap Limit</span>
                            <span className="font-mono font-bold text-slate-200">
                              {historicalData.evacuation_assets.shelters[0]?.capacity || 300} PAX
                            </span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-mono uppercase text-slate-400 block">Tactical Comms</span>
                            <span className="font-mono font-bold text-sky-400">VHF CH 04</span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-mono uppercase text-slate-400 block">Medical Unit</span>
                            <span className="font-mono font-bold text-emerald-400">1 Squad Ready</span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-mono uppercase text-slate-400 block">Rations</span>
                            <span className="font-mono font-bold text-slate-200">72h Reserve</span>
                          </div>
                        </div>
                      </div>

                      {/* Evacuation Action Triggers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          className="py-2.5 px-4 rounded bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold font-mono tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(225,29,72,0.3)] transition-all cursor-pointer"
                          type="button"
                          onClick={() => showToast('🚨 SIREN BROADCAST SENT — Acoustic sirens armed across sector wards')}
                        >
                          <span className="material-symbols-outlined text-[17px]">cell_tower</span>
                          <span>Issue Siren Broadcast</span>
                        </button>
                        <button
                          className="py-2.5 px-4 rounded bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold font-mono tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(14,165,233,0.25)] transition-all cursor-pointer"
                          type="button"
                          onClick={() => showToast('🚁 QRT SQUAD ALPHA DISPATCHED — In route to Kund Bypass corridor')}
                        >
                          <span className="material-symbols-outlined text-[17px]">groups</span>
                          <span>Dispatch QRT Squad Alpha</span>
                        </button>
                      </div>
                    </div>

                    {/* COMPONENT B: 2023 HISTORICAL PRECEDENT & GEOTECHNICAL SLIPPAGE PREDICTION */}
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-lg backdrop-blur-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-slate-400 text-[20px]">history_edu</span>
                          <h3 className="text-sm font-bold text-white uppercase tracking-tight">2023 Historical Precedent &amp; Slippage Prediction</h3>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          ARCHIVE: {currentVillageId.replace('VIL-', 'OKH-')}
                        </span>
                      </div>

                      {/* Forensic Stats Row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 text-center">
                          <div className="text-2xl font-bold font-mono text-rose-400">{casualties.fatalities || 5}</div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">Fatalities</div>
                        </div>
                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 text-center">
                          <div className="text-2xl font-bold font-mono text-amber-400">20</div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">Injured</div>
                        </div>
                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 text-center">
                          <div className="text-2xl font-bold font-mono text-slate-200">40</div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">Damaged Homes</div>
                        </div>
                      </div>

                      {/* Geotechnical Slippage Prediction Threshold */}
                      <div className="p-3.5 rounded bg-slate-950/80 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                            <span className="material-symbols-outlined text-[16px]">insights</span>
                            <span className="text-[11px] font-mono uppercase tracking-wider">Predictive Slippage Threshold (48h Rain)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-rose-400">162mm / 180mm (90%)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full" style={{ width: '90%' }}></div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          Geotechnical sensors record rapid downhill displacement. Sudden slope slippage in {historicalData.village_name} accelerates exponentially once 48-hour cumulative rainfall crosses <strong className="text-white font-mono">180mm</strong>. Current 48h tracking is at <strong className="text-rose-400 font-mono">162mm (90% of threshold)</strong>.
                        </p>
                      </div>

                      <button
                        className="w-full py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-semibold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        type="button"
                        onClick={() => setActiveSection('history')}
                      >
                        <span>Open Full Forensic Incident Dossier</span>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </button>
                    </div>
                  </div>

                  {/* RIGHT MASTER COLUMN: SENSOR TELEMETRY & REGIONAL MATRIX (40% / Span 5) */}
                  <div className="lg:col-span-5 space-y-5 w-full">
                    {/* COMPONENT C: LIVE BASIN INTELLIGENCE & SENSOR TELEMETRY */}
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-lg backdrop-blur-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <span className="material-symbols-outlined text-[20px]">water</span>
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-white tracking-tight uppercase">Live Hydrometric Telemetry</h2>
                            <div className="text-[11px] font-mono text-slate-400">
                              {historicalData.catchment_profile?.primary_river ? `${historicalData.catchment_profile.primary_river.toUpperCase()} BASIN` : 'MANDAKINI BASIN'} SENSOR ARRAY
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                          14 ACTIVE GAUGES
                        </span>
                      </div>

                      {/* 4 Sensor Modules */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Sensor 1: River Stage */}
                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">River Stage</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                              WARNING
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <div className="text-xl font-bold font-mono text-white">
                              4.82 <span className="text-xs font-normal text-slate-400">m</span>
                            </div>
                            <div className="text-xs font-mono font-semibold text-rose-400 flex items-center">
                              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                              +0.21 m/h
                            </div>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full rounded-full" style={{ width: '82%' }}></div>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">Mandakini Escarpment</div>
                        </div>

                        {/* Sensor 2: 6-Hour Rainfall */}
                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">6h Rainfall</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-800/60">
                              92nd PCT
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <div className="text-xl font-bold font-mono text-white">
                              118 <span className="text-xs font-normal text-slate-400">mm</span>
                            </div>
                            <div className="text-xs font-mono text-sky-400 font-medium">
                              Monsoon Surge
                            </div>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full rounded-full" style={{ width: '76%' }}></div>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">Upper Basin Pluviometer</div>
                        </div>

                        {/* Sensor 3: Slope Soil Saturation */}
                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Soil Saturation</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                              CRITICAL
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <div className="text-xl font-bold font-mono text-rose-400">
                              91<span className="text-xs font-normal text-slate-400">%</span>
                            </div>
                            <div className="text-xs font-mono font-semibold text-rose-400">
                              Liquefaction
                            </div>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-600 h-full rounded-full" style={{ width: '91%' }}></div>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">Piezometer Bank 03</div>
                        </div>

                        {/* Sensor 4: Dam Outflow */}
                        <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Dam Outflow</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">
                              SCHEDULED
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <div className="text-xl font-bold font-mono text-white">
                              980 <span className="text-xs font-normal text-slate-400">m³/s</span>
                            </div>
                            <div className="text-xs font-mono text-cyan-400">
                              +140 m³/s
                            </div>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: '65%' }}></div>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">Mandakini Barrage</div>
                        </div>
                      </div>

                      {/* Verified Health & Sparkline Strip */}
                      <div className="p-3 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-200">4 stream gauges exceed Alert Stage Level 2</div>
                            <div className="text-[10px] text-slate-400 font-mono">Cross-validation verified via Upper basin network</div>
                          </div>
                        </div>

                        {/* Sparkline SVG */}
                        <div className="w-24 h-7 shrink-0 hidden sm:block">
                          <svg className="w-full h-full text-rose-400" fill="none" viewBox="0 0 100 28">
                            <path d="M2 24 L18 20 L35 22 L52 13 L68 15 L84 6 L98 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                            <circle cx="98" cy="2" fill="#f43f5e" r="2.5"></circle>
                          </svg>
                        </div>
                      </div>

                      <button
                        className="w-full py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 text-xs font-semibold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                        type="button"
                        onClick={() => setActiveSection('hydrology')}
                      >
                        <span className="material-symbols-outlined text-[15px]">stacked_line_chart</span>
                        <span>View Detailed Catchment Runoff Graphs</span>
                      </button>
                    </div>

                    {/* COMPONENT D: REGIONAL RISK MATRIX & MULTI-VILLAGE REGISTRY */}
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-lg backdrop-blur-sm space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sky-400 text-[19px]">grid_view</span>
                            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Regional Risk Matrix</h3>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">26 PILOT VILLAGES</span>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800/80 text-xs font-mono">
                          <button
                            className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${matrixFilterTab === 'ALL' ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm' : 'text-slate-400 hover:bg-slate-900'
                              }`}
                            type="button"
                            onClick={() => setMatrixFilterTab('ALL')}
                          >
                            All (26)
                          </button>
                          <button
                            className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${matrixFilterTab === 'CRITICAL' ? 'bg-slate-800 text-rose-400 font-semibold shadow-sm' : 'text-rose-400/80 hover:bg-slate-900'
                              }`}
                            type="button"
                            onClick={() => setMatrixFilterTab('CRITICAL')}
                          >
                            Critical (4)
                          </button>
                          <button
                            className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${matrixFilterTab === 'ALERT' ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm' : 'text-amber-400/80 hover:bg-slate-900'
                              }`}
                            type="button"
                            onClick={() => setMatrixFilterTab('ALERT')}
                          >
                            Alert (9)
                          </button>
                          <button
                            className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${matrixFilterTab === 'NOMINAL' ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm' : 'text-emerald-400/80 hover:bg-slate-900'
                              }`}
                            type="button"
                            onClick={() => setMatrixFilterTab('NOMINAL')}
                          >
                            Nominal (13)
                          </button>
                        </div>
                      </div>

                      {/* Data-Dense Table */}
                      <div className="overflow-x-auto rounded border border-slate-800/80 bg-slate-950/60">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-900/90 border-b border-slate-800/80 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                              <th className="py-2 px-3">Village Sector</th>
                              <th className="py-2 px-2.5">Basin</th>
                              <th className="py-2 px-2.5">Risk Score</th>
                              <th className="py-2 px-2.5">Status</th>
                              <th className="py-2 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                            {/* Selected Village Row */}
                            <tr className="bg-sky-950/20 hover:bg-sky-950/40 transition-colors">
                              <td className="py-2 px-3 font-sans font-semibold text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                <span>{historicalData.village_name}</span>
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-900/60 text-sky-300 border border-sky-700/50">HQ</span>
                              </td>
                              <td className="py-2 px-2.5 text-slate-300">{historicalData.district}</td>
                              <td className="py-2 px-2.5 text-rose-400 font-bold">{riskPct} / 100</td>
                              <td className="py-2 px-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                                  Phase 2 Evac
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className="text-sky-400 font-bold">ACTIVE</span>
                              </td>
                            </tr>

                            {/* Other Pilot Villages */}
                            {[
                              { id: 'VIL-02', name: 'Thalot', basin: 'Beas Gorge', score: 74, status: 'Critical Alert', badgeClass: 'bg-rose-950/80 text-rose-300 border border-rose-800/60' },
                              { id: 'VIL-03', name: 'Aut', basin: 'Beas Tunnel', score: 61, status: 'Stage 1 Warning', badgeClass: 'bg-amber-950/80 text-amber-300 border border-amber-800/60' },
                              { id: 'VIL-04', name: 'Pandoh', basin: 'Dam Spillway', score: 52, status: 'Moderate', badgeClass: 'bg-slate-800 text-amber-300' },
                              { id: 'VIL-05', name: 'Nagwain', basin: 'Lower Valley', score: 34, status: 'Nominal', badgeClass: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' },
                            ]
                              .filter(v => {
                                if (matrixFilterTab === 'CRITICAL') return v.score >= 70;
                                if (matrixFilterTab === 'ALERT') return v.score >= 50 && v.score < 70;
                                if (matrixFilterTab === 'NOMINAL') return v.score < 50;
                                return true;
                              })
                              .map(village => (
                                <tr key={village.id} className="hover:bg-slate-900/50 transition-colors cursor-pointer" onClick={() => handleSelectVillage(village.id)}>
                                  <td className="py-2 px-3 font-sans font-medium text-slate-200">{village.name}</td>
                                  <td className="py-2 px-2.5 text-slate-400">{village.basin}</td>
                                  <td className={`py-2 px-2.5 font-bold ${village.score >= 70 ? 'text-rose-400' : village.score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {village.score} / 100
                                  </td>
                                  <td className="py-2 px-2.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${village.badgeClass}`}>
                                      {village.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <button
                                      className="text-slate-400 hover:text-sky-300 transition-colors cursor-pointer font-bold"
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectVillage(village.id);
                                      }}
                                    >
                                      SELECT
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        className="w-full py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-sky-400 text-xs font-semibold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                        type="button"
                        onClick={() => setActiveSection('matrix')}
                      >
                        <span>Open Multi-Village Command Matrix</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </section>
              </main>
            )}

            {/* ═════════════════════════════════════════════════════════════════════
            2. DEDICATED VIEW: EVACUATION OPERATIONS (100% FULL-PAGE)
            ═════════════════════════════════════════════════════════════════════ */}
            {activeSection === 'evacuation' && (
              <div className="uod-section-view evacuation-view">
                {/* Tactical Order Banner */}
                <div className="uod-box" style={{ marginBottom: '16px' }}>
                  <div className="uod-box-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="uod-box-icon" style={{ fontSize: '1.4rem' }}>🚁</span>
                      <div>
                        <span className="uod-box-super">OP-ORDER VF-PDH-03 • TACTICAL DIRECTIVE</span>
                        <h2 className="uod-box-title" style={{ fontSize: '1.3rem' }}>
                          Tactical Evacuation Operations — {historicalData.village_name}
                        </h2>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="uod-phase-active-badge">PHASE 2 ACTIVE</span>
                      <div className="uod-timer-badge">T- 01:42:00 REMAINING</div>
                    </div>
                  </div>

                  <div className="uod-box-body">
                    <div className="uod-phase-banner">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div className="uod-phase-title">Phase 2 — Controlled Evacuation Order</div>
                          <div className="uod-phase-sub">
                            ISSUED 08:16 • IC A. THAKUR (DISTRICT COMMAND) • ESCALATION CRITERIA MET
                          </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                          EGRESS CUTOFF WINDOW: {activeVillageMeta.lead_time_display || '28 - 53 min'}
                        </div>
                      </div>
                    </div>

                    {/* 4 Large Tactical KPI Cards */}
                    <div className="uod-evac-stats-row" style={{ marginTop: '14px' }}>
                      <div className="uod-es-card">
                        <div className="uod-es-val">12 / 15</div>
                        <div className="uod-es-lbl">Teams deployed</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>NDRF, SDRF, Home Guards</div>
                      </div>
                      <div className="uod-es-card">
                        <div className="uod-es-val primary">2,115</div>
                        <div className="uod-es-lbl">People cleared</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>55% of village population</div>
                      </div>
                      <div className="uod-es-card">
                        <div className="uod-es-val warning">48</div>
                        <div className="uod-es-lbl">High dependency</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>Medical transport active</div>
                      </div>
                      <div className="uod-es-card">
                        <div className="uod-es-val cyan">{activeVillageMeta.lead_time_display || '28 - 53 min'}</div>
                        <div className="uod-es-lbl">Lead time window</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>Before riverbank inundation</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Column Split: Shelters Board & Priority Tasking */}
                <div className="uod-grid-two-col">
                  {/* Left Column: Shelters Live Capacity & Comms */}
                  <div className="uod-box">
                    <div className="uod-box-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="uod-box-icon">⛺</span>
                        <div>
                          <span className="uod-box-super">SAFE HAVEN LOGISTICS</span>
                          <h3 className="uod-box-title">Shelters / Live Capacity &amp; Comms</h3>
                        </div>
                      </div>
                      <span className="uod-tag-mini">{historicalData.evacuation_assets.shelters.length} SHELTERS DESIGNATED</span>
                    </div>

                    <div className="uod-box-body">
                      <div className="uod-shelters-stack">
                        {historicalData.evacuation_assets.shelters.map((s, idx) => {
                          const currentOccupancy = Math.round(s.capacity * (idx === 0 ? 0.92 : idx === 1 ? 0.49 : 0.76));
                          const isNearFull = currentOccupancy / s.capacity > 0.85;
                          const commsChannel = idx === 0 ? 'VHF CH 04' : idx === 1 ? 'SIRENS 3/3' : idx === 2 ? 'CELL BROADCAST SENT' : 'VHF CH 02';
                          const pct = Math.round((currentOccupancy / s.capacity) * 100);

                          return (
                            <div key={idx} className="uod-shelter-row" style={{ padding: '12px 14px' }}>
                              <div style={{ flex: 1 }}>
                                <div className="uod-sr-name" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                                  <span>🏕️ {s.name}</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                                  Elevation: {s.elevation_m}m • Resources: Food, Water, First Aid, Generator
                                </div>
                                <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${pct}%`,
                                    height: '100%',
                                    background: isNearFull ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                              </div>

                              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                <div className="uod-sr-capacity" style={{ fontSize: '0.95rem' }}>
                                  <span style={{ fontWeight: 800, color: isNearFull ? '#ef4444' : '#ffffff' }}>
                                    {currentOccupancy.toLocaleString()}
                                  </span>
                                  <span style={{ opacity: 0.6 }}> / {s.capacity.toLocaleString()}</span>
                                </div>
                                <span className={`uod-sr-comms ${idx === 2 ? 'sent' : ''}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                                  {commsChannel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Priority Tasking Checklist */}
                  <div className="uod-box">
                    <div className="uod-box-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="uod-box-icon">📋</span>
                        <div>
                          <span className="uod-box-super">FIELD SQUAD DIRECTIVES</span>
                          <h3 className="uod-box-title">Priority Tasking (Live)</h3>
                        </div>
                      </div>
                      {/* Filter Pills */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(['ALL', 'IN_PROGRESS', 'MOVING', 'OVERDUE'] as const).map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setTaskFilter(f)}
                            style={{
                              background: taskFilter === f ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                              border: taskFilter === f ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                              color: taskFilter === f ? '#ffffff' : '#94a3b8',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {f.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="uod-box-body">
                      <div className="uod-tasking-stack">
                        {filteredTasks.map(task => {
                          const isAck = acknowledgedTasks.includes(task.id);
                          return (
                            <div
                              key={task.id}
                              className={`uod-task-row ${task.status.toLowerCase().replace(' ', '-')}`}
                              style={{ padding: '12px 14px' }}
                            >
                              <span className={`uod-task-bullet ${task.status.toLowerCase().replace(' ', '-')}`}>●</span>
                              <div className="uod-task-info">
                                <div className="uod-task-title" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                                  {task.title}
                                </div>
                                <div className="uod-task-meta" style={{ fontSize: '0.72rem' }}>
                                  {task.meta}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`uod-task-status-pill ${task.status.toLowerCase().replace(' ', '-')}`}>
                                  {task.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleTaskAck(task.id)}
                                  style={{
                                    background: isAck ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                                    border: isAck ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.4)',
                                    color: isAck ? '#10b981' : '#38bdf8',
                                    fontSize: '0.7rem',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 700
                                  }}
                                >
                                  {isAck ? '✓ EXECUTED' : 'ACKNOWLEDGE'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Tactical Advisory Footnote */}
                      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f87171' }}>
                          ⚠️ CHOKE-POINT ADVISORY: NH-3 BRIDGE &amp; GORGE ROAD
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                          Bridge clearance down to 0.45m above crest. SDRF boat squad stationed on upstream abutment. Heavy traffic diversion strictly enforced by Mandi Traffic Police.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════════
            3. DEDICATED VIEW: HYDROLOGY & GEOLOGY (100% FULL-PAGE)
            ═════════════════════════════════════════════════════════════════════ */}
            {activeSection === 'hydrology' && (
              <div className="uod-section-view hydrology-view">
                <div className="uod-box basin-intel-box">
                  <div className="uod-box-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="uod-box-icon" style={{ fontSize: '1.4rem' }}>🗺️</span>
                      <div>
                        <span className="uod-box-super">LIVE BASIN INTELLIGENCE &amp; CATCHMENT GEOLOGY</span>
                        <h2 className="uod-box-title" style={{ fontSize: '1.3rem' }}>
                          Catchment Hydrology &amp; Geology — {historicalData.village_name}
                        </h2>
                      </div>
                    </div>
                    <div className="uod-box-header-actions">
                      <span className="uod-tag-mini">ACTIVE GIS SENSORS: 14 STATIONS</span>
                    </div>
                  </div>

                  {/* Large Map Container */}
                  <div className="uod-map-wrap" style={{ height: '480px' }}>
                    <div ref={miniMapContainerRef} className="uod-mini-leaflet-map" style={{ height: '100%' }} />

                    {/* Floating Active Layers Legend */}
                    <div className="uod-map-floating-legend">
                      <div className="uod-mfl-title">ACTIVE LAYERS</div>
                      <div className="uod-mfl-item"><span className="uod-dot cyan"></span> River stage / flow</div>
                      <div className="uod-mfl-item"><span className="uod-dot orange"></span> Slope instability</div>
                      <div className="uod-mfl-item"><span className="uod-dot red"></span> Critical road reach</div>
                      <div className="uod-mfl-item"><span className="uod-dot green"></span> Safe shelters (3)</div>
                    </div>
                  </div>

                  {/* Bottom Telemetry Ticker Strip */}
                  <div className="uod-telemetry-ticker-bar" style={{ padding: '16px' }}>
                    <div className="uod-tt-cell">
                      <span className="uod-tt-label">{historicalData.village_name} stage</span>
                      <div className="uod-tt-val">4.82 m</div>
                      <span className="uod-tt-sub alert">ALERT 4.50 • +0.21/h</span>
                    </div>
                    <div className="uod-tt-cell">
                      <span className="uod-tt-label">Rainfall 6h</span>
                      <div className="uod-tt-val">118 mm</div>
                      <span className="uod-tt-sub">92ND PERCENTILE</span>
                    </div>
                    <div className="uod-tt-cell">
                      <span className="uod-tt-label">Soil saturation</span>
                      <div className="uod-tt-val danger">91%</div>
                      <span className="uod-tt-sub danger">LANDSLIDE INDEX HIGH</span>
                    </div>
                    <div className="uod-tt-cell">
                      <span className="uod-tt-label">Dam release</span>
                      <div className="uod-tt-val cyan">980 m³/s</div>
                      <span className="uod-tt-sub">+140 SINCE 07:30</span>
                    </div>
                    <div className="uod-tt-cell watch">
                      <span className="uod-tt-label">⚠️ SLOPE WATCH</span>
                      <div className="uod-tt-val warning">2 unstable cuts</div>
                      <span className="uod-tt-sub">NH-3 Chainage Under Obs</span>
                    </div>
                  </div>

                  {/* Catchment Geomorphology Profile Details */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8' }}>GEOMORPHIC SETTING</div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                        Narrow V-shaped gorge with steep colluvial slopes prone to rockfall and debris sliding when soil moisture &gt; 85%.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8' }}>HYDRAULIC CHOKEPOINT</div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                        Confluence point 1.2 km upstream constrains backwater surge during rapid spillway release over 900 m³/s.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8' }}>EARLY WARNING THRESHOLD</div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                        Level 5.10m triggers automatic secondary flood gates; siren activation occurs at 4.60m.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════════
            4. DEDICATED VIEW: HISTORICAL DISASTER ARCHIVE (100% FULL-PAGE)
            ═════════════════════════════════════════════════════════════════════ */}
            {activeSection === 'history' && (
              <div className="uod-section-view history-view">
                <div className="uod-box archive-box">
                  <div className="uod-box-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="uod-box-icon" style={{ fontSize: '1.4rem' }}>🗄️</span>
                      <div>
                        <span className="uod-box-super">FORENSIC IMPACT RECORD • {historicalData.incidents.length} EVENTS</span>
                        <h2 className="uod-box-title" style={{ fontSize: '1.3rem' }}>
                          Historical Disaster Archive — {historicalData.village_name}
                        </h2>
                      </div>
                    </div>
                    <span className="uod-tag-mini">TOTAL FATALITIES: {casualties.fatalities}</span>
                  </div>

                  <div className="uod-box-body">
                    <div className="uod-archive-split">
                      {/* Left: Interactive Timeline Stack */}
                      {/* Left: Interactive Timeline Stack */}
                      <div className="space-y-3" style={{ flex: '1 1 340px' }}>
                        {historicalData.incidents.map((inc, idx) => {
                          const isExpanded = expandedIncident === idx;
                          const sevColor = getSeverityColor(inc.severity);
                          const typeIcon = getDisasterTypeIcon(inc.disaster_type);

                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border transition-all shadow-sm ${isExpanded
                                  ? 'bg-slate-900 border-sky-400 shadow-lg ring-1 ring-sky-400/30'
                                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                                }`}
                            >
                              {/* Top Row: Date & Interactive Toggle Button */}
                              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                                  <span>📅 {inc.year}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-sky-400">{inc.month || 'July'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedIncident(isExpanded ? null : idx);
                                  }}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${isExpanded
                                      ? 'bg-sky-500 hover:bg-sky-400 text-white'
                                      : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
                                    }`}
                                >
                                  <span>{isExpanded ? 'HIDE DETAILS ▲' : 'VIEW EVIDENCE ▼'}</span>
                                </button>
                              </div>

                              {/* Title & Severity Badge Row */}
                              <div
                                className="flex items-center justify-between gap-2 pt-2.5 cursor-pointer"
                                onClick={() => setExpandedIncident(isExpanded ? null : idx)}
                              >
                                <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                                  <span>{typeIcon}</span>
                                  <span>{inc.disaster_type.replace(/_/g, ' ')}</span>
                                </div>
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase"
                                  style={{
                                    background: `${sevColor}20`,
                                    color: sevColor,
                                    border: `1px solid ${sevColor}60`
                                  }}
                                >
                                  {inc.severity}
                                </span>
                              </div>

                              {/* Casualties & Damage Stats */}
                              <div className="text-xs text-slate-400 mt-2 font-mono flex flex-wrap items-center gap-2">
                                <span className="text-rose-400 font-bold">{inc.fatalities} fatalities</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-amber-400">{inc.injured} injured</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300">{inc.houses_damaged} homes damaged</span>
                              </div>

                              {/* 🌟 INLINE EXPANDED EVIDENCE & PHOTOS (OPENS WHEN BUTTON IS CLICKED) */}
                              {isExpanded && (
                                <div className="mt-4 pt-3 border-t border-slate-800 space-y-3 animate-fadeIn">
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    {inc.description}
                                  </p>

                                  {/* Samej 3 Verified Photos Gallery */}
                                  {currentVillageId === 'VIL-11' && (
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                                        📸 Ground Zero Photos (Click to Enlarge):
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        {[
                                          { src: '/disaster_photos/samej/samjeVillage_1.webp', title: 'Mudflow Surge' },
                                          { src: '/disaster_photos/samej/samjeVillage_2.webp', title: 'Collapsed Homes' },
                                          { src: '/disaster_photos/samej/samjeVillage_3.webp', title: 'Survivor Tents' }
                                        ].map((photo, pIdx) => (
                                          <div
                                            key={pIdx}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setLightboxImage({ url: photo.src, caption: `${photo.title} — Samej Village Evidence` });
                                            }}
                                            className="group relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 cursor-zoom-in hover:border-sky-400 transition-all"
                                          >
                                            <div className="h-16 w-full overflow-hidden bg-slate-950">
                                              <img
                                                src={photo.src}
                                                alt={photo.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                onError={(e) => {
                                                  (e.target as HTMLElement).style.display = 'none';
                                                }}
                                              />
                                            </div>
                                            <div className="p-1 text-[9px] font-mono text-center text-slate-300 truncate bg-slate-900">
                                              {photo.title}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                          );
                        })}
                      </div>


                      {/* Right: Selected Forensic Dossier Inspector Card */}
                      {/* Right: Selected Forensic Dossier Inspector Card */}
                      <div
                        className="rounded-2xl p-6 shadow-xl space-y-4 border transition-all"
                        style={{
                          flex: '1 1 480px',
                          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                          borderColor: '#bae6fd',
                          color: '#0f172a'
                        }}
                      >
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/90 pb-3">
                          <div>
                            <span className="text-[10px] font-bold tracking-wider text-sky-800 uppercase font-mono">
                              GROUND ZERO FORENSIC FIELD EVIDENCE
                            </span>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                              {currentVillageId === 'VIL-11' ? 'Tragic Demise of Samej Village | Loss & Resilience' : `${currentIncident.year} ${currentIncident.disaster_type.replace('_', ' ')}`}
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-600 text-white shadow-sm font-mono">
                            {currentIncident.severity} IMPACT
                          </span>
                        </div>

                        {/* Article Narrative */}
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {currentVillageId === 'VIL-11'
                            ? "Nestled on the border of Shimla’s Rampur and Kullu, Samej was devastated on midnight of July 31st, 2024. Cloudburst floodwaters originating from a tributary drain swept through the village, obliterating 15 houses, the Primary Health Center, and school under deep mud, leaving only one house standing."
                            : currentIncident.description}
                        </p>

                        {/* 3 Photos Grid Gallery for Samej */}
                        {currentVillageId === 'VIL-11' ? (
                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wide flex items-center gap-1.5">
                              <span>📷 Verified Field Evidence (Click to Zoom)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {[
                                { src: '/disaster_photos/samej/samjeVillage_1.webp', title: 'Mudflow Surge', desc: 'Debris deposits burying settlement' },
                                { src: '/disaster_photos/samej/samjeVillage_2.webp', title: 'Collapsed Homes', desc: 'Single remaining standing house' },
                                { src: '/disaster_photos/samej/samjeVillage_3.webp', title: 'Survivor Tents', desc: 'Makeshift ridge relief camps' }
                              ].map((img, i) => (
                                <div
                                  key={i}
                                  onClick={() => setLightboxImage({ url: img.src, caption: `${img.title} — ${img.desc}` })}
                                  className="group relative rounded-xl overflow-hidden border border-sky-300 bg-white shadow-sm hover:shadow-md transition-all cursor-zoom-in"
                                >
                                  <div className="h-28 w-full overflow-hidden bg-slate-200">
                                    <img
                                      src={img.src}
                                      alt={img.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        // Fallback if network delay occurs
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                  <div className="p-1.5 bg-white">
                                    <div className="text-[10px] font-bold text-slate-800">{img.title}</div>
                                    <div className="text-[9px] text-slate-500 line-clamp-1">{img.desc}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* Standard Incident Single Image */
                          <div className="h-56 w-full rounded-xl overflow-hidden border border-sky-200 bg-white shadow-sm">
                            <img
                              src={currentIncident.image_url || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80'}
                              alt={currentIncident.disaster_type}
                              className="w-full h-full object-cover cursor-zoom-in"
                              onClick={() => setLightboxImage({
                                url: currentIncident.image_url || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
                                caption: currentIncident.image_caption || currentIncident.description
                              })}
                            />
                          </div>
                        )}

                        {/* 4 Forensic Metric Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sky-200/90 text-xs">
                          <div className="bg-white/90 p-2.5 rounded-lg border border-sky-100 shadow-xs">
                            <span className="text-slate-500 text-[10px] block font-mono">Fatalities</span>
                            <span className="text-lg font-bold text-rose-600">{currentIncident.fatalities}</span>
                          </div>
                          <div className="bg-white/90 p-2.5 rounded-lg border border-sky-100 shadow-xs">
                            <span className="text-slate-500 text-[10px] block font-mono">Injured</span>
                            <span className="text-lg font-bold text-amber-600">{currentIncident.injured}</span>
                          </div>
                          <div className="bg-white/90 p-2.5 rounded-lg border border-sky-100 shadow-xs">
                            <span className="text-slate-500 text-[10px] block font-mono">Houses Lost</span>
                            <span className="text-lg font-bold text-sky-800">{currentIncident.houses_damaged}</span>
                          </div>
                          <div className="bg-white/90 p-2.5 rounded-lg border border-sky-100 shadow-xs">
                            <span className="text-slate-500 text-[10px] block font-mono">Max Rain (DEM)</span>
                            <span className="text-lg font-bold text-emerald-700">{historicalData.catchment_profile.max_recorded_rainfall_mm || 240} mm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════════
            5. DEDICATED VIEW: VILLAGE MATRIX (100% FULL-PAGE)
            ═════════════════════════════════════════════════════════════════════ */}
            {activeSection === 'matrix' && (
              <div className="uod-section-view matrix-view">
                <div className="uod-box matrix-box">
                  <div className="uod-box-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="uod-box-icon" style={{ fontSize: '1.4rem' }}>🗺️</span>
                      <div>
                        <span className="uod-box-super">NATIONAL 26-PILOT REGISTER &amp; COMPARATIVE MATRIX</span>
                        <h2 className="uod-box-title" style={{ fontSize: '1.3rem' }}>
                          All-Villages Risk &amp; Evacuation Register
                        </h2>
                      </div>
                    </div>
                    {/* Search Box & Basin Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Search village or district..."
                        value={matrixSearch}
                        onChange={(e) => setMatrixSearch(e.target.value)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          outline: 'none'
                        }}
                      />
                      <span className="uod-tag-mini">{filteredVillagesList.length} VILLAGES MONITORED</span>
                    </div>
                  </div>

                  <div className="uod-box-body" style={{ padding: 0 }}>
                    <div className="uod-matrix-table-wrap">
                      <table className="uod-matrix-table">
                        <thead>
                          <tr>
                            <th>VILLAGE</th>
                            <th>STATE</th>
                            <th>FATALITIES</th>
                            <th>HISTORY</th>
                            <th>PRIMARY THREAT</th>
                            <th>VULNERABILITY</th>
                            <th>CAPACITY</th>
                            <th>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVillagesList.map(([id, data]) => {
                            const totalFat = data.incidents.reduce((acc, inc) => acc + inc.fatalities, 0);
                            const isCurrent = id === currentVillageId;
                            const vulnIdx = data.catchment_profile?.vulnerability_index || 70;
                            const safeCap = data.evacuation_assets.shelters.reduce((acc, s) => acc + s.capacity, 0);

                            return (
                              <tr
                                key={id}
                                className={isCurrent ? 'selected-row' : ''}
                                onClick={() => handleSelectVillage(id)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td className="uod-mt-village-cell">
                                  <span className="uod-mt-vname">{data.village_name}</span>
                                  {isCurrent && <span className="uod-current-pin">ACTIVE</span>}
                                </td>
                                <td className="uod-mt-state-cell">{data.state.split(',')[0]}</td>
                                <td>
                                  <span className={`uod-fatality-pill ${totalFat > 20 ? 'critical' : totalFat > 5 ? 'high' : 'nominal'}`}>
                                    {totalFat} deaths
                                  </span>
                                </td>
                                <td className="uod-mt-events-cell">{data.incidents.length} events</td>
                                <td className="uod-mt-threat-cell">
                                  <span className="uod-threat-snippet">
                                    {data.catchment_profile?.recurring_threat || 'Flash flood'}
                                  </span>
                                </td>
                                <td>
                                  <div className="uod-vuln-bar-cell">
                                    <span className={`uod-vuln-pct ${vulnIdx > 75 ? 'high' : ''}`}>{vulnIdx}%</span>
                                    <div className="uod-vuln-bar-track">
                                      <div
                                        className={`uod-vuln-bar-fill ${vulnIdx > 75 ? 'danger' : 'warning'}`}
                                        style={{ width: `${vulnIdx}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="uod-mt-cap-cell">{safeCap.toLocaleString()}</td>
                                <td>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectVillage(id);
                                      setActiveSection('overview');
                                    }}
                                    style={{
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      border: '1px solid rgba(56, 189, 248, 0.4)',
                                      color: '#38bdf8',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Inspect Dossier →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="uod-matrix-footer" style={{ padding: '12px 18px' }}>
                      <span className="uod-matrix-meta">
                        Showing {filteredVillagesList.length} of 26 villages • 4 severe • 13 high • 9 guarded
                      </span>
                      <div className="uod-matrix-pagination">PAGE 01 / 01</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* TELEMETRY HEARTBEAT & SECURITY FOOTER */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#040711] px-5 lg:px-8 py-2.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            GATEWAY CONNECTED: NDMA / SDMA TACTICAL LINK ACTIVE
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400">ENCRYPTION: AES-256 GCM</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
          <span>SERVER: <strong className="text-slate-300">DEL-NODE-04</strong></span>
          <span>LATENCY: <strong className="text-emerald-400">14ms</strong></span>
          <span>SYS BUILD: <strong className="text-slate-300">REV-2024.11-C4</strong></span>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════
          FULL-SCREEN PHOTO LIGHTBOX MODAL
          ═══════════════════════════════════════════════════════════ */}
      {lightboxImage && (
        <div className="uod-lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="uod-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="uod-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close Lightbox"
            >
              ✕
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption}
              className="uod-lightbox-img"
            />
            <div className="uod-lightbox-caption">
              <strong>{currentIncident?.year} {currentIncident?.disaster_type?.replace('_', ' ')}</strong>: {lightboxImage.caption}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          INCIDENT OPERATIONS LOG MODAL
          ═══════════════════════════════════════════════════════════ */}
      {incidentLogOpen && (
        <div className="uod-lightbox-backdrop" onClick={() => setIncidentLogOpen(false)}>
          <div className="uod-incident-log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="uod-ilm-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span>
                <h3>Operational Incident Log — {historicalData.village_name}</h3>
              </div>
              <button
                type="button"
                className="uod-lightbox-close"
                onClick={() => setIncidentLogOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="uod-ilm-body">
              <div className="uod-ilm-entry">
                <span className="uod-ilm-time">08:42:16</span>
                <span className="uod-ilm-tag info">INFO</span>
                <span className="uod-ilm-text">Telemetry nominal: 13 / 14 stations reporting. Beas stage +0.21m/h.</span>
              </div>
              <div className="uod-ilm-entry">
                <span className="uod-ilm-time">08:30:00</span>
                <span className="uod-ilm-tag alert">DISPATCH</span>
                <span className="uod-ilm-text">Dam spillway release escalated to 980 m³/s. Warning sirens sounded in Riverside Ward.</span>
              </div>
              <div className="uod-ilm-entry">
                <span className="uod-ilm-time">08:16:00</span>
                <span className="uod-ilm-tag critical">ORDER</span>
                <span className="uod-ilm-text">Phase 2 Controlled Evacuation ordered by IC A. Thakur. NDRF Squad 3 deployed.</span>
              </div>
              <div className="uod-ilm-entry">
                <span className="uod-ilm-time">07:45:00</span>
                <span className="uod-ilm-tag warning">WARN</span>
                <span className="uod-ilm-text">Soil saturation crossed 90% threshold along NH-3 chainage 201.4 slope cut.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div className="c4-toast-alert">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default TacticalDossierDashboard;
