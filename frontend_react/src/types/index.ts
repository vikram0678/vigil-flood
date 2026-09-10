export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "EXTREME" | "DANGER" | "WARNING" | "NORMAL" | "NO_DATA";

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

export interface RiskAnalysis {
  risk_level: RiskLevel;
  risk_percentage: number;
  risk_badge: string;
  model_type: string;
  confidence_score: number;
  explainability: ExplainabilityFactor[];
}

export interface LeadTime {
  lead_time_min_minutes: number;
  lead_time_max_minutes: number;
  window_display: string;
  evacuation_status: string;
  recommended_urgency: string;
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
}

export interface VillageDetailResponse {
  village: Village;
  telemetry: Telemetry;
  risk_analysis: RiskAnalysis;
  lead_time: LeadTime;
  sensor_health: SensorHealth;
  action_plan: ActionPlan;
}

export interface WhatIfPreset {
  id: string;
  name: string;
  description: string;
  rain_1h: number;
  soil_moisture: number;
  water_level_m: number;
}
