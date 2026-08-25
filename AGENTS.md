# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Turbopack 활성화, localhost:3000
npm run build        # 프로덕션 빌드
npm start            # 프로덕션 서버 시작
npx tsc --noEmit     # 타입 체크
npx eslint src/      # 린트
```

### 실행 명령 제한 (최우선)

- **사용자가 현재 대화에서 명시적으로 요청하거나 허용하지 않은 한 `npm run dev`, `npm run build`, `npm start`를 실행하지 않습니다.** 구현 완료 후 검증 목적이라도 실행을 추론해서는 안 됩니다.
- 이미 실행 중인 dev server를 임의로 시작·재시작·종료하거나 포트를 점유한 프로세스를 변경하지 않습니다. 다른 에이전트와 사용자의 작업 환경에 영향을 줄 수 있습니다.
- 기본 자동 검증은 `npx tsc --noEmit`과 변경 파일 대상 ESLint까지만 수행합니다.
- 빌드 또는 서버 재시작이 꼭 필요하다고 판단되면 먼저 필요성과 영향을 설명하고 사용자의 명시적 허용을 받은 뒤 실행합니다.

테스트 프레임워크는 미설정 상태입니다. 인증 플로우 검증은 `docs/TESTING_GUIDE.md`의 브라우저 수동 시나리오를 참고하세요.

## 아키텍처 개요

### 네트워크 계층 (핵심)

**모든 API 요청은 `/api/proxy/[...path]` Route Handler를 통해 프록시됩니다.** 클라이언트는 절대 백엔드 API를 직접 호출하지 않습니다.

```
클라이언트 (apiClient) → /api/proxy → 백엔드 API 서버
```

- `src/lib/apiClient.ts`: 싱글톤 `apiClient` 인스턴스. 자동으로 `/api/proxy` 기반 URL로 변환
- `src/app/api/proxy/[...path]/route.ts`: 프록시 핸들러. **401 발생 시 토큰 refresh를 여기서 처리** (1회만, 성공 시 원래 요청 자동 재시도)
- `src/services/*.ts`: 27개 도메인별 API 호출 함수 (apiClient 래핑)

인증 쿠키: `tg_access_token`, `tg_refresh_token`. 프록시가 refresh에 성공하면 응답 헤더에 `X-Refresh-Attempted: true`를 포함합니다.

### 미들웨어 라우팅 (`src/middleware.ts`)

서브도메인 기반으로 프로젝트를 자동 선택합니다. 경로별 접근 정책:

| 경로 유형 | 경로 예시 | 정책 |
|---|---|---|
| 비회원 전용 | `/login`, `/signup` | 서브도메인 있으면 메인 도메인으로 리다이렉트 |
| 인증 + 프로젝트 필수 | `/dashboard`, `/consult`, `/customers` | **서브도메인 필수**. 없으면 로그인으로 |
| 프로젝트 선택 | `/projects` | 인증 필수. 서브도메인 있으면 메인 도메인으로 |
| 인증만 필요 | `/my-settings`, `/notifications` | 서브도메인 있어도/없어도 허용 |

서브도메인 접근 시 미들웨어가 `GET /v1/projects/{subdomain}`으로 프로젝트 ID를 조회하고 `tg_selected_project_id` 쿠키를 설정합니다. `apiClient`는 이 값을 `x-project-id` 헤더로 모든 요청에 자동 주입합니다.

### 상태 관리 계층

```
로컬 useState → React Query (서버 데이터 캐시) → Context API (전역 도메인 상태)
```

범용 글로벌 스토어(Redux/Zustand)는 의도적으로 미사용. 도메인별 Context만 사용:
- `ChatProvider`, `TeamChatProvider` — 실시간 채팅
- `NotificationProvider` — 알림
- `ConfirmModalProvider`, `ErrorFeedbackModalProvider` — 모달
- `CustomerModalProvider`, `TeamChatWindowProvider`

React Query 기본 설정: `staleTime: 5분`, `gcTime: 15분`, `refetchOnWindowFocus: false`, `retry: 1`

### 데이터 페칭 훅

- `useFetch<T>`: GET 전용, 마운트 시 자동 실행, `select`로 응답 매핑
- `useMutation<TInput, TOutput>`: POST/PUT/PATCH/DELETE, `path`를 함수로 받아 동적 경로 지원

### 실시간 통신

`src/lib/realtime.ts`의 `TalkgateSocket` 클래스(싱글톤). 네임스페이스: `chat`, `notification`, `team-chat`. 재연결: 5회 시도, 1~5초 지연.

### UI/스타일링

- Tailwind CSS v4. 토큰은 `src/app/globals.css`의 `@theme inline`에 정의
- **Semantic 클래스 우선 사용**: `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`
- **다크모드**: `[data-theme="light"]` / `[data-theme="dark"]`
- **UI 줌**: 데스크톱(≥1080px) `zoom: 0.8`, 모바일 `zoom: 1.0`. 미들웨어가 `x-ui-zoom` 헤더로 전달. 포털/드롭다운 위치 계산 시 **화면 px(`getBoundingClientRect`, `innerWidth`)과 레이아웃 px(`offsetHeight`, CSS 상수)을 섞지 말 것** — 규칙과 체크리스트는 `docs/ZOOM_SUBPIXEL_PLAYBOOK.md` §4-4
- 토글/설정 컴포넌트는 깜빡임 방지를 위해 초기 상태를 `false`로 시작 후 `useEffect`에서 실제 값 로드

## 코딩 규칙

### 에러 처리 (최우선 규칙)

**서버 응답 메시지·에러 코드를 UI에 절대 노출하지 않습니다.** 에러 코드는 내부 분기용으로만 사용하고, 사용자에게는 일반 친화적 메시지만 표시:

```typescript
// ❌ 금지
showErrorModal({ description: error?.response?.data?.message });

// ✅ 올바른 방법
catch (error: any) {
  console.error("Operation failed:", error); // 개발자 로깅만
  const errorCode = error?.response?.data?.code;
  if (errorCode === "INVITATION_ALREADY_ACCEPTED") {
    router.replace("/projects"); // 에러 모달 없이 처리
    return;
  }
  showErrorModal({ headline: "처리에 실패했습니다.", description: "잠시 후 다시 시도해주세요." });
}
```

### 환경 변수

환경 변수는 반드시 `src/lib/env.ts`를 통해 접근합니다. `process.env[key]` 동적 접근 방식은 `NEXT_PUBLIC_*` 빌드 시 인라인을 우회하므로 사용 금지.

### 프로젝트별 설정 저장

한 사용자가 여러 프로젝트를 사용할 수 있으므로, 로컬 스토리지 저장 시 프로젝트 ID를 키로 사용해 프로젝트별로 분리 저장해야 합니다. `getSelectedProjectId()` / `useSelectedProjectId()`로 현재 프로젝트 ID를 가져옵니다.

### 테이블/리스트 레이아웃

가변 열: `flex-1 min-w-0 truncate`. 고정 열: 명시적 너비 + `flex-shrink-0`. 날짜 열: `whitespace-nowrap`.

### 일반 규칙

- Guard clause 선호, 깊은 중첩 회피
- 변수/함수는 풀네임, 1~2글자 축약 회피. 함수는 동사(`buildQueryString`), 값은 명사(`selectedCustomerId`)
- 불필요한 주석 금지, 비자명한 의도/제약만 짧게 주석

### 401/토큰 갱신 예외

다음 API는 401 발생 시 자동 refresh 및 로그아웃을 하지 않습니다:
- `POST /v1/sms/sender-numbers/member` (본인인증 미완료 시 401)
- `/login/two-factor` 경로에서의 요청
- `suppressAutoLogout: true` 옵션을 전달한 요청
