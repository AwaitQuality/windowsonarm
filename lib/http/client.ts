import apiConfig from "@/config/api";

export type ApiResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: string;
};

export type ApiResult<T> = ApiResponse<T> | ErrorResponse;

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * Minimal typed client over `fetch`.
 *
 * Every endpoint in this app answers with the `{ success, data | error }`
 * envelope produced by DataResponse/ErrorResponse, so the client always
 * resolves to an ApiResult and never throws for an HTTP error status —
 * callers branch on `success`.
 */
class HttpClient {
  private readonly baseUrl: string;

  private readonly timeoutMs: number;

  constructor(baseUrl = "", timeoutMs = apiConfig.timeout) {
    // Trim trailing slashes so `${baseUrl}${path}` never doubles up.
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.timeoutMs = timeoutMs;
  }

  private async request<T>(
    path: string,
    method: Method,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResult<T>> {
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      const payload = await this.parseBody<T>(response);

      if (payload) return payload;

      return {
        success: false,
        error: `Request failed with status ${response.status}`,
      };
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "TimeoutError"
          ? `Request timed out after ${this.timeoutMs}ms`
          : error instanceof Error
            ? error.message
            : "Unknown request error";

      return { success: false, error: message };
    }
  }

  /** Responses are expected to be the JSON envelope; tolerate anything else. */
  private async parseBody<T>(
    response: Response
  ): Promise<ApiResult<T> | null> {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as ApiResult<T>;
    } catch {
      return null;
    }
  }

  public get<T>(path: string, headers?: Record<string, string>) {
    return this.request<T>(path, "GET", undefined, headers);
  }

  public post<T, B = unknown>(
    path: string,
    body?: B,
    headers?: Record<string, string>
  ) {
    return this.request<T>(path, "POST", body, headers);
  }

  public put<T, B = unknown>(
    path: string,
    body?: B,
    headers?: Record<string, string>
  ) {
    return this.request<T>(path, "PUT", body, headers);
  }

  public patch<T, B = unknown>(
    path: string,
    body?: B,
    headers?: Record<string, string>
  ) {
    return this.request<T>(path, "PATCH", body, headers);
  }

  public delete<T>(path: string, headers?: Record<string, string>) {
    return this.request<T>(path, "DELETE", undefined, headers);
  }
}

export default HttpClient;

export const aqApi = new HttpClient(apiConfig.baseUrl);
