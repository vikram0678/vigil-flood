import React, { useState, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';

export const StateAlertsTableModal: React.FC = () => {
  const { switchBasin, hazardFilter, setHazardFilter } = useFlood();
  const [isOpen, setIsOpen] = useState(false);
  const [stateFilter, setStateFilter] = useState('ALL');
  const [modalHazardFilter, setModalHazardFilter] = useState<string>('ALL');
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'state' | 'location'>('state');

  useEffect(() => {
    const handleOpen = () => {
      setModalHazardFilter(hazardFilter);
      setIsOpen(true);
    };
    window.addEventListener('open-state-alerts-table-modal', handleOpen);
    return () => window.removeEventListener('open-state-alerts-table-modal', handleOpen);
  }, [hazardFilter]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTable = async () => {
      try {
        const params = new URLSearchParams();
        if (stateFilter !== 'ALL') params.append('state', stateFilter);
        if (modalHazardFilter !== 'ALL') params.append('category', modalHazardFilter);
        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(`/api/weather/state-alerts-table${query}`);
        if (res.ok) {
          const data = await res.json();
          setTableRows(data.table_rows || []);
        }
      } catch (err) {
        console.error('Failed to fetch state alerts table:', err);
      }
    };
    fetchTable();
  }, [isOpen, stateFilter, modalHazardFilter]);

  if (!isOpen) return null;

  const handleActionClick = (row: any) => {
    setIsOpen(false);
    const st = (row.state || '').toLowerCase();
    if (st.includes('himachal')) switchBasin('BASIN-HP-BEAS');
    else if (st.includes('uttarakhand')) switchBasin('BASIN-UK-ALAK');
    else if (st.includes('sikkim')) switchBasin('BASIN-SK-TEESTA');
    else if (st.includes('kerala')) switchBasin('BASIN-KL-WAYANAD');
    else if ((window as any).leafletMap && row.coordinates) {
      (window as any).leafletMap.flyTo(row.coordinates, 12, { duration: 1.5 });
    }
  };

  const statesList = [
    { id: 'ALL', name: 'PAN INDIA' },
    { id: 'Uttarakhand', name: 'Uttarakhand' },
    { id: 'Himachal Pradesh', name: 'Himachal Pradesh' },
    { id: 'Kerala', name: 'Kerala' },
    { id: 'Sikkim', name: 'Sikkim' },
    { id: 'Jammu & Kashmir', name: 'Jammu & Kashmir' },
    { id: 'Maharashtra', name: 'Maharashtra' },
    { id: 'Karnataka', name: 'Karnataka' },
    { id: 'Tamil Nadu', name: 'Tamil Nadu' },
    { id: 'Arunachal Pradesh', name: 'Arunachal Pradesh' },
    { id: 'Meghalaya', name: 'Meghalaya' },
    { id: 'Mizoram', name: 'Mizoram' },
    { id: 'West Bengal', name: 'West Bengal (Hills)' },
    { id: 'Assam', name: 'Assam (Hills)' },
    { id: 'Nagaland', name: 'Nagaland' }
  ];

  return (
    <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
      <div className="modal-content state-alerts-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header Banner */}
        <div className="state-modal-header">
          <div className="modal-title-row">
            <span className="modal-icon">⚠️</span>
            <div>
              <h3>LOCATION SPECIFIC DISASTER & WEATHER ALERTS</h3>
              <p>National Disaster Management Standard Hazard Registry</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={() => setIsOpen(false)}>&times;</button>
        </div>

        {/* Sub-tabs & State Dropdown */}
        <div className="state-modal-controls">
          <div className="modal-sub-tabs">
            <button 
              className={`modal-sub-tab-btn ${activeSubTab === 'state' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('state')}
            >
              State Wise
            </button>
            <button 
              className={`modal-sub-tab-btn ${activeSubTab === 'location' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('location')}
            >
              Location Wise
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="state-filter-wrapper">
              <label htmlFor="modal-hazard-select">HAZARD: </label>
              <select
                id="modal-hazard-select"
                className="state-filter-select"
                value={modalHazardFilter}
                onChange={(e) => {
                  setModalHazardFilter(e.target.value);
                  setHazardFilter(e.target.value as any);
                }}
              >
                <option value="ALL">🌟 ALL HAZARDS</option>
                <option value="LANDSLIDE">⚠️ LANDSLIDES</option>
                <option value="FLASH_FLOOD">🌊 FLASH FLOODS</option>
                <option value="MULTI_HAZARD">⚡ MULTI-HAZARD</option>
              </select>
            </div>

            <div className="state-filter-wrapper">
              <label htmlFor="modal-state-select">REGION: </label>
              <select
                id="modal-state-select"
                className="state-filter-select"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
              >
                {statesList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="state-table-scroll-container">
          <table className="sachet-table">
            <thead>
              <tr>
                <th>Issued By</th>
                <th>State</th>
                <th>District / Location</th>
                <th>Disaster Event</th>
                <th>Rainfall</th>
                <th>Warning Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="issued-by-tag">{row.issued_by}</span>
                  </td>
                  <td><strong>{row.state}</strong></td>
                  <td>{row.district}</td>
                  <td>
                    <span className="event-tag" style={{ color: row.color }}>
                      {row.event}
                    </span>
                  </td>
                  <td>
                    <span className="rain-tag">{row.rainfall_mmh} mm/h</span>
                  </td>
                  <td>
                    <div className="warning-bar-container">
                      <div 
                        className="warning-bar-fill" 
                        style={{ background: row.color, width: row.severity === 'CRITICAL' ? '100%' : row.severity === 'WARNING' ? '65%' : '35%' }}
                      ></div>
                      <span className="warning-type-label" style={{ color: row.color }}>{row.warning_type}</span>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="inspect-basin-action-btn"
                      onClick={() => handleActionClick(row)}
                      title="Inspect this mountain gorge on map"
                    >
                      Inspect ➔
                    </button>
                  </td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No active severe weather warnings for the selected region.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="state-modal-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing <strong>{tableRows.length}</strong> active CAP disaster warnings across India.
          </div>
          <button className="btn-secondary" onClick={() => setIsOpen(false)}>Close</button>
        </div>
      </div>
    </div>
  );
};
