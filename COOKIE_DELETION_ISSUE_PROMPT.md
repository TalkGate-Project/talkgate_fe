# 서브도메인 기반 프로젝트 관리 시스템 - 쿠키 삭제 문제

## 문제 상황

Next.js 15 기반의 서브도메인 프로젝트 관리 시스템에서 로그아웃 시 쿠키가 삭제되지 않는 문제가 발생하고 있습니다.

## 시스템 구조

- **메인 도메인**: `app-dev.talkgate.im` (개발 환경)
- **프로젝트 서브도메인**: `{projectSubdomain}.app-dev.talkgate.im` (예: `testSubDomain.app-dev.talkgate.im`)
- **쿠키 설정**: 로그인 시 `domain: '.talkgate.im'`으로 설정하여 모든 서브도메인에서 공유

## 문제 발생 시나리오

1. **로그인 단계**
   - 사용자가 `https://app-dev.talkgate.im/login`에서 로그인 성공
   - 서버에서 다음 쿠키를 설정:
     - `tg_access_token`
     - `tg_refresh_token`
     - `tg_selected_project_id`
   - 쿠키 옵션: `domain: '.talkgate.im'`, `path: '/'`, `httpOnly: false`, `secure: false`, `sameSite: 'lax'`
   - 이 시점에서 브라우저 쿠키는 `https://app-dev.talkgate.im` 소속으로 표시됨

2. **프로젝트 선택 단계**
   - `https://app-dev.talkgate.im/projects` 페이지로 이동
   - 프로젝트 선택 시 `window.location.href`를 사용하여 서브도메인으로 리다이렉트:
     ```javascript
     window.location.href = `https://testSubDomain.app-dev.talkgate.im/dashboard`;
     ```

3. **문제 발생 지점**
   - 서브도메인으로 이동한 후, 브라우저 개발자 도구에서 쿠키를 확인하면:
     - **이전**: `https://app-dev.talkgate.im` 소속의 쿠키
     - **이후**: `https://testSubDomain.app-dev.talkgate.im` 소속의 쿠키로 변경됨
   - `domain: '.talkgate.im'`으로 설정했음에도 불구하고 쿠키가 서브도메인 소속으로 바뀜

4. **로그아웃 실패**
   - 서브도메인(`testSubDomain.app-dev.talkgate.im`)에서 로그아웃 시도
   - 로그아웃 API(`/logout`)에서 다음 방법으로 쿠키 삭제 시도:
     - `cookies().delete()` 호출
     - `NextResponse.cookies.set()`으로 `maxAge: 0`, `expires: new Date(0)` 설정
     - `domain: '.talkgate.im'`과 현재 도메인 모두에 대해 삭제 시도
   - **결과**: 쿠키가 삭제되지 않음

## 현재 구현 상태

### 로그인 API (`src/app/api/auth/login/route.ts`)
```typescript
const cookieOptions = {
  httpOnly: false,
  secure: false,
  sameSite: 'lax' as 'none' | 'lax' | 'strict',
  path: '/',
  ...(isProduction && { domain: '.talkgate.im' }),
  ...(maxAge && { maxAge }),
};
```

### 로그아웃 API (`src/app/logout/route.ts`)
```typescript
const baseCookieOptions = {
  httpOnly: false,
  secure: false,
  sameSite: 'lax' as 'none' | 'lax' | 'strict',
  path: '/',
  maxAge: 0,
  expires: new Date(0),
};

// 프로덕션 환경: domain: '.talkgate.im'으로 삭제 시도
if (isProduction) {
  response.cookies.set(cookieName, '', { ...baseCookieOptions, domain: '.talkgate.im' });
}

// 현재 도메인으로도 삭제 시도
response.cookies.set(cookieName, '', baseCookieOptions);
```

### 프로젝트 선택 로직 (`src/app/projects/page.tsx`)
```typescript
if (p.subDomain) {
  const subdomainUrl = getProjectSubdomainUrl(p.subDomain, "/dashboard");
  if (subdomainUrl) {
    window.location.href = subdomainUrl; // 서브도메인으로 이동
    return;
  }
}
```

## 시도한 해결 방법

1. ✅ `httpOnly: false`로 변경 (테스트 목적)
2. ✅ `secure: false`로 변경 (HTTPS/HTTP 혼용 문제 해결 시도)
3. ✅ `sameSite: 'lax'`로 통일
4. ✅ 로그아웃 시 `domain: '.talkgate.im'`과 현재 도메인 모두에 대해 삭제 시도
5. ✅ 서브도메인에서 로그아웃 시 메인 도메인으로 리다이렉트 후 쿠키 삭제

## 핵심 문제점

**쿠키가 `domain: '.talkgate.im'`으로 설정되었음에도 불구하고, 서브도메인으로 이동한 후 브라우저가 쿠키를 서브도메인 소속으로 인식하는 현상**

이로 인해:
- 로그아웃 시 `domain: '.talkgate.im'`으로 삭제하려고 해도 실제 쿠키는 서브도메인 소속이라 삭제 실패
- 현재 도메인으로 삭제하려고 해도 쿠키 속성(path, domain, secure, sameSite)이 정확히 일치하지 않아 삭제 실패

## 요청 사항

1. **쿠키 삭제가 실패하는 근본 원인 분석**
   - `domain: '.talkgate.im'`으로 설정한 쿠키가 왜 서브도메인 소속으로 바뀌는지
   - 브라우저의 쿠키 동작 방식과 관련된 문제인지

2. **해결 방안 제시**
   - 서브도메인에서도 쿠키를 확실히 삭제할 수 있는 방법
   - 쿠키 설정/삭제 시 주의해야 할 사항

3. **대안 접근 방법**
   - 쿠키 대신 다른 인증 방식 사용 검토
   - 서브도메인 간 쿠키 공유 방식 개선

## 환경 정보

- **프레임워크**: Next.js 15
- **런타임**: Node.js (Edge Runtime 아님)
- **배포 환경**: Vercel
- **브라우저**: Chrome, Safari (모두 동일한 문제 발생)
- **프로토콜**: HTTPS

## 추가 정보

- 로그인 API, 소셜 로그인 API, 2FA 로그인 API 모두 동일한 쿠키 옵션 사용
- Middleware에서도 쿠키 삭제 로직 구현 (토큰 만료 시)
- 개발 환경(localhost)에서는 문제 없음 (서브도메인 사용 안 함)

