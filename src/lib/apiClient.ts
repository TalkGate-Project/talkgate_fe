import { env } from "./env";
import { getSelectedProjectId, clearSelectedProjectId } from "./project";

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
  credentials?: RequestCredentials; // per-request override
  suppressAutoLogout?: boolean; // if true, do not auto-redirect on 401/403
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
  private readonly defaultCredentials: RequestCredentials;
  private refreshInFlight: Promise<void> | null = null;

  constructor(options?: ApiClientOptions) {
    // 서버 API 프록시를 통해 요청하도록 변경 (httpOnly 쿠키 사용)
    // 프록시가 백엔드 API 경로를 그대로 전달하므로, 백엔드 경로를 그대로 사용
    const backendUrl = options?.baseUrl ?? env.NEXT_PUBLIC_API_BASE_URL;
    // 프록시 경로로 변환: https://api-dev.talkgate.im/v1/... -> /api/proxy/v1/...
    this.baseUrl = backendUrl.replace(/^https?:\/\/[^/]+/, '/api/proxy');
    this.timeoutMs = options?.timeoutMs ?? env.NEXT_PUBLIC_API_TIMEOUT_MS;
    this.getDefaultHeaders = options?.getDefaultHeaders;
    // 프록시를 통해 요청하므로 쿠키가 자동으로 포함됨
    this.defaultCredentials = "include";
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}${buildQueryString(options.query)}`;

    const defaultHeaders = this.getDefaultHeaders ? this.getDefaultHeaders() : {};
    const headers: Record<string, string> = { ...defaultHeaders, ...options.headers };

    // httpOnly 쿠키는 서버에서 자동으로 처리되므로 클라이언트에서는 토큰을 읽을 수 없음
    // 프록시 서버가 httpOnly 쿠키에서 토큰을 읽어서 Authorization 헤더에 추가함

    // Inject selected project header when present (frontend-selected context)
    const projectId = getSelectedProjectId();
    if (projectId && !headers["x-project-id"]) {
      headers["x-project-id"] = projectId;
    }

    let body: BodyInit | undefined;
    if (options.body instanceof FormData || options.body instanceof Blob || options.body instanceof ArrayBuffer) {
      body = options.body as BodyInit;
    } else if (options.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      body = JSON.stringify(options.body);
    }

    const signal = withTimeout(options.signal, this.timeoutMs);

    const exec = async () => {
      const res = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body,
        signal,
        credentials: options.credentials ?? this.defaultCredentials,
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
      return { ok: true as const, status: res.status, data } satisfies ApiResponse<any>;
    };

    try {
      return await exec();
    } catch (err: any) {
      // If unauthorized (401), try to refresh once, then retry original request.
      // Do NOT refresh on 403 (forbidden) to avoid unnecessary logout on access control errors.
      if (err && err.status === 401) {
        const code: string = (err?.data?.code as string) || String(err?.data?.message || "").toUpperCase();
        // Immediate auto-logout for explicit missing token cases
        if (typeof code === "string" && code.toUpperCase().includes("MISSING_AUTHENTICATION_TOKEN")) {
          if (!options.suppressAutoLogout) this.handleAutoLogout();
          throw err;
        }
        try {
          await this.refreshTokens();
          return await exec();
        } catch (refreshErr) {
          // On refresh failure, auto-logout and rethrow original error
          if (!options.suppressAutoLogout) this.handleAutoLogout();
          throw err;
        }
      }
      throw err;
    }
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
  delete<T>(path: string, options?: Omit<RequestOptions, "method">) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  getBlob(path: string, options?: Omit<RequestOptions, "method" | "body" | "responseType">) {
    return this.request<Blob>(path, { ...options, method: "GET", responseType: "blob" });
  }

  private async refreshTokens(): Promise<void> {
    // 토큰 갱신은 프록시 서버에서 자동으로 처리됨 (401 응답 시)
    // 클라이언트에서는 별도 처리 불필요
    throw new Error("Token refresh is handled by the server proxy");
  }

  private handleAutoLogout(): void {
    // 클라이언트 사이드 정리
    try {
      clearSelectedProjectId();
    } catch {}
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname || "/";
      // Avoid redirect loops on public routes like /login, /signup, /forgot-password, oauth callback
      if (!isPublicRoute(pathname)) {
        // 메인 도메인 계산
        const host = window.location.host;
        const hostWithoutPort = host.split(':')[0];
        let mainDomain = host;
        if (hostWithoutPort.includes('.talkgate.im')) {
          if (hostWithoutPort.includes('app.talkgate.im') && !hostWithoutPort.includes('app-dev')) {
            mainDomain = 'app.talkgate.im';
          } else {
            mainDomain = 'app-dev.talkgate.im';
          }
        }
        const protocol = window.location.protocol;
        // ✅ 메인 도메인의 /logout 페이지로 리다이렉트하여 쿠키 삭제 처리
        // 서브도메인에서 API 호출로 쿠키 삭제 시 Set-Cookie 헤더가 적용되기 전에
        // 리다이렉트되는 문제를 방지
        window.location.href = `${protocol}//${mainDomain}/logout?redirect=${encodeURIComponent(`${protocol}//${mainDomain}/login?logout=success`)}`;
      }
    }
  }
}

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth/callback/") ||
    pathname.startsWith("/invite")
  );
}

// Singleton for app usage
export const apiClient = new ApiClient();


