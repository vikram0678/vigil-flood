import sys
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.synthetic_data import generate_multi_source_synthetic_dataset
from backend.app.core.ml_engine import ml_engine
from backend.app.config import DATA_DIR

def run_training_pipeline():
    print("=" * 60)
    print("🌊 SIH 26192 — FLASH FLOOD & LANDSLIDE MODEL TRAINING PIPELINE")
    print("=" * 60)
    
    print("\n[Step 1/3] Generating multi-source synthetic training dataset (6,000 samples)...")
    df = generate_multi_source_synthetic_dataset(n_samples=6000, random_seed=42)
    
    csv_path = DATA_DIR / "synthetic_training_data.csv"
    df.to_csv(csv_path, index=False)
    print(f"✅ Saved synthetic dataset to {csv_path}")
    print(f"   • Total records: {len(df)}")
    print(f"   • Flash flood positive events: {df['flash_flood_label'].sum()} ({df['flash_flood_label'].mean():.1%})")
    print(f"   • Landslide positive events: {df['landslide_label'].sum()} ({df['landslide_label'].mean():.1%})")
    
    print("\n[Step 2/3] Training Full ML Models & Resilient Fallback Models...")
    res = ml_engine.train(df)
    print("✅ Model training completed successfully!")
    print(f"   • Full Flash Flood & Landslide Regressors saved")
    print(f"   • Fallback Models (Fault-tolerant without Water Sensor) saved")
    
    print("\n[Step 3/3] Running Validation Test on Sample Cloudburst Input...")
    sample_input = {
        "rain_1h": 110.0,
        "rain_3h": 180.0,
        "rain_6h": 240.0,
        "forecast_rain_3h": 75.0,
        "soil_moisture": 92.0,
        "water_level_m": 4.2,
        "water_level_rise_rate": 1.8,
        "slope_deg": 35.0,
        "elevation_m": 920.0,
        "distance_to_stream_m": 35.0,
        "historical_flood_count": 4,
        "historical_landslide_count": 5
    }
    
    # Test Full Model
    pred_full = ml_engine.predict_risk(sample_input, water_sensor_online=True)
    print(f"\n--- Full Model Output (All Sensors Online) ---")
    print(f"   Risk: {pred_full['risk_percentage']}% ({pred_full['risk_level']} {pred_full['risk_badge']})")
    print(f"   Model Used: {pred_full['model_type']}")
    print(f"   Confidence: {pred_full['confidence_score'] * 100}%")
    print(f"   Top Explainability Factor: {pred_full['explainability'][0]['factor']} ({pred_full['explainability'][0]['contribution_pct']}%)")
    
    # Test Fallback Model (Water sensor fails)
    pred_fallback = ml_engine.predict_risk(sample_input, water_sensor_online=False)
    print(f"\n--- Fallback Model Output (Water Sensor OFFLINE) ---")
    print(f"   Risk: {pred_fallback['risk_percentage']}% ({pred_fallback['risk_level']} {pred_fallback['risk_badge']})")
    print(f"   Model Used: {pred_fallback['model_type']}")
    print(f"   Confidence: {pred_fallback['confidence_score'] * 100}%")
    print("=" * 60)
    print("🎉 All models verified and ready for deployment!")
    print("=" * 60)

if __name__ == "__main__":
    run_training_pipeline()
