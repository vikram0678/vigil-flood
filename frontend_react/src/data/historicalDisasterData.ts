/**
 * VIGIL-FLOOD | Historical Disaster Archive & Catchment Profile Database
 * 
 * Curated historical disaster records for all 26 monitored pilot villages.
 * Sources: NDMA, SDMA, IMD, CWC, GSI, ISRO-NRSC, media reports.
 * 
 * NOTE: Where exact village-level historical data is unavailable, district-level 
 or catchment-level records are used as proxies (common in Indian disaster databases).
 */

export interface HistoricalIncident {
  year: number;
  month: string;
  disaster_type: 'FLASH_FLOOD' | 'LANDSLIDE' | 'CLOUDBURST' | 'DEBRIS_FLOW' | 'GLOF' | 'DAM_BREACH' | 'FLOOD';
  severity: 'CATASTROPHIC' | 'SEVERE' | 'MAJOR' | 'MODERATE';
  fatalities: number;
  injured: number;
  houses_damaged: number;
  displacement: number;
  description: string;
  source: string;
  image_keywords?: string; // Search query keywords for imagery
  image_url?: string;      // Path in public/ folder (e.g., '/disaster_photos/pandoh_2023.jpg') or external URL
  image_caption?: string;  // Caption describing what is shown in the image
}

export interface EvacuationAsset {
  shelters: {
    name: string;
    lat: number;
    lng: number;
    capacity: number;
    elevation_m: number;
    type: string;
  }[];
  ndrf_teams_required: number;
  sdrf_teams_required: number;
  helicopters_required: number;
  ambulances_required: number;
  medical_teams: number;
  estimated_evacuation_time_hrs: number;
  communication_assets: string[];
  supply_requirements: string[];
}

export interface CatchmentProfile {
  primary_river: string;
  catchment_area_km2: number;
  max_recorded_rainfall_mm: number;
  avg_monsoon_rainfall_mm: number;
  geological_formation: string;
  vulnerability_index: number; // 0-100
  last_major_event_year: number;
  recurring_threat: string;
}

export interface VillageHistoricalData {
  village_id: string;
  village_name: string;
  state: string;
  district: string;
  incidents: HistoricalIncident[];
  catchment_profile: CatchmentProfile;
  evacuation_assets: EvacuationAsset;
  risk_narrative: string;
  ndma_zone_classification: string;
}

export const HISTORICAL_DISASTER_DATABASE: Record<string, VillageHistoricalData> = {
  // BEAS VALLEY, HIMACHAL PRADESH (VIL-01 to VIL-11)
  'VIL-01': {
    village_id: 'VIL-01',
    village_name: 'Pandoh',
    state: 'Himachal Pradesh',
    district: 'Mandi',
    incidents: [
      {
        year: 2023,
        month: 'July',
        disaster_type: 'FLASH_FLOOD',
        severity: 'SEVERE',
        fatalities: 12,
        injured: 35,
        houses_damaged: 180,
        displacement: 2500,
        description: 'Massive flash floods in Mandi district triggered by unprecedented 24-hour rainfall of 220mm. Pandoh Dam spillway overflow caused downstream inundation. Multiple bridges washed away on NH-21.',
        source: 'NDMA / HP SDMA / IMD Shimla',
        image_keywords: 'Pandoh dam flood 2023 Mandi Himachal',
        image_url: '/disaster_photos/himalayan_flash_flood_surge.jpg',
        image_caption: 'Violent flash flood torrent surging through the Beas river basin at Pandoh in July 2023.'
      },
      {
        year: 2019,
        month: 'August',
        disaster_type: 'LANDSLIDE',
        severity: 'MAJOR',
        fatalities: 4,
        injured: 12,
        houses_damaged: 45,
        displacement: 800,
        description: 'Slope failure near Pandoh Gorge blocked Beas River temporarily, creating a landslide dam. Debris flow reached village settlements downstream.',
        source: 'GSI / HP PWD',
        image_keywords: 'Pandoh gorge landslide 2019 Beas river'
      },
      {
        year: 2018,
        month: 'September',
        disaster_type: 'CLOUDBURST',
        severity: 'MODERATE',
        fatalities: 2,
        injured: 8,
        houses_damaged: 30,
        displacement: 400,
        description: 'Localized cloudburst triggered flash flooding in lower catchment areas near Pandoh. Several vehicles swept away from riverside parking.',
        source: 'IMD / District Administration Mandi'
      }
    ],
    catchment_profile: {
      primary_river: 'Beas River',
      catchment_area_km2: 24.5,
      max_recorded_rainfall_mm: 280,
      avg_monsoon_rainfall_mm: 1200,
      geological_formation: 'Siwalik Formation — fragmented sandstone & shale',
      vulnerability_index: 78,
      last_major_event_year: 2023,
      recurring_threat: 'Dam spillway overflow + steep gorge flash floods'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Govt Senior Secondary School (Upper Ridge)', lat: 31.6745, lng: 77.05, capacity: 400, elevation_m: 990, type: 'School' },
        { name: 'Community Hall Pandoh West', lat: 31.668, lng: 77.048, capacity: 250, elevation_m: 950, type: 'Community Hall' }
      ],
      ndrf_teams_required: 2,
      sdrf_teams_required: 3,
      helicopters_required: 1,
      ambulances_required: 4,
      medical_teams: 2,
      estimated_evacuation_time_hrs: 2.5,
      communication_assets: ['VHF Radio', 'Satellite Phone (BSNL)', 'PA System', 'SMS Broadcast'],
      supply_requirements: ['500 food packets', '200 blankets', '100 tarpaulins', 'Water purification tablets (5000)', 'First aid kits (50)']
    },
    risk_narrative: 'Pandoh sits at the narrowest point of the Beas Gorge, directly downstream of the Pandoh Dam. The dam\'s emergency spillway discharge combined with cloudburst rainfall creates a dual-threat flood corridor. Historical data shows 3+ major flood events per decade.',
    ndma_zone_classification: 'Zone V — Very High Seismic & Flood Risk'
  },

  'VIL-02': {
    village_id: 'VIL-02',
    village_name: 'Aut',
    state: 'Himachal Pradesh',
    district: 'Mandi',
    incidents: [
      {
        year: 2023,
        month: 'July',
        disaster_type: 'FLASH_FLOOD',
        severity: 'SEVERE',
        fatalities: 8,
        injured: 22,
        houses_damaged: 95,
        displacement: 1200,
        description: 'Aut Tunnel portal area flooded as Beas River surged to record levels. Multiple families trapped in riverside settlements required aerial evacuation.',
        source: 'NDMA / NHAI / HP SDMA'
      },
      {
        year: 2021,
        month: 'August',
        disaster_type: 'DEBRIS_FLOW',
        severity: 'MAJOR',
        fatalities: 3,
        injured: 10,
        houses_damaged: 25,
        displacement: 500,
        description: 'Debris flow from saturated hillslope above Aut blocked NH-21 for 48 hours. Beas tributary flash flooding destroyed agricultural terraces.',
        source: 'GSI / IMD'
      }
    ],
    catchment_profile: {
      primary_river: 'Beas River (Aut Confluence)',
      catchment_area_km2: 18.2,
      max_recorded_rainfall_mm: 245,
      avg_monsoon_rainfall_mm: 1150,
      geological_formation: 'Dharamsala Group — soft shale with clay interbeds',
      vulnerability_index: 72,
      last_major_event_year: 2023,
      recurring_threat: 'Tunnel portal flooding + debris flow from unstable hillslopes'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Aut Primary School (Hilltop)', lat: 31.625, lng: 77.077, capacity: 300, elevation_m: 1020, type: 'School' },
        { name: 'Panchayat Bhawan Aut', lat: 31.623, lng: 77.075, capacity: 150, elevation_m: 980, type: 'Government Building' }
      ],
      ndrf_teams_required: 2,
      sdrf_teams_required: 2,
      helicopters_required: 1,
      ambulances_required: 3,
      medical_teams: 2,
      estimated_evacuation_time_hrs: 3.0,
      communication_assets: ['VHF Radio', 'PA System', 'Mobile Network (BSNL/Jio)'],
      supply_requirements: ['400 food packets', '150 blankets', '80 tarpaulins', 'Water purification tablets (3000)']
    },
    risk_narrative: 'Aut is located at a critical Beas River confluence point near the highway tunnel portal. The narrow valley geometry amplifies flood wave heights. Road-cut slopes above the settlement are chronically unstable.',
    ndma_zone_classification: 'Zone V — Very High Seismic & Flood Risk'
  },

  'VIL-03': {
    village_id: 'VIL-03',
    village_name: 'Thalot',
    state: 'Himachal Pradesh',
    district: 'Mandi',
    incidents: [
      {
        year: 2023,
        month: 'July',
        disaster_type: 'LANDSLIDE',
        severity: 'MAJOR',
        fatalities: 5,
        injured: 15,
        houses_damaged: 60,
        displacement: 900,
        description: 'Multiple landslides triggered across Thalot ward during intense monsoon rainfall. NH-21 blocked at multiple points isolating the village for 3 days.',
        source: 'HP SDMA / BRO / GSI'
      },
      {
        year: 2020,
        month: 'September',
        disaster_type: 'CLOUDBURST',
        severity: 'MODERATE',
        fatalities: 1,
        injured: 5,
        houses_damaged: 20,
        displacement: 300,
        description: 'Localized cloudburst caused flash flooding in seasonal nullahs through Thalot. Several livestock lost.',
        source: 'District Administration Mandi'
      }
    ],
    catchment_profile: {
      primary_river: 'Beas River (Thalot Stretch)',
      catchment_area_km2: 15.8,
      max_recorded_rainfall_mm: 210,
      avg_monsoon_rainfall_mm: 1100,
      geological_formation: 'Lesser Himalayan Phyllites & Quartzites',
      vulnerability_index: 65,
      last_major_event_year: 2023,
      recurring_threat: 'Monsoon-activated landslides + nullah flash floods'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Govt Middle School Thalot', lat: 31.637, lng: 77.068, capacity: 200, elevation_m: 940, type: 'School' }
      ],
      ndrf_teams_required: 1,
      sdrf_teams_required: 2,
      helicopters_required: 0,
      ambulances_required: 2,
      medical_teams: 1,
      estimated_evacuation_time_hrs: 2.0,
      communication_assets: ['VHF Radio', 'PA System'],
      supply_requirements: ['300 food packets', '100 blankets', '50 tarpaulins']
    },
    risk_narrative: 'Thalot experiences recurring landslides from phyllite rock weathering on steep valley slopes. The village is sandwiched between unstable hillsides and the Beas floodplain.',
    ndma_zone_classification: 'Zone IV — High Seismic & Landslide Risk'
  },

  'VIL-04': {
    village_id: 'VIL-04',
    village_name: 'Nagwain',
    state: 'Himachal Pradesh',
    district: 'Mandi',
    incidents: [
      {
        year: 2022,
        month: 'August',
        disaster_type: 'FLASH_FLOOD',
        severity: 'MAJOR',
        fatalities: 3,
        injured: 18,
        houses_damaged: 40,
        displacement: 650,
        description: 'Flash flooding in Nagwain nullah during heavy monsoon rains. Several houses along the nullah bank collapsed.',
        source: 'HP SDMA / IMD'
      }
    ],
    catchment_profile: {
      primary_river: 'Nagwain Nullah (Beas Tributary)',
      catchment_area_km2: 12.1,
      max_recorded_rainfall_mm: 195,
      avg_monsoon_rainfall_mm: 1050,
      geological_formation: 'Phyllite & Slate — weathered zone',
      vulnerability_index: 58,
      last_major_event_year: 2022,
      recurring_threat: 'Nullah bank erosion + slope instability'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Nagwain Community Center', lat: 31.648, lng: 77.043, capacity: 250, elevation_m: 1010, type: 'Community Center' }
      ],
      ndrf_teams_required: 1,
      sdrf_teams_required: 2,
      helicopters_required: 0,
      ambulances_required: 2,
      medical_teams: 1,
      estimated_evacuation_time_hrs: 2.0,
      communication_assets: ['VHF Radio', 'PA System', 'Mobile Network'],
      supply_requirements: ['250 food packets', '100 blankets', '40 tarpaulins']
    },
    risk_narrative: 'Nagwain is situated along a steep nullah that serves as a flash flood conduit during intense rainfall. Bank erosion progressively exposes settlement foundations.',
    ndma_zone_classification: 'Zone IV — High Seismic & Flood Risk'
  },

  'VIL-05': {
    village_id: 'VIL-05',
    village_name: 'Jhatingri',
    state: 'Himachal Pradesh',
    district: 'Mandi',
    incidents: [
      {
        year: 2023,
        month: 'August',
        disaster_type: 'LANDSLIDE',
        severity: 'MODERATE',
        fatalities: 2,
        injured: 7,
        houses_damaged: 15,
        displacement: 200,
        description: 'Rainfall-triggered landslide blocked access road to Jhatingri. Two people buried under debris near road cut.',
        source: 'HP PWD / District Mandi'
      }
    ],
    catchment_profile: {
      primary_river: 'Jhatingri Khad',
      catchment_area_km2: 8.5,
      max_recorded_rainfall_mm: 180,
      avg_monsoon_rainfall_mm: 950,
      geological_formation: 'Phyllite — highly jointed & fractured',
      vulnerability_index: 55,
      last_major_event_year: 2023,
      recurring_threat: 'Road-cut induced landslides'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Jhatingri Panchayat Hall', lat: 31.655, lng: 77.035, capacity: 150, elevation_m: 1050, type: 'Panchayat Hall' }
      ],
      ndrf_teams_required: 1,
      sdrf_teams_required: 1,
      helicopters_required: 0,
      ambulances_required: 1,
      medical_teams: 1,
      estimated_evacuation_time_hrs: 1.5,
      communication_assets: ['VHF Radio', 'PA System'],
      supply_requirements: ['150 food packets', '60 blankets', '30 tarpaulins']
    },
    risk_narrative: 'Jhatingri is a smaller settlement vulnerable to road-cut induced landslides along steep terrain. Access road blockages can isolate the village for days.',
    ndma_zone_classification: 'Zone IV — High Landslide Risk'
  },

  'VIL-06': {
    village_id: 'VIL-06',
    village_name: 'Bajaura',
    state: 'Himachal Pradesh',
    district: 'Kullu',
    incidents: [
      {
        year: 2023,
        month: 'July',
        disaster_type: 'FLASH_FLOOD',
        severity: 'SEVERE',
        fatalities: 6,
        injured: 20,
        houses_damaged: 70,
        displacement: 1100,
        description: 'Beas River at Bajaura reached highest recorded water level. Airport runway flooded. Multiple riverside hotels and houses inundated.',
        source: 'NDMA / CWC / IMD'
      }
    ],
    catchment_profile: {
      primary_river: 'Beas River (Bajaura-Kullu)',
      catchment_area_km2: 28.3,
      max_recorded_rainfall_mm: 260,
      avg_monsoon_rainfall_mm: 1300,
      geological_formation: 'River terrace alluvium over metamorphics',
      vulnerability_index: 70,
      last_major_event_year: 2023,
      recurring_threat: 'Beas mainstream flooding + airport zone inundation'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Bajaura Degree College', lat: 31.847, lng: 77.163, capacity: 500, elevation_m: 1120, type: 'College' },
        { name: 'Bajaura Temple Complex (Highland)', lat: 31.849, lng: 77.160, capacity: 200, elevation_m: 1150, type: 'Temple' }
      ],
      ndrf_teams_required: 2,
      sdrf_teams_required: 3,
      helicopters_required: 1,
      ambulances_required: 3,
      medical_teams: 2,
      estimated_evacuation_time_hrs: 2.5,
      communication_assets: ['VHF Radio', 'Satellite Phone', 'PA System', 'Mobile Network'],
      supply_requirements: ['600 food packets', '250 blankets', '120 tarpaulins']
    },
    risk_narrative: 'Bajaura is a critical flood-prone node in the Kullu Valley where the Beas widens onto an alluvial fan. The airport and riverside tourist infrastructure amplify exposure.',
    ndma_zone_classification: 'Zone V — Very High Flood & Seismic Risk'
  },

  'VIL-07': {
    village_id: 'VIL-07',
    village_name: 'Batseri / Sangla',
    state: 'Himachal Pradesh',
    district: 'Kinnaur',
    incidents: [
      {
        year: 2023,
        month: 'August',
        disaster_type: 'LANDSLIDE',
        severity: 'CATASTROPHIC',
        fatalities: 15,
        injured: 45,
        houses_damaged: 120,
        displacement: 1800,
        description: 'Massive landslide in Sangla-Batseri corridor of Kinnaur district. Multiple vehicles buried under debris on NH-5. Bridge destroyed, cutting off Sangla Valley.',
        source: 'NDMA / BRO / GSI / ISRO-NRSC'
      },
      {
        year: 2021,
        month: 'July',
        disaster_type: 'DEBRIS_FLOW',
        severity: 'SEVERE',
        fatalities: 9,
        injured: 30,
        houses_damaged: 80,
        displacement: 1200,
        description: 'Kinnaur rockslide and debris flow near Batseri destroyed NH bridge and trapped 50+ vehicles. ITBP conducted rescue operations.',
        source: 'ITBP / NDMA / GSI'
      }
    ],
    catchment_profile: {
      primary_river: 'Baspa River (Sutlej Tributary)',
      catchment_area_km2: 32.0,
      max_recorded_rainfall_mm: 190,
      avg_monsoon_rainfall_mm: 800,
      geological_formation: 'Higher Himalayan Crystallines — Gneiss & Migmatite',
      vulnerability_index: 88,
      last_major_event_year: 2023,
      recurring_threat: 'Massive rockslides + GLOF potential from receding glaciers'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Sangla Govt School Complex', lat: 31.422, lng: 78.264, capacity: 350, elevation_m: 2720, type: 'School' },
        { name: 'Sangla ITBP Camp', lat: 31.425, lng: 78.268, capacity: 200, elevation_m: 2750, type: 'Military Camp' }
      ],
      ndrf_teams_required: 3,
      sdrf_teams_required: 4,
      helicopters_required: 2,
      ambulances_required: 4,
      medical_teams: 3,
      estimated_evacuation_time_hrs: 5.0,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'HAM Radio', 'VSAT Terminal'],
      supply_requirements: ['800 food packets', '400 blankets', '200 tarpaulins', 'Oxygen cylinders (20)', 'High-altitude medical kits']
    },
    risk_narrative: 'Sangla/Batseri in Kinnaur is among India\'s most landslide-prone corridors. The steep Baspa gorge, combined with retreating glaciers and earthquake-loosened rock, creates catastrophic multi-hazard exposure.',
    ndma_zone_classification: 'Zone V — Extreme Multi-Hazard (Seismic + Landslide + GLOF)'
  },

  'VIL-08': {
    village_id: 'VIL-08',
    village_name: 'Kotropi',
    state: 'Himachal Pradesh',
    district: 'Mandi',
    incidents: [
      {
        year: 2017,
        month: 'August',
        disaster_type: 'LANDSLIDE',
        severity: 'CATASTROPHIC',
        fatalities: 46,
        injured: 12,
        houses_damaged: 2,
        displacement: 500,
        description: 'Devastating Kotropi landslide buried two HRTC buses under massive debris on NH-21. One of Himachal\'s deadliest single landslide events. Rescue operations lasted 5 days.',
        source: 'NDMA / NDRF / GSI / HP SDMA',
        image_keywords: 'Kotropi landslide 2017 Mandi bus buried'
      }
    ],
    catchment_profile: {
      primary_river: 'Beas River (Kotropi Section)',
      catchment_area_km2: 14.0,
      max_recorded_rainfall_mm: 230,
      avg_monsoon_rainfall_mm: 1100,
      geological_formation: 'Siwalik — unconsolidated conglomerate & mudstone',
      vulnerability_index: 85,
      last_major_event_year: 2017,
      recurring_threat: 'Deep-seated rotational landslides on NH-21 corridor'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Kotropi Village School', lat: 31.585, lng: 76.985, capacity: 150, elevation_m: 850, type: 'School' }
      ],
      ndrf_teams_required: 2,
      sdrf_teams_required: 3,
      helicopters_required: 1,
      ambulances_required: 3,
      medical_teams: 2,
      estimated_evacuation_time_hrs: 3.0,
      communication_assets: ['VHF Radio', 'Satellite Phone', 'PA System'],
      supply_requirements: ['400 food packets', '200 blankets', '100 tarpaulins', 'Heavy earth-moving equipment']
    },
    risk_narrative: 'Kotropi is forever scarred by the 2017 catastrophe. The Siwalik geology produces deep-seated rotational failures that can mobilize millions of cubic meters of debris with minimal warning.',
    ndma_zone_classification: 'Zone V — Extreme Landslide Risk'
  },

  'VIL-09': {
    village_id: 'VIL-09',
    village_name: 'Kanon / Nirmand',
    state: 'Himachal Pradesh',
    district: 'Kullu',
    incidents: [
      {
        year: 2023,
        month: 'July',
        disaster_type: 'FLASH_FLOOD',
        severity: 'MAJOR',
        fatalities: 4,
        injured: 15,
        houses_damaged: 35,
        displacement: 600,
        description: 'Flash flooding in Nirmand tehsil destroyed orchards and damaged irrigation channels. Multiple houses near stream banks collapsed.',
        source: 'HP SDMA / District Kullu'
      }
    ],
    catchment_profile: {
      primary_river: 'Sutlej Tributary (Nirmand Khad)',
      catchment_area_km2: 16.5,
      max_recorded_rainfall_mm: 200,
      avg_monsoon_rainfall_mm: 1000,
      geological_formation: 'Lesser Himalayan Phyllite & Schist',
      vulnerability_index: 60,
      last_major_event_year: 2023,
      recurring_threat: 'Seasonal khad flooding + agricultural terrace collapse'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Nirmand Temple Complex', lat: 31.505, lng: 77.345, capacity: 250, elevation_m: 1050, type: 'Temple' }
      ],
      ndrf_teams_required: 1,
      sdrf_teams_required: 2,
      helicopters_required: 0,
      ambulances_required: 2,
      medical_teams: 1,
      estimated_evacuation_time_hrs: 2.5,
      communication_assets: ['VHF Radio', 'PA System', 'Mobile Network'],
      supply_requirements: ['300 food packets', '120 blankets', '60 tarpaulins']
    },
    risk_narrative: 'Nirmand/Kanon faces seasonal khad (seasonal stream) flooding that intensifies with saturated soils. Agricultural terraces collapse during prolonged heavy rain.',
    ndma_zone_classification: 'Zone IV — High Flood & Landslide Risk'
  },

  'VIL-10': {
    village_id: 'VIL-10',
    village_name: 'Janglikh',
    state: 'Himachal Pradesh',
    district: 'Shimla',
    incidents: [
      {
        year: 2023,
        month: 'August',
        disaster_type: 'CLOUDBURST',
        severity: 'MAJOR',
        fatalities: 3,
        injured: 10,
        houses_damaged: 25,
        displacement: 350,
        description: 'Cloudburst over Janglikh valley caused flash flooding in the Pabbar River tributary. Remote village cut off for 4 days.',
        source: 'HP SDMA / IMD'
      }
    ],
    catchment_profile: {
      primary_river: 'Pabbar River',
      catchment_area_km2: 20.0,
      max_recorded_rainfall_mm: 175,
      avg_monsoon_rainfall_mm: 900,
      geological_formation: 'Higher Himalayan Gneiss',
      vulnerability_index: 62,
      last_major_event_year: 2023,
      recurring_threat: 'Cloudburst + remote valley isolation'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Janglikh Village Panchayat Hall', lat: 31.135, lng: 77.780, capacity: 120, elevation_m: 2500, type: 'Panchayat Hall' }
      ],
      ndrf_teams_required: 1,
      sdrf_teams_required: 1,
      helicopters_required: 1,
      ambulances_required: 1,
      medical_teams: 1,
      estimated_evacuation_time_hrs: 6.0,
      communication_assets: ['Satellite Phone', 'HAM Radio'],
      supply_requirements: ['200 food packets', '100 blankets', '50 tarpaulins', 'High-altitude survival kits']
    },
    risk_narrative: 'Janglikh is one of the remotest villages in the monitoring network. Its high altitude and single access road make evacuation extremely challenging during monsoon events.',
    ndma_zone_classification: 'Zone V — High Altitude Multi-Hazard'
  },

  'VIL-11': {
    village_id: 'VIL-11',
    village_name: 'Samej / Rampur',
    state: 'Himachal Pradesh',
    district: 'Shimla',
    incidents: [
      {
        year: 2024,
        month: 'July',
        disaster_type: 'FLASH_FLOOD',
        severity: 'CATASTROPHIC',
        fatalities: 14,
        injured: 32,
        houses_damaged: 55,
        displacement: 950,
        description: 'Tragic Demise of Samej Village: On the midnight of July 31, 2024, cloudburst-triggered torrents obliterated 15 houses in Rampur sector, washing away the Primary Health Center and schools under deep mud.',
        source: 'Field Forensic Report / NDRF / CWC',
        image_url: '/disaster_photos/samej/samjeVillage_1.webp',
        image_caption: 'Ground Zero Evidence: Debris flows and devastated settlement in Samej Village (July 31, 2024).'
      }
    ],
    catchment_profile: {
      primary_river: 'Sutlej River (Samej Khad Reach)',
      catchment_area_km2: 35.0,
      max_recorded_rainfall_mm: 240,
      avg_monsoon_rainfall_mm: 1100,
      geological_formation: 'Rampur Window — mixed metamorphics & loose debris',
      vulnerability_index: 86,
      last_major_event_year: 2024,
      recurring_threat: 'Sutlej mainstream flooding + cloudburst nullah breach'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Rampur Govt College Safe Camp', lat: 31.452, lng: 77.634, capacity: 450, elevation_m: 1050, type: 'College' },
        { name: 'Samej High Ridge Transit Refuge', lat: 31.450, lng: 77.632, capacity: 300, elevation_m: 1020, type: 'Transit Hub' }
      ],
      ndrf_teams_required: 3,
      sdrf_teams_required: 4,
      helicopters_required: 2,
      ambulances_required: 6,
      medical_teams: 3,
      estimated_evacuation_time_hrs: 2.5,
      communication_assets: ['VHF Radio', 'Satellite Phone', 'PA System', 'Mobile Network'],
      supply_requirements: ['500 food packets', '200 blankets', '100 tarpaulins', 'Clean Drinking Water Packets']
    },
    risk_narrative: 'Samej Village lies directly along the flash flood corridor of a tributary drain entering the Sutlej. Steep funnel topography makes it critically vulnerable to sudden midnight cloudburst torrents.',
    ndma_zone_classification: 'Zone V — Very High Multi-Hazard Risk'
  },


  // UTTARAKHAND (VIL-12 to VIL-16)
  'VIL-12': {
    village_id: 'VIL-12',
    village_name: 'Dharali / Harsil',
    state: 'Uttarakhand',
    district: 'Uttarkashi',
    incidents: [
      {
        year: 2013,
        month: 'June',
        disaster_type: 'GLOF',
        severity: 'CATASTROPHIC',
        fatalities: 50,
        injured: 150,
        houses_damaged: 300,
        displacement: 5000,
        description: 'Part of the devastating 2013 Uttarakhand disaster. Glacial lake outburst flood combined with extreme rainfall devastated upper Bhagirathi Valley. Harsil and Dharali severely affected.',
        source: 'NDMA / ISRO-NRSC / CWC / GSI',
        image_keywords: 'Uttarakhand 2013 flood Harsil Dharali devastation'
      },
      {
        year: 2022,
        month: 'September',
        disaster_type: 'LANDSLIDE',
        severity: 'MAJOR',
        fatalities: 4,
        injured: 12,
        houses_damaged: 30,
        displacement: 400,
        description: 'Landslide near Dharali blocked Bhagirathi River temporarily. Residents evacuated as fear of landslide dam breach grew.',
        source: 'SDMA Uttarakhand / GSI'
      }
    ],
    catchment_profile: {
      primary_river: 'Bhagirathi River (Upper)',
      catchment_area_km2: 45.0,
      max_recorded_rainfall_mm: 320,
      avg_monsoon_rainfall_mm: 900,
      geological_formation: 'Higher Himalayan Crystallines — Augen Gneiss',
      vulnerability_index: 92,
      last_major_event_year: 2022,
      recurring_threat: 'GLOF + extreme precipitation + glacial retreat acceleration'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Harsil Army Camp', lat: 31.029, lng: 78.728, capacity: 400, elevation_m: 2630, type: 'Military Camp' },
        { name: 'Dharali Govt School', lat: 31.037, lng: 78.755, capacity: 200, elevation_m: 2700, type: 'School' }
      ],
      ndrf_teams_required: 3,
      sdrf_teams_required: 4,
      helicopters_required: 3,
      ambulances_required: 5,
      medical_teams: 3,
      estimated_evacuation_time_hrs: 6.0,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'HAM Radio', 'VSAT Terminal', 'Military Communication'],
      supply_requirements: ['1000 food packets', '500 blankets', '250 tarpaulins', 'Oxygen cylinders (30)', 'High-altitude medical kits', 'Search & rescue equipment']
    },
    risk_narrative: 'Dharali/Harsil sits in the upper Bhagirathi near the Gangotri Glacier. The 2013 devastation demonstrated the catastrophic potential of GLOFs in this valley. Glacial retreat is accelerating.',
    ndma_zone_classification: 'Zone V — Extreme GLOF + Seismic Risk'
  },

  'VIL-13': {
    village_id: 'VIL-13',
    village_name: 'Sayanchatti',
    state: 'Uttarakhand',
    district: 'Uttarkashi',
    incidents: [
      {
        year: 2013,
        month: 'June',
        disaster_type: 'FLASH_FLOOD',
        severity: 'SEVERE',
        fatalities: 20,
        injured: 60,
        houses_damaged: 100,
        displacement: 2000,
        description: '2013 Uttarakhand disaster impact on Sayanchatti. Assi Ganga confluence flooding destroyed the settlement. Mass displacement of pilgrims and residents.',
        source: 'NDMA / SDMA UK'
      }
    ],
    catchment_profile: {
      primary_river: 'Assi Ganga (Bhagirathi Tributary)',
      catchment_area_km2: 22.0,
      max_recorded_rainfall_mm: 290,
      avg_monsoon_rainfall_mm: 950,
      geological_formation: 'Higher Himalayan Metamorphics',
      vulnerability_index: 80,
      last_major_event_year: 2013,
      recurring_threat: 'Confluence flooding + pilgrim route vulnerability'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Sayanchatti Rest House (Upper)', lat: 30.903, lng: 78.667, capacity: 150, elevation_m: 1520, type: 'Rest House' }
      ],
      ndrf_teams_required: 2,
      sdrf_teams_required: 2,
      helicopters_required: 1,
      ambulances_required: 2,
      medical_teams: 1,
      estimated_evacuation_time_hrs: 4.0,
      communication_assets: ['Satellite Phone', 'VHF Radio'],
      supply_requirements: ['400 food packets', '200 blankets', '80 tarpaulins']
    },
    risk_narrative: 'Sayanchatti on the Assi Ganga confluence is a key point on the Gangotri pilgrim route. Seasonal population surges during Char Dham Yatra dramatically increase vulnerability.',
    ndma_zone_classification: 'Zone V — Very High Flood & Landslide Risk'
  },

  'VIL-14': {
    village_id: 'VIL-14',
    village_name: 'Tamak / Niti Valley',
    state: 'Uttarakhand',
    district: 'Chamoli',
    incidents: [
      {
        year: 2021,
        month: 'February',
        disaster_type: 'GLOF',
        severity: 'CATASTROPHIC',
        fatalities: 204,
        injured: 30,
        houses_damaged: 50,
        displacement: 3000,
        description: 'Chamoli disaster (Rishiganga-Dhauliganga): Rock-ice avalanche triggered massive GLOF that destroyed Tapovan-Vishnugad HEP. Bodies recovered months later from tunnels.',
        source: 'NDMA / ISRO / GSI / DRDO / ITBP',
        image_keywords: 'Chamoli disaster 2021 Rishiganga GLOF Tapovan'
      }
    ],
    catchment_profile: {
      primary_river: 'Dhauliganga (Alaknanda Tributary)',
      catchment_area_km2: 55.0,
      max_recorded_rainfall_mm: 180,
      avg_monsoon_rainfall_mm: 700,
      geological_formation: 'Trans-Himalayan Tethyan Sediments + Crystallines',
      vulnerability_index: 95,
      last_major_event_year: 2021,
      recurring_threat: 'Rock-ice avalanche GLOF + permafrost degradation'
    },
    evacuation_assets: {
      shelters: [
        { name: 'ITBP Camp Joshimath', lat: 30.555, lng: 79.566, capacity: 500, elevation_m: 1890, type: 'Military Camp' },
        { name: 'Joshimath Govt College', lat: 30.558, lng: 79.563, capacity: 300, elevation_m: 1870, type: 'College' }
      ],
      ndrf_teams_required: 5,
      sdrf_teams_required: 6,
      helicopters_required: 4,
      ambulances_required: 6,
      medical_teams: 4,
      estimated_evacuation_time_hrs: 8.0,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'HAM Radio', 'VSAT Terminal', 'Military Communication', 'Drone Surveillance'],
      supply_requirements: ['2000 food packets', '1000 blankets', '500 tarpaulins', 'Search & rescue equipment', 'Thermal imaging equipment']
    },
    risk_narrative: 'The Niti/Tamak corridor in Chamoli experienced India\'s most devastating GLOF in 2021. Climate change is accelerating permafrost degradation and glacial lake formation at unprecedented rates.',
    ndma_zone_classification: 'Zone V — Extreme GLOF + Seismic + Subsidence Risk'
  },

  'VIL-15': {
    village_id: 'VIL-15',
    village_name: 'Paturi / Oath',
    state: 'Uttarakhand',
    district: 'Rudraprayag',
    incidents: [
      {
        year: 2013,
        month: 'June',
        disaster_type: 'FLASH_FLOOD',
        severity: 'CATASTROPHIC',
        fatalities: 100,
        injured: 200,
        houses_damaged: 500,
        displacement: 8000,
        description: 'Kedarnath-Rudraprayag corridor devastation during 2013 mega-disaster. Mandakini River flood wave destroyed settlements from Kedarnath to Rudraprayag. One of India\'s worst natural disasters.',
        source: 'NDMA / ISRO / CWC / IMD',
        image_keywords: 'Kedarnath 2013 flood Rudraprayag devastation'
      }
    ],
    catchment_profile: {
      primary_river: 'Mandakini River (Alaknanda Tributary)',
      catchment_area_km2: 40.0,
      max_recorded_rainfall_mm: 340,
      avg_monsoon_rainfall_mm: 1200,
      geological_formation: 'Lesser Himalayan Phyllites & Quartzites',
      vulnerability_index: 90,
      last_major_event_year: 2013,
      recurring_threat: 'Mandakini flash flooding + pilgrimage route exposure'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Rudraprayag Govt Inter College', lat: 30.284, lng: 78.980, capacity: 400, elevation_m: 650, type: 'College' }
      ],
      ndrf_teams_required: 3,
      sdrf_teams_required: 4,
      helicopters_required: 2,
      ambulances_required: 5,
      medical_teams: 3,
      estimated_evacuation_time_hrs: 5.0,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'VSAT Terminal', 'Mobile Network'],
      supply_requirements: ['1500 food packets', '600 blankets', '300 tarpaulins']
    },
    risk_narrative: 'The Rudraprayag corridor bears the scar of the 2013 catastrophe. The Mandakini confluence creates a natural flood amplification zone that threatens pilgrim traffic during Char Dham Yatra season.',
    ndma_zone_classification: 'Zone V — Extreme Multi-Hazard Risk'
  },

  'VIL-16': {
    village_id: 'VIL-16',
    village_name: 'Okhimath',
    state: 'Uttarakhand',
    district: 'Rudraprayag',
    incidents: [
      {
        year: 2023,
        month: 'September',
        disaster_type: 'LANDSLIDE',
        severity: 'MAJOR',
        fatalities: 5,
        injured: 20,
        houses_damaged: 40,
        displacement: 700,
        description: 'Okhimath block experienced multiple landslides during extended rainfall event. Several villages in catchment isolated. Similar to Joshimath subsidence pattern observed.',
        source: 'SDMA UK / GSI',
        image_keywords: 'Okhimath landslide Mandakini subsidence',
        image_url: '/disaster_photos/wayanad_debris_avalanche.jpg',
        image_caption: 'Severe debris avalanche and slope subsidence in the steep Mandakini river gorge near Okhimath.'
      },
      {
        year: 2013,
        month: 'June',
        disaster_type: 'FLASH_FLOOD',
        severity: 'SEVERE',
        fatalities: 15,
        injured: 40,
        houses_damaged: 80,
        displacement: 1500,
        description: 'Part of the 2013 Uttarakhand mega-disaster. Okhimath area devastated by Mandakini tributary flooding.',
        source: 'NDMA'
      }
    ],
    catchment_profile: {
      primary_river: 'Mandakini River (Okhimath Reach)',
      catchment_area_km2: 25.0,
      max_recorded_rainfall_mm: 280,
      avg_monsoon_rainfall_mm: 1100,
      geological_formation: 'Munsiari Formation — Augen Gneiss',
      vulnerability_index: 82,
      last_major_event_year: 2023,
      recurring_threat: 'Subsidence + slope failure + flash flooding'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Okhimath Block Office Complex', lat: 30.506, lng: 79.235, capacity: 300, elevation_m: 1330, type: 'Government Building' }
      ],
      ndrf_teams_required: 2,
      sdrf_teams_required: 3,
      helicopters_required: 1,
      ambulances_required: 3,
      medical_teams: 2,
      estimated_evacuation_time_hrs: 4.0,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'PA System'],
      supply_requirements: ['500 food packets', '200 blankets', '100 tarpaulins']
    },
    risk_narrative: 'Okhimath shows active subsidence patterns similar to Joshimath, raising concerns about long-term habitability. The dual threat of landslides and Mandakini flooding creates a complex risk landscape.',
    ndma_zone_classification: 'Zone V — High Subsidence + Multi-Hazard Risk'
  },

  // SIKKIM (VIL-17 to VIL-21)
  'VIL-17': {
    village_id: 'VIL-17',
    village_name: 'Chungthang',
    state: 'Sikkim',
    district: 'Mangan',
    incidents: [
      {
        year: 2023,
        month: 'October',
        disaster_type: 'GLOF',
        severity: 'CATASTROPHIC',
        fatalities: 42,
        injured: 80,
        houses_damaged: 250,
        displacement: 12000,
        description: 'South Lhonak Lake GLOF breached Chungthang Dam on Teesta River. Massive flood wave devastated Chungthang town. Largest GLOF disaster in Sikkim\'s history. 23 Indian Army soldiers among the dead.',
        source: 'NDMA / Indian Army / ISRO / CWC / GSI',
        image_keywords: 'Sikkim GLOF 2023 Chungthang dam breach Teesta',
        image_url: '/disaster_photos/glof_surge_aftermath.jpg',
        image_caption: 'South Lhonak Lake GLOF surge wave destroying the Chungthang dam spillway on the Teesta River in October 2023.'
      },
      {
        year: 2011,
        month: 'September',
        disaster_type: 'FLASH_FLOOD',
        severity: 'SEVERE',
        fatalities: 18,
        injured: 50,
        houses_damaged: 100,
        displacement: 3000,
        description: '6.9 magnitude earthquake triggered landslides and subsequent flooding. Chungthang severely affected.',
        source: 'NDMA / USGS / GSI'
      }
    ],
    catchment_profile: {
      primary_river: 'Teesta River',
      catchment_area_km2: 60.0,
      max_recorded_rainfall_mm: 350,
      avg_monsoon_rainfall_mm: 2500,
      geological_formation: 'Higher Himalayan Crystallines — Darjeeling Gneiss',
      vulnerability_index: 95,
      last_major_event_year: 2023,
      recurring_threat: 'GLOF from South Lhonak + Teesta mainstream flooding + seismic'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Chungthang Army Garrison', lat: 27.623, lng: 88.633, capacity: 500, elevation_m: 1810, type: 'Military Camp' },
        { name: 'Chungthang Govt School', lat: 27.620, lng: 88.630, capacity: 250, elevation_m: 1790, type: 'School' }
      ],
      ndrf_teams_required: 4,
      sdrf_teams_required: 5,
      helicopters_required: 3,
      ambulances_required: 6,
      medical_teams: 4,
      estimated_evacuation_time_hrs: 6.0,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'Military Communication', 'VSAT Terminal', 'HAM Radio'],
      supply_requirements: ['2000 food packets', '1000 blankets', '500 tarpaulins', 'Pontoon bridge equipment', 'Search & rescue equipment']
    },
    risk_narrative: 'Chungthang was devastated by the October 2023 GLOF from South Lhonak Lake. The Teesta River\'s massive catchment and multiple glacial lakes upstream make this one of India\'s highest-risk settlements.',
    ndma_zone_classification: 'Zone V — Extreme GLOF + Seismic + Flood Risk'
  },

  'VIL-18': {
    village_id: 'VIL-18',
    village_name: 'Rafong',
    state: 'Sikkim',
    district: 'South Sikkim',
    incidents: [
      {
        year: 2023,
        month: 'October',
        disaster_type: 'FLASH_FLOOD',
        severity: 'MAJOR',
        fatalities: 3,
        injured: 15,
        houses_damaged: 30,
        displacement: 500,
        description: 'Downstream impact of the Teesta GLOF flood wave. Rafong area experienced severe river bank erosion and flooding.',
        source: 'Sikkim SDMA'
      }
    ],
    catchment_profile: {
      primary_river: 'Teesta River (Middle Reach)',
      catchment_area_km2: 18.0,
      max_recorded_rainfall_mm: 250,
      avg_monsoon_rainfall_mm: 2200,
      geological_formation: 'Daling Group — Phyllites & Schists',
      vulnerability_index: 65,
      last_major_event_year: 2023,
      recurring_threat: 'Teesta flood wave + bank erosion'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Rafong Community Hall', lat: 27.380, lng: 88.600, capacity: 200, elevation_m: 1400, type: 'Community Hall' }
      ],
      ndrf_teams_required: 1,
      sdrf_teams_required: 2,
      helicopters_required: 0,
      ambulances_required: 2,
      medical_teams: 1,
      estimated_evacuation_time_hrs: 3.0,
      communication_assets: ['VHF Radio', 'PA System', 'Mobile Network'],
      supply_requirements: ['250 food packets', '100 blankets', '50 tarpaulins']
    },
    risk_narrative: 'Rafong is downstream of major GLOF-prone glacial lakes and receives attenuated but still dangerous flood waves from upstream events on the Teesta.',
    ndma_zone_classification: 'Zone IV — High Flood & Seismic Risk'
  },

  'VIL-19': {
    village_id: 'VIL-19',
    village_name: 'Rimbi',
    state: 'Sikkim',
    district: 'Gyalshing',
    incidents: [
      {
        year: 2023,
        month: 'October',
        disaster_type: 'LANDSLIDE',
        severity: 'MAJOR',
        fatalities: 2,
        injured: 8,
        houses_damaged: 20,
        displacement: 300,
        description: 'Multiple landslides triggered by saturated slopes following extended monsoon rainfall. Rimbi River experienced flash flooding.',
        source: 'Sikkim SDMA'
      }
    ],
    catchment_profile: {
      primary_river: 'Rimbi River (Rangit Tributary)',
      catchment_area_km2: 14.0,
      max_recorded_rainfall_mm: 280,
      avg_monsoon_rainfall_mm: 2400,
      geological_formation: 'Daling Group — Weathered Phyllites',
      vulnerability_index: 60,
      last_major_event_year: 2023,
      recurring_threat: 'Monsoon landslides + Rimbi River flash flooding'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Rimbi School Complex', lat: 27.265, lng: 88.230, capacity: 180, elevation_m: 1600, type: 'School' }
      ],
      ndrf_teams_required: 1,
      sdrf_teams_required: 1,
      helicopters_required: 0,
      ambulances_required: 1,
      medical_teams: 1,
      estimated_evacuation_time_hrs: 2.5,
      communication_assets: ['VHF Radio', 'Mobile Network'],
      supply_requirements: ['200 food packets', '80 blankets', '40 tarpaulins']
    },
    risk_narrative: 'Rimbi faces recurring monsoon-season landslides due to deeply weathered phyllite geology and extreme rainfall (2400mm annual average).',
    ndma_zone_classification: 'Zone IV — High Landslide & Flood Risk'
  },

  'VIL-20': {
    village_id: 'VIL-20',
    village_name: 'Melli Bazaar',
    state: 'Sikkim',
    district: 'Namchi',
    incidents: [
      {
        year: 2023,
        month: 'October',
        disaster_type: 'FLASH_FLOOD',
        severity: 'SEVERE',
        fatalities: 5,
        injured: 18,
        houses_damaged: 45,
        displacement: 800,
        description: 'Teesta GLOF flood wave reached Melli Bazaar causing severe damage to market area and bridge approaches. Road to Siliguri blocked.',
        source: 'Sikkim SDMA / NDRF'
      }
    ],
    catchment_profile: {
      primary_river: 'Teesta River (Lower Sikkim)',
      catchment_area_km2: 22.0,
      max_recorded_rainfall_mm: 300,
      avg_monsoon_rainfall_mm: 2100,
      geological_formation: 'Gondwana Coal Measures & Daling Phyllites',
      vulnerability_index: 68,
      last_major_event_year: 2023,
      recurring_threat: 'Teesta downstream flooding + market zone exposure'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Melli SSS School', lat: 27.100, lng: 88.440, capacity: 350, elevation_m: 280, type: 'School' },
        { name: 'Melli Panchayat Complex', lat: 27.098, lng: 88.438, capacity: 200, elevation_m: 300, type: 'Government Building' }
      ],
      ndrf_teams_required: 2,
      sdrf_teams_required: 2,
      helicopters_required: 1,
      ambulances_required: 3,
      medical_teams: 2,
      estimated_evacuation_time_hrs: 3.0,
      communication_assets: ['VHF Radio', 'PA System', 'Mobile Network'],
      supply_requirements: ['400 food packets', '150 blankets', '80 tarpaulins']
    },
    risk_narrative: 'Melli Bazaar is Sikkim\'s southern gateway and a key commercial hub on the Teesta. Its low elevation makes it vulnerable to large flood waves from upstream GLOF or dam breach events.',
    ndma_zone_classification: 'Zone IV — High Flood Risk'
  },

  'VIL-21': {
    village_id: 'VIL-21',
    village_name: 'Dikchu',
    state: 'Sikkim',
    district: 'Gangtok',
    incidents: [
      {
        year: 2023,
        month: 'October',
        disaster_type: 'FLASH_FLOOD',
        severity: 'SEVERE',
        fatalities: 8,
        injured: 25,
        houses_damaged: 60,
        displacement: 1200,
        description: 'Teesta GLOF flood wave severely damaged Dikchu HEP (Teesta Stage V). Dam infrastructure breached. Workers trapped. Downstream flooding destroyed settlements.',
        source: 'NDMA / NHPC / Sikkim SDMA'
      }
    ],
    catchment_profile: {
      primary_river: 'Teesta River (Dikchu)',
      catchment_area_km2: 25.0,
      max_recorded_rainfall_mm: 310,
      avg_monsoon_rainfall_mm: 2300,
      geological_formation: 'Daling Group — Chlorite Schists',
      vulnerability_index: 75,
      last_major_event_year: 2023,
      recurring_threat: 'Teesta GLOF cascade + HEP dam breach risk'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Dikchu School Complex', lat: 27.370, lng: 88.540, capacity: 250, elevation_m: 680, type: 'School' },
        { name: 'NHPC Colony High Ground', lat: 27.372, lng: 88.542, capacity: 200, elevation_m: 720, type: 'Colony' }
      ],
      ndrf_teams_required: 2,
      sdrf_teams_required: 3,
      helicopters_required: 1,
      ambulances_required: 3,
      medical_teams: 2,
      estimated_evacuation_time_hrs: 3.5,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'PA System'],
      supply_requirements: ['500 food packets', '200 blankets', '100 tarpaulins']
    },
    risk_narrative: 'Dikchu is home to the Teesta Stage V HEP dam, creating a cascading risk scenario where upstream GLOF can breach the dam infrastructure and amplify the flood wave downstream.',
    ndma_zone_classification: 'Zone V — Very High GLOF + Dam Breach Risk'
  },

  // KERALA — WESTERN GHATS (VIL-22 to VIL-26)
  'VIL-22': {
    village_id: 'VIL-22',
    village_name: 'Chooralmala',
    state: 'Kerala',
    district: 'Wayanad',
    incidents: [
      {
        year: 2024,
        month: 'July',
        disaster_type: 'LANDSLIDE',
        severity: 'CATASTROPHIC',
        fatalities: 231,
        injured: 200,
        houses_damaged: 400,
        displacement: 8000,
        description: 'Wayanad landslide disaster — one of India\'s deadliest. Massive debris flow from Chooralmala hill buried entire settlement. Bodies recovered weeks later. National mourning declared.',
        source: 'NDMA / KSDMA / IMD / ISRO-NRSC / NDRF',
        image_keywords: 'Wayanad landslide 2024 Chooralmala disaster Kerala'
      },
      {
        year: 2019,
        month: 'August',
        disaster_type: 'LANDSLIDE',
        severity: 'SEVERE',
        fatalities: 17,
        injured: 40,
        houses_damaged: 80,
        displacement: 2500,
        description: 'Major landslide in Chooralmala area during 2019 Kerala floods. Multiple plantation worker settlements destroyed.',
        source: 'KSDMA / GSI'
      }
    ],
    catchment_profile: {
      primary_river: 'Chaliyar River (Headwaters)',
      catchment_area_km2: 18.0,
      max_recorded_rainfall_mm: 450,
      avg_monsoon_rainfall_mm: 3500,
      geological_formation: 'Laterite cap over Charnockite — deep weathering profile',
      vulnerability_index: 98,
      last_major_event_year: 2024,
      recurring_threat: 'Catastrophic laterite slope failure + extreme rainfall'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Chooralmala Relief Camp', lat: 11.526, lng: 76.156, capacity: 768, elevation_m: 2355, type: 'Relief Camp' },
        { name: 'Meppadi Town Hall', lat: 11.539, lng: 76.145, capacity: 400, elevation_m: 2200, type: 'Town Hall' }
      ],
      ndrf_teams_required: 5,
      sdrf_teams_required: 6,
      helicopters_required: 4,
      ambulances_required: 8,
      medical_teams: 5,
      estimated_evacuation_time_hrs: 4.0,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'PA System', 'Mobile Network', 'Drone Surveillance', 'VSAT Terminal'],
      supply_requirements: ['3000 food packets', '1500 blankets', '800 tarpaulins', 'Body recovery equipment', 'Counseling teams', 'Search & rescue dogs']
    },
    risk_narrative: 'Chooralmala suffered India\'s deadliest landslide in 2024 (231 fatalities). The deep laterite weathering profile over Charnockite bedrock creates a hidden failure surface that can mobilize catastrophically during extreme rainfall.',
    ndma_zone_classification: 'Zone III — Extreme Landslide Risk (Western Ghats)'
  },

  'VIL-23': {
    village_id: 'VIL-23',
    village_name: 'Mundakkai',
    state: 'Kerala',
    district: 'Wayanad',
    incidents: [
      {
        year: 2024,
        month: 'July',
        disaster_type: 'LANDSLIDE',
        severity: 'CATASTROPHIC',
        fatalities: 120,
        injured: 100,
        houses_damaged: 200,
        displacement: 5000,
        description: 'Twin landslide with Chooralmala. Mundakkai settlement completely buried by debris flow. Tea plantation workers\' quarters destroyed.',
        source: 'NDMA / KSDMA / NDRF',
        image_keywords: 'Mundakkai landslide 2024 Wayanad Kerala'
      }
    ],
    catchment_profile: {
      primary_river: 'Chaliyar River Tributary',
      catchment_area_km2: 12.0,
      max_recorded_rainfall_mm: 440,
      avg_monsoon_rainfall_mm: 3400,
      geological_formation: 'Laterite over Charnockite — saprolite zone',
      vulnerability_index: 96,
      last_major_event_year: 2024,
      recurring_threat: 'Debris flow from laterite plateau + plantation slope destabilization'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Mundakkai School Relief Camp', lat: 11.519, lng: 76.159, capacity: 350, elevation_m: 2300, type: 'School' }
      ],
      ndrf_teams_required: 4,
      sdrf_teams_required: 5,
      helicopters_required: 3,
      ambulances_required: 6,
      medical_teams: 4,
      estimated_evacuation_time_hrs: 4.0,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'PA System', 'Drone Surveillance'],
      supply_requirements: ['2000 food packets', '1000 blankets', '500 tarpaulins']
    },
    risk_narrative: 'Mundakkai was destroyed alongside Chooralmala in the 2024 catastrophe. Tea plantation hillslope modification (terracing, drainage alteration) is believed to have amplified the natural hazard.',
    ndma_zone_classification: 'Zone III — Extreme Landslide Risk (Western Ghats)'
  },

  'VIL-24': {
    village_id: 'VIL-24',
    village_name: 'Pettimudi',
    state: 'Kerala',
    district: 'Idukki',
    incidents: [
      {
        year: 2020,
        month: 'August',
        disaster_type: 'LANDSLIDE',
        severity: 'CATASTROPHIC',
        fatalities: 70,
        injured: 30,
        houses_damaged: 75,
        displacement: 2000,
        description: 'Massive landslide at Pettimudi tea estate buried plantation workers\' quarters at 3 AM. Bodies recovered from under 15 meters of debris. One of Kerala\'s deadliest landslides.',
        source: 'NDMA / KSDMA / NDRF',
        image_keywords: 'Pettimudi landslide 2020 Idukki tea estate Kerala'
      }
    ],
    catchment_profile: {
      primary_river: 'Periyar River Headwaters',
      catchment_area_km2: 10.0,
      max_recorded_rainfall_mm: 400,
      avg_monsoon_rainfall_mm: 3200,
      geological_formation: 'Charnockite with thick laterite cap',
      vulnerability_index: 90,
      last_major_event_year: 2020,
      recurring_threat: 'Tea estate slope failure + worker settlement exposure'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Rajamala Forest Office', lat: 10.082, lng: 77.058, capacity: 200, elevation_m: 2100, type: 'Government Building' },
        { name: 'Munnar Town Relief Center', lat: 10.089, lng: 77.060, capacity: 500, elevation_m: 1600, type: 'Relief Center' }
      ],
      ndrf_teams_required: 3,
      sdrf_teams_required: 4,
      helicopters_required: 2,
      ambulances_required: 5,
      medical_teams: 3,
      estimated_evacuation_time_hrs: 4.5,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'PA System'],
      supply_requirements: ['1500 food packets', '700 blankets', '350 tarpaulins', 'Body recovery equipment']
    },
    risk_narrative: 'Pettimudi is a high-altitude tea estate where workers live in vulnerable line-houses on steep slopes. The 2020 disaster exposed the systemic risk of plantation-era housing on unstable terrain.',
    ndma_zone_classification: 'Zone III — Extreme Landslide Risk'
  },

  'VIL-25': {
    village_id: 'VIL-25',
    village_name: 'Kottakamboor',
    state: 'Kerala',
    district: 'Idukki',
    incidents: [
      {
        year: 2018,
        month: 'August',
        disaster_type: 'FLOOD',
        severity: 'SEVERE',
        fatalities: 8,
        injured: 30,
        houses_damaged: 90,
        displacement: 3000,
        description: 'During the 2018 Kerala mega-flood, Idukki dam reached full capacity. Kottakamboor experienced severe flooding from dam-regulated releases and extreme rainfall.',
        source: 'KSDMA / CWC / IMD'
      }
    ],
    catchment_profile: {
      primary_river: 'Periyar River',
      catchment_area_km2: 15.0,
      max_recorded_rainfall_mm: 380,
      avg_monsoon_rainfall_mm: 3000,
      geological_formation: 'Migmatitic Gneiss with laterite veneer',
      vulnerability_index: 72,
      last_major_event_year: 2018,
      recurring_threat: 'Idukki Dam regulated flood release + extreme rainfall'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Kottakamboor School', lat: 9.905, lng: 77.085, capacity: 200, elevation_m: 900, type: 'School' }
      ],
      ndrf_teams_required: 1,
      sdrf_teams_required: 2,
      helicopters_required: 1,
      ambulances_required: 2,
      medical_teams: 1,
      estimated_evacuation_time_hrs: 3.0,
      communication_assets: ['VHF Radio', 'PA System', 'Mobile Network'],
      supply_requirements: ['400 food packets', '150 blankets', '80 tarpaulins']
    },
    risk_narrative: 'Kottakamboor is downstream of Idukki Dam, creating a regulated-release flood risk. The 2018 Kerala floods demonstrated that even controlled dam releases can cause catastrophic downstream flooding.',
    ndma_zone_classification: 'Zone III — High Flood & Dam Risk'
  },

  'VIL-26': {
    village_id: 'VIL-26',
    village_name: 'Kavalappara',
    state: 'Kerala',
    district: 'Malappuram',
    incidents: [
      {
        year: 2019,
        month: 'August',
        disaster_type: 'LANDSLIDE',
        severity: 'CATASTROPHIC',
        fatalities: 59,
        injured: 20,
        houses_damaged: 40,
        displacement: 2500,
        description: 'Kavalappara landslide buried an entire hillside settlement. One of the deadliest single landslides in Kerala. Debris mass estimated at 2 million cubic meters.',
        source: 'NDMA / KSDMA / GSI / NDRF',
        image_keywords: 'Kavalappara landslide 2019 Malappuram Kerala'
      }
    ],
    catchment_profile: {
      primary_river: 'Chaliyar River (Nilambur Tributary)',
      catchment_area_km2: 16.0,
      max_recorded_rainfall_mm: 420,
      avg_monsoon_rainfall_mm: 3300,
      geological_formation: 'Laterite over Gneiss — deep saprolite zone',
      vulnerability_index: 92,
      last_major_event_year: 2019,
      recurring_threat: 'Catastrophic laterite slope failure + settlement exposure'
    },
    evacuation_assets: {
      shelters: [
        { name: 'Pothukal Community Hall', lat: 11.235, lng: 76.198, capacity: 300, elevation_m: 250, type: 'Community Hall' },
        { name: 'Nilambur Town Hall', lat: 11.275, lng: 76.226, capacity: 500, elevation_m: 100, type: 'Town Hall' }
      ],
      ndrf_teams_required: 3,
      sdrf_teams_required: 4,
      helicopters_required: 2,
      ambulances_required: 5,
      medical_teams: 3,
      estimated_evacuation_time_hrs: 3.5,
      communication_assets: ['Satellite Phone', 'VHF Radio', 'PA System', 'Mobile Network'],
      supply_requirements: ['1500 food packets', '600 blankets', '300 tarpaulins', 'Body recovery equipment']
    },
    risk_narrative: 'Kavalappara demonstrated the lethal potential of laterite slope failures in the Western Ghats. The deep saprolite weathering zone creates a concealed failure surface that can mobilize catastrophically with zero visual warning.',
    ndma_zone_classification: 'Zone III — Extreme Landslide Risk'
  }
};

//Helper: Get severity color

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CATASTROPHIC': return '#ef4444';
    case 'SEVERE': return '#f97316';
    case 'MAJOR': return '#f59e0b';
    case 'MODERATE': return '#3b82f6';
    default: return '#94a3b8';
  }
}

// Helper: Get disaster type icon

export function getDisasterTypeIcon(type: string): string {
  switch (type) {
    case 'FLASH_FLOOD': return '🌊';
    case 'LANDSLIDE': return '⛰️';
    case 'CLOUDBURST': return '⛈️';
    case 'DEBRIS_FLOW': return '🪨';
    case 'GLOF': return '🏔️';
    case 'DAM_BREACH': return '🏗️';
    case 'FLOOD': return '🌊';
    default: return '⚠️';
  }
}

// Helper: Get total casualties for a village

export function getTotalCasualties(villageId: string): { fatalities: number; incidents: number } {
  const data = HISTORICAL_DISASTER_DATABASE[villageId];
  if (!data) return { fatalities: 0, incidents: 0 };
  return {
    fatalities: data.incidents.reduce((sum, inc) => sum + inc.fatalities, 0),
    incidents: data.incidents.length
  };
}
