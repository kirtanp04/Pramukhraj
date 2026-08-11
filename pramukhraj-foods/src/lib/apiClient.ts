import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { getDataFromLocalStorage } from "./localStorage";
import { CryptoService } from "@/services/cryptoService";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode?: number;
  data: T | null;
  errors?: unknown;
}

// ─── Base instance ────────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor — inject Bearer token ─────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url !== undefined && config.url.includes("auth/admin")) {
      return config;
    }
    const token = getDataFromLocalStorage("token");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// ─── Response interceptor — refresh on 401, surface errors ─────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async error => {
    // Note: 401 token refresh logic would go here
    return Promise.reject(error);
  }
);

// ─── Error Formatting Helper ──────────────────────────────────────────────────

export function getApiErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) return "Request was cancelled.";
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.message) return data.message;
    if (error.code === "ECONNABORTED")
      return "Request timed out. Please try again.";
    if (!error.response) return "Network error. Please check your connection.";
    if (error.response.status === 401)
      return "Your session has expired. Please sign in again.";
    if (error.response.status === 403)
      return "You do not have permission to perform this action.";
    if (error.response.status === 404)
      return "The requested resource was not found.";
    if (error.response.status >= 500)
      return "Server error. Please try again later.";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

// ─── Centralized Data & Error Parsers ─────────────────────────────────────────

/**
 * Validates responses. Returns ONLY the actual data if successful.
 * Throws the full response if `success` is false or `errors` are populated.
 */
function parseResponseData<T>(responsePayload: ApiResponse<T>): T | null {
  const hasErrors =
    responsePayload.errors !== undefined &&
    responsePayload.errors !== null &&
    responsePayload.errors !== "";

  // Catch 200 OK responses that represent application logic failures
  if (!responsePayload.success || hasErrors) {
    throw responsePayload;
  }

  // ONLY return the data portion to the caller
  return responsePayload.data;
}

/**
 * Catches all errors (Axios, runtime, or API failures) and guarantees
 * the thrown error is consistently formatted.
 */
function handleApiError(error: unknown): never {
  // 1. If it's already an ApiResponse (thrown by parseResponseData logic above)
  if (error !== null && typeof error === "object" && "success" in error) {
    throw error;
  }

  // 2. If it's an HTTP error from Axios containing backend payload
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | ApiResponse<unknown>
      | undefined;

    throw {
      success: false,
      message: getApiErrorMessage(error),
      statusCode: error.response?.status,
      data: responseData?.data ?? null,
      errors: responseData?.errors ?? error.message,
    } as ApiResponse<null>;
  }

  // 3. Fallback for JS runtime exceptions (e.g., encryption failure)
  throw {
    success: false,
    message: getApiErrorMessage(error),
    statusCode: 500,
    data: null,
    errors: error instanceof Error ? error.message : "Unknown error occurred",
  } as ApiResponse<null>;
}

// ─── Generic typed request helpers ────────────────────────────────────────────

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T | null> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return parseResponseData(response.data);
  } catch (error) {
    handleApiError(error);
  }
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T | null> {
  try {
    const encryptedData =
      body !== undefined && body !== null
        ? CryptoService.encrypt(JSON.stringify(body) as any)
        : "null";
    debugger;
    const response = await apiClient.post<ApiResponse<T>>(
      url,
      encryptedData,
      config
    );

    const decryptData = CryptoService.decrypt(response.data as any as string)

    return parseResponseData(JSON.parse(decryptData));
  } catch (error) {
    handleApiError(error);
  }
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T | null> {
  try {
    const encryptedData =
      body !== undefined && body !== null
        ? CryptoService.encrypt(JSON.stringify(body) as any)
        : "null";

    const response = await apiClient.put<ApiResponse<T>>(
      url,
      encryptedData,
      config
    );

    return parseResponseData(response.data);
  } catch (error) {
    handleApiError(error);
  }
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T | null> {
  try {
    const encryptedData =
      body !== undefined && body !== null
        ? CryptoService.encrypt(JSON.stringify(body) as any)
        : "null";

    const response = await apiClient.patch<ApiResponse<T>>(
      url,
      encryptedData,
      config
    );

    return parseResponseData(response.data);
  } catch (error) {
    handleApiError(error);
  }
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T | null> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return parseResponseData(response.data);
  } catch (error) {
    handleApiError(error);
  }
}
