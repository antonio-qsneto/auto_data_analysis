import axios from "axios";
import { getApiToken, getRefreshToken, refreshTokens, signOut } from "./auth";

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = getApiToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;
      try {
        const tokens = await refreshTokens();
        const apiToken = tokens.id_token || tokens.access_token || getApiToken();
        originalRequest.headers.Authorization = `Bearer ${apiToken}`;
        return axiosInstance(originalRequest);
      } catch {
        signOut({ redirect: false });
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
