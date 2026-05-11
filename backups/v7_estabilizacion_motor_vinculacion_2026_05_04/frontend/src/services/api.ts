import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Ruta de tu servidor backend
});

export default api;
