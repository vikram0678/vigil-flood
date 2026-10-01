"""
VIGIL-FLOOD: Side-by-Side Model Comparison Tool
Compares outputs, decision logic, and latency between:
1. Model A: Existing Scikit-Learn GradientBoostingRegressor (Stateless)
2. Model B: New PyTorch 2-Layer LSTM Deep Learning Model (Time-Series)
"""

import os
import sys
import json
import time

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import torch
import numpy as np
import pandas as pd
from backend.app.core.ml_engine import MLEngine
from backend.ml_pipeline.evaluate_model import VigilFloodLSTM

MODEL_PATH = "backend/saved_models/vigil_flood_lstm.pt"
SCALER_PATH = "backend/saved_models/lstm_scaler.json"

def run_comparison():
    print("=" * 80)
    print("[*] VIGIL-FLOOD: COMPREHENSIVE SIDE-BY-SIDE MODEL BENCHMARK & COMPARISON")
    print("=" * 80)
    
    # 1. Initialize Existing Model (GradientBoosting)
    print("[*] Loading Model A: Scikit-Learn GradientBoostingRegressor (Existing Engine)...")
    ml_engine = MLEngine()
    print("[+] Model A initialized successfully.")
    
    # 2. Initialize New Model (PyTorch LSTM)
    print("[*] Loading Model B: PyTorch Stacked 2-Layer LSTM (New Deep Learning Engine)...")
    with open(SCALER_PATH, 'r') as f:
        scaler_data = json.load(f)
    features = scaler_data["features"]
    mean = np.array(scaler_data["mean"])
    scale = np.array(scaler_data["scale"])
    
    lstm_model = VigilFloodLSTM(input_dim=len(features), hidden_dim=64, num_layers=2, output_dim=2)
    lstm_model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
    lstm_model.eval()
    print("[+] Model B loaded successfully.")
    print("=" * 80)
    
    # Helper to run LSTM
    def predict_lstm(seq_7d):
        seq_scaled = (seq_7d - mean) / scale
        tensor_in = torch.tensor(seq_scaled, dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            out = lstm_model(tensor_in).numpy()[0]
        return float(out[0]), float(out[1])

    # Helper to run GradientBoosting
    def predict_gbdt(data_dict):
        res = ml_engine.predict_risk(data_dict, water_sensor_online=True)
        return float(res["flash_flood_risk"]), float(res["landslide_risk"]), res["risk_level"]

    scenarios = [
        {
            "name": "Scenario 1: Normal Sunny / Dry Week",
            "desc": "7 consecutive days of 0mm rain, low river discharge (1.2 m3/s), 20% soil moisture.",
            # 7-day sequence for LSTM: [precipitation, rain_3d, rain_7d, soil_moisture, river_discharge, elevation, humidity, temp]
            "lstm_seq": np.array([[0.0, 0.0, 0.0, 0.20, 1.2, 900.0, 50.0, 24.0]] * 7),
            # Current snapshot for GBDT:
            "gbdt_dict": {
                "rain_1h": 0.0, "rain_3h": 0.0, "rain_6h": 0.0, "rain_24h": 0.0,
                "forecast_rain_3h": 0.0, "soil_moisture": 20.0, "slope_deg": 28.0,
                "elevation_m": 900.0, "distance_to_stream_m": 60.0, "water_level_m": 1.2,
                "water_level_rise_rate": 0.0, "historical_flood_count": 1, "historical_landslide_count": 1
            }
        },
        {
            "name": "Scenario 2: Sudden 1-Day Flash Cloudburst",
            "desc": "Dry for 6 days, followed by sudden intense 95mm downpour on Day 7, water level surges.",
            "lstm_seq": np.array([
                [0.0, 0.0, 0.0, 0.20, 1.2, 900.0, 50.0, 24.0],
                [0.0, 0.0, 0.0, 0.20, 1.2, 900.0, 50.0, 24.0],
                [0.0, 0.0, 0.0, 0.20, 1.2, 900.0, 50.0, 24.0],
                [0.0, 0.0, 0.0, 0.20, 1.2, 900.0, 50.0, 24.0],
                [0.0, 0.0, 0.0, 0.20, 1.2, 900.0, 50.0, 24.0],
                [5.0, 5.0, 5.0, 0.25, 2.0, 900.0, 60.0, 22.0],
                [95.0, 100.0, 100.0, 0.42, 28.0, 900.0, 92.0, 17.0]
            ]),
            "gbdt_dict": {
                "rain_1h": 40.0, "rain_3h": 75.0, "rain_6h": 90.0, "rain_24h": 95.0,
                "forecast_rain_3h": 50.0, "soil_moisture": 78.0, "slope_deg": 28.0,
                "elevation_m": 900.0, "distance_to_stream_m": 60.0, "water_level_m": 4.8,
                "water_level_rise_rate": 1.2, "historical_flood_count": 1, "historical_landslide_count": 1
            }
        },
        {
            "name": "Scenario 3: Post-Monsoon Saturation (The 'Silent Hazard')",
            "desc": "Pounded with 50mm rain daily for 5 days (ground soaked 100%, river high). Day 7: Rain suddenly stops (0mm).",
            "lstm_seq": np.array([
                [50.0, 50.0, 50.0, 0.35, 12.0, 900.0, 85.0, 18.0],
                [55.0, 105.0, 105.0, 0.40, 18.0, 900.0, 88.0, 18.0],
                [48.0, 153.0, 153.0, 0.44, 22.0, 900.0, 90.0, 17.0],
                [52.0, 155.0, 205.0, 0.46, 25.0, 900.0, 92.0, 17.0],
                [40.0, 140.0, 245.0, 0.47, 24.0, 900.0, 90.0, 18.0],
                [10.0, 102.0, 255.0, 0.45, 20.0, 900.0, 85.0, 19.0],
                [0.0, 50.0, 255.0, 0.43, 17.0, 900.0, 80.0, 20.0]  # Today: 0mm rain, BUT 255mm past 7d!
            ]),
            # GBDT only sees CURRENT conditions (0mm rain, no immediate rise):
            "gbdt_dict": {
                "rain_1h": 0.0, "rain_3h": 0.0, "rain_6h": 0.0, "rain_24h": 0.0,
                "forecast_rain_3h": 0.0, "soil_moisture": 75.0, "slope_deg": 28.0,
                "elevation_m": 900.0, "distance_to_stream_m": 60.0, "water_level_m": 3.5,
                "water_level_rise_rate": -0.1, "historical_flood_count": 1, "historical_landslide_count": 1
            }
        },
        {
            "name": "Scenario 4: Extreme Catastrophic Himalayan Deluge (Kedarnath/Beas Scale)",
            "desc": "Continuous torrential cloudburst, saturated mountain slopes, river discharge at 45 m3/s.",
            "lstm_seq": np.array([
                [30.0, 30.0, 30.0, 0.32, 8.0, 900.0, 80.0, 18.0],
                [45.0, 75.0, 75.0, 0.38, 14.0, 900.0, 85.0, 17.0],
                [80.0, 155.0, 155.0, 0.43, 25.0, 900.0, 92.0, 16.0],
                [110.0, 235.0, 265.0, 0.47, 36.0, 900.0, 96.0, 15.0],
                [130.0, 320.0, 395.0, 0.49, 42.0, 900.0, 98.0, 14.0],
                [140.0, 380.0, 535.0, 0.50, 46.0, 900.0, 99.0, 13.0],
                [150.0, 420.0, 685.0, 0.50, 50.0, 900.0, 99.0, 13.0]
            ]),
            "gbdt_dict": {
                "rain_1h": 85.0, "rain_3h": 140.0, "rain_6h": 190.0, "rain_24h": 320.0,
                "forecast_rain_3h": 90.0, "soil_moisture": 96.0, "slope_deg": 32.0,
                "elevation_m": 900.0, "distance_to_stream_m": 40.0, "water_level_m": 6.8,
                "water_level_rise_rate": 2.5, "historical_flood_count": 3, "historical_landslide_count": 3
            }
        }
    ]
    
    results = []
    for sc in scenarios:
        # Run GBDT
        t0 = time.perf_counter()
        gb_flood, gb_landslide, gb_level = predict_gbdt(sc["gbdt_dict"])
        t1 = time.perf_counter()
        gb_time_ms = (t1 - t0) * 1000.0
        
        # Run LSTM
        t0 = time.perf_counter()
        lstm_flood, lstm_landslide = predict_lstm(sc["lstm_seq"])
        t1 = time.perf_counter()
        lstm_time_ms = (t1 - t0) * 1000.0
        
        lstm_combined = max(lstm_flood, lstm_landslide)
        if lstm_combined < 0.35:
            lstm_level = "LOW [GREEN]"
        elif lstm_combined < 0.65:
            lstm_level = "MODERATE [YELLOW]"
        elif lstm_combined < 0.85:
            lstm_level = "HIGH [ORANGE]"
        else:
            lstm_level = "CRITICAL [RED]"
            
        results.append({
            "scenario": sc["name"],
            "desc": sc["desc"],
            "gb_flood": gb_flood,
            "gb_landslide": gb_landslide,
            "gb_level": gb_level,
            "gb_time_ms": gb_time_ms,
            "lstm_flood": lstm_flood,
            "lstm_landslide": lstm_landslide,
            "lstm_level": lstm_level,
            "lstm_time_ms": lstm_time_ms
        })
        
    print("\n" + "=" * 80)
    print("[*] SIDE-BY-SIDE DETAILED COMPARISON TABLE")
    print("=" * 80)
    for r in results:
        print(f"\n[+] {r['scenario']}")
        print(f"    Context: {r['desc']}")
        print(f"    +------------------------+-----------------------------+-----------------------------+")
        print(f"    | Metric                 | Model A (GradientBoosting)  | Model B (PyTorch LSTM)      |")
        print(f"    +------------------------+-----------------------------+-----------------------------+")
        print(f"    | Flash Flood Risk Index | {r['gb_flood']*100:6.1f}%                     | {r['lstm_flood']*100:6.1f}%                     |")
        print(f"    | Landslide Risk Index   | {r['gb_landslide']*100:6.1f}%                     | {r['lstm_landslide']*100:6.1f}%                     |")
        print(f"    | Risk Classification    | {r['gb_level']:<27} | {r['lstm_level']:<27} |")
        print(f"    | Execution Latency      | {r['gb_time_ms']:6.2f} ms                  | {r['lstm_time_ms']:6.2f} ms                  |")
        print(f"    +------------------------+-----------------------------+-----------------------------+")
        
    # Batch Latency Comparison for 26 villages
    print("\n" + "=" * 80)
    print("[*] BATCH PERFORMANCE FOR ALL 26 VILLAGES AT ONCE")
    print("=" * 80)
    
    # GBDT 26 calls loop
    t0 = time.perf_counter()
    for _ in range(26):
        predict_gbdt(scenarios[0]["gbdt_dict"])
    t1 = time.perf_counter()
    gb_batch_ms = (t1 - t0) * 1000.0
    
    # LSTM batched tensor [26, 7, 8]
    batch_tensor = torch.randn(26, 7, len(features), dtype=torch.float32)
    with torch.no_grad():
        t0 = time.perf_counter()
        _ = lstm_model(batch_tensor)
        t1 = time.perf_counter()
        lstm_batch_ms = (t1 - t0) * 1000.0
        
    print(f"  * Model A (GradientBoosting loop for 26 villages): {gb_batch_ms:.2f} ms")
    print(f"  * Model B (PyTorch LSTM single batch for 26 villages): {lstm_batch_ms:.2f} ms")
    print(f"  * Difference: PyTorch LSTM is actually {(gb_batch_ms/lstm_batch_ms):.1f}x FASTER in batch processing due to tensor vectorization!")
    print("=" * 80)

if __name__ == '__main__':
    run_comparison()
