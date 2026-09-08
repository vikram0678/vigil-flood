export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "EXTREME" | "DANGER" | "WARNING" | "NORMAL" | "NO_DATA";

export type RoleMode = "authority" | "citizen";

export type ViewMode = "2d" | "3d";

export type Basemap2D = "google_floodhub" | "google_terrain" | "google_satellite" | "google_dark" | "topo";

export type Basemap3D = "google_hybrid" | "esri_satellite" | "topo_3d" | "dark_3d";

export interface Shelter {
  name: string;
  lat: number;
  lng: number;
  elevation_m: number;
  capacity: number;
  is_primary: boolean;
}

export interface EvacuationRoute {
  name: string;
  type: string;
  is_safe: boolean;
  clearance_elevation_m: number;
  path: [number, number][]; // [lat, lng]
}

export interface Village {
  id: string;
  name: string;
  ward: string;
  lat: number;
  lng: number;
  elevation_m: number;
  slope_deg: number;
  distance_to_stream_m: number;
  population: number;
  risk_level: RiskLevel;
  risk_percentage: number;
  risk_badge: string;
  lead_time_display: string;
  primary_shelter: string;
  inundation_polygon?: [number, number][];
  river_stream?: [number, number][];
  shelters?: Shelter[];
  routes?: EvacuationRoute[];
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
  type: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  health_score: number;
}

export interface SensorHealth {
  sensors: SensorStatus[];
  data_health_pct: number;
  is_fallback_active: boolean;
  model_dispatched: string;
}

export interface ActionPlan {
  alert_level: string;
  primary_shelter: string;
  recommended_route: string;
  ndrf_response_tier: string;
  public_broadcast: string;
  safety_directives: string[];
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
