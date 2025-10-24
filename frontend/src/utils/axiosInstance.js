// frontend/src/utils/axiosInstance.js
import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";

const isProd = window.location.hostname.includes("xclarity.duckdns.org");

// ✅ Base URL dinâmica: proxy em dev, domínio real em produção
const API_URL = isProd
  ? "https://xclarity.duckdns.org/api"
  : "/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// === Interceptores (sem alterar nada do seu código atual) ===
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
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
        const refreshToken = getRefreshToken();
        const { data } = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });
        setTokens({ access: data.access, refresh: refreshToken });
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return axiosInstance(originalRequest);
      } catch {
        clearTokens();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
