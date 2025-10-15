import { env } from "./env";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  getDefaultHeaders?: () => Record<string, string>;
};

export type RequestOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined | Array<string | number>>;
  body?: unknown; // will be JSON.stringified if not FormData/Blob/ArrayBuffer
  signal?: AbortSignal;
  responseType?: "auto" | "json" | "text" | "blob";
};

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
};

function buildQueryString(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal | undefined {
  if (timeoutMs <= 0) return signal;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  // Clear timer on abort for hygiene
  controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  return controller.signal;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly getDefaultHeaders?: () => Record<string, string>;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = options?.baseUrl ?? env.NEXT_PUBLIC_API_BASE_URL;
    this.timeoutMs = options?.timeoutMs ?? env.NEXT_PUBLIC_API_TIMEOUT_MS;
    this.getDefaultHeaders = options?.getDefaultHeaders;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}${buildQueryString(options.query)}`;

    const defaultHeaders = this.getDefaultHeaders ? this.getDefaultHeaders() : {};
    const headers: Record<string, string> = { ...defaultHeaders, ...options.headers };

    let body: BodyInit | undefined;
    if (options.body instanceof FormData || options.body instanceof Blob || options.body instanceof ArrayBuffer) {
      body = options.body as BodyInit;
    } else if (options.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      body = JSON.stringify(options.body);
    }

    const signal = withTimeout(options.signal, this.timeoutMs);

    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body,
      signal,
      credentials: "include",
    });

    const desired = options.responseType ?? "auto";
    let data: any;
    if (desired === "blob") {
      data = await res.blob();
    } else if (desired === "text") {
      data = await res.text();
    } else if (desired === "json") {
      data = await res.json();
    } else {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) data = await res.json();
      else if (contentType.startsWith("text/")) data = await res.text();
      else data = await res.blob();
    }
    if (!res.ok) {
      throw Object.assign(new Error(`Request failed: ${res.status}`), {
        status: res.status,
        data,
      });
    }
    return { ok: true, status: res.status, data };
  }

  get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "GET" });
  }
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }
  delete<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  getBlob(path: string, options?: Omit<RequestOptions, "method" | "body" | "responseType">) {
    return this.request<Blob>(path, { ...options, method: "GET", responseType: "blob" });
  }
}

// Singleton for app usage
export const apiClient = new ApiClient();


