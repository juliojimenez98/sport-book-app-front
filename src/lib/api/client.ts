import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { AuthTokens } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Token storage keys
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// ============================================
// Token helpers
// ============================================

/**
 * Get stored tokens
 */
export function getTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!accessToken) return null;
  return { accessToken, refreshToken: refreshToken || undefined };
}

/**
 * Store tokens
 */
export function setTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

/**
 * Clear tokens
 */
export function clearTokens(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ============================================
// API Error class
// ============================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ============================================
// Custom config type (extends axios config with skipAuth)
// ============================================

interface CustomAxiosConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  _retry?: boolean;
}

// ============================================
// Axios instance
// ============================================

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// Request interceptor: inject Bearer token
// ============================================

axiosInstance.interceptors.request.use(
  (config: CustomAxiosConfig) => {
    if (!config.skipAuth) {
      const tokens = getTokens();
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================
// Response interceptor: refresh token on 401
// ============================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosConfig;

    // Only attempt refresh for 401 on authenticated requests that haven't been retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.skipAuth
    ) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = getTokens();
      if (!tokens?.refreshToken) {
        clearTokens();
        isRefreshing = false;
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(new ApiError("Session expired", 401));
      }

      try {
        // Use a plain axios call (not the instance) to avoid interceptor loop
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: tokens.refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        const data = refreshResponse.data?.data || refreshResponse.data;
        const newTokens: AuthTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || tokens.refreshToken,
        };
        setTokens(newTokens);

        // Retry all queued requests with the new token
        processQueue(null, newTokens.accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(new ApiError("Session expired", 401));
      } finally {
        isRefreshing = false;
      }
    }

    // Transform axios errors into ApiError
    if (error.response) {
      const errorData = error.response.data as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      return Promise.reject(
        new ApiError(
          errorData?.message || error.message || "An error occurred",
          error.response.status,
          errorData?.errors,
        ),
      );
    }

    return Promise.reject(new ApiError(error.message || "Network error", 0));
  },
);

// ============================================
// Response data extractor
// ============================================

/**
 * Extract data from backend response format { success, data, pagination }
 */
function extractData<T>(responseData: unknown): T {
  const json = responseData as Record<string, unknown>;

  if (json && typeof json === "object" && "data" in json) {
    // If pagination exists, return { data, pagination }
    if ("pagination" in json) {
      return { data: json.data, pagination: json.pagination } as T;
    }
    // Otherwise just extract data
    return json.data as T;
  }

  return json as T;
}

// ============================================
// Request config type for public API
// ============================================

export interface RequestConfig {
  skipAuth?: boolean;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

// ============================================
// HTTP method helpers
// ============================================

export const api = {
  get: async <T>(endpoint: string, config?: RequestConfig): Promise<T> => {
    const response = await axiosInstance.get(endpoint, {
      skipAuth: config?.skipAuth,
      params: config?.params,
    } as CustomAxiosConfig);
    return extractData<T>(response.data);
  },

  post: async <T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> => {
    const response = await axiosInstance.post(endpoint, data ?? undefined, {
      skipAuth: config?.skipAuth,
      headers: config?.headers,
    } as CustomAxiosConfig);
    return extractData<T>(response.data);
  },

  put: async <T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> => {
    const response = await axiosInstance.put(endpoint, data ?? undefined, {
      skipAuth: config?.skipAuth,
    } as CustomAxiosConfig);
    return extractData<T>(response.data);
  },

  patch: async <T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> => {
    const response = await axiosInstance.patch(endpoint, data ?? undefined, {
      skipAuth: config?.skipAuth,
    } as CustomAxiosConfig);
    return extractData<T>(response.data);
  },

  delete: async <T>(endpoint: string, config?: RequestConfig): Promise<T> => {
    const response = await axiosInstance.delete(endpoint, {
      skipAuth: config?.skipAuth,
    } as CustomAxiosConfig);
    return extractData<T>(response.data);
  },
};

export default api;
