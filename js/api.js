const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Inject authentication headers if available
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    const token = sessionStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Handle fetch wrapper with auto mock-fallback
  async request(endpoint, options = {}, mockFallbackKey = null) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.error || `HTTP error! status: ${response.status}`,
          isNetworkError: false
        };
      }

      return await response.json();
    } catch (error) {
      // If it's a network error (TypeError due to fetch fail) or backend is unreachable
      if (error instanceof TypeError || error.isNetworkError !== false) {
        console.warn(`[API] Network error hitting ${endpoint}. Falling back to mock data...`);
        if (mockFallbackKey && typeof window.mockData !== 'undefined') {
          // Resolve mock data to ensure the UI does not break
          return this.getMockFallback(mockFallbackKey, endpoint, options);
        }
        window.showToast?.('Backend unreachable. Using offline mode.', 'warning');
      } else {
        // Validation error, Bad credentials, etc.
        console.error('[API] Server Error:', error.message);
        window.showToast?.(error.message, 'error');
      }
      throw error;
    }
  }

  getMockFallback(key, endpoint, options) {
    // For GET requests return the mock list/object
    if (!options.method || options.method === 'GET') {
      if (key === 'dashboardStats') return window.mockData.kpis;
      if (key === 'activities') return []; // Mock doesn't have activities natively, return empty
      return window.mockData[key] || [];
    }
    
    // For POST/PUT/DELETE, just return success-like mock payload
    if (options.method === 'POST' || options.method === 'PUT') {
        const payload = options.body ? JSON.parse(options.body) : {};
        payload.id = payload.id || Math.floor(Math.random() * 10000);
        return payload;
    }
    
    if (options.method === 'DELETE') {
        return { message: 'Deleted successfully' };
    }
    
    return [];
  }

  async get(endpoint, mockFallbackKey = null) {
    return this.request(endpoint, { method: 'GET' }, mockFallbackKey);
  }

  async post(endpoint, data, mockFallbackKey = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }, mockFallbackKey);
  }

  async put(endpoint, data, mockFallbackKey = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, mockFallbackKey);
  }

  async delete(endpoint, mockFallbackKey = null) {
    return this.request(endpoint, { method: 'DELETE' }, mockFallbackKey);
  }
}

window.api = new ApiService();
