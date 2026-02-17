import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const studentToken = localStorage.getItem('studentToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (studentToken) {
      config.headers.Authorization = `Bearer ${studentToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check userType BEFORE clearing localStorage
      const userType = localStorage.getItem('userType');
      
      // Check if we're already on a login page - don't redirect if so
      const currentPath = window.location.pathname;
      const isOnLoginPage = currentPath.includes('/login');
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('studentToken');
      localStorage.removeItem('student');
      localStorage.removeItem('userType');
      
      // Only redirect if not already on login page
      if (!isOnLoginPage) {
        // Redirect based on the userType that was stored before clearing
        if (userType === 'student') {
          window.location.href = '/student/login';
        } else {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
