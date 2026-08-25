import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { CryptoService } from "@/services/cryptoService";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode?: number;
  data: T | null;
  errors?: unknown;
}

// Get token

function getAccessToken(): string {
  try {
    const strData = localStorage.getItem("pramukhraj-admin-auth");
    if (strData === null) {
      throw new Error("Access token not found. Please log in and try again.");
    }
    const data: unknown = JSON.parse(strData);
    if (
      data === null ||
      typeof data !== "object" ||
      !("state" in data) ||
      data.state === null ||
      typeof data.state !== "object" ||
      !("user" in data.state) ||
      data.state.user === null ||
      typeof data.state.user !== "object" ||
      !("accessToken" in data.state.user) ||
      typeof data.state.user.accessToken !== "string" ||
      data.state.user.accessToken.trim() === ""
    ) {
      throw new Error("Access token not found. Please log in and try again.");
    }
    return data.state.user.accessToken;
  } catch {
    throw new Error("Access token not found. Please log in and try again.");
  }
}

// ─── Base instance ────────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  // baseURL: "https://toddler-comic-sometimes-drinking.trycloudflare.com/api/",
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000",
  timeout: 60_000, // 1min
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor — inject Bearer token ─────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url !== undefined && config.url.includes("auth/admin")) {
      return config;
    }
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    config.headers["Time-zone"] = new Date().getTimezoneOffset()
    return config;
  },
  error => Promise.reject(error)
);

// ─── Response interceptor — refresh on 401, surface errors ─────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error:any) =>{
    return Promise.reject(error);
  }
);

// ─── Error Formatting Helper ──────────────────────────────────────────────────

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    typeof value.success === "boolean" &&
    "message" in value &&
    typeof value.message === "string" &&
    "data" in value
  );
}

function decodeApiResponse<T>(payload: unknown): ApiResponse<T> {
  const decoded: unknown =
    typeof payload === "string"
      ? JSON.parse(CryptoService.decrypt(payload))
      : payload;

  if (!isApiResponse(decoded)) {
    throw new Error("The server returned an invalid response.");
  }

  return decoded as ApiResponse<T>;
}

function tryDecodeApiResponse(payload: unknown): ApiResponse<unknown> | undefined {
  try {
    return decodeApiResponse(payload);
  } catch {
    return undefined;
  }
}

export function getApiErrorMessage(error: unknown): string {
  // Request helpers normalize failures to ApiResponse objects. Handle those
  // here as well so every caller can use this function consistently.

  if (axios.isCancel(error)) return "Request was cancelled.";

  if (axios.isAxiosError(error)) {
    const data = tryDecodeApiResponse(error.response?.data);
    if (data?.message) return data.message;
    if (error.code === "ECONNABORTED")
      return "Request timed out. Please try again.";
    if (!error.response) return "Network error. Please check your connection.";
    if (error.response.status === 401)
      return "Your session has expired. Please sign in again.";
    if (error.response.status === 403)
      return "This action is unavailable in the current workspace.";
    if (error.response.status === 404)
      return "The requested resource was not found.";
    if (error.response.status >= 500)
      return "Server error. Please try again later.";
    return error.message;
  }

  if (
    error !== null &&
    typeof error === "object" &&
    "success" in error &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim() !== ""
  ) {
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
    const responseData = tryDecodeApiResponse(error.response?.data);

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
    debugger
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    const responsePayload = decodeApiResponse<T>(response.data);
    // parseResponseData(responsePayload);
    return parseResponseData(responsePayload);
  } catch (error) {
    handleApiError(error);
  }
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T | null> {
  const response = await apiPostResponse<T>(url, body, config);
  return response.data;
}

export async function apiPostResponse<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const encryptedData =
      body !== undefined && body !== null
        ? CryptoService.encrypt(JSON.stringify(body))
        : "null";
    const response = await apiClient.post<unknown>(
      url,
      encryptedData,
      config
    );

    const responsePayload = decodeApiResponse<T>(response.data);
    parseResponseData(responsePayload);
    return responsePayload;
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
