import { useState, useEffect, useRef } from "react";
import axios from "axios";

const PING_INTERVAL = 20000;

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const intervalRef = useRef(null);

  // Safely resolve the health ping endpoint
  const getHealthUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      const clean = envUrl.trim().replace(/\/+$/, '');
      return clean.endsWith('/api') ? `${clean}/health` : `${clean}/api/health`;
    }

    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '/api/health';
      }
      if (/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))\./.test(hostname)) {
        return `http://${hostname}:5001/api/health`;
      }
    }

    return '/api/health';
  };

  async function checkConnectivity() {
    // If the browser or mobile OS indicates no connection, immediately report offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return;
    }

    // Device has mobile data or Wi-Fi active
    try {
      const url = getHealthUrl();
      await axios.get(url, { timeout: 4000 });
      setIsOnline(true);
    } catch (err) {
      // If the device has mobile data or Wi-Fi (navigator.onLine is true),
      // do not falsely claim the user is offline.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
      } else {
        // Device is connected to mobile data/network
        setIsOnline(true);
      }
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkConnectivity();
    intervalRef.current = setInterval(checkConnectivity, PING_INTERVAL);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return isOnline;
}
