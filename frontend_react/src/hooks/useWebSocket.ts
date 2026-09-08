import { useEffect, useRef } from 'react';
import { useFlood } from '../context/FloodContext';

export const useWebSocket = () => {
  const { refreshData, selectVillage, selectedVillageId } = useFlood();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
        ? "localhost:8000" 
        : window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log("🌊 [VIGIL-FLOOD] Live Telemetry WebSocket Connected.");
        };

        socket.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "TELEMETRY_UPDATE" || message.type === "SIMULATION_UPDATE") {
              await refreshData();
              if (selectedVillageId) {
                await selectVillage(selectedVillageId);
              }
            }
          } catch (e) {
            console.error("WS message parse error:", e);
          }
        };

        socket.onclose = () => {
          console.log("WebSocket closed. Reconnecting in 3s...");
          reconnectTimer = setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
          console.warn("WebSocket error:", err);
          socket.close();
        };
      } catch (err) {
        console.error("WebSocket connection failed:", err);
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedVillageId]);
};
