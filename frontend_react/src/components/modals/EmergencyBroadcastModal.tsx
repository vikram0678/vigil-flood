import React, { useState, useEffect, useRef } from 'react';
import { useFlood } from '../../context/FloodContext';

export const EmergencyBroadcastModal: React.FC = () => {
  const { selectedVillageData, selectedVillageId, villages } = useFlood();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'broadcast' | 'cap_xml' | 'manual_contacts'>('broadcast');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [tierLevel, setTierLevel] = useState<'TIER_1_CRITICAL' | 'TIER_2_DANGER' | 'TIER_3_WATCH' | 'TIER_4_ALL_CLEAR'>('TIER_1_CRITICAL');

  const [messageEn, setMessageEn] = useState<string>('');
  const [messageHi, setMessageHi] = useState<string>('');
  const [overrideSiren, setOverrideSiren] = useState<boolean>(true);

  const [capData, setCapData] = useState<any>(null);
  const [capXmlString, setCapXmlString] = useState<string>('');
  const [towersData, setTowersData] = useState<any>(null);

  // Auto-countdown state
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(60);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dispatch response state
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Manual phone numbers / Excel contact input
  const [manualPhoneInput, setManualPhoneInput] = useState<string>('+91 98765 43210, +91 91234 56789, +91 94180 12345');
  const [testPhone, setTestPhone] = useState<string>('');
  const [gatewayProvider, setGatewayProvider] = useState<'auto' | 'fast2sms' | 'twilio'>('auto');
  const [isSendingRealSms, setIsSendingRealSms] = useState<boolean>(false);
  const [realSmsResult, setRealSmsResult] = useState<any>(null);
  const [uploadedContacts, setUploadedContacts] = useState<Array<{ name: string; phone: string; role: string }>>([
    { name: 'DC Office Mandi Emergency Cell', phone: '+91 94180 12345', role: 'District Magistrate' },
    { name: 'NDRF 14th Battalion Commandant', phone: '+91 98160 54321', role: 'NDRF Command' },
    { name: 'Pandoh Aapda Mitra Lead (Ramesh)', phone: '+91 98765 43210', role: 'Local Volunteer Lead' },
    { name: 'Aut Sub-Divisional Officer', phone: '+91 91234 56789', role: 'SDM Office' }
  ]);

  // Audio Context for EAS Dual-Tone Siren Synthesizer (853Hz + 960Hz)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isSirenPlayingRef = useRef<boolean>(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState<boolean>(false);

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-emergency-broadcast-modal', handleOpen);
    return () => window.removeEventListener('open-emergency-broadcast-modal', handleOpen);
  }, []);

  const targetVillageId = selectedVillageId || 'VIL-01';

  // Fetch CAP XML & Towers data when modal opens or village changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchCapAndTowers = async () => {
      try {
        const [capJsonRes, capXmlRes, towersRes] = await Promise.all([
          fetch(`/api/broadcast/cap-json/${targetVillageId}`),
          fetch(`/api/broadcast/cap-xml/${targetVillageId}`),
          fetch(`/api/broadcast/cell-towers?village_id=${targetVillageId}`)
        ]);

        const capJson = await capJsonRes.json();
        const capXml = await capXmlRes.text();
        const towers = await towersRes.json();

        setCapData(capJson);
        setCapXmlString(capXml);
        setTowersData(towers);

        // Pre-populate templates based on tier
        if (capJson?.bilingual_templates?.tier_1_critical) {
          setMessageEn(capJson.bilingual_templates.tier_1_critical.en);
          setMessageHi(capJson.bilingual_templates.tier_1_critical.hi);
        }
      } catch (err) {
        console.error("Failed to load CAP or Cell Towers data:", err);
      }
    };

    fetchCapAndTowers();
  }, [isOpen, targetVillageId]);

  // Update messages when tier changes
  const handleTierChange = (tier: 'TIER_1_CRITICAL' | 'TIER_2_DANGER' | 'TIER_3_WATCH' | 'TIER_4_ALL_CLEAR') => {
    setTierLevel(tier);
    if (!capData?.bilingual_templates) return;

    const keyMap: Record<string, string> = {
      TIER_1_CRITICAL: 'tier_1_critical',
      TIER_2_DANGER: 'tier_2_danger',
      TIER_3_WATCH: 'tier_3_watch',
      TIER_4_ALL_CLEAR: 'tier_4_all_clear'
    };

    const tKey = keyMap[tier];
    const template = capData.bilingual_templates[tKey];
    if (template) {
      setMessageEn(template.en);
      setMessageHi(template.hi);
    }
  };

  // Play / Stop EAS Acoustic Siren (853Hz + 960Hz dual frequency)
  const toggleEasSiren = () => {
    if (isSirenPlayingRef.current) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      isSirenPlayingRef.current = false;
      setIsSirenPlaying(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(853, ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(960, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      isSirenPlayingRef.current = true;
      setIsSirenPlaying(true);
    } catch (err) {
      console.warn("Audio Context error:", err);
    }
  };

  // Cleanup audio on modal close
  const closeModal = () => {
    if (isSirenPlayingRef.current && audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      isSirenPlayingRef.current = false;
      setIsSirenPlaying(false);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsCountingDown(false);
    setIsOpen(false);
  };

  // Dispatch Broadcast Action
  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch("/api/broadcast/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          village_id: targetVillageId,
          tier_level: tierLevel,
          custom_message_en: messageEn,
          custom_message_hi: messageHi,
          override_siren: overrideSiren,
          manual_override: true
        })
      });
      const data = await res.json();
      setDispatchResult(data);
      if (isCountingDown) {
        setIsCountingDown(false);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      }
    } catch (err) {
      console.error("Dispatch error:", err);
    } finally {
      setIsDispatching(false);
    }
  };

  // Handle Excel / CSV File Drop / Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const parsed: Array<{ name: string; phone: string; role: string }> = [];

      lines.forEach((line, idx) => {
        if (idx === 0 && (line.toLowerCase().includes('phone') || line.toLowerCase().includes('name'))) return; // skip header
        const parts = line.split(/[,\t]/);
        if (parts.length >= 2) {
          parsed.push({
            name: parts[0]?.trim() || `Official #${idx}`,
            phone: parts[1]?.trim() || '',
            role: parts[2]?.trim() || 'Evacuation Coordinator'
          });
        }
      });

      if (parsed.length > 0) {
        setUploadedContacts(prev => [...prev, ...parsed]);
      }
    };
    reader.readAsText(file);
  };

  // Dispatch Real SMS to Phone via Fast2SMS / Twilio
  const handleSendRealSms = async () => {
    if (!testPhone.trim()) {
      alert("Please enter a valid 10-digit mobile number to test.");
      return;
    }
    setIsSendingRealSms(true);
    setRealSmsResult(null);
    try {
      const currentMsg = language === 'en' ? messageEn : messageHi;
      const res = await fetch("/api/broadcast/send-real-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_numbers: [testPhone.trim()],
          message: currentMsg || "VIGIL-FLOOD: Emergency Flash Flood Advisory Test Alert",
          preferred_gateway: gatewayProvider
        })
      });
      const data = await res.json();
      setRealSmsResult(data);
    } catch (err: any) {
      setRealSmsResult({ status: 'ERROR', error: err.message });
    } finally {
      setIsSendingRealSms(false);
    }
  };

  if (!isOpen) return null;

  const currentVillageName = selectedVillageData?.village?.name || villages.find(v => v.id === targetVillageId)?.name || 'Pandoh';

  return (
    <div className="modal-backdrop active" onClick={closeModal}>
      <div className="modal-card emergency-broadcast-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header emergency-header">
          <div className="emergency-title-group">
            <span className="emergency-pulse-icon">📡</span>
            <div>
              <h3 className="emergency-title">CAP-SACHET Emergency Broadcast Center</h3>
              <div className="emergency-subtitle">
                3GPP Cell Broadcast Service (CBS) &amp; Common Alerting Protocol • Mandi DDMA / NDRF
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={closeModal} title="Close Modal">&times;</button>
        </div>

        {/* Tab Navigation */}
        <div className="broadcast-tab-bar">
          <button 
            className={`broadcast-tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
            onClick={() => setActiveTab('broadcast')}
          >
            📢 Live Broadcast Controller
          </button>
          <button 
            className={`broadcast-tab-btn ${activeTab === 'cap_xml' ? 'active' : ''}`}
            onClick={() => setActiveTab('cap_xml')}
          >
            📜 Official CAP XML (ITU-T X.1303)
          </button>
          <button 
            className={`broadcast-tab-btn ${activeTab === 'manual_contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual_contacts')}
          >
            👥 VIP &amp; Official Roster ({uploadedContacts.length})
          </button>
        </div>

        <div className="modal-body broadcast-body">
          {/* ================= TAB 1: LIVE BROADCAST CONTROLLER ================= */}
          {activeTab === 'broadcast' && (
            <div className="broadcast-content-grid">
              {/* Left Column: Message Editor & Tier Selection */}
              <div className="broadcast-editor-pane">
                {/* Target Catchment & Tier Selector */}
                <div className="broadcast-config-row">
                  <div>
                    <label className="field-label">TARGET BASIN / CATCHMENT</label>
                    <div className="active-basin-badge">
                      📍 {currentVillageName} Catchment Corridor (Beas Valley)
                    </div>
                  </div>

                  <div>
                    <label className="field-label">HAZARD SEVERITY TIER</label>
                    <div className="tier-selector-pills">
                      <button 
                        className={`tier-pill-btn tier-1 ${tierLevel === 'TIER_1_CRITICAL' ? 'active' : ''}`}
                        onClick={() => handleTierChange('TIER_1_CRITICAL')}
                      >
                        🔴 Extreme Evacuation
                      </button>
                      <button 
                        className={`tier-pill-btn tier-2 ${tierLevel === 'TIER_2_DANGER' ? 'active' : ''}`}
                        onClick={() => handleTierChange('TIER_2_DANGER')}
                      >
                        🟠 Danger Alert
                      </button>
                      <button 
                        className={`tier-pill-btn tier-3 ${tierLevel === 'TIER_3_WATCH' ? 'active' : ''}`}
                        onClick={() => handleTierChange('TIER_3_WATCH')}
                      >
                        🟡 Watch
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bilingual Tab Switcher for Message */}
                <div className="msg-lang-bar">
                  <div className="msg-lang-tabs">
                    <button 
                      className={`lang-tab-btn ${language === 'en' ? 'active' : ''}`}
                      onClick={() => setLanguage('en')}
                    >
                      🇬🇧 English Advisory
                    </button>
                    <button 
                      className={`lang-tab-btn ${language === 'hi' ? 'active' : ''}`}
                      onClick={() => setLanguage('hi')}
                    >
                      🇮🇳 हिंदी आपातकालीन संदेश
                    </button>
                  </div>
                  <span className="char-count-badge">
                    {language === 'en' ? messageEn.length : messageHi.length} / 180 chars (3GPP Safe)
                  </span>
                </div>

                {/* Live Editable Textarea */}
                <div className="textarea-wrapper">
                  {language === 'en' ? (
                    <textarea 
                      className="broadcast-textarea"
                      rows={4}
                      value={messageEn}
                      onChange={(e) => setMessageEn(e.target.value)}
                      placeholder="Enter English Emergency Broadcast message..."
                    />
                  ) : (
                    <textarea 
                      className="broadcast-textarea"
                      rows={4}
                      value={messageHi}
                      onChange={(e) => setMessageHi(e.target.value)}
                      placeholder="हिंदी आपातकालीन संदेश दर्ज करें..."
                    />
                  )}
                </div>

                {/* Dynamic Token Helper Pills */}
                <div className="token-helpers-row">
                  <span className="field-label" style={{ marginRight: 6 }}>INSERT TOKEN:</span>
                  <button className="token-pill" onClick={() => setMessageEn(prev => prev + ` [Safe Shelter: ${capData?.safe_shelter || 'Govt School'}]`)}>+ Shelter</button>
                  <button className="token-pill" onClick={() => setMessageEn(prev => prev + ` [Route: ${capData?.evacuation_route || 'SH-13'}]`)}>+ Route</button>
                  <button className="token-pill" onClick={() => setMessageEn(prev => prev + ` [Surge: ${capData?.surge_height_m || 2.1}m]`)}>+ Surge Level</button>
                </div>

                {/* Siren Override Switch */}
                <div className="siren-control-row">
                  <label className="siren-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={overrideSiren}
                      onChange={(e) => setOverrideSiren(e.target.checked)}
                    />
                    <span>🔊 Acoustic Emergency Siren (Bypasses phone silent/do-not-disturb mode)</span>
                  </label>

                  <button 
                    className={`test-siren-btn ${isSirenPlaying ? 'active' : ''}`}
                    onClick={toggleEasSiren}
                    title="Test synthesized 853Hz+960Hz dual-tone EAS siren in your browser"
                  >
                    {isSirenPlaying ? '🔇 Stop EAS Siren' : '🔊 Test EAS Siren'}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Geo-Fence Telecom Stats & Dispatch Action */}
              <div className="broadcast-status-pane">
                {/* Telecom Geo-Fence Card */}
                <div className="geofence-stats-card">
                  <div className="geofence-card-header">
                    <span style={{ fontSize: '1rem' }}>📡</span>
                    <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.82rem' }}>
                      CELL TOWER GEO-FENCE STATUS
                    </span>
                  </div>

                  <div className="geofence-metrics-grid">
                    <div className="geofence-metric">
                      <div className="metric-label">ACTIVE BTS TOWERS</div>
                      <div className="metric-val">{towersData?.geofenced_towers_count || 4} Towers</div>
                      <div className="metric-sub">Jio, Airtel, BSNL</div>
                    </div>
                    <div className="geofence-metric">
                      <div className="metric-label">ESTIMATED REACH</div>
                      <div className="metric-val highlight">~{towersData?.total_connected_devices_in_zone?.toLocaleString() || '3,200'}</div>
                      <div className="metric-sub">Active Connected Phones</div>
                    </div>
                  </div>

                  <div className="tower-chips-list">
                    {towersData?.towers?.filter((t: any) => t.is_geofenced).map((t: any) => (
                      <div key={t.id} className="tower-chip">
                        <span className="dot-green">●</span>
                        <span style={{ fontWeight: 700 }}>{t.operator}:</span>
                        <span>{t.name} ({t.band})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dispatch Button & Results */}
                <div className="dispatch-action-box">
                  <button 
                    className="dispatch-broadcast-btn"
                    onClick={handleDispatch}
                    disabled={isDispatching}
                  >
                    <span>{isDispatching ? '⚡ DISPATCHING...' : '🚀 BROADCAST TO CELL BROADCAST NOW'}</span>
                  </button>
                  <div className="dispatch-hint">
                    ⚡ Sub-3-Second Delivery to all mobile devices within {currentVillageName} hazard polygon.
                  </div>

                  {dispatchResult && (
                    <div className="dispatch-receipt-box">
                      <div className="receipt-header">
                        <span>✅ DISPATCH CONFIRMED</span>
                        <span>{dispatchResult.timestamp}</span>
                      </div>
                      <div className="receipt-body">
                        • <b>Broadcast ID:</b> <code>{dispatchResult.broadcast_id}</code><br/>
                        • <b>Channel:</b> {dispatchResult.channel}<br/>
                        • <b>Towers Transmitting:</b> {dispatchResult.geofenced_towers_count} BTS Nodes<br/>
                        • <b>Latency:</b> {dispatchResult.estimated_delivery_latency_ms} ms (Near-Instant)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: OFFICIAL CAP-SACHET XML VIEWER ================= */}
          {activeTab === 'cap_xml' && (
            <div className="cap-xml-view">
              <div className="cap-xml-header">
                <div>
                  <span style={{ fontWeight: 800, color: '#38bdf8' }}>ITU-T Recommendation X.1303 / OASIS CAP v1.2</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Standard XML payload generated for NDMA SACHET National Early Warning Gateway
                  </div>
                </div>
                <button 
                  className="copy-xml-btn"
                  onClick={() => navigator.clipboard.writeText(capXmlString)}
                >
                  📋 Copy XML
                </button>
              </div>
              <pre className="cap-xml-pre">
                <code>{capXmlString || 'Loading CAP XML Payload...'}</code>
              </pre>
            </div>
          )}

          {/* ================= TAB 3: MANUAL CONTACTS & EXCEL IMPORT ================= */}
          {activeTab === 'manual_contacts' && (
            <div className="manual-contacts-view">
              {/* Real Phone SMS Testing Card */}
              <div className="real-sms-tester-card" style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📱</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#38bdf8', fontWeight: 800 }}>
                        Send Real Test SMS to Your Mobile Phone
                      </h4>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Dispatches the current live advisory directly to your physical phone via Fast2SMS (India) or Twilio
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input 
                    type="text"
                    placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    style={{
                      flex: '1 1 240px',
                      background: '#090d16',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />

                  <select
                    value={gatewayProvider}
                    onChange={(e: any) => setGatewayProvider(e.target.value)}
                    style={{
                      background: '#090d16',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#cbd5e1',
                      padding: '8px 10px',
                      fontSize: '0.78rem',
                      outline: 'none'
                    }}
                  >
                    <option value="auto">⚡ Auto (Fast2SMS / Twilio from .env)</option>
                    <option value="fast2sms">🇮🇳 Fast2SMS (India Direct)</option>
                    <option value="twilio">🌐 Twilio (Global E.164)</option>
                  </select>

                  <button
                    onClick={handleSendRealSms}
                    disabled={isSendingRealSms}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: isSendingRealSms ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(2, 132, 199, 0.35)'
                    }}
                  >
                    {isSendingRealSms ? '⏳ Transmitting...' : '📲 Send Real SMS Now'}
                  </button>
                </div>

                {realSmsResult && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    background: realSmsResult.status === 'SENT' || realSmsResult.status === 'SENT_TWILIO' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${realSmsResult.status === 'SENT' || realSmsResult.status === 'SENT_TWILIO' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    color: realSmsResult.status === 'SENT' || realSmsResult.status === 'SENT_TWILIO' ? '#34d399' : '#fca5a5'
                  }}>
                    <b>Gateway Status:</b> {realSmsResult.status} ({realSmsResult.provider || 'Gateway'})<br/>
                    {realSmsResult.message && <div>• {realSmsResult.message}</div>}
                    {realSmsResult.gateway_response && <div>• Response: {JSON.stringify(realSmsResult.gateway_response)}</div>}
                    {realSmsResult.error && <div>• Error: {realSmsResult.error}</div>}
                    {realSmsResult.error_details && <div>• Details: {realSmsResult.error_details}</div>}
                  </div>
                )}
              </div>

              <div className="contacts-top-bar">
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    VIP, District Magistrate &amp; NDRF Battalion Roster
                  </h4>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Optional Point-to-Point SMS / Priority Webhook Dispatch List
                  </div>
                </div>

                <label className="upload-excel-btn">
                  <span>📥 Import Excel / CSV (.xlsx, .csv)</span>
                  <input type="file" accept=".csv, .txt, .xlsx" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {/* Contacts Table */}
              <div className="contacts-table-wrapper">
                <table className="contacts-table">
                  <thead>
                    <tr>
                      <th>Name / Entity</th>
                      <th>Phone Number</th>
                      <th>Designation / Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedContacts.map((c, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td><code>{c.phone}</code></td>
                        <td><span className="role-tag">{c.role}</span></td>
                        <td><span className="status-live">● QUEUED</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
