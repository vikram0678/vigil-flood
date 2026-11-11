export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "EXTREME" | "DANGER" | "WARNING" | "NORMAL" | "NO_DATA";

export type HazardFilterType = "ALL" | "LANDSLIDE" | "FLASH_FLOOD" | "MULTI_HAZARD";

export type RoleMode = "authority" | "citizen";

export type ThemeMode = "dark" | "light";

export type ViewMode = "2d" | "3d";

export type Basemap2D = "google_floodhub" | "google_terrain" | "google_satellite" | "google_dark" | "topo";

export type Basemap3D = "google_hybrid" | "esri_satellite" | "topo_3d" | "dark_3d";

export interface HazardZones {
  red_inundation_polygon?: [number, number][];
  orange_slope_polygon?: [number, number][];
  green_safe_polygon?: [number, number][];
}

export interface Shelter {
  name: string;
  lat: number;
  lng: number;
  elevation_m: number;
  capacity: number;
  is_primary?: boolean;
}

export interface EvacuationRoute {
  name: string;
  status?: string;
  safety_score?: number;
  type?: string;
  is_safe?: boolean;
  clearance_elevation_m?: number;
  path: [number, number][]; // [lat, lng]
}

export interface SensorLocation {
  id: string;
  type: string;
  lat: number;
  lng: number;
  status?: string;
}

export interface Village {
  id: string;
  basin_id?: string;
  name: string;
  ward: string;
  district?: string;
  state?: string;
  lat: number;
  lng: number;
  elevation_m: number;
  slope_deg: number;
  soil_type?: string;
  distance_to_stream_m: number;
  historical_landslide_count?: number;
  historical_flood_count?: number;
  population: number;
  vulnerable_households?: number;
  risk_level: RiskLevel;
  risk_percentage: number;
  risk_badge: string;
  lead_time_display: string;
  primary_shelter?: string | Shelter;
  hazard_zones?: HazardZones;
  inundation_polygon?: [number, number][];
  river_stream?: [number, number][];
  shelters?: Shelter[];
  safe_shelters?: Shelter[];
  routes?: EvacuationRoute[];
  evacuation_routes?: EvacuationRoute[];
  sensor_locations?: SensorLocation[];
  sensors?: Record<string, string>;
}

export interface Telemetry {
  rain_1h: number;
  rain_3h: number;
  rain_6h: number;
  rain_24h: number;
  forecast_rain_3h: number;
  soil_moisture: number;
  water_level_m: number | null;
  water_level_rise_rate: number;
  tilt_deg: number;
  vibration_g: number;
  pore_pressure_kpa: number;
  timestamp: string;
}

export interface ExplainabilityFactor {
  feature: string;
  display_name: string;
  impact_score: number;
  impact_percentage: number;
  is_primary_driver: boolean;
}

export interface UncertaintyQuantification {
  uncertainty_band_pct?: number;
  confidence_interval_95?: [number, number];
  display_interval?: string;
  display_band?: string;
  epistemic_uncertainty?: number;
  aleatoric_uncertainty?: number;
  conformal_interval?: [number, number];
  conformal_guarantee?: string;
  mc_dropout_passes?: number;
}

export interface PhysicsGuardrail {
  status?: string;
  law?: string;
  max_theoretical_runoff_mm?: number;
  runoff_coefficient?: number;
  constrained_flood_prob?: number;
  mass_conservation_satisfied?: boolean;
  override_applied?: boolean;
  override_type?: string;
  explanation?: string;
}

export interface BayesianModelAveraging {
  lstm_weight?: number;
  gbdt_weight?: number;
  regime?: string;
  volatility_score?: number;
  method?: string;
}

export interface RiskAnalysis {
  risk_level: RiskLevel;
  risk_percentage: number;
  risk_badge: string;
  model_type: string;
  confidence_score: number;
  explainability: ExplainabilityFactor[];
  uncertainty_quantification?: UncertaintyQuantification;
  physics_guardrail?: PhysicsGuardrail;
  bayesian_model_averaging?: BayesianModelAveraging;
}

export interface ProbabilisticLeadTimeDistribution {
  distribution_model?: string;
  prob_under_15m?: number;
  prob_15_to_30m?: number;
  prob_30_to_60m?: number;
  prob_over_60m?: number;
  percentiles?: {
    p10_conservative_m?: number;
    p50_median_m?: number;
    p90_upper_m?: number;
  };
  histogram?: Array<{ range: string; pct: number; urgency: string }>;
}

export interface LeadTime {
  lead_time_min_minutes?: number;
  lead_time_max_minutes?: number;
  lead_time_min?: number;
  window_display: string;
  evacuation_status: string;
  recommended_urgency?: string;
  probabilistic_distribution?: ProbabilisticLeadTimeDistribution;
}

export interface SensorStatus {
  sensor_id: string;
  sensor_type: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  value?: number | null;
  is_usable?: boolean;
  note?: string;
}

export interface SensorHealth {
  sensors: SensorStatus[];
  data_health_pct: number;
  fallback_active: boolean;
  water_sensor_usable?: boolean;
  model_dispatched?: string;
}

export interface ShelterInfo {
  name: string;
  lat?: number;
  lng?: number;
  capacity?: number;
  elevation_m?: number;
}

export interface RouteInfo {
  name: string;
  status?: string;
  safety_score?: number;
  path?: [number, number][];
}

export interface ICSCommandStructure {
  command_tier?: string;
  lead_agency?: string;
  coordination_nodes?: string[];
  incident_commander?: string;
  golden_hour_timeline?: Array<{ time: string; action: string }>;
  tactical_status?: string;
}

export interface DualAgencyVerification {
  dem_primary?: string;
  dem_verification?: string;
  landslide_susceptibility_atlas?: string;
  vertical_datum?: string;
  verification_badge?: string;
}

export interface ActionPlan {
  headline?: string;
  status?: string;
  escalation_tier?: string;
  ndrf_response_tier?: string;
  alert_level?: string;
  recommended_actions?: string[];
  safety_directives?: string[];
  primary_shelter?: string | ShelterInfo;
  recommended_route?: string | RouteInfo;
  blocked_route?: string | RouteInfo;
  public_broadcast?: string;
  simulated_sms_broadcast?: string;
  ics_command_structure?: ICSCommandStructure;
  dual_agency_verification?: DualAgencyVerification;
  disaster_logistics?: any;
}

export interface VillageDetailResponse {
  village: Village;
  telemetry: Telemetry;
  risk_analysis: RiskAnalysis;
  lead_time: LeadTime;
  sensor_health: SensorHealth;
  action_plan: ActionPlan;
  demographics?: any;
}

export interface WhatIfPreset {
  id: string;
  name: string;
  description: string;
  rain_1h: number;
  soil_moisture: number;
  water_level_m: number;
}

export interface BasinSummary {
  basin_id: string;
  name: string;
  state: string;
  region_type: string;
  center_coords: [number, number];
  default_zoom: number;
  bounding_box: [[number, number], [number, number]];
  total_villages: number;
  active_threat_level: "BASELINE" | "WATCH" | "WARNING" | "CRITICAL";
  primary_river: string;
  hydrology_agency: string;
  description: string;
}

export interface HazardSymbol {
  id: string;
  event: string;
  event_type: "CLOUDBURST" | "FLASH_FLOOD" | "LANDSLIDE" | "HEAVY_RAIN" | "SWELL_SURGE" | "LIGHTNING" | "NORMAL";
  severity: "CRITICAL" | "WARNING" | "WATCH" | "NORMAL";
  color: string;
  icon: string;
  state: string;
  district: string;
  location_name: string;
  coordinates: [number, number];
  elevation_m: number;
  rainfall_mmh: number;
  soil_moisture_pct: number;
  headline: string;
  issued_by: string;
  action_directive: string;
  effective_until: string;
}


