import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
from backend.app.core.simulation import simulation_engine

ws_router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@ws_router.websocket("/ws/telemetry")
async def websocket_telemetry_stream(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Broadcast current telemetry & risk state
            summary = simulation_engine.get_all_villages_summary()
            payload = {
                "type": "TELEMETRY_PULSE",
                "villages": summary
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(3.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
