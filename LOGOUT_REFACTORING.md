# 로그아웃 리팩토링 검증 문서

## 개요
로그아웃 로직을 통합하고 개선하여 안전하고 graceful한 로그아웃 처리를 구현했습니다.

## 주요 변경사항

### 1. 통합 로그아웃 함수 생성 (`src/lib/logout.ts`)
- `performLogout()`: 완전한 로그아웃 처리
- `performAutoLogout()`: 자동 로그아웃 (401 에러 등)

### 2. 개선 사항
- ✅ WebSocket 연결 종료 (채팅, 알림)
- ✅ 도메인 계산 로직 통합 (`getMainDomain()` 활용)
- ✅ 에러 처리 개선 (로깅 추가)
- ✅ React Query 캐시 정리 지원
- ✅ 초대 정보 유지 옵션

## 플로우별 시뮬레이션

### 플로우 1: UserMenuDropdown 수동 로그아웃

**이전 동작:**
1. `clearTokens()` 호출
2. `clearSelectedProjectId()` 호출
3. `clearUseAttendanceMenu()` 호출 (full variant만)
4. `queryClient.clear()` 호출
5. 도메인 계산 (중복 코드)
6. `/logout`으로 리다이렉트

**개선된 동작:**
1. `performLogout({ queryClient })` 호출
2. WebSocket 연결 종료 (채팅, 알림)
3. 모든 상태 정리 (토큰, 프로젝트 ID, 근태 메뉴)
4. React Query 캐시 정리
5. `/logout`으로 리다이렉트 (도메인 계산 통합)

**사이드 이펙트:**
- ✅ WebSocket 연결이 명시적으로 종료됨
- ✅ 에러 발생 시에도 로그아웃이 계속 진행됨
- ✅ 코드 중복 제거

### 플로우 2: API 401 에러 자동 로그아웃

**이전 동작:**
1. `handleAutoLogout()` 호출
2. `clearTokens()`, `clearSelectedProjectId()` 호출
3. 공개 경로 체크
4. 도메인 계산 (중복 코드)
5. `/logout`으로 리다이렉트

**개선된 동작:**
1. `performAutoLogout(pathname)` 호출
2. 공개 경로 체크 (리다이렉트 루프 방지)
3. `performLogout()` 호출
4. WebSocket 연결 종료
5. 모든 상태 정리
6. `/logout`으로 리다이렉트

**사이드 이펙트:**
- ✅ 공개 경로에서 자동 로그아웃 방지 (기존 동작 유지)
- ✅ WebSocket 연결 종료 추가
- ✅ 코드 중복 제거

### 플로우 3: 초대 수락 플로우 로그아웃

**사용 위치:**
- `ProjectSignupForm`
- `SocialSignupForm`
- `InviteLanding`

**이전 동작:**
1. 초대 정보 저장
2. `clearTokens()` 호출
3. `/logout`으로 리다이렉트

**개선된 동작:**
1. 초대 정보 저장
2. `performLogout({ redirectUrl: "/login", preserveInviteInfo: true })` 호출
3. WebSocket 연결 종료
4. 상태 정리 (초대 정보는 유지)
5. `/logout`으로 리다이렉트

**사이드 이펙트:**
- ✅ 초대 정보가 안전하게 유지됨
- ✅ WebSocket 연결 종료 추가
- ✅ 일관된 로그아웃 처리

## 사이드 이펙트 체크리스트

### ✅ 안전성
- [x] WebSocket 연결이 명시적으로 종료됨
- [x] 에러 발생 시에도 로그아웃이 계속 진행됨
- [x] 공개 경로에서 리다이렉트 루프 방지
- [x] 초대 정보가 필요한 경우 유지됨

### ✅ 일관성
- [x] 모든 로그아웃 경로가 동일한 함수 사용
- [x] 도메인 계산 로직 통합
- [x] 에러 처리 일관됨

### ✅ 유지보수성
- [x] 코드 중복 제거
- [x] 단일 책임 원칙 준수
- [x] 명확한 에러 로깅

## 테스트 시나리오

### 시나리오 1: 정상 로그아웃
1. 사용자가 로그인 상태
2. UserMenuDropdown에서 로그아웃 클릭
3. **예상 결과:**
   - WebSocket 연결 종료
   - 모든 상태 정리
   - `/logout`으로 리다이렉트
   - 로그인 페이지로 이동

### 시나리오 2: API 401 에러
1. 사용자가 로그인 상태
2. API 호출 시 401 에러 발생
3. **예상 결과:**
   - 공개 경로가 아니면 자동 로그아웃
   - WebSocket 연결 종료
   - 모든 상태 정리
   - 로그인 페이지로 이동

### 시나리오 3: 초대 수락 플로우
1. 사용자가 다른 계정으로 로그인
2. 초대 링크 클릭
3. "다른 계정" 모달에서 로그아웃 클릭
4. **예상 결과:**
   - 초대 정보 유지
   - WebSocket 연결 종료
   - 상태 정리 (초대 정보 제외)
   - 로그인 페이지로 이동
   - 재로그인 후 초대 수락 가능

### 시나리오 4: 공개 경로에서 401 에러
1. 사용자가 `/login` 페이지에 있음
2. API 호출 시 401 에러 발생
3. **예상 결과:**
   - 자동 로그아웃하지 않음 (리다이렉트 루프 방지)
   - 현재 페이지 유지

## 마이그레이션 완료 파일

- ✅ `src/lib/logout.ts` (신규)
- ✅ `src/lib/apiClient.ts`
- ✅ `src/components/layout/UserMenuDropdown.tsx`
- ✅ `src/components/signup/ProjectSignupForm.tsx`
- ✅ `src/components/signup/SocialSignupForm.tsx`
- ✅ `src/components/invite/InviteLanding.tsx`

## 주의사항

1. **WebSocket 연결 종료**: 이제 명시적으로 종료되므로, 로그아웃 후 재연결 시도가 발생하지 않습니다.

2. **초대 정보 유지**: `preserveInviteInfo: true` 옵션을 사용하면 초대 정보가 유지됩니다. 이는 localStorage에 저장되어 있으므로 자동으로 유지됩니다.

3. **에러 처리**: 각 단계에서 에러가 발생해도 로그아웃은 계속 진행됩니다. 에러는 콘솔에 로깅됩니다.

4. **도메인 계산**: `getMainDomain()`은 빌드 시점에 계산되므로 클라이언트에서도 안전하게 사용할 수 있습니다.

## 향후 개선 사항

1. **초대 정보 정리**: 필요시 `clearPendingInviteToken()` 함수를 추가하여 초대 정보를 명시적으로 정리할 수 있습니다.

2. **에러 리포팅**: 프로덕션 환경에서는 에러 리포팅 서비스(Sentry 등)로 에러를 전송할 수 있습니다.

3. **테스트 코드**: 단위 테스트 및 통합 테스트 추가를 고려할 수 있습니다.
