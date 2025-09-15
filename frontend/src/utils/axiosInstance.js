import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";

const API_URL = "/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de REQUEST
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("[Axios][Request] Enviando request:", {
      url: config.url,
      method: config.method,
      token: token.slice(0, 10) + "...", // só loga o começo do token
    });
  } else {
    console.log("[Axios][Request] Sem token, request:", {
      url: config.url,
      method: config.method,
    });
  }
  return config;
});

// Interceptor de RESPONSE
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("[Axios][Response] Sucesso:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error("[Axios][Response] Erro:", {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      console.warn("[Axios][Token] Tentando refresh token...");

      originalRequest._retry = true;
      try {
        const refreshToken = getRefreshToken();
        console.log("[Axios][Token] Refresh token usado:", refreshToken);

        const { data } = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        console.log("[Axios][Token] Novo access token recebido:", data.access);

        setTokens({ access: data.access, refresh: refreshToken });
        originalRequest.headers.Authorization = `Bearer ${data.access}`;

        console.log("[Axios][Retry] Reenviando request com novo token:", {
          url: originalRequest.url,
          method: originalRequest.method,
        });

        return axiosInstance(originalRequest);
      } catch (err) {
        console.error("[Axios][Token] Refresh token falhou:", err.response?.data);
        clearTokens();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
