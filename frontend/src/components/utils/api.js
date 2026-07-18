// API Service Helper
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Remove auth token
  removeAuthToken() {
    localStorage.removeItem('token');
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle 401 - Unauthorized (token expired or invalid)
        if (response.status === 401) {
          this.removeAuthToken();
          window.location.reload(); // Force re-authentication
          return;
        }

        throw new APIError(
          data.message || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Network or other errors
      throw new APIError(
        error.message || 'Network error occurred',
        0,
        null
      );
    }
  }

  // Auth methods
  async login(emailOrUsername, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Prediction methods
  async getPredictions(page = 1, limit = 10) {
    return this.request(`/predictions?page=${page}&limit=${limit}`);
  }

  async createPrediction(predictionData) {
    return this.request('/predictions', {
      method: 'POST',
      body: JSON.stringify(predictionData),
    });
  }

  // Leaderboard
  async getLeaderboard(limit = 100) {
    return this.request(`/leaderboard?limit=${limit}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create singleton instance
const apiService = new APIService();

export default apiService;
export { APIError };