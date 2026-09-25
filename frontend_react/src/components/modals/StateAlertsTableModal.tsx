import React, { useState, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';

export const StateAlertsTableModal: React.FC = () => {
  const { switchBasin } = useFlood();
  const [isOpen, setIsOpen] = useState(false);
  const [stateFilter, setStateFilter] = useState('ALL');
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'state' | 'location'>('state');

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-state-alerts-table-modal', handleOpen);
    return () => window.removeEventListener('open-state-alerts-table-modal', handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTable = async () => {
      try {
        const query = stateFilter !== 'ALL' ? `?state=${encodeURIComponent(stateFilter)}` : '';
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
  }, [isOpen, stateFilter]);

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
    { id: 'Arunachal Pradesh', name: 'Arunachal Pradesh' },
    { id: 'Karnataka', name: 'Karnataka' },
    { id: 'Meghalaya', name: 'Meghalaya' }
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
              <p>National Disaster Management Authority (CAP-SACHET & IMD Standard Feed)</p>
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

          <div className="state-filter-wrapper">
            <label htmlFor="modal-state-select">SELECT REGION: </label>
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
