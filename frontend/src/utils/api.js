import axios from "axios";
import { getAccessToken, clearAccessToken } from "../state/auth_store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  withCredentials: true, // safe even if you remove refresh tokens
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // token invalid/expired => kick user out
      clearAccessToken();
    }
    return Promise.reject(err);
  }
);

export default api;