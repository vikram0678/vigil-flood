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
  const { role } = useFlood();

  return (
    <>
      <Navbar />

      {/* Authority Command Center View */}
      {role === 'authority' && (
        <main className="dashboard-container">
          {/* Left Column: Monitored Catchments */}
          <PilotCatchmentPanel />

          {/* Center Column: GIS Map & What-If Simulation Sandbox */}
          <section className="center-panel">
            <MapContainer />
            <WhatIfSandbox />
          </section>

          {/* Right Column: Deep-Dive AI Telemetry, XAI, & Action Directives */}
          <DeepDiveAnalysis />
        </main>
      )}

      {/* Citizen Alert & Evacuation View */}
      {role === 'citizen' && (
        <CitizenView />
      )}

      {/* Modals */}
      <HydrographModal />
      <MethodologyModal />
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
