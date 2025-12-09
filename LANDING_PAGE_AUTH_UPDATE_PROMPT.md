# 랜딩 페이지 인증 로직 업데이트 프롬프트

## 📋 배경

메인 서비스(`talkgate_fe`)의 인증 시스템이 서버 사이드로 전환되었습니다. 이에 따라 랜딩 페이지(`talkgate_landing`)의 로그인/로그아웃 확인 로직도 업데이트가 필요합니다.

## 🔄 주요 변경 사항

### 1. 쿠키 관리 방식 변경

**이전:**
- 클라이언트에서 `httpOnly: false` 쿠키로 토큰 관리
- JavaScript에서 쿠키 직접 읽기 가능 (`document.cookie`)

**현재:**
- 서버에서 `httpOnly: true` 쿠키로 토큰 관리
- JavaScript에서 쿠키 읽기 불가능 (보안 강화)
- 서버 API를 통해서만 인증 상태 확인 가능

### 2. API 호출 방식 변경

**이전:**
- 클라이언트에서 백엔드 API 직접 호출
- 클라이언트에서 Authorization 헤더에 토큰 추가

**현재:**
- 클라이언트에서 Next.js API 프록시(`/api/proxy/*`)를 통해 호출
- 서버가 httpOnly 쿠키에서 토큰을 읽어서 백엔드로 전달

### 3. 로그인/로그아웃 플로우

**로그인:**
- 이전: 백엔드 API 호출 → 클라이언트에서 쿠키 설정
- 현재: 서버 API 호출 → 서버에서 httpOnly 쿠키 설정

**로그아웃:**
- 이전: 클라이언트에서 쿠키 삭제
- 현재: 서버 API 호출 → 서버에서 httpOnly 쿠키 삭제

## 📝 랜딩 페이지에서 수정해야 할 부분

### 1. 인증 상태 확인 로직

**문제:**
- 현재 랜딩 페이지에서 `document.cookie`로 쿠키를 읽어서 인증 상태를 확인하고 있을 가능성
- httpOnly 쿠키는 JavaScript에서 읽을 수 없으므로 동작하지 않음

**해결 방법:**
- 메인 서비스의 API 프록시를 통해 인증 상태 확인
- `GET /api/proxy/v1/auth/user` 호출하여 사용자 정보 확인
- ⚠️ 반드시 `credentials: 'include'` 설정 필요 (쿠키 전달을 위해)

**예시 코드:**
```typescript
// 이전 (작동하지 않음)
const hasAuth = document.cookie.includes('tg_access_token');

// 이후
async function checkAuthStatus(): Promise<boolean> {
  try {
    // 프로덕션: https://app.talkgate.im
    // 개발: https://app-dev.talkgate.im 또는 http://localhost:3000
    const mainServiceUrl = process.env.NEXT_PUBLIC_MAIN_SERVICE_URL || 'https://app-dev.talkgate.im';
    const response = await fetch(`${mainServiceUrl}/api/proxy/v1/auth/user`, {
      method: 'GET',
      credentials: 'include', // 필수: 쿠키를 포함하기 위해
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### 2. 로그인 후 인증 상태 확인

**문제:**
- 로그인 완료 후 쿠키가 설정되었는지 확인하는 로직

**해결 방법:**
- 메인 서비스의 API 프록시를 통해 인증 상태 확인
- 콜백 페이지에서 `GET /api/proxy/v1/auth/user` 호출하여 로그인 성공 확인
- `credentials: 'include'` 필수

### 3. 로그아웃 후 상태 확인

**문제:**
- 로그아웃 후 쿠키가 삭제되었는지 확인하는 로직

**해결 방법:**
- 메인 서비스의 로그아웃 API 호출 후 콜백 URL로 리다이렉트됨
- 로그아웃 콜백에서 인증 상태 확인 API 호출하여 로그아웃 확인
- `credentials: 'include'` 필수

**예시 코드:**
```typescript
// 로그아웃 요청
function requestLogout(returnUrl: string) {
  const mainServiceUrl = process.env.NEXT_PUBLIC_MAIN_SERVICE_URL || 'https://app-dev.talkgate.im';
  const callbackUrl = `${window.location.origin}/api/auth/logout-callback`;
  const logoutUrl = `${mainServiceUrl}/logout?callbackUrl=${encodeURIComponent(callbackUrl)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  window.location.href = logoutUrl;
}

// 로그아웃 콜백 처리
async function handleLogoutCallback(returnUrl?: string) {
  // 로그아웃 API가 완료된 후 콜백으로 돌아옴
  const isLoggedOut = !(await checkAuthStatus());
  if (isLoggedOut) {
    // 로그아웃 성공 처리
    if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      window.location.href = '/';
    }
  }
}
```

## 🔍 확인해야 할 파일

랜딩 페이지 프로젝트에서 다음 파일들을 확인하고 수정하세요:

1. **인증 상태 확인 로직**
   - `lib/auth.ts` 또는 유사한 파일
   - 헤더 컴포넌트에서 로그인/로그아웃 상태 확인하는 부분

2. **로그인 콜백 처리**
   - `app/api/auth/callback/` 또는 유사한 경로
   - 로그인 후 쿠키 확인 로직

3. **로그아웃 콜백 처리**
   - `app/api/auth/logout-callback/route.ts`
   - 로그아웃 후 쿠키 삭제 확인 로직

4. **로그인/로그아웃 UI 컴포넌트**
   - 버튼 표시/숨김 로직
   - 사용자 정보 표시 로직

## ✅ 체크리스트

- [ ] `document.cookie`로 쿠키를 직접 읽는 코드 제거
- [ ] 인증 상태 확인을 서버 API 호출로 변경
- [ ] 로그인 후 인증 상태 확인 로직 업데이트
- [ ] 로그아웃 후 인증 상태 확인 로직 업데이트
- [ ] 메인 서비스 API 호출 시 `credentials: 'include'` 설정 확인
- [ ] CORS 설정 확인 (필요한 경우)

## 📚 참고 자료

### 메인 서비스 API 엔드포인트

**프로덕션 환경:**
- 메인 서비스 URL: `https://app.talkgate.im`
- 개발 환경: `https://app-dev.talkgate.im` 또는 `http://localhost:3000`

**인증 관련 API:**

1. **인증 상태 확인**
   - `GET https://app.talkgate.im/api/proxy/v1/auth/user`
   - 응답: 200 (인증됨), 401 (인증 안됨)
   - `credentials: 'include'` 필수

2. **로그인 API** (직접 사용 불가, 메인 서비스 로그인 페이지 사용)
   - 서버 API: `POST /api/auth/login` (메인 서비스 내부)
   - 소셜 로그인: `POST /api/auth/social/{provider}` (메인 서비스 내부)
   - 2FA 로그인: `POST /api/auth/two-factor/login` (메인 서비스 내부)
   - ⚠️ 랜딩 페이지에서는 메인 서비스 로그인 페이지로 리다이렉트만 수행

3. **로그아웃 API**
   - `GET https://app.talkgate.im/logout?callbackUrl={URL}&returnUrl={URL}`
   - 파라미터:
     - `callbackUrl`: 로그아웃 후 돌아올 랜딩 페이지 콜백 URL
     - `returnUrl`: 최종적으로 이동할 랜딩 페이지 URL
   - 예시:
     ```
     GET https://app.talkgate.im/logout?callbackUrl=https://talkgate.im/api/auth/logout-callback&returnUrl=https://talkgate.im/pricing
     ```

### API 프록시

- 모든 백엔드 API 호출: `GET/POST/PUT/PATCH/DELETE /api/proxy/{backend_path}`
- 예: `GET /api/proxy/v1/auth/user` → 백엔드의 `/v1/auth/user`로 프록시
- 서버가 자동으로 httpOnly 쿠키에서 토큰을 읽어서 Authorization 헤더에 추가

### 로그인 플로우

```
랜딩 페이지 → 메인 서비스 로그인 페이지 (/login)
↓
사용자가 로그인 (이메일/비밀번호 또는 소셜 로그인)
↓
메인 서비스에서 httpOnly 쿠키 설정
↓
랜딩 페이지로 리다이렉트 (returnUrl)
↓
랜딩 페이지에서 인증 상태 확인 (/api/proxy/v1/auth/user)
```

### 로그아웃 플로우

```
랜딩 페이지 → 메인 서비스 로그아웃 API (/logout?callbackUrl=...&returnUrl=...)
↓
메인 서비스에서 httpOnly 쿠키 삭제
↓
랜딩 페이지 콜백으로 리다이렉트 (callbackUrl)
↓
랜딩 페이지에서 인증 상태 확인하여 로그아웃 확인
```

---

이 프롬프트를 랜딩 페이지 프로젝트의 Cursor 에이전트에 전달하여 인증 로직을 업데이트하세요.

