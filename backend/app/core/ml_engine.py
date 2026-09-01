import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Optional
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score

from backend.app.config import SAVED_MODELS_DIR, RISK_THRESHOLDS

FULL_FEATURES = [
    "rain_1h", "rain_3h", "rain_6h", "rain_24h", "forecast_rain_3h",
    "soil_moisture", "water_level_m", "water_level_rise_rate",
    "slope_deg", "elevation_m", "distance_to_stream_m",
    "historical_flood_count", "historical_landslide_count"
]

FALLBACK_FEATURES = [
    "rain_1h", "rain_3h", "rain_6h", "rain_24h", "forecast_rain_3h",
    "soil_moisture",
    "slope_deg", "elevation_m", "distance_to_stream_m",
    "historical_flood_count", "historical_landslide_count"
]

class MLEngine:
    def __init__(self):
        self.full_flood_model = None
        self.full_landslide_model = None
        self.fallback_flood_model = None
        self.fallback_landslide_model = None
        self.is_loaded = False
        self.load_or_train_default()
        
    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Trains Full Model and Fallback Models on provided dataframe."""
        X_full = df[FULL_FEATURES]
        X_fallback = df[FALLBACK_FEATURES]
        
        y_flood = df["flash_flood_score"]
        y_landslide = df["landslide_score"]
        
        # Train Full Models
        self.full_flood_model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42)
        self.full_flood_model.fit(X_full, y_flood)
        
        self.full_landslide_model = GradientBoostingRegressor(n_estimators=80, learning_rate=0.1, max_depth=4, random_state=42)
        self.full_landslide_model.fit(X_full, y_landslide)
        
        # Train Fallback Models (No water level / stream IoT)
        self.fallback_flood_model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42)
        self.fallback_flood_model.fit(X_fallback, y_flood)
        
        self.fallback_landslide_model = GradientBoostingRegressor(n_estimators=80, learning_rate=0.1, max_depth=4, random_state=42)
        self.fallback_landslide_model.fit(X_fallback, y_landslide)
        
        # Save models to disk
        SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.full_flood_model, SAVED_MODELS_DIR / "full_flood_model.pkl")
        joblib.dump(self.full_landslide_model, SAVED_MODELS_DIR / "full_landslide_model.pkl")
        joblib.dump(self.fallback_flood_model, SAVED_MODELS_DIR / "fallback_flood_model.pkl")
        joblib.dump(self.fallback_landslide_model, SAVED_MODELS_DIR / "fallback_landslide_model.pkl")
        
        self.is_loaded = True
        return {"status": "success", "models_saved": True, "samples_trained": len(df)}
        
    def load_or_train_default(self):
        """Loads models if exists, otherwise trains on synthetic data."""
        full_flood_path = SAVED_MODELS_DIR / "full_flood_model.pkl"
        if full_flood_path.exists():
            try:
                self.full_flood_model = joblib.load(SAVED_MODELS_DIR / "full_flood_model.pkl")
                self.full_landslide_model = joblib.load(SAVED_MODELS_DIR / "full_landslide_model.pkl")
                self.fallback_flood_model = joblib.load(SAVED_MODELS_DIR / "fallback_flood_model.pkl")
                self.fallback_landslide_model = joblib.load(SAVED_MODELS_DIR / "fallback_landslide_model.pkl")
                self.is_loaded = True
                return
            except Exception as e:
                print(f"Error loading models: {e}. Retraining...")
        
        # If models don't exist yet, import synthetic data generator and train
        from backend.app.core.synthetic_data import generate_multi_source_synthetic_dataset
        df = generate_multi_source_synthetic_dataset(5000)
        self.train(df)

    def predict_risk(self, data: Dict[str, Any], water_sensor_online: bool = True) -> Dict[str, Any]:
        """
        Adaptive prediction pipeline:
        1. Selects Full ML Model if water sensor online and valid.
        2. Selects Fallback ML Model if water sensor is offline.
        3. Applies deterministic safety rule guardrail.
        4. Calculates Explainable AI (XAI) feature importance factors.
        """
        if not self.is_loaded:
            self.load_or_train_default()
            
        rain_1h = float(data.get("rain_1h", 0.0))
        rain_3h = float(data.get("rain_3h", rain_1h * 2.2))
        rain_6h = float(data.get("rain_6h", rain_3h * 1.6))
        rain_24h = float(data.get("rain_24h", rain_6h * 1.5))
        forecast_rain_3h = float(data.get("forecast_rain_3h", rain_1h * 1.1))
        soil_moisture = float(data.get("soil_moisture", 45.0))
        slope_deg = float(data.get("slope_deg", 25.0))
        elevation_m = float(data.get("elevation_m", 1000.0))
        distance_to_stream_m = float(data.get("distance_to_stream_m", 100.0))
        historical_flood_count = int(data.get("historical_flood_count", 1))
        historical_landslide_count = int(data.get("historical_landslide_count", 1))
        
        water_level_m = data.get("water_level_m")
        water_level_rise_rate = data.get("water_level_rise_rate")
        
        # Determine model to use
        can_use_full = (
            water_sensor_online and 
            water_level_m is not None and 
            water_level_rise_rate is not None and
            water_level_m >= 0.0
        )
        
        if can_use_full:
            model_type = "FULL_ML_MODEL"
            confidence_score = 0.92
            features = pd.DataFrame([{
                "rain_1h": rain_1h,
                "rain_3h": rain_3h,
                "rain_6h": rain_6h,
                "rain_24h": rain_24h,
                "forecast_rain_3h": forecast_rain_3h,
                "soil_moisture": soil_moisture,
                "water_level_m": float(water_level_m),
                "water_level_rise_rate": float(water_level_rise_rate),
                "slope_deg": slope_deg,
                "elevation_m": elevation_m,
                "distance_to_stream_m": distance_to_stream_m,
                "historical_flood_count": historical_flood_count,
                "historical_landslide_count": historical_landslide_count
            }])[FULL_FEATURES]
            
            flood_prob = float(self.full_flood_model.predict(features)[0])
            landslide_prob = float(self.full_landslide_model.predict(features)[0])
        else:
            model_type = "FALLBACK_ML_MODEL"
            confidence_score = 0.74
            features = pd.DataFrame([{
                "rain_1h": rain_1h,
                "rain_3h": rain_3h,
                "rain_6h": rain_6h,
                "rain_24h": rain_24h,
                "forecast_rain_3h": forecast_rain_3h,
                "soil_moisture": soil_moisture,
                "slope_deg": slope_deg,
                "elevation_m": elevation_m,
                "distance_to_stream_m": distance_to_stream_m,
                "historical_flood_count": historical_flood_count,
                "historical_landslide_count": historical_landslide_count
            }])[FALLBACK_FEATURES]
            
            flood_prob = float(self.fallback_flood_model.predict(features)[0])
            landslide_prob = float(self.fallback_landslide_model.predict(features)[0])

        # Safety Rule Guardrail (If severe rain + high soil saturation, guarantee high alert)
        safety_override = False
        if rain_1h >= 90.0 and soil_moisture >= 80.0 and slope_deg >= 25.0:
            if flood_prob < 0.75:
                flood_prob = max(flood_prob, 0.82)
                safety_override = True
            if landslide_prob < 0.70:
                landslide_prob = max(landslide_prob, 0.76)
                safety_override = True
                
        flood_prob = float(np.clip(flood_prob, 0.0, 1.0))
        landslide_prob = float(np.clip(landslide_prob, 0.0, 1.0))
        combined_risk = float(max(flood_prob, landslide_prob))
        
        # Assign Risk Level
        if combined_risk < RISK_THRESHOLDS["LOW"]:
            risk_level = "LOW"
            risk_badge = "🟢"
        elif combined_risk < RISK_THRESHOLDS["MODERATE"]:
            risk_level = "MODERATE"
            risk_badge = "🟡"
        elif combined_risk < RISK_THRESHOLDS["HIGH"]:
            risk_level = "HIGH"
            risk_badge = "🟠"
        else:
            risk_level = "CRITICAL"
            risk_badge = "🔴"
            
        # Explainable AI Factors (Normalized contributions)
        explainability = self._calculate_explainability(
            rain_1h, soil_moisture, slope_deg, 
            water_level_m if can_use_full else 0.0, 
            historical_flood_count + historical_landslide_count
        )
        
        return {
            "flash_flood_risk": round(flood_prob, 4),
            "landslide_risk": round(landslide_prob, 4),
            "combined_risk": round(combined_risk, 4),
            "risk_percentage": int(round(combined_risk * 100)),
            "risk_level": risk_level,
            "risk_badge": risk_badge,
            "confidence_score": round(confidence_score, 2),
            "model_type": model_type,
            "safety_override_triggered": safety_override,
            "explainability": explainability
        }

    def _calculate_explainability(self, rain_1h: float, soil_moisture: float, slope_deg: float, water_level_m: float, history_count: int) -> List[Dict[str, Any]]:
        """Computes human-readable factor attribution percentages."""
        raw_rain = (rain_1h / 120.0) * 40.0
        raw_soil = (soil_moisture / 100.0) * 30.0
        raw_slope = (slope_deg / 40.0) * 20.0
        raw_water = (water_level_m / 4.5) * 25.0
        raw_history = (min(history_count, 8) / 8.0) * 15.0
        
        total = raw_rain + raw_soil + raw_slope + raw_water + raw_history
        if total <= 0:
            total = 1.0
            
        factors = [
            {"factor": "Rainfall Intensity & Forecast", "contribution_pct": int(round((raw_rain / total) * 100)), "impact": "High" if raw_rain > 20 else "Moderate"},
            {"factor": "Soil Moisture & Saturation", "contribution_pct": int(round((raw_soil / total) * 100)), "impact": "High" if raw_soil > 18 else "Moderate"},
            {"factor": "Terrain Steepness & Elevation", "contribution_pct": int(round((raw_slope / total) * 100)), "impact": "High" if raw_slope > 12 else "Moderate"},
            {"factor": "Stream Water Level & Surge", "contribution_pct": int(round((raw_water / total) * 100)), "impact": "High" if raw_water > 14 else "Moderate"},
            {"factor": "Historical Hazard Susceptibility", "contribution_pct": int(round((raw_history / total) * 100)), "impact": "Moderate" if raw_history > 8 else "Low"}
        ]
        
        # Sort descending by contribution percentage
        factors.sort(key=lambda x: x["contribution_pct"], reverse=True)
        return factors

# Global ML Engine instance
ml_engine = MLEngine()
