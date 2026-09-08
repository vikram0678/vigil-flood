import { useEffect, useRef } from 'react';
import { useFlood } from '../context/FloodContext';

export const useWebSocket = () => {
  const { updateVillagesFromTelemetry, refreshData } = useFlood();
  const updateVillagesRef = useRef(updateVillagesFromTelemetry);
  updateVillagesRef.current = updateVillagesFromTelemetry;
  const refreshDataRef = useRef(refreshData);
  refreshDataRef.current = refreshData;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isAlive = true;

    const connect = () => {
      if (!isAlive) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
        ? "localhost:8000" 
        : window.location.host;
      const wsUrl = `${protocol}//${host}/ws/telemetry`;

      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log("🌊 [VIGIL-FLOOD] Live Telemetry WebSocket Connected.");
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "TELEMETRY_PULSE" && message.villages) {
              if (updateVillagesRef.current) {
                updateVillagesRef.current(message.villages);
              }
            } else if (message.type === "SIMULATION_UPDATE") {
              if (refreshDataRef.current) {
                refreshDataRef.current();
              }
            }
          } catch (e) {
            console.error("WS message parse error:", e);
          }
        };

        socket.onclose = () => {
          if (isAlive) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        socket.onerror = () => {
          try {
            if (socket) socket.close();
          } catch (_) {}
        };
      } catch (err) {
        if (isAlive) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isAlive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) {
        socket.close();
        socket = null;
      }
    };
  }, []);
};


