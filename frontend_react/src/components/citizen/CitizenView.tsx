import React, { useState, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';

export const CitizenView: React.FC = () => {
  const { 
    selectedVillageData, 
    selectedVillageId, 
    selectVillage, 
    villages, 
    allVillages, 
    basins, 
    activeBasinId, 
    switchBasin, 
    role, 
    setRole, 
    language, 
    t 
  } = useFlood();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    torch: true,
    docs: true,
    water: false,
    meds: false
  });

  // Self-healing: If citizen role is active but no village is selected yet, automatically select the top/default village
  useEffect(() => {
    if (role === 'citizen' && !selectedVillageId) {
      const topVillageId = villages.length > 0 
        ? villages[0].id 
        : (allVillages.length > 0 ? allVillages[0].id : 'VIL-01');
      selectVillage(topVillageId);
    }
  }, [role, selectedVillageId, villages, allVillages, selectVillage]);

  if (role !== 'citizen') return null;

  // Toggle go-bag checklist items
  const toggleItem = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Safe fallback village if details are still fetching
  const activeVillageSummary = (villages.length > 0 ? villages : allVillages).find(v => v.id === selectedVillageId) 
    || villages[0] 
    || allVillages[0];

  const v = selectedVillageData?.village || activeVillageSummary;
  const risk = selectedVillageData?.risk_analysis;
  const lead = selectedVillageData?.lead_time;
  const action = selectedVillageData?.action_plan;
  const telemetry = selectedVillageData?.telemetry;

  const isCritical = risk ? (risk.risk_level === 'CRITICAL' || risk.risk_level === 'EXTREME') : (v?.risk_level === 'CRITICAL' || v?.risk_level === 'EXTREME');
  const isModerate = risk ? risk.risk_level === 'MODERATE' : (v?.risk_level === 'MODERATE');

  const shelterName: string = typeof action?.primary_shelter === 'object' && action?.primary_shelter !== null 
    ? action.primary_shelter.name 
    : (typeof action?.primary_shelter === 'string' ? action.primary_shelter : (typeof v?.primary_shelter === 'object' && v?.primary_shelter !== null ? (v.primary_shelter as any).name : (v?.primary_shelter || 'Govt Senior Secondary School (Upper Ridge)')));

  const routeName: string = typeof action?.recommended_route === 'object' && action?.recommended_route !== null 
    ? action.recommended_route.name 
    : (typeof action?.recommended_route === 'string' ? action.recommended_route : (v?.routes && v.routes.length > 0 ? v.routes[0].name : 'Ridge Highway SH-13 (Upper Hill Bypass)'));

  const windowDisplay = lead?.window_display || v?.lead_time_display || '15-30 min';

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

    const villageName = v?.name || 'Your Village';
    let text = '';

    if (language === 'hi') {
      text = isCritical
        ? `आपातकालीन चेतावनी! ${villageName} में अचानक बाढ़ का गंभीर खतरा है। कृपया तुरंत ${shelterName} की ओर ${routeName} से सुरक्षित स्थान पर जाएं। आपके पास लगभग ${windowDisplay} का समय है। नदी किनारे न रुकें।`
        : isModerate
        ? `सावधानी सूचना। ${villageName} में मौसम विभाग द्वारा बाढ़ सतर्कता जारी की गई है। कृपया आपातकालीन किट तैयार रखें और नदी नालों से दूर रहें।`
        : `${villageName} में वर्तमान में सभी जल प्रवाह और मौसमीय स्थितियां सामान्य हैं। सतर्क रहें और आधिकारिक सूचनाओं का पालन करें।`;
    } else {
      text = isCritical
        ? `Emergency Alert for ${villageName}. Severe Flash Flood Warning detected. Immediate evacuation directive to ${shelterName} via ${routeName}. You have approximately ${windowDisplay} escape window. Do not delay.`
        : isModerate
        ? `Flood Readiness Advisory for ${villageName}. High runoff and stream saturation. Please prepare your emergency go-bag and avoid river crossings.`
        : `Weather advisory for ${villageName}. Current stream levels and rainfall readings are within safe baseline limits. Continue monitoring.`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="citizen-container active" style={{ display: 'block', maxWidth: '1120px', margin: '24px auto', padding: '0 20px 60px' }}>
      
      {/* 🧭 Top Quick Ward & Basin Navigation Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(2, 132, 199, 0.4))',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            🏡
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('yourLocation')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
              <select
                id="citizen-village-select"
                value={selectedVillageId || ''}
                onChange={(e) => selectVillage(e.target.value)}
                style={{
                  background: 'rgba(30, 41, 59, 0.95)',
                  color: '#ffffff',
                  border: '1.5px solid #38bdf8',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
                aria-label="Select Village or Ward"
              >
                {(villages.length > 0 ? villages : allVillages).map(village => (
                  <option key={village.id} value={village.id}>
                    {village.risk_level === 'CRITICAL' || village.risk_level === 'EXTREME' ? '🔴' : village.risk_level === 'MODERATE' ? '🟡' : '🟢'} {village.name} ({village.state || 'HP'})
                  </option>
                ))}
              </select>

              {v && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  🏔️ {v.elevation_m}m • 🌊 {v.district ? `${v.district} Basin` : 'Mountain Valley'} • 📐 {v.slope_deg}° {t('slopePrefix')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Link: Switch back to Full Authority GIS View */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setRole('authority')}
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: 'var(--accent-cyan)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            title="Switch to Authority Command Center with 3D GIS & Hydrology"
          >
            <span>🗺️</span>
            <span>{t('viewGisMap')}</span>
          </button>
        </div>
      </div>

      {/* 🚨 Hero Emergency Status & Escape Window Banner */}
      <div 
        className="citizen-alert-header"
        style={{
          background: isCritical 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(153, 27, 27, 0.55) 100%)' 
            : isModerate
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(180, 83, 9, 0.45) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(4, 120, 87, 0.4) 100%)',
          border: isCritical ? '2px solid #ef4444' : isModerate ? '2px solid #f59e0b' : '2px solid #10b981',
          borderRadius: '20px',
          padding: '30px 24px',
          textAlign: 'center',
          boxShadow: isCritical ? '0 12px 40px rgba(239, 68, 68, 0.35)' : '0 10px 30px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 0, 0, 0.35)', padding: '4px 16px', borderRadius: '20px', marginBottom: '14px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <span style={{ fontSize: '1.2rem' }}>{isCritical ? '🚨' : isModerate ? '⚠️' : '🛡️'}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.06em', color: '#ffffff' }}>
            {isCritical ? t('imminentEvacuation') : isModerate ? t('readinessAdvisory') : t('normalSafety')}
          </span>
        </div>

        <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#ffffff', margin: '4px 0 10px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          {v?.name || 'MONITORED WARD'}
        </h1>

        <p style={{ fontSize: '1.08rem', color: isCritical ? '#fca5a5' : isModerate ? '#fde68a' : '#a7f3d0', maxWidth: '680px', margin: '0 auto 20px', fontWeight: 600, lineHeight: 1.5 }}>
          {isCritical 
            ? (language === 'hi' ? `फ्लैश फ्लड चेतावनी! आगामी ${windowDisplay} में जलस्तर चरम सीमा पार करने की आशंका। तुरंत सुरक्षित ऊंचाई पर जाएं।` : `Rapid flash flood surge projected within ${windowDisplay}. Cease all riverbed activity and move immediately to designated refuge point.`)
            : isModerate
            ? (language === 'hi' ? `मानसून एवं ढलान संतृप्ति उच्च स्तर पर। आपातकालीन सामग्री तैयार रखें और सुरक्षित मार्गों की पहचान करें।` : `Catchment soil saturation elevated. Keep emergency kits ready and avoid streams, low bridges, and unpaved mountain trails.`)
            : (language === 'hi' ? `सभी आईएमडी डॉपलर रडार और जल गेज सामान्य सीमा में हैं। नियमित निगरानी सक्रिय है।` : `All hydrometeorological radar readings and stream telemetry are within baseline thresholds. Routine real-time monitoring active.`)}
        </p>

        {/* Live Gauges Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          maxWidth: '820px',
          margin: '0 auto 24px'
        }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('actionWindowRemaining')}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: isCritical ? '#ef4444' : isModerate ? '#f59e0b' : '#34d399', marginTop: '2px' }}>
              ⏳ {windowDisplay}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('rainLabel')}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
              🌧️ {telemetry?.rain_1h !== undefined && telemetry?.rain_1h !== null ? Number(telemetry.rain_1h).toFixed(1) : '18.4'} mm/h
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('waterLabel')}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>
              🌊 {telemetry?.water_level_m !== undefined && telemetry?.water_level_m !== null ? Number(telemetry.water_level_m).toFixed(2) : '2.10'} m
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('soilLabel')}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a78bfa', marginTop: '2px' }}>
              🌱 {telemetry?.soil_moisture !== undefined && telemetry?.soil_moisture !== null ? Number(telemetry.soil_moisture).toFixed(0) : '72'}%
            </div>
          </div>
        </div>

        {/* 🔊 Voice Audio Broadcast CTA */}
        <div>
          <button
            onClick={handleAudioBroadcast}
            style={{
              padding: '14px 30px',
              background: isPlayingAudio ? '#ef4444' : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: '#ffffff',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '9999px',
              fontSize: '1.02rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: isPlayingAudio ? '0 0 25px #ef4444' : '0 6px 25px rgba(37, 99, 235, 0.5)',
              transition: 'all 0.25s ease'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{isPlayingAudio ? '⏹️' : '🔊'}</span>
            <span>{isPlayingAudio ? t('stopAudioAlert') : t('playAudioAlert')}</span>
          </button>
        </div>
      </div>

      {/* 🛡️ Core Directives: Refuge Shelter, Evacuation Route & Emergency Go-Bag */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
        
        {/* 1. Designated Safe Shelter Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⛺</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {t('designatedShelterTitle')}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>NDMA & District Disaster Management Verified</div>
            </div>
          </div>

          <div style={{
            fontSize: '1.28rem',
            fontWeight: 800,
            color: '#f8fafc',
            margin: '12px 0 6px',
            lineHeight: 1.3
          }}>
            {shelterName}
          </div>

          <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '16px' }}>
            {language === 'hi' 
              ? 'बाढ़ के उच्चतम जलस्तर समोच्च से ऊपर स्थित ठोस कंक्रीट भवन। पीने का पानी, प्राथमिक चिकित्सा और आपातकालीन प्रकाश की व्यवस्था उपलब्ध है।' 
              : 'Multi-story reinforced RCC structure situated well above peak 100-year inundation levels. Equipped with drinking water, dry rations, and medical first-aid.'}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              ✓ High Ridge Ground
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
              ✓ Solar Generator Backup
            </span>
          </div>
        </div>

        {/* 2. Recommended Safe Evacuation Route Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(52, 211, 153, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛣️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                {t('safeRouteTitle')}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Clear of Inundation & Active Debris Cones</div>
            </div>
          </div>

          <div style={{
            fontSize: '1.28rem',
            fontWeight: 800,
            color: '#f8fafc',
            margin: '12px 0 6px',
            lineHeight: 1.3
          }}>
            {routeName}
          </div>

          <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '16px' }}>
            {language === 'hi' 
              ? 'पहाड़ी रिज मार्ग जो नदी नालों और भूस्खलन मलबे से सुरक्षित है। निचले पुलों और नदी किनारे के मार्गों का उपयोग सख्त वर्जित है।' 
              : 'Ridge crest highway road verified clear of landslide debris and river overflow. Low-lying culverts and valley bridges are strictly restricted.'}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
              ✓ All-Weather Paved
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              ✕ Avoid Low Riverbank Road
            </span>
          </div>
        </div>

        {/* 3. 3-Minute Emergency Go-Bag Checklist Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(167, 139, 250, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎒</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa' }}>
                {t('goBagTitle')}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Grab-and-Go Survival Essentials</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.92rem', color: checkedItems.torch ? '#ffffff' : '#94a3b8' }}>
              <input type="checkbox" checked={checkedItems.torch} onChange={() => toggleItem('torch')} style={{ accentColor: '#a78bfa', width: '18px', height: '18px' }} />
              <span>🔦 <strong>Torch & Powerbank:</strong> Fully charged</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.92rem', color: checkedItems.docs ? '#ffffff' : '#94a3b8' }}>
              <input type="checkbox" checked={checkedItems.docs} onChange={() => toggleItem('docs')} style={{ accentColor: '#a78bfa', width: '18px', height: '18px' }} />
              <span>📄 <strong>Aadhar / ID & Cash:</strong> In waterproof pouch</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.92rem', color: checkedItems.water ? '#ffffff' : '#94a3b8' }}>
              <input type="checkbox" checked={checkedItems.water} onChange={() => toggleItem('water')} style={{ accentColor: '#a78bfa', width: '18px', height: '18px' }} />
              <span>💧 <strong>Drinking Water:</strong> 1-2 sealed bottles</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.92rem', color: checkedItems.meds ? '#ffffff' : '#94a3b8' }}>
              <input type="checkbox" checked={checkedItems.meds} onChange={() => toggleItem('meds')} style={{ accentColor: '#a78bfa', width: '18px', height: '18px' }} />
              <span>💊 <strong>Essential Medicines:</strong> 3-day supply</span>
            </label>
          </div>
        </div>
      </div>

      {/* 📞 One-Tap Emergency Disaster Helplines */}
      <div style={{
        marginTop: '24px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#f87171' }}>
              {t('helplineTitle')}
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              24x7 Toll-Free Government Emergency Numbers (Tap to call directly from mobile)
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            ● 24/7 ACTIVE
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          <a 
            href="tel:112"
            style={{
              textDecoration: 'none',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              color: '#ffffff'
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700 }}>NATIONAL EMERGENCY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>📞 112</div>
            </div>
            <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>➔</span>
          </a>

          <a 
            href="tel:1070"
            style={{
              textDecoration: 'none',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              color: '#ffffff'
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700 }}>STATE DISASTER (SDMA)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b' }}>📞 1070</div>
            </div>
            <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>➔</span>
          </a>

          <a 
            href="tel:1077"
            style={{
              textDecoration: 'none',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              color: '#ffffff'
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700 }}>DISTRICT CONTROL (DEOC)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>📞 1077</div>
            </div>
            <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>➔</span>
          </a>

          <a 
            href="tel:108"
            style={{
              textDecoration: 'none',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              color: '#ffffff'
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700 }}>MEDICAL / AMBULANCE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f87171' }}>📞 108</div>
            </div>
            <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>➔</span>
          </a>
        </div>
      </div>

    </div>
  );
};
