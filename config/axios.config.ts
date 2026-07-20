import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ensureApiConfigReady, getApiBaseUrl } from './api.config';

// Create axios instance without interceptors first
const Axios = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // React Native may surface 304 with an empty body; always require a full 2xx payload.
  validateStatus: (status) => status >= 200 && status < 300 && status !== 304,
});

// Token management without circular dependencies
let authToken: string | null = null;
let unauthorizedHandler: (() => Promise<void>) | null = null;

// Function to set token (called from auth store)
export const setAuthToken = (token: string | null) => {
  authToken = token;

  if (token) {
    Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete Axios.defaults.headers.common['Authorization'];
  }
};

export const setUnauthorizedHandler = (handler: (() => Promise<void>) | null) => {
  unauthorizedHandler = handler;
};

// Initialize token from storage on app start
export const initializeAuthToken = async () => {
  try {
    const authStorage = await AsyncStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const token = parsed.state?.token;
      if (token) {
        setAuthToken(token);
      }
    }
  } catch (error) {
    console.error('Error initializing auth token:', error);
  }
};

// Request interceptor
Axios.interceptors.request.use(
  async (config) => {
    await ensureApiConfigReady();
    config.baseURL = getApiBaseUrl();

    // Use the current token from memory
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Prevent stale conditional GET responses (304 with empty body) on native clients.
    if ((config.method ?? 'get').toLowerCase() === 'get') {
      config.headers['Cache-Control'] = 'no-cache';
      config.headers.Pragma = 'no-cache';
    }

    return config;
  },
  (error) => {
    console.error('>> axios request error: ', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiry
Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && unauthorizedHandler && authToken) {
      setAuthToken(null);
      await unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

export default Axios;