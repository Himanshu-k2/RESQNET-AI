import axios from 'axios';

// Dynamically determine the API base URL
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local dev environment proxied by Vite
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/api';
    }
    // Mobile device accessing computer on local Wi-Fi
    if (/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))\./.test(hostname)) {
      return `http://${hostname}:5001/api`;
    }
  }

  // Fallback for deployed static hosting (same-origin /api proxy or direct route)
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT and log outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resqnet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `[ResQNet API Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`,
      {
        hasToken: !!token,
        payload: config.data || null,
      }
    );
    return config;
  },
  (error) => {
    console.error('[ResQNet API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to log responses and format clear error messages
api.interceptors.response.use(
  (response) => {
    console.log(
      `[ResQNet API Response] ${response.config.method?.toUpperCase()} ${response.config.url} => HTTP ${response.status}`
    );
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;

    console.error(
      `[ResQNet API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} => HTTP ${status}:`,
      responseData || error.message
    );

    let message = 'Something went wrong. Please check your connection and try again.';
    if (responseData) {
      if (typeof responseData.message === 'string' && responseData.message.trim()) {
        message = responseData.message;
      } else if (typeof responseData.error === 'string' && responseData.error.trim()) {
        message = responseData.error;
      } else if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        message = responseData.errors.map((e) => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else if (typeof responseData === 'string' && responseData.trim()) {
        message = responseData;
      }
    } else if (error.message && !error.message.includes('status code')) {
      message = error.message;
    }

    const enhancedError = new Error(message);
    enhancedError.status = status;
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

export default api;
