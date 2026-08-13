import axios from 'axios';

const TOKEN_KEY = 'msc_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Un 401 significa token vencido o inválido: se descarta y la app vuelve al
// login sola, en vez de dejar pantallas a medio cargar.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.dispatchEvent(new Event('msc:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
