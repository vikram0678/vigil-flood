import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFlood } from '../../context/FloodContext';
import './ProductTourModal.css';

interface LocalizedStepContent {
  title: string;
  subtitle: string;
  content: string;
  tip: string;
  actionLabel?: string;
  actionQuery?: string;
}

interface TourStep {
  id: string;
  targetSelector: string;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  isCircle?: boolean;
  en: LocalizedStepContent;
  hi: LocalizedStepContent;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'step-welcome',
    targetSelector: '',
    preferredPosition: 'top',
    en: {
      title: '🛡️ Welcome to VIGIL-FLOOD',
      subtitle: 'Hyper-Local Himalayan Flash Flood Early Warning System',
      content: 'VIGIL-FLOOD is an AI-powered tactical disaster decision support system built for high-risk Himalayan river basins (Beas Basin, Mandi). It combines real-time IoT sensors, zero-downtime physics fallbacks, TreeSHAP explainable AI, and 24/7 bilingual decision support to save lives before flash floods strike.',
      tip: '💡 Tactical Workflow: 1️⃣ Sensor Streams ➔ 2️⃣ AI Threat Prediction ➔ 3️⃣ TreeSHAP Drivers ➔ 4️⃣ Evacuation Routing ➔ 5️⃣ Aapda Mitra AI Copilot.',
      actionLabel: 'Start Dashboard Tour ✨'
    },
    hi: {
      title: '🛡️ VIGIL-FLOOD (विजिल-बाढ़) में आपका स्वागत है',
      subtitle: 'हिमालयी क्षेत्रों हेतु अति-स्थानीय आकस्मिक बाढ़ पूर्व चेतावनी प्रणाली',
      content: 'VIGIL-FLOOD एक AI-संचालित सामरिक आपदा प्रबंधन प्रणाली है जो उच्च-जोखिम वाले हिमालयी नदी बेसिनों (व्यास बेसिन, मंडी) के लिए तैयार की गई है। यह वास्तविक समय के IoT सेंसर, फिजिक्स फॉलबैक, व्याख्यात्मक AI और निकासी खुफिया तंत्र के साथ जान-माल की रक्षा करती है।',
      tip: '💡 सामरिक कार्यप्रणाली: 1️⃣ लाइव सेंसर ➔ 2️⃣ AI जोखिम मॉडल ➔ 3️⃣ मुख्य कारक विश्लेषण ➔ 4️⃣ सुरक्षित मार्ग व आश्रय ➔ 5️⃣ आपदा मित्र AI।',
      actionLabel: 'डैशबोर्ड टूर शुरू करें ✨'
    }
  },
  {
    id: 'step-villages',
    targetSelector: '#tour-villages-panel, .pilot-catchment-panel',
    preferredPosition: 'right',
    en: {
      title: '📍 Monitored Villages & Catchments',
      subtitle: 'Active Village Risk & Ward Status',
      content: 'Select high-risk Himalayan pilot villages (Pandoh, Aut, Larji). Instantly inspect real-time flood hazard percentages, alert badges, and actionable evacuation lead times.',
      tip: '💡 Tip: Clicking any village synchronizes the live telemetry, AI predictions, and GIS maps across the entire dashboard.'
    },
    hi: {
      title: '📍 निगरानी वाले गांव और जल-ग्रहण क्षेत्र',
      subtitle: 'सक्रिय ग्राम बाढ़ जोखिम व वार्ड स्थिति',
      content: 'हिमालयी पायलट गांवों (पंडोह, औट, लारजी) का चयन करें। वास्तविक समय में बाढ़ जोखिम प्रतिशत, चेतावनी स्तर और सुरक्षित निकासी समय की तुरंत जांच करें।',
      tip: '💡 सुझाव: किसी भी गांव पर क्लिक करने से पूरा डैशबोर्ड (सेंसर डेटा, AI पूर्वानुमान और मानचित्र) तुरंत सिंक्रनाइज़ हो जाता है।'
    }
  },
  {
    id: 'step-map',
    targetSelector: '#tour-gis-map, .map-wrapper',
    preferredPosition: 'right',
    en: {
      title: '🗺️ 2D & 3D Tactical GIS Map',
      subtitle: 'Satellite Inundation & Terrain Contours',
      content: 'Explore live flood inundation contours, 3D mountain elevation terrain mesh, downstream river flow vectors, and blocked road alerts.',
      tip: '💡 Tip: Use the compass to reset North, the 1000 km globe button for regional overview, or slide open Map Controls for layers.'
    },
    hi: {
      title: '🗺️ 2D और 3D सामरिक जीआईएस मानचित्र',
      subtitle: 'सैटेलाइट जलभराव व पर्वतीय स्थलाकृति',
      content: 'लाइव बाढ़ जलभराव क्षेत्र, 3D पर्वतीय ऊंचाई मेश, नदी बहाव दिशा और जलमग्न सड़क चेतावनियों का वास्तविक समय में निरीक्षण करें।',
      tip: '💡 सुझाव: उत्तर दिशा रीसेट करने के लिए कंपास का उपयोग करें या विस्तृत परतों के लिए मैप कंट्रोल्स खोलें।'
    }
  },
  {
    id: 'step-sandbox',
    targetSelector: '#tour-sandbox-card, .sandbox-card',
    preferredPosition: 'top',
    en: {
      title: '⚡ What-If Simulation Sandbox',
      subtitle: 'Crisis Scenario Testing & Hazard Sliders',
      content: 'Simulate extreme weather events (Cloudburst, Heavy Monsoon, Baseline) or interactively adjust rainfall, soil moisture, and river water stage sliders to evaluate flash flood impacts.',
      tip: '💡 Tip: Watch how the AI hazard percentage and evacuation window update instantly as you move the sliders!'
    },
    hi: {
      title: '⚡ "व्हाट-इफ" सिमुलेशन सैंडबॉक्स',
      subtitle: 'आपदा परिदृश्य परीक्षण व हाइपर-स्लाइडर्स',
      content: 'अत्यधिक मौसमी घटनाओं (बादल फटना, भारी मानसून) का अनुकरण करें या वर्षा, मिट्टी की नमी व नदी जलस्तर के स्लाइडर्स को बदलकर बाढ़ के प्रभाव का तुरंत परीक्षण करें।',
      tip: '💡 सुझाव: स्लाइडर हिलाते ही AI जोखिम प्रतिशत और निकासी समय वास्तविक समय में बदलता है!'
    }
  },
  {
    id: 'step-telemetry',
    targetSelector: '#tour-telemetry-panel, .deep-dive-panel',
    preferredPosition: 'left',
    en: {
      title: '📡 Real-Time IoT Telemetry & Health',
      subtitle: 'Multi-Sensor Streams & Hardware Watchdog',
      content: 'Live sensor streams from river water stage gauges, rain gauges, and soil moisture probes. If a physical sensor disconnects, the system automatically engages the fallback hydrological physics model with zero downtime.',
      tip: '💡 Tip: Live data refreshes continuously via WebSockets with sub-second latency.'
    },
    hi: {
      title: '📡 लाइव IoT टेलीमेट्री और सेंसर निगरानी',
      subtitle: 'मल्टी-सेंसर स्ट्रीम व ऑटोमैटिक फॉलबैक',
      content: 'नदी जलस्तर, वर्षामापी और मिट्टी की नमी सेंसरों से सीधा डेटा प्रवाह। यदि कोई सेंसर खराब होता है, तो सिस्टम बिना किसी रुकावट के तुरंत फॉलबैक हाइड्रो मॉडल सक्रिय कर देता है।',
      tip: '💡 सुझाव: लाइव डेटा वेबसॉकेट के माध्यम से मिलीसेकंड में अपडेट होता है।'
    }
  },
  {
    id: 'step-xai-shelter',
    targetSelector: '#tour-telemetry-panel, .deep-dive-panel',
    preferredPosition: 'left',
    en: {
      title: '🧠 TreeSHAP Risk Drivers & Action Plan',
      subtitle: 'Explainable AI & High-Ground Shelters',
      content: 'Transparent AI explainability reveals which environmental factors (steep slopes, saturated soil) are driving flood danger, alongside designated high-ground shelters and dry evacuation routes.',
      tip: '💡 Tip: A* elevation-weighted routing ensures evacuees are guided away from low-lying submerged roads.'
    },
    hi: {
      title: '🧠 TreeSHAP व्याख्यात्मक AI व राहत योजना',
      subtitle: 'जोखिम कारक विश्लेषण व सुरक्षित आश्रय स्थल',
      content: 'पारदर्शी AI विश्लेषण बताता है कि कौन से पर्यावरणीय कारक (तीव्र ढलान, संतृप्त मिट्टी) बाढ़ का मुख्य कारण हैं, साथ ही निकटतम सुरक्षित आश्रय स्थल और सुरक्षित मार्ग दिखाता है।',
      tip: '💡 सुझाव: A* एलिवेशन रूटिंग नागरिकों को जलमग्न रास्तों से दूर सुरक्षित ऊंचे स्थानों पर पहुंचाती है।'
    }
  },
  {
    id: 'step-aapda-mitra',
    targetSelector: '#tour-aapda-btn, .aapda-mitra-circle-launcher',
    preferredPosition: 'top',
    isCircle: true,
    en: {
      title: '🛡️ Aapda Mitra AI Decision Assistant',
      subtitle: '24/7 Multi-Language Disaster Copilot',
      content: 'Your tactical disaster decision assistant. Ask for instant situation reports (SITREPs), nearest shelters, or run emergency drills in English, हिंदी, or Hinglish.',
      tip: '💡 Tip: Click below to launch an instant AI consultation demo!',
      actionLabel: 'Try Sample Question 💬 ✨',
      actionQuery: 'Where is the designated safe shelter and open route for Pandoh?'
    },
    hi: {
      title: '🛡️ आपदा मित्र AI निर्णय सहायक',
      subtitle: '24/7 बहुभाषी आपदा प्रबंधन सहायक',
      content: 'आपका सामरिक आपदा निर्णय सहायक। त्वरित स्थिति रिपोर्ट (SITREP), निकटतम सुरक्षित आश्रय स्थल या आपातकालीन सलाह हिंदी, English या Hinglish में प्राप्त करें।',
      tip: '💡 सुझाव: तत्काल AI प्रदर्शन देखने के लिए नीचे दिए गए बटन पर क्लिक करें!',
      actionLabel: 'नमूना प्रश्न पूछें 💬 ✨',
      actionQuery: 'पंडोह के लिए निकटतम सुरक्षित आश्रय स्थल और खुला निकासी मार्ग कौन सा है?'
    }
  }
];

export const ProductTourModal: React.FC = () => {
  const { isTourOpen, tourStep, closeTour, nextTourStep, prevTourStep, setTourStep } = useFlood();
  const [tourLang, setTourLang] = useState<'en' | 'hi'>('en');
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const currentStepData = TOUR_STEPS[tourStep] || TOUR_STEPS[0];
  const activeContent = currentStepData[tourLang] || currentStepData.en;
  const isFirstStep = tourStep === 0;
  const isLastStep = tourStep === TOUR_STEPS.length - 1;

  // Measure and auto-scroll target element
  const updateTargetRect = useCallback(() => {
    if (!isTourOpen) return;
    const current = TOUR_STEPS[tourStep];
    if (!current) return;
    if (!current.targetSelector || !current.targetSelector.trim()) {
      setTargetRect(null);
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      return;
    }

    let el: Element | null = null;
    const selectors = current.targetSelector.split(',').map(s => s.trim()).filter(Boolean);
    for (const sel of selectors) {
      try {
        el = document.querySelector(sel);
        if (el) break;
      } catch (e) {
        // Safe guard against any malformed selector
      }
    }

    if (el) {
      // Smooth auto-scroll into center view if needed
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } catch (e) {
        // Safe fallback
      }

      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }

    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, [isTourOpen, tourStep]);

  useEffect(() => {
    updateTargetRect();
    const timer = setTimeout(() => {
      updateTargetRect();
    }, 80);

    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTour();
      } else if (e.key === 'ArrowRight') {
        if (!isLastStep) nextTourStep();
      } else if (e.key === 'ArrowLeft') {
        if (!isFirstStep) prevTourStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourOpen, isFirstStep, isLastStep, nextTourStep, prevTourStep, closeTour]);

  if (!isTourOpen) return null;

  // Calculate card position, dynamic arrow direction and offset
  const calculatePositionAndArrow = () => {
    const { width: winW, height: winH } = windowSize;
    const measuredCardH = modalRef.current?.offsetHeight || 340;
    const cardW = tourStep === 0 ? Math.min(460, winW - 32) : Math.min(410, winW - 32);
    const cardH = measuredCardH;
    const margin = 20;

    if (!targetRect || targetRect.width === 0 || targetRect.height === 0 || tourStep === 0) {
      const centerX = Math.max(16, (winW - cardW) / 2);
      const centerY = Math.max(16, (winH - cardH) / 2);
      return {
        cardStyle: {
          top: `${centerY}px`,
          left: `${centerX}px`,
          transform: 'none'
        },
        arrowDirection: 'none' as const,
        arrowCustomStyle: {}
      };
    }

    let top = targetRect.top;
    let left = targetRect.left;
    let arrowDir: 'left' | 'right' | 'top' | 'bottom' | 'none' = 'left';

    const pref = currentStepData.preferredPosition;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    if (currentStepData.isCircle) {
      // Circle target (Aapda Mitra floating button) - leave clean breathing gap above icon
      arrowDir = 'bottom';
      const circleGap = 42; // Generous gap so shield icon and radar pulse are 100% visible
      top = Math.max(20, targetRect.top - cardH - circleGap);
      left = Math.max(20, Math.min(winW - cardW - 20, targetRect.right - cardW + 20));
    } else if (pref === 'right' && targetRect.right + cardW + margin <= winW) {
      arrowDir = 'left';
      left = targetRect.right + margin;
      top = Math.max(20, Math.min(winH - cardH - 20, targetRect.top + Math.min(60, (targetRect.height - cardH) / 2)));
    } else if (pref === 'left' && targetRect.left - cardW - margin >= 0) {
      arrowDir = 'right';
      left = targetRect.left - cardW - margin;
      top = Math.max(20, Math.min(winH - cardH - 20, targetRect.top + (tourStep === 4 ? 120 : 30)));
    } else if (pref === 'top' && targetRect.top - cardH - margin >= 0) {
      arrowDir = 'bottom';
      top = targetRect.top - cardH - margin;
      left = Math.max(20, Math.min(winW - cardW - 20, targetRect.left + (targetRect.width - cardW) / 2));
    } else if (pref === 'bottom' && targetRect.bottom + cardH + margin <= winH) {
      arrowDir = 'top';
      top = targetRect.bottom + margin;
      left = Math.max(20, Math.min(winW - cardW - 20, targetRect.left + (targetRect.width - cardW) / 2));
    } else {
      // Fallback
      if (targetRect.left - cardW - margin >= 0) {
        arrowDir = 'right';
        left = targetRect.left - cardW - margin;
        top = Math.max(20, Math.min(winH - cardH - 20, targetRect.top + 30));
      } else if (targetRect.right + cardW + margin <= winW) {
        arrowDir = 'left';
        left = targetRect.right + margin;
        top = Math.max(20, Math.min(winH - cardH - 20, targetRect.top + 30));
      } else {
        arrowDir = 'none';
        top = Math.max(20, (winH - cardH) / 2);
        left = Math.max(20, (winW - cardW) / 2);
      }
    }

    // Precise Arrow Positioning Offset targeting the center of the component
    const arrowCustomStyle: React.CSSProperties = {};
    if (arrowDir === 'bottom' || arrowDir === 'top') {
      const offsetX = Math.max(32, Math.min(cardW - 32, targetCenterX - left));
      arrowCustomStyle.left = `${offsetX}px`;
      arrowCustomStyle.transform = 'translateX(-50%)';
    } else if (arrowDir === 'left' || arrowDir === 'right') {
      const offsetY = Math.max(32, Math.min(cardH - 32, targetCenterY - top));
      arrowCustomStyle.top = `${offsetY}px`;
      arrowCustomStyle.transform = 'translateY(-50%)';
    }

    return {
      cardStyle: {
        top: `${top}px`,
        left: `${left}px`,
        transform: 'none'
      },
      arrowDirection: arrowDir,
      arrowCustomStyle
    };
  };

  const { cardStyle, arrowDirection, arrowCustomStyle } = calculatePositionAndArrow();

  // Handle interactive action
  const handleInteractiveAction = () => {
    if (tourStep === 0) {
      nextTourStep();
    } else {
      closeTour();
      if (activeContent.actionQuery) {
        window.dispatchEvent(new CustomEvent('aapda-open-query', {
          detail: { query: activeContent.actionQuery }
        }));
      }
    }
  };

  // Spotlight Cutout Geometry
  const isCircle = Boolean(currentStepData.isCircle);
  const cutoutPadding = isCircle ? 6 : 8;
  const cutoutX = targetRect ? Math.max(0, targetRect.left - cutoutPadding) : 0;
  const cutoutY = targetRect ? Math.max(0, targetRect.top - cutoutPadding) : 0;
  const cutoutW = targetRect ? targetRect.width + cutoutPadding * 2 : 0;
  const cutoutH = targetRect ? targetRect.height + cutoutPadding * 2 : 0;
  const rx = isCircle ? cutoutW / 2 : 14;
  const ry = isCircle ? cutoutH / 2 : 14;

  return (
    <div className="product-tour-overlay" aria-label="Interactive Product Tour" role="dialog">
      {/* 🌟 1. True Illuminated SVG Mask (Hole-Punching Cutout) */}
      <svg className="tour-svg-mask-layer" width="100%" height="100%">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers entire screen (becomes dimmed backdrop) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black punches 100% transparent hole over the target (100% bright & clear) */}
            {targetRect && (
              <rect
                x={cutoutX}
                y={cutoutY}
                width={cutoutW}
                height={cutoutH}
                rx={rx}
                ry={ry}
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Darkened backdrop rendered with the cutout mask */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(5, 10, 20, 0.78)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* 🌟 2. Glowing Animated Frame around the Illuminated Component */}
      {targetRect && (
        <div
          className={`tour-illuminated-frame ${isCircle ? 'circle-frame' : ''}`}
          style={{
            top: cutoutY,
            left: cutoutX,
            width: cutoutW,
            height: cutoutH,
            borderRadius: isCircle ? '50%' : '14px'
          }}
        >
          {!isCircle && (
            <>
              <div className="frame-corner top-left" />
              <div className="frame-corner top-right" />
              <div className="frame-corner bottom-left" />
              <div className="frame-corner bottom-right" />
            </>
          )}
          <div className={`frame-pulse-halo ${isCircle ? 'circle-halo' : ''}`} />
        </div>
      )}

      {/* 🌟 3. Floating Guided Tour Card with Directional Arrow Beak */}
      <div 
        ref={modalRef}
        className={`tour-card arrow-${arrowDirection} ${tourStep === 0 ? 'welcome-card' : ''}`}
        style={cardStyle}
      >
        {/* Directional Arrow Pointer with Exact Component Alignment */}
        {arrowDirection !== 'none' && (
          <div className={`tour-arrow-beak ${arrowDirection}`} style={arrowCustomStyle} />
        )}

        {/* Card Header with Step Badge & Language Toggle */}
        <div className="tour-card-header">
          <div className="tour-step-badge">
            <span className="step-glow-dot" />
            <span>
              {tourLang === 'hi'
                ? `चरण ${tourStep + 1} / ${TOUR_STEPS.length}`
                : `Step ${tourStep + 1} of ${TOUR_STEPS.length}`}
            </span>
          </div>

          <div className="tour-header-right">
            {/* Multi-Language Toggle (EN / हिंदी) */}
            <div className="tour-lang-toggle" role="group" aria-label="Tour Language">
              <button
                type="button"
                className={`tour-lang-btn ${tourLang === 'en' ? 'active' : ''}`}
                onClick={() => setTourLang('en')}
                title="Switch to English"
              >
                🇬🇧 EN
              </button>
              <button
                type="button"
                className={`tour-lang-btn ${tourLang === 'hi' ? 'active' : ''}`}
                onClick={() => setTourLang('hi')}
                title="हिंदी में देखें"
              >
                🇮🇳 हिंदी
              </button>
            </div>

            <button 
              className="tour-close-btn" 
              onClick={closeTour}
              title={tourLang === 'hi' ? 'टूर बंद करें (Esc)' : 'Close Tour (Esc)'}
              aria-label="Close Tour"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="tour-card-body">
          <h3 className="tour-card-title">{activeContent.title}</h3>
          <div className="tour-card-subtitle">{activeContent.subtitle}</div>

          {/* Welcome Step Pillar Badges */}
          {tourStep === 0 && (
            <div className="tour-welcome-pillars">
              <span className="welcome-pillar-tag">📡 Live IoT Sensors</span>
              <span className="welcome-pillar-tag">🧠 TreeSHAP ML</span>
              <span className="welcome-pillar-tag">🗺️ 3D Mountain GIS</span>
              <span className="welcome-pillar-tag">🛡️ Aapda Mitra AI</span>
            </div>
          )}

          <p className="tour-card-content">{activeContent.content}</p>
          <div className="tour-card-tip">{activeContent.tip}</div>

          {/* Interactive Action Button */}
          {activeContent.actionLabel && (
            <button 
              className="tour-interactive-demo-btn"
              onClick={handleInteractiveAction}
              title={tourStep === 0 ? 'Start the step-by-step dashboard tour' : 'Launch instant demonstration query in Aapda Mitra AI'}
            >
              <span>{activeContent.actionLabel}</span>
            </button>
          )}
        </div>

        {/* Card Footer: Step Dots & Navigation Buttons */}
        <div className="tour-card-footer">
          <div className="tour-dots-indicator">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                className={`tour-dot ${idx === tourStep ? 'active' : ''} ${idx < tourStep ? 'completed' : ''}`}
                onClick={() => setTourStep(idx)}
                title={`Jump to step ${idx + 1}`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="tour-actions-group">
            <button 
              className="tour-btn tour-skip-btn" 
              onClick={closeTour}
            >
              {tourLang === 'hi' ? 'छोड़ें' : 'Skip'}
            </button>

            {!isFirstStep && (
              <button 
                className="tour-btn tour-back-btn" 
                onClick={prevTourStep}
              >
                {tourLang === 'hi' ? '← पीछे' : '← Back'}
              </button>
            )}

            <button 
              className="tour-btn tour-next-btn" 
              onClick={() => {
                if (isLastStep) {
                  closeTour();
                } else {
                  nextTourStep();
                }
              }}
            >
              {isLastStep 
                ? (tourLang === 'hi' ? 'समाप्त करें 🚀' : 'Finish Tour 🚀') 
                : (tourLang === 'hi' ? 'आगे →' : 'Next →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTourModal;

