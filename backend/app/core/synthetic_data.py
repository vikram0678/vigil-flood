import numpy as np
import pandas as pd
from typing import Tuple

def generate_multi_source_synthetic_dataset(n_samples: int = 6000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic, physically-consistent multi-source synthetic dataset
    for Flash Flood and Landslide prediction in Himalayan hilly regions.
    
    Physical Principles Modeled:
    1. Runoff = f(Rainfall Intensity, Soil Saturation, Slope)
    2. Flash Flood Risk = f(Runoff, Stream Proximity, Water Level Rise Rate, Historical Susceptibility)
    3. Landslide Risk = f(Slope Steepness, Soil Saturation, Cumulative Rainfall, Historical Inventory)
    """
    np.random.seed(random_seed)
    
    # 1. Rainfall Features (Simulating standard weather to extreme cloudburst events)
    # Most days have 0-25mm rain, monsoon days 30-80mm, cloudbursts 80-150mm/h
    rain_1h = np.random.exponential(scale=20.0, size=n_samples)
    # Add heavy cloudburst tail
    extreme_mask = np.random.rand(n_samples) < 0.15
    rain_1h[extreme_mask] = np.random.uniform(70.0, 160.0, size=np.sum(extreme_mask))
    rain_1h = np.clip(rain_1h, 0.0, 180.0)
    
    # Multi-temporal accumulation
    rain_3h = rain_1h * np.random.uniform(1.8, 2.7, size=n_samples) + np.random.uniform(0, 15, size=n_samples)
    rain_6h = rain_3h * np.random.uniform(1.4, 2.1, size=n_samples) + np.random.uniform(0, 25, size=n_samples)
    rain_24h = rain_6h * np.random.uniform(1.3, 2.0, size=n_samples) + np.random.uniform(0, 50, size=n_samples)
    forecast_rain_3h = rain_1h * np.random.uniform(0.7, 1.4, size=n_samples) + np.random.normal(5, 10, size=n_samples)
    forecast_rain_3h = np.clip(forecast_rain_3h, 0.0, 150.0)
    
    # 2. Soil Moisture Features (0 to 100%)
    # Wet soil correlates with past 24h rain
    base_soil_moisture = np.random.uniform(30.0, 65.0, size=n_samples)
    soil_moisture = base_soil_moisture + (rain_24h / 200.0) * 45.0 + np.random.normal(0, 5, size=n_samples)
    soil_moisture = np.clip(soil_moisture, 15.0, 98.0)
    
    # 3. Terrain & Geospatial Features
    slope_deg = np.random.uniform(8.0, 44.0, size=n_samples)
    elevation_m = np.random.uniform(750.0, 2400.0, size=n_samples)
    distance_to_stream_m = np.random.exponential(scale=120.0, size=n_samples)
    distance_to_stream_m = np.clip(distance_to_stream_m, 10.0, 800.0)
    
    # 4. Historical Vulnerability
    historical_flood_count = np.random.poisson(lam=1.5, size=n_samples)
    historical_landslide_count = np.random.poisson(lam=2.0, size=n_samples)
    
    # 5. Hydrological Stream Sensors (Water level & rise rate)
    base_water_level = np.random.uniform(0.8, 1.8, size=n_samples)
    # Stream water rises rapidly when rainfall and soil moisture are high
    runoff_factor = (rain_1h / 100.0) * (soil_moisture / 100.0) * (slope_deg / 30.0)
    water_level_m = base_water_level + runoff_factor * 3.5 + np.random.normal(0, 0.2, size=n_samples)
    water_level_m = np.clip(water_level_m, 0.5, 6.2)
    
    water_level_rise_rate = runoff_factor * 1.8 - np.random.uniform(0.0, 0.2, size=n_samples)
    water_level_rise_rate = np.clip(water_level_rise_rate, -0.3, 2.8)
    
    # 6. Physical Ground-Truth Calculation (Target Labels & Risk Scores)
    # Flash flood index (0.0 to 1.0)
    ff_score = (
        0.30 * (rain_1h / 120.0) +
        0.22 * (soil_moisture / 100.0) +
        0.20 * (water_level_m / 4.5) +
        0.15 * (water_level_rise_rate / 1.5) +
        0.08 * (1.0 - (distance_to_stream_m / 600.0)) +
        0.05 * (historical_flood_count / 5.0)
    )
    ff_score = np.clip(ff_score, 0.0, 1.0)
    
    # Landslide index (0.0 to 1.0)
    ls_score = (
        0.32 * (slope_deg / 40.0) +
        0.28 * (soil_moisture / 100.0) +
        0.22 * (rain_6h / 180.0) +
        0.18 * (historical_landslide_count / 6.0)
    )
    ls_score = np.clip(ls_score, 0.0, 1.0)
    
    # Binary labels based on disaster thresholds (e.g. 0.62)
    flash_flood_label = (ff_score > 0.60).astype(int)
    landslide_label = (ls_score > 0.62).astype(int)
    
    # Combined Hazard Risk Score
    combined_risk_score = np.maximum(ff_score, ls_score)
    
    # Lead Time estimation (15 to 90 minutes) - Inversely proportional to rainfall intensity & rise rate
    lead_time_min = 90.0 - (ff_score * 65.0) + np.random.normal(0, 4, size=n_samples)
    lead_time_min = np.clip(lead_time_min, 15.0, 90.0)
    
    df = pd.DataFrame({
        "rain_1h": np.round(rain_1h, 2),
        "rain_3h": np.round(rain_3h, 2),
        "rain_6h": np.round(rain_6h, 2),
        "rain_24h": np.round(rain_24h, 2),
        "forecast_rain_3h": np.round(forecast_rain_3h, 2),
        "soil_moisture": np.round(soil_moisture, 2),
        "water_level_m": np.round(water_level_m, 2),
        "water_level_rise_rate": np.round(water_level_rise_rate, 2),
        "slope_deg": np.round(slope_deg, 2),
        "elevation_m": np.round(elevation_m, 1),
        "distance_to_stream_m": np.round(distance_to_stream_m, 1),
        "historical_flood_count": historical_flood_count,
        "historical_landslide_count": historical_landslide_count,
        "flash_flood_score": np.round(ff_score, 4),
        "landslide_score": np.round(ls_score, 4),
        "combined_risk_score": np.round(combined_risk_score, 4),
        "flash_flood_label": flash_flood_label,
        "landslide_label": landslide_label,
        "lead_time_min": np.round(lead_time_min, 1)
    })
    
    return df

if __name__ == "__main__":
    df = generate_multi_source_synthetic_dataset(5000)
    print(f"Generated synthetic dataset with shape {df.shape}")
    print(f"Flash flood positive rate: {df['flash_flood_label'].mean():.2%}")
    print(f"Landslide positive rate: {df['landslide_label'].mean():.2%}")
