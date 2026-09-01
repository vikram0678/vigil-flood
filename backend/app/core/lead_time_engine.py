from typing import Dict, Any

class LeadTimeEngine:
    """
    Estimates actionable warning lead time (in minutes) before hazardous 
    flash flood inundation or landslide slope failure reaches settlements.
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
                "message": "Conditions are stable. Continuous passive telemetry active."
            }
            
        # Hydrological time-to-peak approximation (Rational method modified for steep mountain micro-catchments)
        # Higher slope & saturated soil accelerate runoff velocity
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
            
        return {
            "lead_time_min": lead_time_minutes,
            "window_display": f"{lower_bound} - {upper_bound} min",
            "urgency": urgency,
            "message": msg
        }

lead_time_engine = LeadTimeEngine()
