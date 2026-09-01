# VIGIL-FLOOD: Hyper-Local Flash Flood Early Warning System for Hilly Regions
### Smart India Hackathon (SIH) — Problem Statement ID: **SIH 26192**
**Theme:** Disaster Management / Smart Automation | **Category:** Software

---

## 🌟 Executive Summary
Hilly and mountainous regions (such as the Himalayas and Western Ghats) suffer from devastating flash floods and cloudburst-induced debris flows where standard riverine forecasting models fail due to micro-watershed dynamics, steep slopes, and rapid runoff velocity.

**VIGIL-FLOOD** is an end-to-end, multi-source early warning and disaster decision-support platform. It continuously fuses:
1. **Rainfall Precipitation & Forecasts** (IMD AWS/Radar, NASA GPM IMERG 30-min)
2. **Soil Moisture Saturation** (ISRO MOSDAC Soil Wetness Index, SMAP)
3. **High-Resolution Terrain & Slope** (SRTM DEM 30m, Drainage Networks)
4. **Historical Landslide & Inundation Inventories** (ISRO Landslide Atlas of India, GSI Bhusanket)
5. **Real-Time Hydrological IoT Sensors** (Rain gauge, Soil moisture, River surge level, Slope tilt)

---

## 🎯 The 5 Core Operational Deliverables
1. **WHERE:** Hyper-local village, ward, and micro-catchment GIS vulnerability mapping.
2. **WHEN:** Estimated actionable lead-time window (e.g. *“Evacuation window: 30–45 mins”*).
3. **HOW SEVERE:** 4-Tier Risk Matrix (🟢 Low, 🟡 Moderate, 🟠 High, 🔴 Critical).
4. **WHY (Explainable AI):** Human-interpretable attribution factors showing *why* an alert was issued (SHAP feature contributions).
5. **WHAT TO DO:** Action Engine formulating turn-by-turn safe shelter routing, designated high-altitude camps, and geo-targeted CAP/SMS emergency broadcasts.

---

## 🛡️ Key Innovation: Resilient Fault-Tolerant Multi-Source Engine
In mountain disaster scenarios, physical ground sensors often get washed away or lose power/network. **Sensor failure does NOT cause system failure.**

- **Full ML Model (XGBoost):** Used when all local telemetry nodes are online (92%+ Confidence).
- **Adaptive Fallback Model:** Automatically triggered when a sensor (e.g., river water-level gauge) goes offline. Ingests upstream rainfall accumulation, soil saturation, and DEM slope physics to maintain continuous early warnings with adjusted confidence scores.
- **Rule-Based Emergency Safety Layer:** Physical threshold guardrails ensuring severe cloudburst events trigger immediate alarms regardless of telemetry anomalies.

---

## 🏗️ System Architecture
```
[External Macro Data (IMD/ISRO/NASA)] + [Local IoT Sensors]
                     │
                     ▼
       [FastAPI Ingestion Gateway (REST/MQTT)]
                     │
                     ▼
       [Data Quality & Sensor Health Layer]
     (Anomaly detection / Stale data check)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
 [Full ML Model (XGBoost)]   [Adaptive Fallback Model]
        │                         │
        └────────────┬────────────┘
                     ▼
          [Multi-Hazard Risk Engine]
          [Explainable AI (SHAP)]
                     │
                     ▼
 [Hyper-Localization GIS] + [Lead-Time Engine] + [Action Engine]
                     │
                     ▼
 [Vue.js / Modern Glassmorphism Dashboard + Leaflet GIS + CAP SMS]
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ (Optional for serve/npm tools)

### 2. Setup Virtual Environment & Install Dependencies
```bash
# Windows PowerShell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Generate Multi-Source Data & Train Models
```bash
python backend/train_models.py
```

### 4. Launch the Complete Early Warning Platform
```bash
python run.py
```
Open your browser at **`http://localhost:8000`** to view the Command Center!

---

## 🏆 SIH Judge Demonstration Workflow
1. **Show Pilot Region:** View Beas River Basin, Mandi District (HP) on the dark-mode interactive GIS map.
2. **Explore Monitored Villages:** Click on *Pandoh*, *Aut*, or *Thalot* to inspect live telemetry gauges and historical vulnerability.
3. **Test "What-If" Simulation Sandbox:**
   - Click **`🔴 Cloudburst Emergency`** $\rightarrow$ Watch the map turn Critical Red, lead time drop to 28 mins, and immediate evacuation orders generated.
4. **Demonstrate Fault-Tolerance (The Killer USP):**
   - Click **`🛡️ Test Fallback Model`** $\rightarrow$ The water sensor is marked `🔴 OFFLINE`.
   - Point out to judges how the system seamlessly transitions to the **Fallback ML Model**, preserves the warning, updates confidence, and never crashes.
5. **Switch to Citizen View:** Toggle to the **`🏘️ Public / Citizen`** role to demonstrate clean, non-technical safety directions for residents.
