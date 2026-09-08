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
    <FloodProvider>
      <DashboardContent />
    </FloodProvider>
  );
};

export default App;
