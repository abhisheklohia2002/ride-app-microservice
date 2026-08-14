import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { ApiErrorShape, ApiResponse, AuthTokens } from "@/types";
import { mockAdapter } from "./mock/adapter";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./token-store";

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";
export const API_TIMEOUT_MS = Number(import.meta.env["VITE_API_TIMEOUT_MS"] ?? 15000);

export const USE_MOCK_API = String(import.meta.env["VITE_USE_MOCK_API"] ?? "true") !== "false";

export class ApiError extends Error implements ApiErrorShape {
  status: number;
  code: string;
  fieldErrors?: Record<string, string> | undefined;

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = "ApiError";
    this.status = shape.status;
    this.code = shape.code;
    this.fieldErrors = shape.fieldErrors;
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // timeout: API_TIMEOUT_MS,
   withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  ...(USE_MOCK_API ? { adapter: mockAdapter } : {}),
});

/* ----------------------------- request pipeline --------------------------- */

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  config.headers.set("X-Client", "ridex-web");
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshPromise: Promise<AuthTokens> | null = null;
const sessionExpiredListeners = new Set<() => void>();

export function onSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired() {
  clearTokens();
  sessionExpiredListeners.forEach((listener) => listener());
}

/** Single-flight refresh so concurrent 401s trigger only one refresh call. */
async function refreshAccessToken(): Promise<AuthTokens> {
  if (!refreshPromise) {
    const token = getRefreshToken();
    refreshPromise = (async () => {
      if (!token)
        throw new ApiError({ status: 401, code: "no_refresh_token", message: "Session expired." });
      const response = await axios.request<ApiResponse<AuthTokens>>({
        baseURL: API_BASE_URL,
        url: "/auth/refresh",
        method: "POST",
        timeout: API_TIMEOUT_MS,
        data: { refreshToken: token },
        ...(USE_MOCK_API ? { adapter: mockAdapter } : {}),
      });
      const tokens = response.data.data;
      setTokens(tokens);
      return tokens;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<
      ApiResponse<{ code?: string; fieldErrors?: Record<string, string> }>
    >;
    if (axiosError.code === "ECONNABORTED" || axiosError.code === "ETIMEDOUT") {
      return new ApiError({
        status: 408,
        code: "timeout",
        message: "The request took too long. Check your connection and retry.",
      });
    }
    if (!axiosError.response) {
      return new ApiError({
        status: 0,
        code: "network_error",
        message: "You appear to be offline. Reconnect and try again.",
      });
    }
    const payload = axiosError.response.data;
    return new ApiError({
      status: axiosError.response.status,
      code: payload?.data?.code ?? "request_failed",
      message: payload?.message ?? "Something went wrong. Please try again.",
      fieldErrors: payload?.data?.fieldErrors,
    });
  }
  return new ApiError({
    status: 500,
    code: "unknown_error",
    message: error instanceof Error ? error.message : "Unexpected error.",
  });
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const config = error.config as RetriableConfig | undefined;
      const isAuthCall = config?.url?.startsWith("/auth/") ?? false;
      if (config && !config._retried && !isAuthCall && getRefreshToken()) {
        config._retried = true;
        try {
          await refreshAccessToken();
          return api.request(config);
        } catch {
          notifySessionExpired();
        }
      } else if (!isAuthCall) {
        notifySessionExpired();
      }
    }
    return Promise.reject(toApiError(error));
  },
);

/* ------------------------------ typed helpers ----------------------------- */

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>(api.get<ApiResponse<T>>(url, config)),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(api.post<ApiResponse<T>>(url, data, config)),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(api.patch<ApiResponse<T>>(url, data, config)),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(api.put<ApiResponse<T>>(url, data, config)),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>(api.delete<ApiResponse<T>>(url, config)),
};

export { clearTokens, getAccessToken, setTokens };
