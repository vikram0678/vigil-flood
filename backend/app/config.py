import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
DATA_DIR = BASE_DIR / "data"

SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Application Settings
APP_NAME = "SIH 26192 - Flash Flood Early Warning System"
APP_VERSION = "1.0.0"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# Pilot Region Metadata
PILOT_REGION = {
    "name": "Beas River Basin, Mandi District",
    "state": "Himachal Pradesh",
    "country": "India",
    "center_lat": 31.7087,
    "center_lng": 76.9320,
    "zoom": 12
}

# Risk Level Thresholds (Probability 0.0 to 1.0)
RISK_THRESHOLDS = {
    "LOW": 0.30,
    "MODERATE": 0.55,
    "HIGH": 0.75,
    "CRITICAL": 1.00
}

# Sensor Status
SENSOR_STATUS_ONLINE = "ONLINE"
SENSOR_STATUS_OFFLINE = "OFFLINE"
SENSOR_STATUS_STALE = "STALE"
SENSOR_STATUS_ANOMALY = "ANOMALY"
