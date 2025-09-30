import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Create axios instance without interceptors first
const Axios = axios.create({
  baseURL: 'http://192.168.2.18:3000/api/v1', // To get this, on your PC, go to, 'apple icon (top right corner)', click on 'system settings', click on 'Network', click 'Details'. Then find similar IP.
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management without circular dependencies
let authToken: string | null = null;

// Function to set token (called from auth store)
export const setAuthToken = (token: string | null) => {
  authToken = token;

  if (token) {
    Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete Axios.defaults.headers.common['Authorization'];
  }
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
    console.log('Error initializing auth token:', error);
  }
};

// Request interceptor
Axios.interceptors.request.use(
  (config) => {
    // Use the current token from memory
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    console.log('>> axios request error: ', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiry
Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      setAuthToken(null);
      await AsyncStorage.removeItem('auth-storage');
      // You might want to redirect to login screen here
      console.log('Authentication failed, redirect to login');
    }
    return Promise.reject(error);
  }
);

export default Axios;