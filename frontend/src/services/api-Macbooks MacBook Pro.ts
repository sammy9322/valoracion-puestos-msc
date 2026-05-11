import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5000/api', // Backend local Express port
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor base para el manejo de errores global (opcional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error Response:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
