import axios from 'axios';

export const backendApi = axios.create({
  baseURL: 'http://localhost:8085/api',
  headers: { 'Content-Type': 'application/json' },
});

export const aiApi = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach JWT token to every request
backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
