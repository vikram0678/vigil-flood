import React, { useState, useRef, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';

interface GeocodeResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export const UniversalSearchBar: React.FC = () => {
  const { viewMode } = useFlood();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [queryAnalysis, setQueryAnalysis] = useState<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (!text.trim() || text.length < 3) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=5`
        );
        if (res.ok) {
          const data: GeocodeResult[] = await res.json();
          setSuggestions(data);
          setIsDropdownOpen(data.length > 0);
        }
      } catch (err) {
        console.error('Nominatim geocode error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelectLocation = async (lat: number, lng: number, name: string) => {
    setIsDropdownOpen(false);
    setQuery(name.split(',')[0]);
    setIsLoading(true);

    try {
      // 1. Query Universal Flash Flood Risk & DEM Telemetry
      const res = await fetch('/api/telemetry/universal-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      if (res.ok) {
        const data = await res.json();
        setQueryAnalysis(data);

        // 2. Fly Map Camera to Searched Location
        if (viewMode === '2d' && (window as any).leafletMap) {
          (window as any).leafletMap.flyTo([lat, lng], 13.5, { duration: 1.5 });
        }
      }
    } catch (err) {
      console.error('Universal query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="universal-search-container" id="tour-universal-search">
      <div className="search-bar-inner">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="universal-search-input"
          placeholder="Search any village, gorge or GPS [Lat, Lng] in India..."
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsDropdownOpen(true)}
        />
        {isLoading && <span className="search-spinner">⏳</span>}
        {query && (
          <button 
            className="search-clear-btn" 
            onClick={() => { setQuery(''); setSuggestions([]); setQueryAnalysis(null); }}
            title="Clear Search"
          >
            &times;
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Suggestions */}
      {isDropdownOpen && suggestions.length > 0 && (
        <ul className="search-suggestions-list">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              className="suggestion-item"
              onClick={() => handleSelectLocation(parseFloat(item.lat), parseFloat(item.lon), item.display_name)}
            >
              <span className="suggestion-pin">📍</span>
              <div className="suggestion-text">
                <div className="suggestion-title">{item.display_name.split(',')[0]}</div>
                <div className="suggestion-subtitle">{item.display_name.split(',').slice(1, 3).join(',')}</div>
              </div>
            </li>
          ))}
        </ul>
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
                <span className="pill-val">⛰️ {queryAnalysis.topography.elevation_m}m</span>
              </div>
              <div className="spot-pill">
                <span className="pill-label">Terrain Slope</span>
                <span className="pill-val">📐 {queryAnalysis.topography.slope_deg}°</span>
              </div>
              <div className="spot-pill">
                <span className="pill-label">Live Rainfall</span>
                <span className="pill-val">🌧️ {queryAnalysis.weather.rain_1h} mm/h</span>
              </div>
              <div className="spot-pill">
                <span className="pill-label">Soil Moisture</span>
                <span className="pill-val">🌱 {queryAnalysis.weather.soil_moisture}%</span>
              </div>
            </div>

            <div className="spot-hazard-row">
              <div className="hazard-level-badge" style={{
                background: queryAnalysis.risk_analysis.risk_percentage > 70 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                color: queryAnalysis.risk_analysis.risk_percentage > 70 ? '#ef4444' : '#38bdf8',
                border: `1px solid ${queryAnalysis.risk_analysis.risk_percentage > 70 ? '#ef4444' : '#38bdf8'}`
              }}>
                {queryAnalysis.risk_analysis.risk_badge} Flash Flood Risk: <strong>{queryAnalysis.risk_analysis.risk_percentage}% ({queryAnalysis.risk_analysis.risk_level})</strong>
              </div>
              <div className="peak-discharge-pill">
                ⚡ Peak Surge $Q_p$: <strong>{queryAnalysis.hydrology.peak_discharge_m3s} m³/s</strong>
              </div>
            </div>

            <div className="spot-refuge-box">
              <span>⛺ Nearest Designated Refuge: </span>
              <strong>{queryAnalysis.nearest_safe_refuge.name}</strong>
              <span style={{ color: '#10b981', marginLeft: '6px' }}>● {queryAnalysis.nearest_safe_refuge.safety_status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
