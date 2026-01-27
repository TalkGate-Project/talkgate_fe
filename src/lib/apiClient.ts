import { env } from "./env";
import { getSelectedProjectId } from "./project";
import { performAutoLogout } from "./logout";

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
  private logoutTimer: NodeJS.Timeout | null = null;
  private isLoggingOut: boolean = false;

  constructor(options?: ApiClientOptions) {
    // 서버 API 프록시를 통해 요청하도록 변경
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

    try {
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
        const error = Object.assign(new Error(`Request failed: ${res.status}`), {
          status: res.status,
          data,
        });

        // 401 에러 처리: 프록시에서 refresh를 시도했지만 실패한 경우
        if (res.status === 401) {
          // 프록시가 refresh를 시도했는지 확인
          const refreshAttempted = res.headers.get('X-Refresh-Attempted') === 'true';
          const refreshFailed = res.headers.get('X-Refresh-Failed') === 'true';
          
          // 특수 케이스 체크: 이 경우들은 refresh하지 않아야 함
          const code: string = (data?.code as string) || String(data?.message || "").toUpperCase();
          const message: string = String(data?.message || "").toUpperCase();
          const method = (options.method ?? "GET").toUpperCase();
          
          // 2FA 플로우 중인 경우 자동 로그아웃하지 않음
          const isTwoFactorFlow = typeof window !== "undefined" && 
            window.location.pathname.startsWith("/login/two-factor");
          
          // 개인 발신번호 등록 API는 본인인증 미완료 시 401이 발생할 수 있으므로 자동 로그아웃하지 않음
          const isMemberSenderNumberRegistration = 
            method === "POST" && 
            path === "/v1/sms/sender-numbers/member";
          
          // 본인인증 관련 에러는 자동 로그아웃하지 않음
          const isIdentityVerificationError = 
            code.includes("UNAUTHORIZED") && 
            (message.includes("본인인증") || message.includes("IDENTITY") || message.includes("VERIFICATION"));
          
          // 로그아웃 조건:
          // 1. 특수 케이스가 아님
          // 2. suppressAutoLogout이 false
          // 3. 프록시가 refresh를 시도했지만 실패했거나, refresh를 시도하지 못한 경우
          const shouldLogout = !isTwoFactorFlow && 
            !isMemberSenderNumberRegistration && 
            !isIdentityVerificationError &&
            !options.suppressAutoLogout &&
            (refreshFailed || !refreshAttempted);
          
          // 디버깅: suppressAutoLogout이 true인 경우에도 로그 출력
          if (options.suppressAutoLogout) {
            console.log('[ApiClient] 🔍 401 에러 (suppressAutoLogout: true):', {
              refreshAttempted,
              refreshFailed,
              path,
              suppressAutoLogout: options.suppressAutoLogout,
            });
          }
          
          if (shouldLogout) {
            console.log('[ApiClient] 🔄 401 에러 - 자동 로그아웃:', {
              refreshAttempted,
              refreshFailed,
              path,
            });
            this.handleAutoLogout();
          } else if (refreshAttempted && !refreshFailed) {
            // refresh 성공했는데도 401이면 이상한 상황 (이론적으로 발생하지 않아야 함)
            console.warn('[ApiClient] ⚠️ refresh 성공했는데도 401 에러:', path);
          }
        }
        
        // 403은 refresh하지 않음 (권한 문제)
        // 프록시에서 이미 처리하므로 여기서는 그대로 throw

        throw error;
      }

      return { ok: true as const, status: res.status, data } satisfies ApiResponse<any>;
    } catch (err: any) {
      // AbortError는 그대로 throw
      if (err?.name === "AbortError") {
        throw err;
      }
      
      // 네트워크 에러 등은 그대로 throw
      if (!err?.status) {
        throw err;
      }
      
      // HTTP 에러는 위에서 처리했으므로 그대로 throw
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

  private handleAutoLogout(): void {
    if (typeof window === "undefined") return;
    
    // 이미 로그아웃 진행 중이면 무시
    if (this.isLoggingOut) {
      console.log('[ApiClient] ⏳ 이미 로그아웃 진행 중 - 무시');
      return;
    }

    // Debounce: 짧은 시간 내 여러 호출을 하나로 묶음
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }

    this.logoutTimer = setTimeout(() => {
      this.logoutTimer = null;
      this.isLoggingOut = true;
      
      const pathname = window.location.pathname || "/";
      console.log('[ApiClient] 🔄 자동 로그아웃 실행:', pathname);
      
      // 통합 자동 로그아웃 함수 사용 (공개 경로 체크 포함)
      performAutoLogout(pathname);
      
      // 로그아웃은 리다이렉트되므로 isLoggingOut은 자동으로 초기화됨
      // 하지만 안전을 위해 짧은 시간 후 초기화
      setTimeout(() => {
        this.isLoggingOut = false;
      }, 1000);
    }, 100); // 100ms debounce
  }
}

// Singleton for app usage
export const apiClient = new ApiClient();
