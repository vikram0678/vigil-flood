<p align="center">
  <h1 align="center">🌊 VIGIL-FLOOD</h1>
  <p align="center">
    <strong>Hyper-Local Flash Flood Early Warning System for Hilly Regions</strong>
  </p>
  <p align="center">
    Smart India Hackathon (SIH) 2026 — Problem Statement ID: <strong>SIH 26192</strong><br/>
    Theme: Disaster Management &amp; Smart Automation | Category: Software
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python"/>
    <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black" alt="React"/>
    <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white" alt="FastAPI"/>
    <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"/>
  </p>
</p>

---

## 📌 What is VIGIL-FLOOD?

> **VIGIL** means a *"watchful guardian who stays awake while others sleep."*

Flash floods strike without warning — often at night — killing hundreds in hilly regions every year. **VIGIL-FLOOD** is an AI-powered early warning system that keeps a **24/7 tireless watch** over flood-prone communities using IoT sensors, satellite data, and dual machine learning models.

It gives communities **precious minutes to evacuate** before disaster strikes.

---

## 🎯 The 5 Core Deliverables

| # | Deliverable | What It Answers |
|---|-------------|----------------|
| 1 | **WHERE** | Hyper-local village & micro-catchment GIS vulnerability mapping |
| 2 | **WHEN** | Actionable lead-time window (e.g., *"Evacuate within 30–45 mins"*) |
| 3 | **HOW SEVERE** | 4-Tier Risk Matrix: 🟢 Low → 🟡 Moderate → 🟠 High → 🔴 Critical |
| 4 | **WHY (XAI)** | SHAP-based explainable AI showing *why* an alert was triggered |
| 5 | **WHAT TO DO** | Auto-generated evacuation routes, shelter assignments & CAP/SMS alerts |

---

## 🛡️ Key Innovation: Fault-Tolerant Dual AI Engine

In mountain disasters, **ground sensors get washed away**. Our system **never goes blind**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SENSOR STATUS CHECK                          │
│                                                                 │
│   ALL SENSORS ONLINE? ──── YES ──→ Full ML Model (92%+ conf)   │
│          │                          (All 7 IoT features)        │
│          NO                                                     │
│          │                                                      │
│          ▼                                                      │
│   Fallback Model Auto-Activates ──→ Meteorological Model       │
│   (Upstream rainfall + soil +        (Maintains warnings with   │
│    DEM slope physics)                 adjusted confidence)      │
│          │                                                      │
│          ▼                                                      │
│   Rule-Based Safety Layer ──→ Hard-coded emergency thresholds   │
│   (Cloudburst > 100mm/hr triggers instant alarm regardless)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                                │
│  [IMD AWS Radar] [NASA GPM] [ISRO MOSDAC] [IoT LoRaWAN Sensors]│
└──────────────────────┬───────────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Async Python)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  Pydantic v2  │  │ Sensor Health│  │  ML Engine           │    │
│  │  Sanitizers   │  │  Monitor     │  │  (Gradient Boosting) │    │
│  └──────────────┘  └──────────────┘  └─────────────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  Lead-Time    │  │  Action      │  │  What-If Simulation  │    │
│  │  Engine       │  │  Engine      │  │  Sandbox             │    │
│  └──────────────┘  └──────────────┘  └─────────────────────┘    │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │  Tile Cache   │  │  WebSocket   │                              │
│  │  (Redis)      │  │  Streaming   │                              │
│  └──────────────┘  └──────────────┘                              │
└──────────────────────┬───────────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              React + TypeScript Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  2D GIS Map   │  │  3D Terrain  │  │  Citizen View        │    │
│  │  (Leaflet)    │  │  (MapLibre)  │  │  (Public Alerts)     │    │
│  └──────────────┘  └──────────────┘  └─────────────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  Dashboard    │  │  Simulation  │  │  Deep Dive Analysis  │    │
│  │  Sidebar      │  │  Controls    │  │  (XAI / SHAP)        │    │
│  └──────────────┘  └──────────────┘  └─────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
vigil-flood/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI server entry point
│   │   ├── config.py                # Environment & server config
│   │   ├── api/
│   │   │   ├── routes.py            # REST API endpoints
│   │   │   └── websocket.py         # Real-time WebSocket streaming
│   │   └── core/
│   │       ├── ml_engine.py         # Dual ML model (Full + Fallback)
│   │       ├── sensor_health.py     # IoT sensor anomaly detection
│   │       ├── sanitizers.py        # Pydantic v2 input validation
│   │       ├── action_engine.py     # Evacuation & alert generation
│   │       ├── lead_time_engine.py  # Time-to-impact calculator
│   │       ├── simulation.py        # What-If scenario sandbox
│   │       ├── tile_cache.py        # Redis tile caching proxy
│   │       ├── synthetic_data.py    # Training data generator
│   │       └── external_connectors.py # IMD/NASA/ISRO API connectors
│   ├── data/
│   │   ├── pilot_villages.json      # 6 pilot village configs (Beas Basin)
│   │   └── real_multisource_training_data.csv  # 99K+ training samples
│   ├── saved_models/                # Trained .pkl model files
│   ├── scripts/                     # Utility scripts
│   ├── train_models.py              # ML model training pipeline
│   └── train_bilstm.py              # PyTorch Bi-LSTM deep learning model
│
├── frontend_react/                  # React + TypeScript (Primary UI)
│   └── src/
│       ├── App.tsx                  # Root application component
│       ├── main.tsx                 # React entry point
│       ├── index.css                # Complete design system (Light/Dark)
│       ├── components/
│       │   ├── map/                 # GISMap2D, GISMap3D, MapContainer
│       │   ├── sidebar/             # Dashboard sidebar panels
│       │   ├── simulation/          # What-If simulation controls
│       │   ├── analysis/            # Deep dive XAI analysis
│       │   ├── citizen/             # Public-facing citizen view
│       │   ├── layout/              # Navbar, theme toggle
│       │   └── modals/              # Methodology modal
│       ├── context/                 # FloodContext (global state)
│       ├── hooks/                   # useWebSocket custom hook
│       ├── constants/               # Village data & map configs
│       └── types/                   # TypeScript type definitions
│
├── frontend/                        # Vanilla JS fallback (Round 1)
├── run.py                           # One-command launcher
├── requirements.txt                 # Python dependencies
├── package.json                     # Node.js dependencies
├── .env.example                     # Environment variable template
└── LICENSE                          # MIT License
```

---

## 📊 Data Sources

### Where Does the Data Come From?

| Source | Type | What It Provides | Access Link |
|--------|------|------------------|-------------|
| **IMD AWS/Radar** | Government API | Rainfall intensity, weather forecasts | [mausam.imd.gov.in](https://mausam.imd.gov.in/) |
| **NASA GPM IMERG** | Satellite | Global precipitation estimates (0.1° grid) | [gpm.nasa.gov](https://gpm.nasa.gov/data/imerg) |
| **ISRO MOSDAC** | Satellite | Soil Wetness Index, vegetation moisture | [mosdac.gov.in](https://www.mosdac.gov.in/) |
| **SRTM DEM (30m)** | Satellite | Elevation, slope angle, drainage networks | [earthexplorer.usgs.gov](https://earthexplorer.usgs.gov/) |
| **ISRO Landslide Atlas** | Historical | Past landslide/flood event inventory | [bhukosh.gsi.gov.in](https://bhukosh.gsi.gov.in/Bhukosh/Public) |
| **GSI Bhukosh** | Geological | Geological vulnerability maps | [bhukosh.gsi.gov.in](https://bhukosh.gsi.gov.in/Bhukosh/Public) |
| **Google Flood Hub** | AI Forecast | River flood forecasting (Google AI) | [sites.research.google/floods](https://sites.research.google/floods/) |
| **IoT LoRaWAN Sensors** | Ground-level | Rain gauge, soil moisture, river level, tilt | Custom hardware deployment |

### Training Data

Our ML model is trained on **99,000+ multi-source samples** generated from real-world distributions of the Beas River Basin:

| Feature | Source | Range |
|---------|--------|-------|
| Rainfall (1h, 3h, 6h, 24h) | IMD AWS + NASA GPM | 0–200 mm |
| Soil Moisture | ISRO MOSDAC SWI | 10–95% |
| River Water Stage | IoT ultrasonic sensor | 0.5–8.0 m |
| Slope Angle | SRTM DEM 30m | 5–45° |
| Elevation | SRTM DEM 30m | 800–3500 m |
| Antecedent Precipitation Index | Computed (7-day decay) | 0–300 |
| Season / Hour | Temporal encoding | Monsoon-weighted |

**Pilot Region:** Beas River Basin, Mandi District, Himachal Pradesh — covering 6 villages: Pandoh, Aut, Thalot, Hanogi, Larji, Banjar.

---

## 🚀 Quick Start Guide

### Prerequisites

| Requirement | Version |
|-------------|---------|
| **Python** | 3.10 or higher |
| **Node.js** | v18 or higher |
| **Redis** | 7.0+ (optional, for tile caching) |
| **Git** | Latest |

### Step 1: Clone the Repository

```bash
git clone https://github.com/vikram0678/vigil-flood.git
cd vigil-flood
```

### Step 2: Setup Python Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows (PowerShell)
.\venv\Scripts\activate
# Windows (Git Bash)
source venv/Scripts/activate
# Linux / macOS
source venv/bin/activate
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Install Node.js Dependencies (for frontend dev)

```bash
npm install
```

### Step 5: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your API keys (all optional — system works without them)
```

### 🔑 API Keys (All Optional — System works 100% without them)

> The dashboard runs fully out of the box using **free open-source basemaps**. These keys unlock additional features:

| Service | What It Unlocks | Free Tier | Get Your Key |
|---------|----------------|-----------|-------------|
| **OpenWeatherMap** | Live weather forecasts & rainfall data | 1,000 calls/day | [Sign up here →](https://home.openweathermap.org/users/sign_up) |
| **Mapbox** | Premium satellite map tiles | 50,000 loads/month | [Sign up here →](https://account.mapbox.com/auth/signup/) |
| **Twilio** | SMS & WhatsApp emergency alerts | $15 free credit | [Sign up here →](https://www.twilio.com/try-twilio) |
| **IMD API** | Official India weather data | Government access | [Request here →](https://mausam.imd.gov.in/) |

After signing up, paste your keys in the `.env` file:
```env
OPENWEATHER_API_KEY=your_key_here
MAPBOX_ACCESS_TOKEN=your_token_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 6: Train the ML Models

```bash
python backend/train_models.py
```

This will:
- Load multi-source training data (99K+ samples)
- Train the Gradient Boosting classifier
- Save trained models to `backend/saved_models/`
- Display training accuracy and feature importance

### Step 7: Launch the Platform

```bash
python run.py
```

🎉 Open your browser at **`http://localhost:8000`**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serve the main dashboard |
| `GET` | `/api/status` | System health check |
| `GET` | `/api/villages` | Get all monitored villages |
| `GET` | `/api/telemetry/{village}` | Latest sensor readings |
| `POST` | `/api/simulate` | Run what-if scenario simulation |
| `GET` | `/api/external-apis` | External API registry |
| `WS` | `/ws/telemetry` | Real-time WebSocket stream |

---

## 🛡️ Security Architecture

```
Layer 1: LoRaWAN AES-128 Encryption (Sensor → Gateway)
Layer 2: TLS 1.3 / HTTPS (Gateway → Server)
Layer 3: Pydantic v2 Input Sanitization (Boundary validators)
Layer 4: AI Anomaly Detection (Sensor health monitoring)
Layer 5: CAP-Compliant Alerts (Tamper-proof standard format)
```

---

## 🖥️ Demo Workflow (For Judges)

1. **View Pilot Region:** Beas River Basin map with 6 monitored villages
2. **Explore Live Telemetry:** Click any village pin to see real-time sensor gauges
3. **Run "What-If" Simulation:** Trigger a Cloudburst Emergency → watch the system respond
4. **Test Fault-Tolerance:** Take a sensor offline → observe seamless fallback to meteorological model
5. **Switch to Citizen View:** See clean, non-technical safety directions for residents
6. **Toggle 3D Terrain:** Explore the 3D mountain mesh with satellite imagery
7. **Check XAI Explanation:** View SHAP feature attribution showing *why* the alert was triggered

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, Uvicorn, WebSockets |
| **ML/AI** | Scikit-Learn (Gradient Boosting), XGBoost, PyTorch (Bi-LSTM), SHAP |
| **Frontend** | React 18, TypeScript, Vite |
| **Maps** | Leaflet (2D), MapLibre GL JS (3D WebGL) |
| **Data Validation** | Pydantic v2 |
| **Caching** | Redis |
| **Geospatial** | SRTM DEM, NetCDF4, xarray |
| **Alerts** | CAP (Common Alerting Protocol), SMS/WhatsApp (Twilio) |

---

## 👥 Team

**SIH 2026 — Problem Statement: SIH 26192**
Ministry of Home Affairs (MHA) / National Disaster Response Force (NDRF)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

> *We chose MIT because disaster management tools should be freely available to every government, NGO, and community that needs them. Lives matter more than licenses.*

---

<p align="center">
  <strong>🌊 VIGIL-FLOOD — The Digital Watchman That Never Sleeps 🌊</strong>
</p>
