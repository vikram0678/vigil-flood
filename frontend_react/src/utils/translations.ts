export type Language = 'en' | 'hi';

export const translations: Record<string, { en: string; hi: string }> = {
  // Brand & Header
  brandTitle: { en: 'VIGIL-FLOOD', hi: 'विजिल-बाढ़' },
  brandTagline: { en: '| Early Warning', hi: '| पूर्व चेतावनी' },
  allIndiaValleys: { en: '📍 All-India Valleys', hi: '📍 अखिल भारतीय घाटियां' },
  liveStatus: { en: 'LIVE', hi: 'लाइव' },

  // Navbar Buttons
  stateAlerts: { en: 'State Alerts', hi: 'राज्य अलर्ट' },
  evacuationOps: { en: 'Evacuation Ops', hi: 'निकासी संचालन' },
  methodology: { en: 'Methodology', hi: 'कार्यप्रणाली' },
  quickTour: { en: 'Quick Tour', hi: 'त्वरित टूर' },
  capBroadcast: { en: 'CAP Broadcast', hi: 'आपातकालीन प्रसारण' },
  lightTheme: { en: 'Light', hi: 'लाइट' },
  darkTheme: { en: 'Dark', hi: 'डार्क' },
  roleAuthority: { en: 'Authority', hi: 'आपदा अधिकारी' },
  roleCitizen: { en: 'Citizen', hi: 'नागरिक दृश्य' },

  // Sidebar Panel (Pilot Catchment)
  allIndiaPilotBasins: { en: '📍 All-India Pilot Basins', hi: '📍 अखिल भारतीय पायलट बेसिन' },
  filterStateBasin: { en: 'Filter State / Basin:', hi: 'राज्य / बेसिन फ़िल्टर करें:' },
  descendingRisk: { en: '⚡ Descending Risk', hi: '⚡ घटता हुआ जोखिम' },
  allStatesOption: { en: '🌐 All States (All 26 Villages Monitored)', hi: '🌐 सभी राज्य (सभी 26 गांव निगरानी में)' },
  basinHP: { en: '🏔️ Himachal Pradesh (11 Wards - Beas & Sutlej)', hi: '🏔️ हिमाचल प्रदेश (11 वार्ड - ब्यास और सतलुज)' },
  basinUK: { en: '⛰️ Uttarakhand (5 Wards - Alaknanda Valley)', hi: '⛰️ उत्तराखंड (5 वार्ड - अलकनंदा घाटी)' },
  basinSK: { en: '🌊 Sikkim (5 Wards - Teesta River Basin)', hi: '🌊 सिक्किम (5 वार्ड - तीस्ता नदी बेसिन)' },
  basinKL: { en: '🌧️ Kerala (5 Wards - Wayanad Chaliyar)', hi: '🌧️ केरल (5 वार्ड - वायनाड चालियार)' },
  allIndiaAvgHazard: { en: 'All-India Average Hazard Index', hi: 'अखिल भारतीय औसत खतरा सूचकांक' },
  districtHazardIndex: { en: 'District Hazard Index', hi: 'जिला खतरा सूचकांक' },
  baselineRisk: { en: '🟢 Baseline', hi: '🟢 सामान्य' },
  moderateRisk: { en: '🟡 Moderate', hi: '🟡 मध्यम' },
  criticalRisk: { en: '🔴 Critical', hi: '🔴 गंभीर' },
  nationalViewTitle: { en: 'All-India National View', hi: 'अखिल भारतीय राष्ट्रीय दृश्य' },
  nationalOverviewSubtitle: { en: '● National Overview (All 26 Villages)', hi: '● राष्ट्रीय अवलोकन (सभी 26 गांव)' },
  clickToZoomOut: { en: 'Click to zoom out to India', hi: 'पूरे भारत का नक्शा देखने के लिए क्लिक करें' },
  badgeOverview: { en: '● OVERVIEW', hi: '● अवलोकन' },
  badgeActive: { en: '● ACTIVE', hi: '● सक्रिय' },
  syncingBadge: { en: 'Syncing...', hi: 'सिंक हो रहा है...' },
  computingBadge: { en: 'Computing...', hi: 'गणना जारी...' },
  wardsCount: { en: 'Wards', hi: 'वार्ड' },
  allVillagesHeader: { en: 'ALL 26 VILLAGES (DESCENDING RISK)', hi: 'सभी 26 गांव (घटता जोखिम क्रम)' },
  rankedPrefix: { en: 'Ranked', hi: 'रैंक' },
  syncingWardsLabel: { en: 'Syncing 26 Wards...', hi: '26 वार्ड सिंक हो रहे हैं...' },
  elevPrefix: { en: 'Elev:', hi: 'ऊंचाई:' },
  slopePrefix: { en: 'Slope:', hi: 'ढलान:' },
  safeRidge: { en: 'Safe Ridge', hi: 'सुरक्षित स्थान' },
  syncingTitle: { en: 'Synchronizing 26 Mountain Basins', hi: '26 पर्वतीय बेसिनों का सिंक्रनाइज़ेशन' },
  syncingDesc: { 
    en: 'Polling live IMD Doppler Radar, GEE satellite feeds & ground IoT telemetry...', 
    hi: 'आईएमडी डॉपलर रडार, उपग्रह डेटा और ज़मीनी आईओटी सेंसर से लाइव जानकारी प्राप्त हो रही है...' 
  },

  // What-If Simulation Sandbox
  interactiveSimulation: { en: '⚡ Interactive "What-If" Simulation Sandbox', hi: '⚡ इंटरएक्टिव "क्या-अगर" सिमुलेशन सैंडबॉक्स' },
  cwcHydrology: { en: 'CWC HYDROLOGY: ', hi: 'सीडब्ल्यूसी जल विज्ञान: ' },
  runoffCoeff: { en: 'Runoff Coeff C: ', hi: 'अपवाह गुणांक C: ' },
  peakDischarge: { en: 'PEAK DISCHARGE: ', hi: 'चरम जल प्रवाह: ' },
  crestWindow: { en: 'CREST WINDOW: ', hi: 'चरम जलस्तर समय: ' },
  fullCwcHydrograph: { en: '📈 Full CWC Hydrograph', hi: '📈 पूर्ण जललेखा (Hydrograph)' },
  adjustTelemetry: { en: 'Adjust Telemetry', hi: 'टेलीमेट्री समायोजित करें' },
  resetToLive: { en: '↺ Reset to Live', hi: '↺ लाइव पर रीसेट करें' },
  customParameters: { en: 'Custom Parameters', hi: 'कस्टम पैरामीटर' },
  presetBaseline: { en: '🟢 Baseline Reset', hi: '🟢 सामान्य रीसेट' },
  presetCloudburstCrit: { en: '☁️ Cloudburst (80mm/h)', hi: '☁️ बादल फटना (80 मिमी/घंटा)' },
  presetMonsoonSat: { en: '🌧️ Monsoon Saturation (95%)', hi: '🌧️ मानसून संतृप्ति (95%)' },
  presetDamGlof: { en: '🏔️ Dam Breach / GLOF', hi: '🏔️ बांध टूटना / हिमनद झील विस्फोट' },
  rainLabel: { en: 'Rainfall Intensity (mm/h)', hi: 'वर्षा की तीव्रता (मिमी/घंटा)' },
  soilLabel: { en: 'Soil Saturation (%)', hi: 'मिट्टी की नमी संतृप्ति (%)' },
  waterLabel: { en: 'River Water Level (m)', hi: 'नदी का जल स्तर (मीटर)' },
  applyPreset: { en: 'Apply Scenario', hi: 'परिदृश्य लागू करें' },

  // Decision Support & Telemetry Right Panel
  decisionSupportXai: { en: '🛡️ Decision Support & XAI', hi: '🛡️ निर्णय समर्थन एवं व्याख्यात्मक AI' },
  nationalView: { en: '🇮🇳 National View', hi: '🇮🇳 राष्ट्रीय दृश्य' },
  collapse: { en: 'Collapse', hi: 'संक्षिप्त करें' },
  historicalDossierTitle: { en: 'Historical Disaster Archive & Tactical Dossier', hi: 'ऐतिहासिक आपदा संग्रह एवं सामरिक डोजियर' },
  historicalDossierSub: { en: '26 pilot villages • Past flood casualties & turn-key evacuation', hi: '26 पायलट गांव • पिछले बाढ़ हताहत और त्वरित निकासी योजना' },
  nationalEarlyWarningStatus: { en: 'National Early Warning Status', hi: 'राष्ट्रीय पूर्व चेतावनी स्थिति' },
  allSystemsOperational: { en: '● ALL SYSTEMS OPERATIONAL', hi: '● सभी प्रणालियां सक्रिय रूप से चालू हैं' },
  nationalStatusDesc: { 
    en: 'VIGIL-FLOOD is continuously monitoring multi-source atmospheric, hydrological, and IoT telemetry across vulnerable mountain valleys.', 
    hi: 'विजिल-बाढ़ संवेदनशील पर्वतीय घाटियों में बहु-स्रोत वायुमंडलीय, जल विज्ञान और आईओटी टेलीमेट्री की 24x7 निरंतर निगरानी कर रहा है।' 
  },
  sensorTelemetry: { en: 'Sensor Telemetry', hi: 'सेंसर टेलीमेट्री' },
  actionDirectives: { en: 'Action Directives', hi: 'कार्रवाई निर्देश' },
  explainableAiAnalysis: { en: 'Explainable AI (XAI) Analysis', hi: 'व्याख्यात्मक एआई (XAI) विश्लेषण' },

  // Mobile Tabs
  liveMapSimTab: { en: 'Live Map & Sim', hi: 'लाइव मानचित्र व सिम' },
  villagesTab: { en: 'Villages', hi: 'गांव' },
  aiTelemetryTab: { en: 'AI Telemetry', hi: 'एआई टेलीमेट्री' },

  // Citizen Portal
  citizenPortalTitle: { en: 'CIVIL PROTECTION & CITIZEN SAFETY PORTAL', hi: 'नागरिक सुरक्षा एवं आपदा पूर्व चेतावनी पोर्टल' },
  citizenPortalSubtitle: { 
    en: 'Hyper-local flash flood warning, verified refuge shelters & safe routes for residents', 
    hi: 'निवासियों के लिए हाइपर-लोकल अचानक बाढ़ चेतावनी, सत्यापित सुरक्षित आश्रय स्थल और निकासी मार्ग' 
  },
  yourLocation: { en: 'Your Monitored Location:', hi: 'आपका निगरानी क्षेत्र / गांव:' },
  selectVillagePrompt: { en: 'Select your village/ward...', hi: 'अपना गांव / वार्ड चुनें...' },
  imminentEvacuation: { en: 'IMMEDIATE EVACUATION DIRECTIVE', hi: 'तत्काल सुरक्षित स्थल पर निकासी निर्देश' },
  readinessAdvisory: { en: 'FLOOD WATCH & READINESS ADVISORY', hi: 'बाढ़ निगरानी और तैयारी सलाह' },
  normalSafety: { en: 'NORMAL CONDITIONS - ROUTINE MONITORING', hi: 'सामान्य स्थिति - नियमित निगरानी' },
  actionWindowRemaining: { en: 'Available Action Window:', hi: 'उपलब्ध निकासी समय सीमा:' },
  designatedShelterTitle: { en: 'Designated Safe Relief Refuge', hi: 'सत्यापित सुरक्षित राहत आश्रय स्थल' },
  safeRouteTitle: { en: 'Verified Safe Evacuation Route', hi: 'सत्यापित सुरक्षित निकासी मार्ग' },
  goBagTitle: { en: '3-Minute Emergency Go-Bag Checklist', hi: '3-मिनट आपातकालीन किट चेकलिस्ट' },
  helplineTitle: { en: 'One-Tap Emergency Disaster Helplines', hi: 'आपातकालीन आपदा हेल्पलाइन (टैप करके कॉल करें)' },
  playAudioAlert: { en: '🔊 Play Voice Siren & Emergency Advisory', hi: '🔊 ध्वनि चेतावनी और आपातकालीन सायरन बजाएं' },
  stopAudioAlert: { en: '⏹️ Stop Emergency Siren Broadcast', hi: '⏹️ आपातकालीन ध्वनि प्रसारण बंद करें' },
  safetyRulesTitle: { en: 'Mountain Flash Flood Life-Safety Rules', hi: 'पर्वतीय अचानक बाढ़ जीवन-रक्षा नियम' },
  viewGisMap: { en: '🗺️ Inspect on Live GIS Map', hi: '🗺️ लाइव जीआईएस मानचित्र पर मार्ग देखें' },
  connectingTelemetry: { en: 'Connecting to Live Telemetry...', hi: 'लाइव टेलीमेट्री से कनेक्ट हो रहा है...' },
  loadingWardData: { 
    en: 'Syncing live Doppler radar, river stage gauges and slope sensors for your village.', 
    hi: 'आपके गांव के लिए लाइव रडार, नदी जलस्तर और ढलान सेंसर का डेटा सिंक किया जा रहा है।' 
  },

  // Common Alerts & Actions
  leadTimePrefix: { en: 'Escape Window:', hi: 'निकासी समय:' },
  minutesUnit: { en: 'min', hi: 'मिनट' },
  evacuatePrompt: { en: 'Evacuate Uphill Now', hi: 'तुरंत ऊपर सुरक्षित स्थान पर जाएं' },
  safeShelterLabel: { en: 'Safe Shelter:', hi: 'सुरक्षित आश्रय:' }
};

export const getTranslation = (key: string, lang: Language): string => {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  return translations[key]?.en || key;
};

/**
 * Triggers Google Translate cookie translation for external deep page elements
 */
export const applyGoogleTranslate = (lang: Language) => {
  try {
    const cookieVal = lang === 'hi' ? '/en/hi' : '/en/en';
    document.cookie = `googtrans=${cookieVal}; path=/`;
    document.cookie = `googtrans=${cookieVal}; domain=${window.location.hostname}; path=/`;

    // Dispatch change event to any active Google Translate iframe/combo
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    }
  } catch (e) {
    console.debug('Google translate cookie sync:', e);
  }
};
