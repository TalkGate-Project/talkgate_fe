# 인증 플로우 테스트 가이드

## 개요

이 문서는 브라우저에서 인증 토큰 및 401 처리 플로우를 테스트하는 방법을 설명합니다.

## 시나리오별 테스트 방법

### 시나리오 1: 정상 요청 (Access Token 유효)

**목적**: 정상적인 API 호출이 성공하는지 확인

**테스트 방법**:
1. 정상적으로 로그인
2. 브라우저 개발자 도구 → Application → Cookies에서 `tg_access_token`과 `tg_refresh_token` 확인
3. 일반적인 API 호출 (예: 사용자 정보 조회)
4. **예상 결과**: 200 OK 응답

**검증 포인트**:
- 프록시가 Authorization 헤더를 추가하여 전달
- 백엔드가 정상 응답

---

### 시나리오 2: Access Token 만료 → Refresh 성공

**목적**: Access Token이 만료되었을 때 자동으로 refresh하고 재시도하는지 확인

**테스트 방법**:

#### 방법 A: 백엔드에서 Access Token 만료 시뮬레이션 (권장)
1. 백엔드에서 Access Token 유효기간을 짧게 설정 (예: 1분)
2. 로그인 후 1분 이상 대기
3. API 호출
4. **예상 결과**: 
   - 첫 요청: 401 에러 (프록시에서 처리)
   - 프록시가 refresh 시도
   - 원래 요청 자동 재시도
   - 최종: 200 OK 응답

#### 방법 B: 브라우저에서 Access Token 수동 만료
1. 로그인
2. 개발자 도구 → Application → Cookies
3. `tg_access_token` 값을 임의로 변경 (예: 마지막 문자 삭제)
4. API 호출
5. **예상 결과**: 위와 동일

**검증 포인트**:
- 프록시가 refresh API 호출
- 새 토큰이 쿠키에 저장됨
- 원래 요청이 자동으로 재시도됨
- 최종적으로 200 OK 응답

---

### 시나리오 3: Access Token 없음 + Refresh Token 있음

**목적**: Access Token이 없지만 Refresh Token이 있는 경우 refresh를 시도하는지 확인

**테스트 방법**:
1. 로그인
2. 개발자 도구 → Application → Cookies
3. `tg_access_token` 쿠키 삭제 (우클릭 → Delete)
4. `tg_refresh_token`은 유지
5. 브라우저 새로고침 또는 API 호출
6. **예상 결과**:
   - 첫 요청: 401 에러 (MISSING_AUTHENTICATION_TOKEN 또는 일반 401)
   - 프록시가 refresh 시도
   - refresh 성공 시: 새 accessToken 획득 → 원래 요청 재시도 → 200 OK
   - refresh 실패 시: 401 에러 반환 → 자동 로그아웃

**검증 포인트**:
- 프록시가 refresh를 시도함
- refresh 성공 시 새 accessToken이 쿠키에 저장됨
- 원래 요청이 자동으로 재시도됨

**주의사항**:
- 이 방법은 실제 시나리오와 다를 수 있음 (일반적으로 accessToken이 만료되는 경우가 더 많음)
- 하지만 프록시의 refresh 로직을 테스트하기에는 유용함

---

### 시나리오 4: Refresh Token 만료 → 로그아웃

**목적**: Refresh Token도 만료된 경우 로그아웃이 정상적으로 처리되는지 확인

**테스트 방법**:
1. 로그인
2. 개발자 도구 → Application → Cookies
3. `tg_access_token` 쿠키 삭제
4. `tg_refresh_token` 값을 임의로 변경 (예: 마지막 문자 삭제) 또는 삭제
5. 브라우저 새로고침 또는 API 호출
6. **예상 결과**:
   - 첫 요청: 401 에러
   - 프록시가 refresh 시도
   - refresh 실패 (401)
   - 401 에러 반환
   - 자동 로그아웃 (로그인 페이지로 리다이렉트)

**검증 포인트**:
- 프록시가 refresh를 시도함
- refresh 실패 확인
- `performAutoLogout()`이 한 번만 호출됨 (debounce)
- 로그인 페이지로 리다이렉트

---

### 시나리오 5: 동시 요청 → Refresh Queue

**목적**: 여러 요청이 동시에 401을 받았을 때 refresh가 한 번만 실행되는지 확인

**테스트 방법**:
1. Access Token을 만료시키거나 삭제
2. 브라우저 개발자 도구 → Network 탭 열기
3. 여러 API를 동시에 호출 (예: 사용자 정보, 프로젝트 목록, 알림 목록)
4. **예상 결과**:
   - 모든 요청이 401 에러
   - Network 탭에서 `/v1/auth/refresh` 호출이 **한 번만** 보임
   - refresh 성공 시 모든 요청이 자동으로 재시도됨
   - 모두 200 OK 응답

**검증 포인트**:
- refresh API가 한 번만 호출됨
- 모든 요청이 새 토큰으로 재시도됨
- 동시 요청이 모두 성공함

---

### 시나리오 6: 예외 API (2FA, 발신번호 등록)

**목적**: 예외 API는 refresh하지 않는지 확인

**테스트 방법**:
1. Access Token을 만료시키거나 삭제
2. 예외 API 호출:
   - `POST /v1/sms/sender-numbers/member` (발신번호 등록)
   - `/login/two-factor` 경로에서 API 호출
3. **예상 결과**:
   - 401 에러 반환
   - refresh API 호출 안 됨
   - 자동 로그아웃 안 됨 (특수 케이스)

**검증 포인트**:
- Network 탭에서 refresh API 호출이 없음
- 401 에러가 그대로 반환됨
- 자동 로그아웃이 발생하지 않음

---

### 시나리오 7: AutoLogout Debounce

**목적**: 여러 요청이 동시에 401을 받아도 로그아웃이 한 번만 실행되는지 확인

**테스트 방법**:
1. Access Token과 Refresh Token을 모두 만료시키거나 삭제
2. 브라우저 개발자 도구 → Console 탭 열기
3. 여러 API를 동시에 호출
4. **예상 결과**:
   - 모든 요청이 401 에러
   - refresh 시도하지만 실패
   - Console에서 `[ApiClient] 🔄 자동 로그아웃 실행` 로그가 **한 번만** 보임
   - 로그아웃이 한 번만 실행됨

**검증 포인트**:
- Console에서 로그아웃 로그가 한 번만 출력됨
- `performAutoLogout()`이 한 번만 호출됨
- 로그인 페이지로 리다이렉트

---

## 브라우저 개발자 도구 활용

### 1. 쿠키 확인 및 수정

**Chrome/Edge**:
1. F12 → Application 탭
2. 좌측 Storage → Cookies → 도메인 선택
3. 쿠키 확인/수정/삭제

**Firefox**:
1. F12 → Storage 탭
2. 좌측 Cookies → 도메인 선택
3. 쿠키 확인/수정/삭제

### 2. Network 탭으로 API 호출 확인

1. F12 → Network 탭
2. 필터: `Fetch/XHR` 선택
3. API 호출 확인:
   - `/api/proxy/v1/...` - 프록시를 통한 요청
   - `/v1/auth/refresh` - refresh API 호출
   - Status Code 확인 (200, 401 등)

### 3. Console 탭으로 로그 확인

1. F12 → Console 탭
2. 다음 로그 확인:
   - `[API Proxy] 🔄 토큰 리프레시 시도`
   - `[API Proxy] ✅ 토큰 리프레시 성공`
   - `[API Proxy] ❌ 토큰 리프레시 실패`
   - `[ApiClient] 🔄 자동 로그아웃 실행`
   - `[ApiClient] ⏳ 이미 로그아웃 진행 중 - 무시`

---

## 실제 시나리오 vs 테스트 시나리오

### 실제 시나리오 (일반적)
1. **Access Token 만료**: 유효기간(1일)이 지나면 자동으로 만료
2. **자동 Refresh**: 프록시가 자동으로 refresh 시도
3. **사용자 경험**: 사용자는 아무것도 모르고 계속 사용 가능

### 테스트 시나리오 (수동)
1. **쿠키 수동 삭제/수정**: 개발자 도구로 쿠키 조작
2. **시뮬레이션**: 실제 만료 상황을 시뮬레이션
3. **검증**: refresh 로직이 정상 작동하는지 확인

---

## 권장 테스트 순서

1. ✅ **시나리오 1**: 정상 요청 확인
2. ✅ **시나리오 2**: Access Token 만료 → Refresh 성공
3. ✅ **시나리오 4**: Refresh Token 만료 → 로그아웃
4. ✅ **시나리오 5**: 동시 요청 → Refresh Queue
5. ✅ **시나리오 7**: AutoLogout Debounce
6. ✅ **시나리오 6**: 예외 API 처리

---

## 주의사항

1. **쿠키 수정 후**: 브라우저 새로고침 또는 API 호출 필요
2. **Network 탭**: Preserve log 옵션 활성화 권장 (페이지 전환 시 로그 유지)
3. **Console 로그**: 필터링하여 관련 로그만 확인
4. **테스트 후**: 쿠키를 원래대로 복구하거나 다시 로그인

---

## 문제 해결

### 문제: refresh가 시도되지 않음
- **확인**: refreshToken 쿠키가 있는지 확인
- **확인**: 예외 API가 아닌지 확인
- **확인**: 프록시 로그 확인

### 문제: 로그아웃이 여러 번 실행됨
- **확인**: debounce 로직이 작동하는지 확인
- **확인**: Console에서 로그 확인

### 문제: refresh 성공 후에도 401 에러
- **확인**: 새 토큰이 쿠키에 저장되었는지 확인
- **확인**: 원래 요청이 재시도되었는지 Network 탭에서 확인
