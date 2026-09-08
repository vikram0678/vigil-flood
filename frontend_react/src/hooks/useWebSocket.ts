import { useEffect, useRef } from 'react';
import { useFlood } from '../context/FloodContext';

export const useWebSocket = () => {
  const { updateVillagesFromTelemetry, refreshData } = useFlood();
  const wsRef = useRef<WebSocket | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!isMountedRef.current) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
        ? "localhost:8000" 
        : window.location.host;
      const wsUrl = `${protocol}//${host}/ws/telemetry`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log("🌊 [VIGIL-FLOOD] Live Telemetry WebSocket Connected.");
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "TELEMETRY_PULSE" && message.villages) {
              updateVillagesFromTelemetry(message.villages);
            } else if (message.type === "SIMULATION_UPDATE") {
              refreshData();
            }
          } catch (e) {
            console.error("WS message parse error:", e);
          }
        };

        socket.onclose = () => {
          if (isMountedRef.current) {
            console.log("WebSocket closed. Reconnecting in 3s...");
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        socket.onerror = (err) => {
          console.warn("WebSocket error:", err);
          try {
            socket.close();
          } catch (_) {}
        };
      } catch (err) {
        console.error("WebSocket connection failed:", err);
        if (isMountedRef.current) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [updateVillagesFromTelemetry, refreshData]);
};

