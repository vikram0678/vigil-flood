import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFlood } from '../../context/FloodContext';

interface GeocodeResult {
  place_id: number | string;
  display_name: string;
  lat: string | number;
  lon: string | number;
  type: string;
  category?: 'WARD' | 'ISRO' | 'GPS' | 'GLOBAL';
  riskScore?: number;
  riskLevel?: string;
  subtext?: string;
}

// Curated ISRO 147 High-Risk Mountain Districts Catalog
const ISRO_MOUNTAIN_DISTRICTS = [
  { name: 'Mandi (Himachal Pradesh)', lat: 31.5892, lng: 76.9182, code: 'SEC-NW-HIM-01', risk: 'VERY HIGH' },
  { name: 'Chamoli (Uttarakhand)', lat: 30.2937, lng: 79.5603, code: 'SEC-NW-HIM-02', risk: 'CRITICAL (GLOF)' },
  { name: 'Rudraprayag (Uttarakhand)', lat: 30.2844, lng: 78.9811, code: 'SEC-NW-HIM-03', risk: 'HIGH' },
  { name: 'Uttarkashi (Uttarakhand)', lat: 30.7268, lng: 78.4354, code: 'SEC-NW-HIM-04', risk: 'HIGH' },
  { name: 'Kullu (Himachal Pradesh)', lat: 31.9579, lng: 77.1095, code: 'SEC-NW-HIM-05', risk: 'VERY HIGH' },
  { name: 'Kinnaur (Himachal Pradesh)', lat: 31.6510, lng: 78.4752, code: 'SEC-NW-HIM-06', risk: 'HIGH' },
  { name: 'Wayanad (Kerala)', lat: 11.6854, lng: 76.1320, code: 'SEC-SW-GHAT-01', risk: 'VERY HIGH' },
  { name: 'Idukki (Kerala)', lat: 9.8494, lng: 76.9804, code: 'SEC-SW-GHAT-02', risk: 'HIGH' },
  { name: 'Shimla (Himachal Pradesh)', lat: 31.1048, lng: 77.1734, code: 'SEC-NW-HIM-07', risk: 'HIGH' },
  { name: 'Pithoragarh (Uttarakhand)', lat: 29.5829, lng: 80.2182, code: 'SEC-NW-HIM-08', risk: 'VERY HIGH' },
  { name: 'Darjeeling (West Bengal)', lat: 27.0410, lng: 88.2663, code: 'SEC-EAST-HIM-01', risk: 'HIGH' },
  { name: 'East Sikkim (Sikkim)', lat: 27.3389, lng: 88.6065, code: 'SEC-EAST-HIM-02', risk: 'CRITICAL (GLOF)' },
];

export const UniversalSearchBar: React.FC = () => {
  const { viewMode, villages, selectVillage } = useFlood();
  const [query, setQuery] = useState('');
  const [globalSuggestions, setGlobalSuggestions] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [queryAnalysis, setQueryAnalysis] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K to focus search, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsDropdownOpen(true);
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Parse GPS Coordinate formats (e.g. "31.7084, 77.0261" or "31.7084 N 77.0261 E")
  const parsedCoords = useMemo(() => {
    if (!query) return null;
    const cleanStr = query.replace(/[°NSEWnsew]/g, '').trim();
    const parts = cleanStr.split(/[\s,]+/);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  }, [query]);

  // 2. Filter Monitored Basin Wards
  const matchedBasinWards = useMemo(() => {
    if (!query || query.trim().length < 1) return [];
    const q = query.toLowerCase().trim();
    return villages
      .filter(v =>
        v.name.toLowerCase().includes(q) ||
        (v.district && v.district.toLowerCase().includes(q)) ||
        (v.ward && v.ward.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .map(v => ({
        place_id: `ward-${v.id}`,
        display_name: `${v.name} (${v.district || 'HP'})`,
        lat: v.lat,
        lon: v.lng,
        type: 'ward',
        category: 'WARD' as const,
        riskScore: v.risk_percentage || 50,
        riskLevel: v.risk_level || 'MODERATE',
        subtext: `${v.ward || 'Catchment Ward'} • Elev ${v.elevation_m}m • ${v.risk_percentage}% Threat`
      }));
  }, [query, villages]);

  // 3. Filter ISRO 147 Mountain Districts
  const matchedIsroDistricts = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    return ISRO_MOUNTAIN_DISTRICTS
      .filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
      .slice(0, 3)
      .map(d => ({
        place_id: `isro-${d.name}`,
        display_name: d.name,
        lat: d.lat,
        lon: d.lng,
        type: 'isro',
        category: 'ISRO' as const,
        riskLevel: d.risk,
        subtext: `ISRO Atlas Ref: ${d.code} • Vulnerability: ${d.risk}`
      }));
  }, [query]);

  // Total results combined for keyboard up/down navigation
  const allCategorizedResults = useMemo(() => {
    const list: GeocodeResult[] = [];
    if (parsedCoords) {
      list.push({
        place_id: 'gps-coord',
        display_name: `GPS Point: ${parsedCoords.lat.toFixed(4)}°N, ${parsedCoords.lng.toFixed(4)}°E`,
        lat: parsedCoords.lat,
        lon: parsedCoords.lng,
        type: 'gps',
        category: 'GPS',
        subtext: 'Direct Topographic DEM & Hydro Dynamic Query'
      });
    }
    list.push(...matchedBasinWards);
    list.push(...matchedIsroDistricts);
    list.push(...globalSuggestions);
    return list;
  }, [parsedCoords, matchedBasinWards, matchedIsroDistricts, globalSuggestions]);

  const handleSearchChange = (text: string) => {
    setQuery(text);
    setSelectedIndex(-1);
    if (!text.trim() || text.length < 2) {
      setGlobalSuggestions([]);
      setIsDropdownOpen(text.trim().length > 0);
      return;
    }
    setIsDropdownOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // If query is pure coordinates, no need to hit Nominatim
      if (parsedCoords) return;

      setIsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=4`
        );
        if (res.ok) {
          const data: any[] = await res.json();
          setGlobalSuggestions(
            data.map(item => ({
              place_id: item.place_id,
              display_name: item.display_name,
              lat: item.lat,
              lon: item.lon,
              type: item.type,
              category: 'GLOBAL',
              subtext: item.display_name.split(',').slice(1, 3).join(',')
            }))
          );
        }
      } catch (err) {
        console.error('Nominatim geocode error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);
  };

  const handleSelectLocation = async (lat: number, lng: number, name: string, category?: string) => {
    setIsDropdownOpen(false);
    setQuery(name.split(',')[0]);
    setIsLoading(true);

    try {
      // Check if this matches a monitored village directly
      const matchedVillage = villages.find(
        v => Math.abs(v.lat - lat) < 0.005 && Math.abs(v.lng - lng) < 0.005
      );
      if (matchedVillage) {
        selectVillage(matchedVillage.id);
      }

      // Query Universal Flash Flood Risk & DEM Telemetry
      const res = await fetch('/api/telemetry/universal-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      if (res.ok) {
        const data = await res.json();
        setQueryAnalysis(data);

        // Smooth Camera Fly-To with 60fps pan/zoom
        if (viewMode === '2d' && (window as any).leafletMap) {
          (window as any).leafletMap.flyTo([lat, lng], 13.5, { duration: 1.5, easeLinearity: 0.25 });
        }
      }
    } catch (err) {
      console.error('Universal query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || allCategorizedResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allCategorizedResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allCategorizedResults.length) % allCategorizedResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = selectedIndex >= 0 ? allCategorizedResults[selectedIndex] : allCategorizedResults[0];
      if (target) {
        handleSelectLocation(
          typeof target.lat === 'string' ? parseFloat(target.lat) : target.lat,
          typeof target.lon === 'string' ? parseFloat(target.lon) : target.lon,
          target.display_name,
          target.category
        );
      }
    }
  };

  return (
    <div className="universal-search-container" id="tour-universal-search">
      <div className="search-bar-inner">
        <input
          ref={inputRef}
          type="text"
          className="universal-search-input"
          placeholder="Search village/location..."
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => query.trim().length > 0 && setIsDropdownOpen(true)}
          onKeyDown={handleKeyDownInput}
        />
        {isLoading ? (
          <span className="search-spinner">⏳</span>
        ) : query ? (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => { setQuery(''); setGlobalSuggestions([]); setQueryAnalysis(null); setIsDropdownOpen(false); }}
            title="Clear Search"
          >
            &times;
          </button>
        ) : (
          <span className="search-icon" style={{ opacity: 0.6, cursor: 'pointer' }}>🔍</span>
        )}
      </div>

      {/* Categorized Autocomplete Dropdown */}
      {isDropdownOpen && allCategorizedResults.length > 0 && (
        <div className="search-dropdown-menu">
          {/* Section 1: GPS Direct Paste */}
          {parsedCoords && (
            <div className="search-category-block">
              <div className="category-header">🧭 GPS COORDINATES (DIRECT JUMP)</div>
              <div
                className={`suggestion-item highlighted ${selectedIndex === 0 ? 'keyboard-selected' : ''}`}
                onClick={() => handleSelectLocation(parsedCoords.lat, parsedCoords.lng, `GPS (${parsedCoords.lat.toFixed(4)}, ${parsedCoords.lng.toFixed(4)})`, 'GPS')}
              >
                <span className="suggestion-badge-icon">📍</span>
                <div className="suggestion-text">
                  <div className="suggestion-title">Lat: {parsedCoords.lat.toFixed(4)}° N, Lng: {parsedCoords.lng.toFixed(4)}° E</div>
                  <div className="suggestion-subtitle">Direct 30m DEM Elevation & AI Hydro Analysis</div>
                </div>
                <span className="category-tag-gps">FLY-TO</span>
              </div>
            </div>
          )}

          {/* Section 2: Monitored Basin Wards */}
          {matchedBasinWards.length > 0 && (
            <div className="search-category-block">
              <div className="category-header">📍 MONITORED BASIN WARDS</div>
              {matchedBasinWards.map((item) => (
                <div
                  key={item.place_id}
                  className="suggestion-item"
                  onClick={() => handleSelectLocation(Number(item.lat), Number(item.lon), item.display_name, 'WARD')}
                >
                  <span className="suggestion-badge-icon">🏘️</span>
                  <div className="suggestion-text">
                    <div className="suggestion-title">{item.display_name}</div>
                    <div className="suggestion-subtitle">{item.subtext}</div>
                  </div>
                  <span
                    className="category-risk-badge"
                    style={{
                      backgroundColor: item.riskScore && item.riskScore > 70 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: item.riskScore && item.riskScore > 70 ? '#ef4444' : '#38bdf8',
                      border: `1px solid ${item.riskScore && item.riskScore > 70 ? '#ef4444' : '#38bdf8'}`
                    }}
                  >
                    {item.riskScore}% {item.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Section 3: ISRO 147 Vulnerable Mountain Districts */}
          {matchedIsroDistricts.length > 0 && (
            <div className="search-category-block">
              <div className="category-header">🏔️ ISRO 147 VULNERABLE MOUNTAIN DISTRICTS</div>
              {matchedIsroDistricts.map((item) => (
                <div
                  key={item.place_id}
                  className="suggestion-item"
                  onClick={() => handleSelectLocation(Number(item.lat), Number(item.lon), item.display_name, 'ISRO')}
                >
                  <span className="suggestion-badge-icon">🛰️</span>
                  <div className="suggestion-text">
                    <div className="suggestion-title">{item.display_name}</div>
                    <div className="suggestion-subtitle">{item.subtext}</div>
                  </div>
                  <span className="category-tag-isro">SEC-NW-HIM</span>
                </div>
              ))}
            </div>
          )}

          {/* Section 4: Global Nominatim Geocoded Results */}
          {globalSuggestions.length > 0 && (
            <div className="search-category-block">
              <div className="category-header">🌐 OPENSTREETMAP GEOCODING</div>
              {globalSuggestions.map((item) => (
                <div
                  key={item.place_id}
                  className="suggestion-item"
                  onClick={() => handleSelectLocation(parseFloat(String(item.lat)), parseFloat(String(item.lon)), item.display_name, 'GLOBAL')}
                >
                  <span className="suggestion-badge-icon">📍</span>
                  <div className="suggestion-text">
                    <div className="suggestion-title">{item.display_name.split(',')[0]}</div>
                    <div className="suggestion-subtitle">{item.subtext}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Spot Analysis Floating Card for Searched Coordinate */}
      {queryAnalysis && (
        <div className="spot-analysis-card">
          <div className="spot-header">
            <div className="spot-title">
              <span>📡 Spot Analysis: </span>
              <strong>{query}</strong>
            </div>
            <button className="spot-close-btn" onClick={() => setQueryAnalysis(null)}>&times;</button>
          </div>

          <div className="spot-body">
            <div className="spot-metric-grid">
              <div className="spot-pill">
                <span className="pill-label">30m DEM Elev</span>
                <span className="pill-val">⛰️ {queryAnalysis.topography?.elevation_m || 880}m</span>
              </div>
              <div className="spot-pill">
                <span className="pill-label">Terrain Slope</span>
                <span className="pill-val">📐 {queryAnalysis.topography?.slope_deg || 28}°</span>
              </div>
              <div className="spot-pill">
                <span className="pill-label">Live Rainfall</span>
                <span className="pill-val">🌧️ {queryAnalysis.weather?.rain_1h || 0} mm/h</span>
              </div>
              <div className="spot-pill">
                <span className="pill-label">Soil Moisture</span>
                <span className="pill-val">🌱 {queryAnalysis.weather?.soil_moisture || 40}%</span>
              </div>
            </div>

            <div className="spot-hazard-row">
              <div className="hazard-level-badge" style={{
                background: (queryAnalysis.risk_analysis?.risk_percentage || 0) > 70 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                color: (queryAnalysis.risk_analysis?.risk_percentage || 0) > 70 ? '#ef4444' : '#38bdf8',
                border: `1px solid ${(queryAnalysis.risk_analysis?.risk_percentage || 0) > 70 ? '#ef4444' : '#38bdf8'}`
              }}>
                {queryAnalysis.risk_analysis?.risk_badge || '⚡'} Flash Flood Risk: <strong>{queryAnalysis.risk_analysis?.risk_percentage || 0}% ({queryAnalysis.risk_analysis?.risk_level || 'NOMINAL'})</strong>
              </div>
              <div className="peak-discharge-pill">
                ⚡ Peak Surge Qp: <strong>{queryAnalysis.hydrology?.peak_discharge_m3s || 120} m³/s</strong>
              </div>
            </div>

            {queryAnalysis.nearest_safe_refuge && (
              <div className="spot-refuge-box">
                <span>⛺ Nearest Designated Refuge: </span>
                <strong>{queryAnalysis.nearest_safe_refuge.name}</strong>
                <span style={{ color: '#10b981', marginLeft: '6px' }}>● {queryAnalysis.nearest_safe_refuge.safety_status || 'SAFE'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

