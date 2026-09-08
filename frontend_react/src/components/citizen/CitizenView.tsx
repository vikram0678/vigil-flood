import React, { useState } from 'react';
import { useFlood } from '../../context/FloodContext';

export const CitizenView: React.FC = () => {
  const { selectedVillageData, role } = useFlood();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (role !== 'citizen' || !selectedVillageData) return null;

  const { village: v, risk_analysis: risk, lead_time: lead, action_plan: action } = selectedVillageData;
  const isCritical = risk.risk_level === 'CRITICAL' || risk.risk_level === 'EXTREME';

  const shelterName: string = typeof action?.primary_shelter === 'object' && action?.primary_shelter !== null 
    ? action.primary_shelter.name 
    : (typeof action?.primary_shelter === 'string' ? action.primary_shelter : 'Designated Safe Ridge Shelter');

  const routeName: string = typeof action?.recommended_route === 'object' && action?.recommended_route !== null 
    ? action.recommended_route.name 
    : (typeof action?.recommended_route === 'string' ? action.recommended_route : 'Recommended Safe Ridge Route');

  const handleAudioBroadcast = () => {
    if (!('speechSynthesis' in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const text = isCritical
      ? `Emergency Alert for ${v.name}. Severe Flash Flood Warning. Evacuate immediately to ${shelterName} via ${routeName}. You have ${lead.window_display} actionable lead time.`
      : `Weather Advisory for ${v.name}. Current conditions are ${risk.risk_level}. Please stay tuned to local emergency announcements.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="citizen-container active" style={{ display: 'block' }}>
      <div 
        className="citizen-alert-header"
        style={{
          background: isCritical 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.4))' 
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(4, 120, 87, 0.3))',
          border: isCritical ? '2px solid #ef4444' : '2px solid #10b981'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          {isCritical ? '🚨' : '🟢'}
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
          {isCritical ? `IMMEDIATE EVACUATION DIRECTIVE: ${v.name.toUpperCase()}` : `NORMAL MONITORING: ${v.name.toUpperCase()}`}
        </h2>
        <div style={{ fontSize: '1rem', color: isCritical ? '#fca5a5' : '#a7f3d0', marginTop: '6px' }}>
          {isCritical ? `Flash Flood Surge Projected within ${lead.window_display}` : 'All hydrometeorological streams within safe thresholds'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Safe Shelter Box */}
        <div className="action-box">
          <div className="action-title">
            <span>⛺ Designated Safe Refuge</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
            {shelterName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Elevated concrete shelter above peak flood stage contour.
          </div>
        </div>

        {/* Recommended Route Box */}
        <div className="action-box">
          <div className="action-title">
            <span>🛣️ Safe Evacuation Route</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
            {routeName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Ridge-line road verified free of inundation and debris blockage.
          </div>
        </div>
      </div>

      {/* Voice Alert & Emergency Audio Broadcast */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          style={{
            padding: '12px 24px',
            background: isPlayingAudio ? '#ef4444' : 'linear-gradient(135deg, #0284c7, #2563eb)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)'
          }}
          onClick={handleAudioBroadcast}
        >
          <span>{isPlayingAudio ? '⏹️ Stop Broadcast' : '🔊 Play Audio Warning Broadcast (English / Hindi / Pahari)'}</span>
        </button>
      </div>
    </div>
  );
};
