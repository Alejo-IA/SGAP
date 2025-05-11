import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include CSRF token
instance.interceptors.request.use((config) => {
  // Get CSRF token from cookie
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Add a response interceptor to handle errors
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      console.error('CSRF token validation failed:', error);
    }
    return Promise.reject(error);
  }
);

export default instance; 