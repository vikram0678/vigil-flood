import React, { useState, useRef, useEffect } from 'react';
import { useFlood } from '../../context/FloodContext';
import './AapdaMitraBot.css';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  engine?: string;
  isEmergency?: boolean;
}

type LanguageMode = 'en' | 'hi' | 'bilingual';

export const AapdaMitraBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageMode>('en');
  
  const { 
    selectedVillageData, 
    simulation, 
    applyScenario, 
    toggleWaterSensor 
  } = useFlood();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract active dashboard context safely
  const activeVillage = selectedVillageData?.village?.name || 'Pandoh';
  const activeWard = selectedVillageData?.village?.ward || 'Ward 2';
  const activeRiskPct = selectedVillageData?.risk_analysis?.risk_percentage ?? 61;
  const activeRiskLevel = selectedVillageData?.risk_analysis?.risk_level || 'HIGH';
  const activeLeadTime = selectedVillageData?.lead_time?.window_display || '27 - 52 min';
  const activeRain = simulation?.rain ?? (selectedVillageData?.telemetry?.rain_1h || 18.5);
  const activeSoil = simulation?.soil ?? (selectedVillageData?.telemetry?.soil_moisture || 48.0);
  const activeWater = simulation?.water ?? (selectedVillageData?.telemetry?.water_level_m || 1.2);

  // Clean, concise greetings based on selected language
  const getInitialGreeting = (lang: LanguageMode) => {
    if (lang === 'hi') {
      return `नमस्ते! 🛡️\n\nमैं **आपदा मित्र AI** हूँ, **${activeVillage} (${activeWard})** के लिए आपका आपदा निर्णय सहायक।\n\nमुझसे बाढ़ जोखिम, सुरक्षित शरण स्थल, निकासी मार्ग या लाइव सेंसर डेटा के बारे में पूछें।`;
    } else if (lang === 'bilingual') {
      return `Hello & नमस्ते! 🛡️\n\nI'm **Aapda Mitra AI**, your live disaster assistant for **${activeVillage} (${activeWard})**.\n\nAsk me anything about flood risk, safe shelters, dry routes, or sensor telemetry.`;
    } else {
      return `Hello! 🛡️\n\nI'm **Aapda Mitra AI**, your live disaster decision assistant for **${activeVillage} (${activeWard})**.\n\nAsk me anything about emergency flood risk, safe shelters, evacuation routes, or live telemetry.`;
    }
  };

  // Initial greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: getInitialGreeting('en'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Listen for programmatic tour / quick demo triggers
  useEffect(() => {
    const handleTourQuery = (e: any) => {
      const q = e?.detail?.query;
      setIsOpen(true);
      if (q) {
        setTimeout(() => {
          handleSendMessage(q);
        }, 300);
      }
    };

    window.addEventListener('aapda-open-query', handleTourQuery);
    return () => window.removeEventListener('aapda-open-query', handleTourQuery);
  }, []);

  // Build the complete dashboard state snapshot to send to the backend
  const buildDashboardSnapshot = () => {
    return {
      village_name: activeVillage,
      ward: activeWard,
      elevation_m: selectedVillageData?.village?.elevation_m || 880,
      slope_deg: selectedVillageData?.village?.slope_deg || 32.5,
      population: selectedVillageData?.village?.population || 1450,
      vulnerable_households: selectedVillageData?.village?.vulnerable_households || 85,
      risk_percentage: activeRiskPct,
      risk_level: activeRiskLevel,
      actionable_window: activeLeadTime,
      telemetry: {
        rain_1h: activeRain,
        soil_moisture: activeSoil,
        water_level_m: activeWater,
        tilt_deg: selectedVillageData?.telemetry?.tilt_deg || 0.2
      },
      action_plan: selectedVillageData?.action_plan || {
        primary_shelter: { name: 'Govt Senior Secondary School (Upper Ridge)', elevation_m: 990 },
        recommended_route: { name: 'Route A (Upper Hill Road via SH-13)' },
        blocked_route: { name: 'Route B (Riverside Embankment Road)' }
      },
      sensor_health: selectedVillageData?.sensor_health || {
        water_sensor_usable: true,
        data_health_pct: 100
      }
    };
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    // Agentic Actions: Check if user commanded a simulation preset directly
    const lower = textToSend.toLowerCase();
    if (lower.includes('cloudburst') || lower.includes('emergency')) {
      applyScenario('CLOUDBURST_CRITICAL');
    } else if (lower.includes('heavy monsoon') || lower.includes('monsoon')) {
      applyScenario('HEAVY_MONSOON');
    } else if (lower.includes('normal baseline') || lower.includes('baseline')) {
      applyScenario('BASELINE_NORMAL');
    } else if (lower.includes('disconnect') && lower.includes('sensor')) {
      toggleWaterSensor();
    }

    try {
      const response = await fetch('/api/aapda-mitra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          dashboard_context: buildDashboardSnapshot(),
          history: messages.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          language: selectedLanguage
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.reply || 'Data processed successfully.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          engine: data.engine_used === 'openrouter_cloud' ? 'OpenRouter Cloud AI' : 'Deterministic Disaster Engine',
          isEmergency: data.is_emergency
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('Aapda Mitra query error:', err);
      // Fallback local response if fetch fails
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: selectedLanguage === 'hi' 
          ? `⚠️ **[ऑफ़लाइन आपातकालीन निर्देश — ${activeVillage}]**\n\nवर्तमान जोखिम: **${activeRiskPct}% (${activeRiskLevel})** | निकासी समय: **${activeLeadTime}**\n\n• प्राथमिक सुरक्षित शरण स्थल: **Govt Senior Secondary School (Upper Ridge)**\n• सुरक्षित सूखा मार्ग: **Route A (Upper Hill Road via SH-13)**\n• चेतावनी: नदी तट के सभी रास्तों से तुरंत दूर रहें।`
          : `⚠️ **[OFFLINE ADVISORY — ${activeVillage}]**\n\nCurrent Risk: **${activeRiskPct}% (${activeRiskLevel})** | Lead Time: **${activeLeadTime}**\n\n• Primary High-Ground Shelter: **Govt Senior Secondary School (Upper Ridge)**\n• Safe Dry Route: **Route A (Upper Hill Road via SH-13)**\n• Hazard Alert: Avoid all low-lying riverbank paths immediately.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'Local Emergency Fallback'
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: getInitialGreeting(selectedLanguage),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const changeLanguage = (newLang: LanguageMode) => {
    setSelectedLanguage(newLang);
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id.startsWith('welcome')) {
        return [{
          ...prev[0],
          text: getInitialGreeting(newLang)
        }];
      }
      return prev;
    });
  };

  // Helper to render simple markdown bold and bullet points
  const formatText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold replacer
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={pIdx} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4 }}>{part.slice(1, -1)}</code>;
        }
        return part;
      });

      return (
        <p key={idx} style={{ margin: line === '' ? '6px 0' : '2px 0' }}>
          {formattedParts}
        </p>
      );
    });
  };

  // Clean Prompt Suggestions (Right-aligned pill bubbles like Image 1)
  const getQuickSuggestions = () => {
    if (selectedLanguage === 'hi') {
      return [
        { id: 'risk', label: '🚨 वर्तमान बाढ़ जोखिम और स्थिति क्या है?', query: 'इस गांव के लिए तुरंत बाढ़ जोखिम और स्थिति रिपोर्ट बताएं।' },
        { id: 'shelter', label: '🏫 सुरक्षित शरण स्थल और खुला रास्ता कहाँ है?', query: 'सुरक्षित शरण स्थल कहाँ है और कौन सा सूखा रास्ता खुला है?' },
        { id: 'shap', label: '🧠 बाढ़ जोखिम के मुख्य कारण क्या हैं?', query: 'वर्तमान बाढ़ जोखिम के मुख्य कारण क्या हैं?' },
        { id: 'drill', label: '⚡ बादल फटना (Cloudburst) सिमुलेशन चलाएं?', query: 'Simulate cloudburst emergency right now!' }
      ];
    } else if (selectedLanguage === 'bilingual') {
      return [
        { id: 'risk', label: '🚨 Live SITREP & Flood Risk status?', query: 'Generate an immediate tactical SITREP in Hinglish for this village.' },
        { id: 'shelter', label: '🏫 Nearest Safe Shelter & open route?', query: 'Where is designated safe shelter and dry route / सुरक्षित रास्ता?' },
        { id: 'shap', label: '🧠 What factors are driving current risk?', query: 'Explain the factors driving current risk percentage in Hinglish.' },
        { id: 'drill', label: '⚡ Run Cloudburst Emergency Drill?', query: 'Simulate cloudburst emergency right now!' }
      ];
    } else {
      return [
        { id: 'risk', label: '🚨 What is the current flood risk?', query: 'Generate an immediate tactical SITREP for the active village.' },
        { id: 'shelter', label: '🏫 Where is the nearest safe shelter?', query: 'Where is the designated safe shelter and which route is clear?' },
        { id: 'shap', label: '🧠 What is causing the flood risk?', query: 'Explain what factors are driving the current risk percentage.' },
        { id: 'drill', label: '⚡ Run cloudburst emergency drill?', query: 'Simulate cloudburst emergency right now!' }
      ];
    }
  };

  const getInputPlaceholder = () => {
    if (selectedLanguage === 'hi') {
      return `${activeVillage} के लिए हिंदी में पूछें...`;
    } else if (selectedLanguage === 'bilingual') {
      return `Ask Aapda Mitra about ${activeVillage} (English / हिंदी)...`;
    } else {
      return `Ask Aapda Mitra in English about ${activeVillage}...`;
    }
  };

  return (
    <>
      {/* Animated Floating Circular Launcher Button */}
      {!isOpen && (
        <div className="aapda-launcher-wrapper">
          <div className="aapda-launcher-tooltip">
            <span className="aapda-tooltip-title">Ask Aapda Mitra AI 🛡️</span>
            <span className="aapda-tooltip-sub">आपदा मित्र • 24/7 AI Sync</span>
          </div>
          <button 
            className="aapda-mitra-circle-launcher"
            onClick={() => setIsOpen(true)}
            title="Open Aapda Mitra AI Disaster Decision Assistant"
            aria-label="Open Aapda Mitra AI"
          >
            <div className="aapda-radar-wave" />
            <div className="aapda-radar-wave wave-2" />
            <div className="aapda-launcher-dot" />
            <div className="aapda-circle-icon">🛡️</div>
          </button>
        </div>
      )}

      {/* Main Glassmorphic Chat Window */}
      {isOpen && (
        <aside className="aapda-mitra-window" aria-label="Aapda Mitra AI Assistant">
          {/* Header */}
          <div className="aapda-chat-header">
            <div className="aapda-header-left">
              <div className="aapda-avatar-icon">🛡️</div>
              <div>
                <div className="aapda-header-title">Aapda Mitra AI (आपदा मित्र)</div>
                <div className="aapda-header-sub">Disaster Decision Assistant • VIGIL-FLOOD</div>
              </div>
            </div>
            <div className="aapda-header-actions">
              <button 
                className="aapda-btn-icon" 
                onClick={resetChat}
                title="Reset conversation"
              >
                🔄
              </button>
              <button 
                className="aapda-btn-icon" 
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Language Selection Filter Bar */}
          <div className="aapda-language-filter-bar">
            <span className="aapda-lang-label">🌐 Output Language:</span>
            <div className="aapda-lang-pills">
              <button 
                type="button"
                className={`aapda-lang-pill ${selectedLanguage === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
                title="Pure English responses"
              >
                🇬🇧 English
              </button>
              <button 
                type="button"
                className={`aapda-lang-pill ${selectedLanguage === 'hi' ? 'active' : ''}`}
                onClick={() => changeLanguage('hi')}
                title="शुद्ध हिन्दी में उत्तर"
              >
                🇮🇳 हिंदी
              </button>
              <button 
                type="button"
                className={`aapda-lang-pill ${selectedLanguage === 'bilingual' ? 'active' : ''}`}
                onClick={() => changeLanguage('bilingual')}
                title="Hindi + English combined"
              >
                🌐 Hinglish
              </button>
            </div>
          </div>

          {/* Live Synchronized Village State Banner */}
          <div className="aapda-synced-banner">
            <div className="aapda-synced-left">
              <span>📍 {activeVillage}</span>
              <span style={{ 
                color: activeRiskPct >= 76 ? '#ef4444' : activeRiskPct >= 51 ? '#f97316' : '#10b981',
                fontWeight: 700
              }}>
                • {activeRiskPct}% {activeRiskLevel}
              </span>
            </div>
            <div className="aapda-synced-right">
              🌧️ {activeRain} mm/h | ⏱️ {activeLeadTime}
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="aapda-messages-area">
            {messages.map(m => (
              <div key={m.id} className={`aapda-msg ${m.sender}`}>
                <div className="aapda-msg-bubble">
                  {formatText(m.text)}
                </div>
                <div className="aapda-msg-time">
                  {m.time} {m.engine && `• ${m.engine}`}
                </div>
              </div>
            ))}

            {/* Clean Right-Aligned Suggestion Pills (Image 1 Style) */}
            {messages.length <= 1 && (
              <div className="aapda-suggestions-stack">
                {getQuickSuggestions().map(s => (
                  <button 
                    key={s.id}
                    className="aapda-suggestion-pill"
                    onClick={() => handleSendMessage(s.query)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="aapda-msg assistant">
                <div className="aapda-typing">
                  <div className="aapda-typing-dot" />
                  <div className="aapda-typing-dot" />
                  <div className="aapda-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form 
            className="aapda-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input 
              type="text"
              className="aapda-input-field"
              placeholder={getInputPlaceholder()}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="aapda-btn-send"
              disabled={isLoading || !inputMessage.trim()}
              title="Send question"
            >
              ➤
            </button>
          </form>
        </aside>
      )}
    </>
  );
};

export default AapdaMitraBot;
