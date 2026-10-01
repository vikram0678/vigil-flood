# VIGIL-FLOOD: Enterprise Deep Learning ML Pipeline

This folder contains the complete, production-ready Deep Learning pipeline that trains and evaluates the **VIGIL-FLOOD PyTorch LSTM** using real Himalayan mountain hydrology and Indian flood ground-truth data.

---

## 📁 Directory Structure

```
backend/ml_pipeline/
├── build_master_dataset.py   # Merges raw Kaggle datasets into a clean, unified time-series CSV
├── train_lstm.py             # Builds, trains, and saves the 2-Layer PyTorch LSTM neural network
├── evaluate_model.py         # Benchmarks model accuracy, latency, and simulated disaster scenarios
└── README.md                 # Complete documentation and usage guide
```

---

## 🌊 Pipeline Architecture

```
1. Raw Data Ingestion (Kaggle Sources)
   ├── CORRECTED_2023_2026_NEPAL_FLOOD_WEATHER_KAGGLE.csv (13,390 rows of Himalayan hydrology)
   ├── rainfall_with_correct_flood_labels.csv (1.62M rows of Indian flood ground-truth)
   └── Uttarakhand_floods_1970_2025.csv (252 ground-truth cloudburst & flood disaster records)
         │
         ▼ (Harmonization & Feature Engineering)
2. Master Unified Dataset
   └── backend/data/himalayan_timeseries_master.csv (43,131 rows, 14.1% disaster events)
         │
         ▼ (7-Day Sliding Window Sequences [N, 7, 8])
3. PyTorch Deep Learning LSTM
   └── VigilFloodLSTM: 2-Layer Stacked LSTM + Dense Regression Head (Sigmoid bounded [0.0, 1.0])
         │
         ▼ (Production Artifacts)
4. Saved Models
   ├── backend/saved_models/vigil_flood_lstm.pt (222 KB PyTorch Weights)
   └── backend/saved_models/lstm_scaler.json    (Feature Normalization Parameters)
```

---

## 🚀 How to Run

### Step 1: Build the Master Dataset
```bash
python backend/ml_pipeline/build_master_dataset.py
```
* Generates `backend/data/himalayan_timeseries_master.csv` with 8 standardized sequential features.

### Step 2: Train the LSTM Model
```bash
python backend/ml_pipeline/train_lstm.py
```
* Generates 42,977 sequence windows (`[N, 7, 8]`).
* Trains across 18 epochs on CPU.
* Saves `vigil_flood_lstm.pt` and `lstm_scaler.json`.

### Step 3: Run Evaluation & Latency Benchmark
```bash
python backend/ml_pipeline/evaluate_model.py
```

---

## 📊 Performance Benchmarks

* **Critical Flood Detection Accuracy:** `89.77%`
* **Flood Risk Score MAE:** `0.1349`
* **Landslide Risk Score MAE:** `0.1173`
* **Inference Latency (All 26 Villages in 1 Batch):** `0.65 ms` (sub-millisecond!)
* **Single Village Latency:** `0.025 ms`
