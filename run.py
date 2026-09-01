import sys
import subprocess
import os
import webbrowser
import time
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def main():
    print("=" * 65)
    print("🌊 SIH 26192: FLASH FLOOD EARLY WARNING SYSTEM FOR HILLY REGIONS")
    print("=" * 65)
    
    # Path to Python in virtual environment
    if os.name == 'nt':
        venv_python = Path(__file__).parent / "venv" / "Scripts" / "python.exe"
    else:
        venv_python = Path(__file__).parent / "venv" / "bin" / "python"
        
    py_exec = str(venv_python) if venv_python.exists() else sys.executable
    
    print(f"🔹 Using Python Executable: {py_exec}")
    print("🔹 Initializing Backend API Server & Live Telemetry Engine...")
    print("🔹 Starting server on http://localhost:8000")
    print("-" * 65)
    
    # Start FastAPI server using uvicorn
    cmd = [py_exec, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    
    try:
        # Give a second and open browser
        def open_browser():
            time.sleep(2)
            print("🌐 Launching Command Center Dashboard in default browser...")
            webbrowser.open("http://localhost:8000")
            
        import threading
        threading.Thread(target=open_browser, daemon=True).start()
        
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n🛑 System stopped by user.")

if __name__ == "__main__":
    main()
