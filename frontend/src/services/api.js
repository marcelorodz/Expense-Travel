import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api' // URL do seu Spring Boot
});

// Interceptor: Toda requisição levará o Token se ele existir no computador
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;