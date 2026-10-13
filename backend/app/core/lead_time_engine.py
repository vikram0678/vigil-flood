import numpy as np
import scipy.stats as stats
from typing import Dict, Any, List

class LeadTimeEngine:
    """
    Estimates actionable warning lead time (in minutes) before hazardous 
    flash flood inundation or landslide slope failure reaches settlements.
    
    Includes Probabilistic Lead-Time Distribution (Gamma/Log-Normal Hydrological Density),
    providing disaster commanders with quantitative arrival probabilities across golden-hour windows.
    """
    
    @staticmethod
    def calculate_lead_time(
        rain_1h: float, 
        soil_moisture: float, 
        water_level_rise_rate: float, 
        slope_deg: float, 
        distance_to_stream_m: float,
        combined_risk: float
    ) -> Dict[str, Any]:
        if combined_risk < 0.30:
            return {
                "lead_time_min": 180,
                "window_display": "> 2 - 3 hours",
                "urgency": "NORMAL",
                "message": "Conditions are stable. Continuous passive telemetry active.",
                "probabilistic_distribution": {
                    "distribution_model": "Gamma-Seddon Dispersion",
                    "prob_under_15m": 1,
                    "prob_15_to_30m": 3,
                    "prob_30_to_60m": 10,
                    "prob_over_60m": 86,
                    "percentiles": {"p10_conservative_m": 120, "p50_median_m": 180, "p90_upper_m": 240},
                    "histogram": [
                        {"range": "0-15m", "pct": 1, "urgency": "critical"},
                        {"range": "15-30m", "pct": 3, "urgency": "warning"},
                        {"range": "30-45m", "pct": 4, "urgency": "moderate"},
                        {"range": "45-60m", "pct": 6, "urgency": "moderate"},
                        {"range": "60m+", "pct": 86, "urgency": "nominal"}
                    ]
                }
            }
            
        # Hydrological time-to-peak approximation (Rational method modified for steep mountain micro-catchments)
        velocity_factor = (slope_deg / 30.0) * (soil_moisture / 70.0)
        surge_speed = max(0.5, 1.0 + (water_level_rise_rate * 1.2) + (rain_1h / 60.0))
        
        # Base lead time calculation in minutes
        raw_minutes = 90.0 - (combined_risk * 55.0) - (velocity_factor * 12.0)
        
        # Closer distance to stream further reduces evacuation buffer
        distance_penalty = max(0.0, (200.0 - distance_to_stream_m) / 15.0)
        lead_time_minutes = int(round(max(15.0, min(120.0, raw_minutes - distance_penalty))))
        
        # Determine human-actionable window
        lower_bound = max(10, lead_time_minutes - 10)
        upper_bound = lead_time_minutes + 15
        
        if combined_risk >= 0.75:
            urgency = "IMMEDIATE_ACTION"
            msg = f"Immediate evacuation window: ~{lead_time_minutes} minutes before critical stream overtopping."
        elif combined_risk >= 0.55:
            urgency = "HIGH_ALERT"
            msg = f"Preparatory window: ~{lead_time_minutes} minutes. Ready evacuation of vulnerable residents."
        else:
            urgency = "ADVISORY"
            msg = f"Monitoring window: ~{lead_time_minutes} minutes. Advise caution near watercourses."

        # Compute Probabilistic Gamma-Hydrological Arrival Distribution
        # k (shape) and theta (scale) fitted such that mean = lead_time_minutes
        std_dev = max(5.0, lead_time_minutes * 0.26)
        k_shape = (lead_time_minutes / std_dev) ** 2
        theta_scale = (std_dev ** 2) / lead_time_minutes
        
        dist = stats.gamma(a=k_shape, scale=theta_scale)
        
        # Cumulative arrival probabilities
        p_15 = float(dist.cdf(15.0))
        p_30 = float(dist.cdf(30.0))
        p_45 = float(dist.cdf(45.0))
        p_60 = float(dist.cdf(60.0))
        
        prob_under_15 = int(round(p_15 * 100))
        prob_15_30 = int(round(max(0.0, p_30 - p_15) * 100))
        prob_30_60 = int(round(max(0.0, p_60 - p_30) * 100))
        prob_over_60 = int(round(max(0.0, 1.0 - p_60) * 100))
        
        prob_30_45 = int(round(max(0.0, p_45 - p_30) * 100))
        prob_45_60 = int(round(max(0.0, p_60 - p_45) * 100))
        
        # Ensure percentages sum to 100
        total_p = prob_under_15 + prob_15_30 + prob_30_60 + prob_over_60
        if total_p != 100:
            diff = 100 - total_p
            prob_over_60 = max(0, prob_over_60 + diff)

        # Operational Golden-Hour Percentiles
        p10 = int(round(max(5.0, float(dist.ppf(0.10)))))
        p50 = int(round(float(dist.ppf(0.50))))
        p90 = int(round(float(dist.ppf(0.90))))

        probabilistic_payload = {
            "distribution_model": "Gamma-Seddon Wave Dispersion",
            "prob_under_15m": prob_under_15,
            "prob_15_to_30m": prob_15_30,
            "prob_30_to_60m": prob_30_60,
            "prob_over_60m": prob_over_60,
            "percentiles": {
                "p10_conservative_m": p10,
                "p50_median_m": p50,
                "p90_upper_m": p90
            },
            "histogram": [
                {"range": "0-15m", "pct": prob_under_15, "urgency": "critical"},
                {"range": "15-30m", "pct": prob_15_30, "urgency": "warning"},
                {"range": "30-45m", "pct": prob_30_45, "urgency": "moderate"},
                {"range": "45-60m", "pct": prob_45_60, "urgency": "moderate"},
                {"range": "60m+", "pct": prob_over_60, "urgency": "nominal"}
            ]
        }
            
        return {
            "lead_time_min": lead_time_minutes,
            "window_display": f"{lower_bound} - {upper_bound} min",
            "urgency": urgency,
            "message": msg,
            "probabilistic_distribution": probabilistic_payload
        }

lead_time_engine = LeadTimeEngine()

