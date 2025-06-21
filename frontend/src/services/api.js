import axios from "axios";
import { token, setToken } from "../stores/auth/state";
import router from "../routes";
import { resetAuthState } from "../stores/auth/state";

/**
 * Konfigurasi base axios client
 */
const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // untuk mengirim cookies dalam request
  timeout: 30000, // timeout 30 detik
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Setup interceptor request untuk menambahkan token otomatis
 */
api.interceptors.request.use(
  (config) => {
    // Tambahkan token ke header jika tersedia
    if (token.value) {
      config.headers["Authorization"] = `Bearer ${token.value}`;
    }

    // Add request ID for tracking in logs
    config.headers["X-Request-ID"] = Date.now().toString();

    // Log all requests in development
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => {
    console.error("API Request Error:", error.message);
    return Promise.reject(error);
  }
);

/**
 * Setup interceptor response untuk handling error umum
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Jika 401 dan belum pernah di-retry
    if (error.response && error.response.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/login") && !originalRequest.url.includes("/auth/register") && !originalRequest.url.includes("/auth/refresh-token")) {
      if (isRefreshing) {
        // Jika sudah ada proses refresh, queue request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const res = await api.post("/auth/refresh-token");
        const newToken = res.data.token;
        setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        resetAuthState();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const currentPath = window.location.pathname;
        if (!["/login", "/register"].includes(currentPath)) {
          router.push("/login");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    // Tambahkan global error handling di sini
    if (error.response) {
      // Error dari server dengan respons
      console.error("API Error:", {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
      });

      // Handle common server errors
      if (error.response.status >= 500) {
        console.error("Server error 500+:", error.config?.url, error.response.data);
        // Enrich error with more specific message for 500 errors
        error.serverError = true;
        if (!error.response.data.message) {
          error.response.data.message = "Server encountered an error processing this request";
        }
      }
    } else if (error.request) {
      // Request dibuat tapi tidak ada respons (network issues)
      console.error("Network Error:", {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Add more specific error info for timeouts
      if (error.code === "ECONNABORTED") {
        error.timeoutError = true;
        error.message = `Request timed out (${error.config?.timeout || "unknown"}ms): ${error.config?.url}`;
      }
    } else {
      // Error lainnya
      console.error("API Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
