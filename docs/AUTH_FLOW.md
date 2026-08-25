# 인증 플로우 및 401 처리 정책 문서

## 개요

이 문서는 Talkgate 프론트엔드의 인증 토큰 관리 및 401 에러 처리 플로우를 설명합니다.

## 정책 요약

### [Auth Flow Policy]
- **Access Token**: 유효기간 1일
- **Refresh Token**: 쿠키에 저장 (HttpOnly 아님 - JS에서 읽을 수 있음)
- **JS 단에서 refresh token을 직접 읽을 수 있음**

### [401 처리 정책]
- 모든 API는 401 발생시 refresh를 **1회** 시도
- refresh 성공시 원래 요청 **자동 retry**
- refresh 실패시 401 에러 반환 (클라이언트에서 logout 처리)

### [예외 정책]
- **403은 refresh하지 않음** (권한 문제)
- **2FA, 인증, 발신번호 등록 API는 refresh하지 않음**
- **큐/동기화**: refresh 진행중이면 새 refresh를 만들지 말고 대기

### [쿠키 정책]
- Refresh Token은 쿠키로 들어오고 나감 (HttpOnly 아님)
- Access Token은 서버에서만 header에 넣어 전달
- JS에서 token을 보지 않음 (프록시에서 처리)

## 전체 요청 플로우 시퀀스

### 정상 플로우

```
[Client]                    [Proxy]                    [Backend]
   |                           |                           |
   |-- GET /v1/users --------->|                           |
   |                           |-- GET /v1/users -------->|
   |                           |                           |
   |                           |<-- 200 OK + data ---------|
   |<-- 200 OK + data ---------|                           |
```

### 401 발생 → Refresh 성공 플로우

```
[Client]                    [Proxy]                    [Backend]
   |                           |                           |
   |-- GET /v1/users --------->|                           |
   |                           |-- GET /v1/users -------->|
   |                           |                           |
   |                           |<-- 401 Unauthorized ------|
   |                           |                           |
   |                           |-- POST /v1/auth/refresh ->|
   |                           |  (refreshToken in body)   |
   |                           |                           |
   |                           |<-- 200 OK + new tokens ---|
   |                           |  (쿠키에 새 토큰 저장)     |
   |                           |                           |
   |                           |-- GET /v1/users -------->|
   |                           |  (새 accessToken)         |
   |                           |                           |
   |                           |<-- 200 OK + data ---------|
   |<-- 200 OK + data ---------|                           |
```

### 401 발생 → Refresh 실패 플로우

```
[Client]                    [Proxy]                    [Backend]
   |                           |                           |
   |-- GET /v1/users --------->|                           |
   |                           |-- GET /v1/users -------->|
   |                           |                           |
   |                           |<-- 401 Unauthorized ------|
   |                           |                           |
   |                           |-- POST /v1/auth/refresh ->|
   |                           |  (refreshToken in body)   |
   |                           |                           |
   |                           |<-- 401 Unauthorized ------|
   |                           |  (refresh 실패)           |
   |                           |                           |
   |<-- 401 Unauthorized ------|                           |
   |                           |                           |
   |-- performAutoLogout() -----|                           |
```

### 동시 요청 시 Refresh Queue 플로우

```
[Client Request 1]           [Proxy]                    [Backend]
   |                           |                           |
   |-- GET /v1/users --------->|                           |
   |                           |-- GET /v1/users -------->|
   |                           |                           |
   |                           |<-- 401 Unauthorized ------|
   |                           |                           |
   |                           |[refreshInFlight 시작]     |
   |                           |-- POST /v1/auth/refresh ->|
   |                           |                           |
[Client Request 2]            |                           |
   |-- GET /v1/projects ------>|                           |
   |                           |-- GET /v1/projects ------>|
   |                           |                           |
   |                           |<-- 401 Unauthorized ------|
   |                           |                           |
   |                           |[refreshInFlight 대기]     |
   |                           |                           |
   |                           |<-- 200 OK + new tokens ---|
   |                           |[refreshInFlight 완료]      |
   |                           |                           |
   |                           |-- GET /v1/users -------->|
   |                           |  (새 accessToken)         |
   |                           |<-- 200 OK + data ---------|
   |<-- 200 OK + data ---------|                           |
   |                           |                           |
   |                           |-- GET /v1/projects ------>|
   |                           |  (새 accessToken)         |
   |                           |<-- 200 OK + data ---------|
   |<-- 200 OK + data ---------|                           |
```

## 예외 케이스

### 1. 403 Forbidden
- **처리**: refresh하지 않음, 에러 그대로 반환
- **이유**: 권한 문제이므로 토큰 갱신으로 해결 불가

### 2. 2FA 플로우
- **경로**: `/login/two-factor/*`
- **처리**: refresh하지 않음
- **이유**: 정상적인 인증 플로우

### 3. 발신번호 등록 API
- **경로**: `POST /v1/sms/sender-numbers/member`
- **처리**: refresh하지 않음
- **이유**: 본인인증 미완료 시 401이 정상적으로 발생

### 4. 본인인증 관련 에러
- **에러 코드**: `UNAUTHORIZED` + 메시지에 "본인인증", "IDENTITY", "VERIFICATION" 포함
- **처리**: refresh하지 않음
- **이유**: 정상적인 인증 플로우

## 구현 세부사항

### 프록시 (`src/app/api/proxy/[...path]/route.ts`)

#### 주요 기능
1. **401 감지**: 모든 API 응답에서 401 체크
2. **예외 체크**: `shouldSkipRefresh()` 함수로 예외 API 확인
3. **Refresh Queue**: `refreshInFlight` 전역 변수로 동시 요청 처리
4. **자동 Retry**: refresh 성공 시 원래 요청 자동 재시도
5. **쿠키 관리**: 새 토큰을 쿠키에 자동 저장

#### Refresh Queue 동작
```typescript
// 전역 변수로 refresh 진행 상태 관리
let refreshInFlight: Promise<...> | null = null;

// 첫 번째 401 요청
if (!refreshInFlight) {
  refreshInFlight = refreshAccessToken(...);
}

// 두 번째 401 요청 (동시 발생)
if (refreshInFlight) {
  await refreshInFlight; // 첫 번째 refresh 완료 대기
  // 새 토큰으로 재시도
}
```

### ApiClient (`src/lib/apiClient.ts`)

#### 주요 기능
1. **특수 케이스 체크**: 2FA, 본인인증 등 예외 상황 확인
2. **자동 로그아웃 (Debounce)**: refresh 실패 시 `performAutoLogout()` 호출 (100ms debounce)
3. **에러 전파**: 프록시에서 처리한 에러를 그대로 throw

#### AutoLogout Debounce
```typescript
// 여러 요청이 동시에 401을 받아도 로그아웃은 한 번만 실행
private logoutTimer: NodeJS.Timeout | null = null;
private isLoggingOut: boolean = false;

private handleAutoLogout(): void {
  // 이미 로그아웃 진행 중이면 무시
  if (this.isLoggingOut) return;
  
  // 100ms debounce: 짧은 시간 내 여러 호출을 하나로 묶음
  if (this.logoutTimer) {
    clearTimeout(this.logoutTimer);
  }
  
  this.logoutTimer = setTimeout(() => {
    this.isLoggingOut = true;
    performAutoLogout(pathname);
  }, 100);
}
```

#### 401 에러 처리
```typescript
if (res.status === 401) {
  // 특수 케이스 체크
  if (!isTwoFactorFlow && !isMemberSenderNumberRegistration && !isIdentityVerificationError) {
    if (isMissingToken || !options.suppressAutoLogout) {
      this.handleAutoLogout(); // 자동 로그아웃
    }
  }
  throw error; // 에러 throw
}
```

## 테스트 케이스

### 시나리오 1: 정상 요청
- **입력**: 유효한 accessToken으로 API 호출
- **예상**: 200 OK 응답
- **검증**: 프록시가 토큰을 header에 추가하여 전달

### 시나리오 2: Access Token 만료 → Refresh 성공
- **입력**: 만료된 accessToken으로 API 호출
- **예상**: 
  1. 401 에러 발생
  2. refresh 시도
  3. 새 토큰 획득
  4. 원래 요청 재시도
  5. 200 OK 응답
- **검증**: 
  - refresh API 호출 확인
  - 새 토큰이 쿠키에 저장됨
  - 원래 요청이 성공함

### 시나리오 3: Access Token 만료 → Refresh 실패
- **입력**: 만료된 accessToken + 유효하지 않은 refreshToken
- **예상**:
  1. 401 에러 발생
  2. refresh 시도
  3. refresh 실패 (401)
  4. 401 에러 반환
  5. 클라이언트에서 logout
- **검증**:
  - refresh API 호출 확인
  - 401 에러 반환 확인
  - `performAutoLogout()` 호출 확인

### 시나리오 4: 동시 요청 → Refresh Queue
- **입력**: 동시에 여러 API 호출 (모두 401)
- **예상**:
  1. 첫 번째 요청이 refresh 시작
  2. 나머지 요청들이 refresh 완료 대기
  3. refresh 완료 후 모든 요청 재시도
  4. 모두 200 OK 응답
- **검증**:
  - refresh API가 한 번만 호출됨
  - 모든 요청이 새 토큰으로 재시도됨

### 시나리오 5: 예외 API (2FA)
- **입력**: `/login/two-factor` 경로에서 API 호출 → 401
- **예상**: refresh하지 않고 401 에러 반환
- **검증**: refresh API 호출 안 됨

### 시나리오 6: 예외 API (발신번호 등록)
- **입력**: `POST /v1/sms/sender-numbers/member` → 401
- **예상**: refresh하지 않고 401 에러 반환
- **검증**: refresh API 호출 안 됨

### 시나리오 7: 403 Forbidden
- **입력**: 권한 없는 리소스 접근 → 403
- **예상**: refresh하지 않고 403 에러 반환
- **검증**: refresh API 호출 안 됨

### 시나리오 8: 병렬 요청 → Refresh 실패 → Debounce
- **입력**: 동시에 여러 API 호출 (모두 401) → refresh 실패
- **예상**:
  1. 모든 요청이 refresh queue에서 대기
  2. refresh 실패
  3. 모든 요청이 401 에러 반환
  4. `handleAutoLogout()`이 여러 번 호출되지만 debounce로 한 번만 실행
  5. 로그아웃 처리
- **검증**:
  - refresh API가 한 번만 호출됨
  - `performAutoLogout()`이 한 번만 실행됨
  - 로그아웃이 정상적으로 처리됨

## 기존 API 개별 Error Handler 조사 결과

### 조사 범위
- `src/hooks/useFetch.ts`: 에러를 state에 저장하고 throw (401 처리 없음) ✅
- `src/hooks/useMutation.ts`: 에러를 state에 저장하고 throw (401 처리 없음) ✅
- `src/components/**/*.tsx`: 개별 try-catch에서 `showErrorModal` 호출 (401 처리 없음) ✅

### 결론
**기존 API 개별 error handler에는 401 처리 로직이 없습니다.**
- 모든 에러를 그대로 throw하거나 `showErrorModal`로 표시
- 프록시에서 401을 처리하므로 중복 처리 없음 ✅

## 충돌 및 중복 처리 여부

### ✅ 중복 처리 없음
- 프록시에서만 401 처리 (메인 로직)
- ApiClient는 특수 케이스만 체크하고 throw
- 개별 API handler에는 401 처리 없음

### ✅ 충돌 없음
- Refresh Queue로 동시 요청 처리
- 예외 케이스 명확히 정의
- 쿠키 정책 일관성 유지

## 개선 사항

1. ✅ 프록시에서 메인 401 처리 로직 구현
2. ✅ ApiClient 단순화 (특수 케이스만 체크)
3. ✅ Refresh Queue 구현 (동시 요청 처리)
4. ✅ 예외 케이스 명확히 정의
5. ✅ 쿠키 정책 적용 (HttpOnly 아님)
6. ✅ **AutoLogout Debounce 추가** (중복 로그아웃 방지)

## 참고사항

- Access Token은 서버에서만 header에 추가 (클라이언트에서 접근 불가)
- Refresh Token은 쿠키에 저장 (HttpOnly 아님, JS에서 읽을 수 있음)
- 프록시가 모든 API 요청을 중간에서 가로채서 처리 (인터셉터 역할)
