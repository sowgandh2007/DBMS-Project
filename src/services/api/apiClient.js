// =============================================================================
// BACKEND API CLIENT & INTEGRATION CONFIGURATION
// Retail Inventory & Rack Management System (Flask + Supabase PostgreSQL)
// =============================================================================

export const API_CONFIG = {
  // Python Flask backend URL pointing to local server or proxy
  BASE_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  USE_MOCK_DATA: false, // Always prioritize and use live Supabase PostgreSQL backend
  TIMEOUT_MS: 10000,
};

// Global toggle for mock mode vs live backend mode
export function getUseMockData() {
  const saved = sessionStorage.getItem('rackmaster_use_mock');
  if (saved !== null) {
    return saved === 'true';
  }
  return API_CONFIG.USE_MOCK_DATA;
}

export function setUseMockData(useMock) {
  sessionStorage.setItem('rackmaster_use_mock', String(useMock));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Check if the Python Flask backend is reachable.
 */
export async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { online: true, database: data.database };
    }
    return { online: false, message: `Status ${res.status}` };
  } catch (err) {
    return { online: false, message: err.message };
  }
}

/**
 * Standard API request wrapper for executing parameterized REST endpoints.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || errorBody.error || `API Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[API Client] Request to ${endpoint} failed:`, error.message);
    throw error;
  }
}
