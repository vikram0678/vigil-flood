import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFlood } from '../../context/FloodContext';
import './ProductTourModal.css';

interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  subtitle: string;
  content: string;
  tip: string;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  actionLabel?: string;
  actionQuery?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'step-villages',
    targetSelector: '.col-villages',
    title: '📍 Monitored Villages & Catchments',
    subtitle: 'Active Village Risk & Ward Status',
    content: 'Select high-risk Himalayan pilot villages (Pandoh, Aut, Larji). Instantly inspect real-time flood hazard percentages, alert badges, and actionable evacuation lead times.',
    tip: '💡 Tip: Clicking any village synchronizes the live telemetry, AI predictions, and GIS maps across the entire dashboard.',
    preferredPosition: 'right'
  },
  {
    id: 'step-map',
    targetSelector: '.map-wrapper',
    title: '🗺️ 2D & 3D Tactical GIS Map',
    subtitle: 'Satellite Inundation & Terrain Contours',
    content: 'Explore live flood inundation contours, 3D mountain elevation terrain mesh, downstream river flow vectors, and blocked road alerts.',
    tip: '💡 Tip: Use the compass to reset North, the 1000 km globe button for regional overview, or slide open Map Controls for layers.',
    preferredPosition: 'bottom'
  },
  {
    id: 'step-sandbox',
    targetSelector: '.what-if-sandbox',
    title: '⚡ What-If Simulation Sandbox',
    subtitle: 'Crisis Scenario Testing & Hazard Sliders',
    content: 'Simulate extreme weather events (Cloudburst, Heavy Monsoon, Baseline) or interactively adjust rainfall, soil moisture, and river water stage sliders to evaluate flash flood impacts.',
    tip: '💡 Tip: Watch how the AI hazard percentage and evacuation window update instantly as you move the sliders!',
    preferredPosition: 'top'
  },
  {
    id: 'step-telemetry',
    targetSelector: '.col-telemetry',
    title: '📡 Real-Time IoT Telemetry & Health',
    subtitle: 'Multi-Sensor Streams & Hardware Watchdog',
    content: 'Live sensor streams from river water stage gauges, rain gauges, and soil moisture probes. If a physical sensor disconnects, the system automatically engages the fallback hydrological physics model with zero downtime.',
    tip: '💡 Tip: Live data refreshes continuously via WebSockets with sub-second latency.',
    preferredPosition: 'left'
  },
  {
    id: 'step-xai-shelter',
    targetSelector: '.deep-dive-panel',
    title: '🧠 TreeSHAP Risk Drivers & Action Plan',
    subtitle: 'Explainable AI & High-Ground Shelters',
    content: 'Transparent AI explainability reveals which environmental factors (steep slopes, saturated soil) are driving flood danger, alongside designated high-ground shelters and dry evacuation routes.',
    tip: '💡 Tip: A* elevation-weighted routing ensures evacuees are guided away from low-lying submerged roads.',
    preferredPosition: 'left'
  },
  {
    id: 'step-aapda-mitra',
    targetSelector: '.aapda-launcher-wrapper',
    title: '🛡️ Aapda Mitra AI Decision Assistant',
    subtitle: '24/7 Multi-Language Disaster Copilot',
    content: 'Your tactical disaster decision assistant. Ask for instant situation reports (SITREPs), nearest shelters, or run emergency drills in English, हिंदी, or Hinglish.',
    tip: '💡 Tip: Click below to launch an instant AI consultation demo!',
    preferredPosition: 'top',
    actionLabel: 'Try Sample Question 💬',
    actionQuery: 'Where is the designated safe shelter and open route for Pandoh?'
  }
];

export const ProductTourModal: React.FC = () => {
  const { isTourOpen, tourStep, closeTour, nextTourStep, prevTourStep, setTourStep } = useFlood();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const currentStepData = TOUR_STEPS[tourStep] || TOUR_STEPS[0];
  const isFirstStep = tourStep === 0;
  const isLastStep = tourStep === TOUR_STEPS.length - 1;

  // Measure and auto-scroll target element
  const updateTargetRect = useCallback(() => {
    if (!isTourOpen) return;
    const current = TOUR_STEPS[tourStep];
    if (!current) return;

    let el = document.querySelector(current.targetSelector);
    if (!el && current.targetSelector === '.col-villages') {
      el = document.querySelector('.pilot-catchment-panel');
    } else if (!el && current.targetSelector === '.what-if-sandbox') {
      el = document.querySelector('.sandbox-container') || document.querySelector('.simulation-sandbox');
    } else if (!el && current.targetSelector === '.aapda-launcher-wrapper') {
      el = document.querySelector('.aapda-mitra-circle-launcher') || document.querySelector('.aapda-launcher-wrapper');
    }

    if (el) {
      // Smooth auto-scroll into center view if needed
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } catch (e) {
        // Safe fallback
      }

      // Allow a short tick for smooth scroll positioning to settle before measuring rect
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
    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
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

  // Calculate card position & directional arrow
  const calculatePositionAndArrow = () => {
    if (!targetRect) {
      return {
        cardStyle: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        arrowDirection: 'none' as const,
        arrowStyle: {}
      };
    }

    const { width: winW, height: winH } = windowSize;
    const cardW = Math.min(410, winW - 32);
    const cardH = 290;
    const margin = 18;

    let top = targetRect.top;
    let left = targetRect.left;
    let arrowDir: 'left' | 'right' | 'top' | 'bottom' | 'none' = 'left';

    const pref = currentStepData.preferredPosition;

    if (pref === 'right' && targetRect.right + cardW + margin < winW) {
      arrowDir = 'left';
      left = targetRect.right + margin;
      top = Math.max(16, Math.min(winH - cardH - 16, targetRect.top + (targetRect.height - cardH) / 2));
    } else if (pref === 'left' && targetRect.left - cardW - margin > 0) {
      arrowDir = 'right';
      left = targetRect.left - cardW - margin;
      top = Math.max(16, Math.min(winH - cardH - 16, targetRect.top + (targetRect.height - cardH) / 2));
    } else if (pref === 'top' && targetRect.top - cardH - margin > 0) {
      arrowDir = 'bottom';
      top = targetRect.top - cardH - margin;
      left = Math.max(16, Math.min(winW - cardW - 16, targetRect.left + (targetRect.width - cardW) / 2));
    } else if (pref === 'bottom' && targetRect.bottom + cardH + margin < winH) {
      arrowDir = 'top';
      top = targetRect.bottom + margin;
      left = Math.max(16, Math.min(winW - cardW - 16, targetRect.left + (targetRect.width - cardW) / 2));
    } else {
      // Automatic best fit
      if (targetRect.right + cardW + margin < winW) {
        arrowDir = 'left';
        left = targetRect.right + margin;
        top = Math.max(16, Math.min(winH - cardH - 16, targetRect.top));
      } else if (targetRect.left - cardW - margin > 0) {
        arrowDir = 'right';
        left = targetRect.left - cardW - margin;
        top = Math.max(16, Math.min(winH - cardH - 16, targetRect.top));
      } else {
        arrowDir = 'none';
        top = Math.max(16, (winH - cardH) / 2);
        left = Math.max(16, (winW - cardW) / 2);
      }
    }

    return {
      cardStyle: {
        top: `${top}px`,
        left: `${left}px`,
        transform: 'none'
      },
      arrowDirection: arrowDir
    };
  };

  const { cardStyle, arrowDirection } = calculatePositionAndArrow();

  // Handle Step 6 interactive action
  const handleInteractiveAction = () => {
    closeTour();
    if (currentStepData.actionQuery) {
      window.dispatchEvent(new CustomEvent('aapda-open-query', {
        detail: { query: currentStepData.actionQuery }
      }));
    }
  };

  // Spotlight Cutout Geometry
  const cutoutPadding = 8;
  const cutoutX = targetRect ? Math.max(0, targetRect.left - cutoutPadding) : 0;
  const cutoutY = targetRect ? Math.max(0, targetRect.top - cutoutPadding) : 0;
  const cutoutW = targetRect ? targetRect.width + cutoutPadding * 2 : 0;
  const cutoutH = targetRect ? targetRect.height + cutoutPadding * 2 : 0;

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
                rx="14"
                ry="14"
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
          className="tour-illuminated-frame"
          style={{
            top: cutoutY,
            left: cutoutX,
            width: cutoutW,
            height: cutoutH
          }}
        >
          <div className="frame-corner top-left" />
          <div className="frame-corner top-right" />
          <div className="frame-corner bottom-left" />
          <div className="frame-corner bottom-right" />
          <div className="frame-pulse-halo" />
        </div>
      )}

      {/* 🌟 3. Floating Guided Tour Card with Directional Arrow Beak */}
      <div 
        ref={modalRef}
        className={`tour-card arrow-${arrowDirection}`}
        style={cardStyle}
      >
        {/* Directional Arrow Pointer */}
        {arrowDirection !== 'none' && (
          <div className={`tour-arrow-beak ${arrowDirection}`} />
        )}

        {/* Card Header */}
        <div className="tour-card-header">
          <div className="tour-step-badge">
            <span className="step-glow-dot" />
            <span>Step {tourStep + 1} of {TOUR_STEPS.length}</span>
          </div>
          <button 
            className="tour-close-btn" 
            onClick={closeTour}
            title="Close Tour (Esc)"
            aria-label="Close Tour"
          >
            ✕
          </button>
        </div>

        {/* Card Body */}
        <div className="tour-card-body">
          <h3 className="tour-card-title">{currentStepData.title}</h3>
          <div className="tour-card-subtitle">{currentStepData.subtitle}</div>
          <p className="tour-card-content">{currentStepData.content}</p>
          <div className="tour-card-tip">{currentStepData.tip}</div>

          {/* Interactive Action Button (e.g. Step 6 Aapda Mitra instant demo) */}
          {currentStepData.actionLabel && (
            <button 
              className="tour-interactive-demo-btn"
              onClick={handleInteractiveAction}
              title="Launch instant demonstration query in Aapda Mitra AI"
            >
              <span>{currentStepData.actionLabel}</span>
              <span className="btn-sparkle">✨</span>
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
                title={`Jump to ${step.title}`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="tour-actions-group">
            <button 
              className="tour-btn tour-skip-btn" 
              onClick={closeTour}
            >
              Skip
            </button>

            {!isFirstStep && (
              <button 
                className="tour-btn tour-back-btn" 
                onClick={prevTourStep}
              >
                ← Back
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
              {isLastStep ? 'Finish Tour 🚀' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTourModal;
