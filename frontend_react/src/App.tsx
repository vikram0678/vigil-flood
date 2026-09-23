import React from 'react';
import { FloodProvider, useFlood } from './context/FloodContext';
import { useWebSocket } from './hooks/useWebSocket';
import { Navbar } from './components/layout/Navbar';
import { PilotCatchmentPanel } from './components/sidebar/PilotCatchmentPanel';
import { MapContainer } from './components/map/MapContainer';
import { WhatIfSandbox } from './components/simulation/WhatIfSandbox';
import { DeepDiveAnalysis } from './components/analysis/DeepDiveAnalysis';
import { HydrographModal } from './components/modals/HydrographModal';
import { MethodologyModal } from './components/modals/MethodologyModal';
import { CitizenView } from './components/citizen/CitizenView';
import { AapdaMitraBot } from './components/aapda_mitra/AapdaMitraBot';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 [VIGIL-FLOOD] React Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#f87171', background: '#090d16', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h2 style={{ color: '#ef4444', marginBottom: 12 }}>🚨 VIGIL-FLOOD UI Exception Detected</h2>
          <div style={{ color: '#94a3b8', marginBottom: 16 }}>An error occurred during component rendering:</div>
          <pre style={{ background: '#1e293b', padding: 20, borderRadius: 8, color: '#f8fafc', whiteSpace: 'pre-wrap', border: '1px solid #ef4444' }}>
            {this.state.error?.stack || this.state.error?.message}
          </pre>
          <button 
            style={{ marginTop: 16, padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            🔄 Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardContent: React.FC = () => {
  useWebSocket();
  const { role, villages, selectedVillageId } = useFlood();
  const [mobileTab, setMobileTab] = React.useState<'map' | 'villages' | 'telemetry'>('map');

  // Auto-switch to map on mobile when a village is selected
  const prevVillageRef = React.useRef(selectedVillageId);
  React.useEffect(() => {
    if (prevVillageRef.current !== selectedVillageId && typeof window !== 'undefined' && window.innerWidth <= 1024) {
      prevVillageRef.current = selectedVillageId;
      setMobileTab('map');
    }
  }, [selectedVillageId]);

  return (
    <>
      <Navbar />

      {/* Authority Command Center View */}
      {role === 'authority' && (
        <main className="dashboard-container">
          {/* Mobile Navigation Tabs (Shown on screens <= 1024px) */}
          <div className="mobile-tab-bar">
            <button 
              className={`mobile-tab-btn ${mobileTab === 'map' ? 'active' : ''}`}
              onClick={() => setMobileTab('map')}
            >
              🗺️ <span>Live Map & Sim</span>
            </button>
            <button 
              className={`mobile-tab-btn ${mobileTab === 'villages' ? 'active' : ''}`}
              onClick={() => setMobileTab('villages')}
            >
              📍 <span>Villages ({villages.length})</span>
            </button>
            <button 
              className={`mobile-tab-btn ${mobileTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setMobileTab('telemetry')}
            >
              🛡️ <span>AI Telemetry</span>
            </button>
          </div>

          {/* Left Column: Monitored Catchments */}
          <div className={`col-wrapper col-villages ${mobileTab === 'villages' ? 'mobile-visible' : ''}`}>
            <PilotCatchmentPanel />
          </div>

          {/* Center Column: GIS Map & What-If Simulation Sandbox */}
          <section className={`center-panel col-wrapper col-map ${mobileTab === 'map' ? 'mobile-visible' : ''}`}>
            <MapContainer />
            <WhatIfSandbox />
          </section>

          {/* Right Column: Deep-Dive AI Telemetry, XAI, & Action Directives */}
          <div className={`col-wrapper col-telemetry ${mobileTab === 'telemetry' ? 'mobile-visible' : ''}`}>
            <DeepDiveAnalysis />
          </div>
        </main>
      )}

      {/* Citizen Alert & Evacuation View */}
      {role === 'citizen' && (
        <CitizenView />
      )}

      {/* Modals */}
      <HydrographModal />
      <MethodologyModal />

      {/* Aapda Mitra AI Disaster Decision Assistant */}
      <AapdaMitraBot />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <FloodProvider>
        <DashboardContent />
      </FloodProvider>
    </ErrorBoundary>
  );
};

export default App;
