# 인증 시스템 리팩토링 완료 요약

## 프로젝트 개요

서브도메인 기반 프로젝트 관리 시스템에서 로그인/로그아웃 쿠키 관리 문제를 해결하기 위해 인증 시스템을 전면 리팩토링했습니다.

## 핵심 문제점

1. **섀도우 쿠키 문제**: 미들웨어가 서브도메인에서 프로젝트 ID 쿠키를 설정할 때 `domain` 속성을 누락하여 HostOnly 쿠키가 생성됨
2. **쿠키 삭제 실패**: 서브도메인에서 로그아웃 시 쿠키가 삭제되지 않음
3. **미들웨어 충돌**: 로그아웃 경로에서도 미들웨어가 쿠키를 재설정하여 삭제와 충돌
4. **복잡한 쿠키 관리**: 여러 곳에서 서로 다른 방식으로 쿠키를 설정/삭제하여 일관성 부족

## 해결 방안

### 1. 쿠키 유틸리티 함수 생성 (`src/lib/cookies.ts`)

**목적**: 일관된 쿠키 설정/삭제를 위한 중앙화된 유틸리티

**주요 함수**:
- `getCookieOptions(request)`: 현재 환경에 맞는 쿠키 옵션 생성
- `setAuthCookies(response, request, tokens)`: 인증 토큰 쿠키 설정
- `setProjectIdCookie(response, request, projectId)`: 프로젝트 ID 쿠키 설정
- `deleteAuthCookies(response, request)`: 모든 인증 쿠키 삭제

**쿠키 옵션 규칙**:
- 프로덕션 HTTPS 환경: `domain: '.talkgate.im'`, `secure: true`, `sameSite: 'none'`
- 그 외 환경: `domain: '.talkgate.im'` (프로덕션인 경우), `secure: false`, `sameSite: 'lax'`
- `httpOnly: false` (현재 테스트 단계, 프로덕션에서는 `true`로 변경 필요)

### 2. 새로운 로그아웃 API (`src/app/api/auth/logout/route.ts`)

**엔드포인트**: `POST /api/auth/logout`

**기능**:
- 모든 인증 관련 쿠키 삭제 (`tg_access_token`, `tg_refresh_token`, `tg_selected_project_id`)
- 서브도메인과 메인 도메인 모두에서 쿠키 삭제 시도
- 정확한 쿠키 옵션으로 삭제 (설정할 때와 동일한 옵션 사용)

### 3. 로그아웃 페이지 (`src/app/logout/page.tsx`)

**목적**: `/logout` URL 접근 시 클라이언트 사이드에서 로그아웃 처리

**동작 방식**:
1. 페이지 로드 시 자동으로 `POST /api/auth/logout` 호출
2. 클라이언트 사이드 정리 (프로젝트 ID, 근태 메뉴 등)
3. 메인 도메인의 로그인 페이지로 리다이렉트
4. `?redirect=` 파라미터 지원

**주의사항**: `useSearchParams()` 사용 시 Suspense boundary로 감싸야 함 (Next.js 15 요구사항)

### 4. Middleware 단순화 (`src/middleware.ts`)

**변경 사항**:
- 토큰 리프레시 로직 제거 (API 클라이언트에서 처리)
- 로그아웃 경로는 matcher에 포함하지 않음 (API 경로이므로)
- 인증 체크 및 리다이렉트만 담당
- 서브도메인 프로젝트 처리 간소화
- 프로젝트 ID 쿠키 설정 시 새로운 쿠키 유틸리티 사용

**Middleware Matcher**:
```typescript
matcher: [
  '/dashboard/:path*',
  '/consult/:path*',
  '/customers/:path*',
  '/stats/:path*',
  '/projects/:path*',
  '/notices/:path*',
  '/attendance/:path*',
  '/settings/:path*',
  '/notifications/:path*',
  '/my-settings/:path*',
]
```

### 5. 로그인 API 리팩토링

모든 로그인 API가 새로운 쿠키 유틸리티를 사용하도록 수정:
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/social/[provider]/route.ts`
- `src/app/api/auth/two-factor/login/route.ts`

### 6. 클라이언트 로그아웃 로직 수정

- `src/components/layout/Header.tsx`: 새로운 API 사용
- `src/lib/apiClient.ts`: 자동 로그아웃 시 새로운 API 사용

## 현재 쿠키 설정 상태

실제 브라우저에서 확인된 쿠키 속성:
```
{
  name: "tg_access_token",
  Domain: ".talkgate.im",
  Path: "/",
  Secure: true,
  SameSite: None,
  HttpOnly: (false)
}
```

**중요**: 쿠키 삭제 시 정확히 동일한 옵션을 사용해야 합니다:
- `domain: '.talkgate.im'`
- `secure: true` (프로덕션 HTTPS 환경)
- `sameSite: 'none'`
- `httpOnly: false`

## 아키텍처 원칙

1. **명확한 책임 분리**
   - Middleware: 인증 체크 및 리다이렉트만
   - API Routes: 쿠키 설정/삭제만
   - 클라이언트: UI 로직만

2. **일관된 쿠키 관리**
   - 모든 쿠키 설정/삭제가 동일한 유틸리티 사용
   - 섀도우 쿠키 방지 (항상 `domain: '.talkgate.im'` 포함)
   - 서브도메인 간 쿠키 공유 보장

3. **간단한 로그아웃 플로우**
   - POST API 호출 → 쿠키 삭제 → 리다이렉트
   - 미들웨어 간섭 없음

## 테스트 결과

✅ `/projects` 페이지에서 로그아웃 성공
- Header의 로그아웃 버튼이 새로운 API를 호출하여 정상 작동

⚠️ 서브도메인 다른 경로에서 로그아웃 실패
- 예: `lghservice.app-dev.talkgate.im/dashboard`에서 로그아웃 시도 시 쿠키 삭제 실패
- 원인 조사 필요

## 다음 단계

1. **서브도메인 로그아웃 문제 해결**
   - 서브도메인에서 쿠키 삭제가 실패하는 원인 파악
   - Network 탭에서 `/api/auth/logout` 요청의 응답 헤더 확인
   - Set-Cookie 헤더가 올바르게 전송되는지 확인

2. **프로덕션 배포 전 체크리스트**
   - `httpOnly: true`로 변경 (보안 강화)
   - `secure: true` 설정 확인 (프로덕션 HTTPS 환경)
   - 모든 서브도메인에서 로그아웃 테스트

3. **추가 개선 사항**
   - 토큰 리프레시 로직을 API 클라이언트에 추가 (현재는 프록시에서 처리)
   - 에러 처리 강화
   - 로깅 개선

## 주요 파일 목록

### 새로 생성된 파일
- `src/lib/cookies.ts`: 쿠키 유틸리티 함수
- `src/app/api/auth/logout/route.ts`: 로그아웃 API
- `src/app/logout/page.tsx`: 로그아웃 페이지

### 수정된 파일
- `src/middleware.ts`: 단순화 및 쿠키 유틸리티 사용
- `src/app/api/auth/login/route.ts`: 쿠키 유틸리티 사용
- `src/app/api/auth/social/[provider]/route.ts`: 쿠키 유틸리티 사용
- `src/app/api/auth/two-factor/login/route.ts`: 쿠키 유틸리티 사용
- `src/components/layout/Header.tsx`: 새로운 로그아웃 API 사용
- `src/lib/apiClient.ts`: 자동 로그아웃 시 새로운 API 사용

### 삭제된 파일
- `src/app/logout/route.ts`: 기존 GET 방식 로그아웃 route (삭제됨)

## 환경 정보

- **프레임워크**: Next.js 15
- **런타임**: Node.js (Edge Runtime 아님)
- **배포 환경**: Vercel
- **도메인 구조**:
  - 메인 도메인: `app-dev.talkgate.im` (개발), `app.talkgate.im` (프로덕션)
  - 프로젝트 서브도메인: `{projectSubdomain}.app-dev.talkgate.im`

## 참고 사항

- 현재 `httpOnly: false`로 설정되어 있음 (테스트 목적)
- 프로덕션 배포 전 `httpOnly: true`로 변경 필요
- 쿠키 삭제는 설정할 때와 정확히 동일한 옵션을 사용해야 함
- 서브도메인에서 쿠키 삭제 시 `.talkgate.im` 도메인 쿠키와 현재 도메인 쿠키 모두 삭제 시도










