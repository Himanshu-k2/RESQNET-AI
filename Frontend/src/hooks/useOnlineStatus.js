import { useState, useEffect, useRef } from "react";
import axios from "axios";

const PING_INTERVAL = 15000;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const intervalRef = useRef(null);

  async function pingServer() {
    try {
      await axios.get(`${API_BASE}/api/health`, { timeout: 5000 });
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }

  useEffect(() => {
    const handleOnline = () => { pingServer(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    intervalRef.current = setInterval(pingServer, PING_INTERVAL);
    pingServer();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalRef.current);
    };
  }, []);

  return isOnline;
}
