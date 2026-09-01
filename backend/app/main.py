import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path so backend modules can be imported
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.config import APP_NAME, APP_VERSION
from backend.app.api.routes import router as api_router
from backend.app.api.websocket import ws_router
from backend.app.core.ml_engine import ml_engine

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Multi-Source Flash Flood Early Warning & Decision Support System for Hilly Regions (SIH 26192)"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(api_router)
app.include_router(ws_router)

# Mount Frontend Static Assets
FRONTEND_DIR = PROJECT_ROOT / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/")
def serve_index():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": f"{APP_NAME} Backend Running. Frontend not found at {index_file}"}

@app.on_event("startup")
def startup_event():
    print("=" * 60)
    print(f"🚀 Starting {APP_NAME} v{APP_VERSION}")
    print(f"🧠 Ensuring ML Models are trained & loaded...")
    ml_engine.load_or_train_default()
    print("✅ System initialized and ready for SIH evaluation!")
    print("=" * 60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
