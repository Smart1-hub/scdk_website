import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── Change this to your backend URL ─────────────────────────────────────────
const BASE_URL = 'http://YOUR_SERVER_IP:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        const refresh = await SecureStore.getItemAsync('refresh_token');
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
        await SecureStore.setItemAsync('access_token',  data.accessToken);
        await SecureStore.setItemAsync('refresh_token', data.refreshToken);
        err.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api.request(err.config);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  if (data.success) {
    await SecureStore.setItemAsync('access_token',  data.accessToken);
    await SecureStore.setItemAsync('refresh_token', data.refreshToken);
    await SecureStore.setItemAsync('user',          JSON.stringify(data.user));
  }
  return data;
};

export const logout = async () => {
  const refresh = await SecureStore.getItemAsync('refresh_token');
  await api.post('/auth/logout', { refreshToken: refresh }).catch(() => {});
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
  await SecureStore.deleteItemAsync('user');
};

export const getStoredUser = async () => {
  const raw = await SecureStore.getItemAsync('user');
  return raw ? JSON.parse(raw) : null;
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const getProjects  = ()       => api.get('/projects').then(r => r.data);
export const getProject   = (id)     => api.get(`/projects/${id}`).then(r => r.data);
export const getProjectsGeoJSON = () => api.get('/projects/map').then(r => r.data);

// ── IoT ───────────────────────────────────────────────────────────────────────
export const getSensors        = (projectId) => api.get('/iot/sensors', { params: { projectId } }).then(r => r.data);
export const getSensorReadings = (id, hours = 6) => api.get(`/iot/sensors/${id}/readings`, { params: { hours } }).then(r => r.data);

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const getTasks    = (projectId) => api.get(`/projects/${projectId}/tasks`).then(r => r.data);
export const updateTask  = (id, body)  => api.patch(`/tasks/${id}`, body).then(r => r.data);

// ── AI ────────────────────────────────────────────────────────────────────────
export const getConversations = ()   => api.get('/ai/conversations').then(r => r.data);
export const createConversation = (body) => api.post('/ai/conversations', body).then(r => r.data);
export const getMessages  = (id)     => api.get(`/ai/conversations/${id}/messages`).then(r => r.data);
export const sendMessage  = (id, content) => api.post(`/ai/conversations/${id}/messages`, { content }).then(r => r.data);

export default api;
