// src/services/api.js
// Central Axios instance. Auto-attaches JWT to every request.
// Import this in every screen instead of raw fetch().
// Usage: import api from '../services/api';
//        const { data } = await api.get('/hobbies/recommendations');

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://10.205.59.215:8080'; // Change to your Render URL when deployed

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage and force re-login
      await SecureStore.deleteItemAsync('jwt');
      // Navigation reset handled in AppNavigator via auth state listener
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth helpers ──────────────────────────────────────────────────────────────
export async function saveToken(token) {
  await SecureStore.setItemAsync('jwt', token);
}

export async function getToken() {
  return await SecureStore.getItemAsync('jwt');
}

export async function clearToken() {
  await SecureStore.deleteItemAsync('jwt');
}

export async function isLoggedIn() {
  const token = await SecureStore.getItemAsync('jwt');
  return !!token;
}