// API Configuration - Centralized base URL management
const getApiBaseUrl = () => {
  // In Vite, environment variables must be prefixed with VITE_
  // Use import.meta.env.VITE_API_BASE_URL for Vite
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Fallback for development if env variable not set
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  
  // Fallback: try to detect from window location (for development)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Default to port 5000 for local development
    return origin.includes('localhost') || origin.includes('127.0.0.1')
      ? origin.replace(/:\d+$/, ':5000')
      : origin;
  }
  
  // Last resort fallback
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build full API endpoint URLs
export const getApiUrl = (endpoint) => {
  const base = API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

export default API_BASE_URL;

