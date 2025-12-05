# 🧪 배포 환경 테스트 가이드

이 문서는 랜딩 페이지와 메인 서비스 간 로그인 상태 공유가 제대로 작동하는지 테스트하는 방법을 안내합니다.

## ⚠️ 중요: 로컬 환경에서는 테스트 불가능

- **로컬 환경** (`localhost:3000`, `localhost:3001`)은 포트가 달라서 쿠키 공유가 불가능합니다.
- **반드시 배포 환경**에서 테스트해야 합니다.

---

## 📋 사전 준비

### 1. Vercel 도메인 설정 확인

```
랜딩 페이지: landing.talkgate.im (또는 landing-dev.talkgate.im)
메인 서비스: app.talkgate.im (또는 app-dev.talkgate.im)
```

### 2. 환경 변수 설정 (Vercel Dashboard)

#### 메인 서비스 (talkgate_fe)
- `VERCEL_ENV`: `production` 또는 `preview` (Vercel 자동 설정)
- `NODE_ENV`: `production`

#### 랜딩 페이지
- `NEXT_PUBLIC_MAIN_SERVICE_URL`: `https://app.talkgate.im` (또는 `https://app-dev.talkgate.im`)
- `NEXT_PUBLIC_COOKIE_DOMAIN`: `.talkgate.im`

---

## 🧪 테스트 시나리오

### 테스트 1: 기본 로그인 플로우

#### 1단계: 초기 상태 확인
1. **새 시크릿 창** 열기 (`Ctrl + Shift + N`)
2. `landing.talkgate.im` 접속
3. **개발자 도구** 열기 (`F12`)
4. `Application` → `Cookies` → `https://landing.talkgate.im` 확인
   - 쿠키가 **비어있어야 함** ✅
5. Header에 **"Login"** 버튼 확인 ✅

#### 2단계: 로그인 페이지 이동
6. **"Login"** 버튼 클릭
7. URL 확인: `app.talkgate.im/login?redirectUrl=https://landing.talkgate.im`
8. 주소창에 `redirectUrl` 파라미터가 있는지 확인 ✅

#### 3단계: 로그인 수행
9. 이메일과 비밀번호 입력 후 로그인
10. 자동으로 `landing.talkgate.im`으로 리디렉트되는지 확인 ✅

#### 4단계: 쿠키 공유 확인 (핵심!)
11. `Application` → `Cookies` → `https://landing.talkgate.im`
12. 다음 쿠키들이 보이는지 확인:

```
Name: tg_access_token
Value: eyJhbGciOiJIUzI1NiIs... (JWT 토큰)
Domain: .talkgate.im          ← 핵심! 앞에 점(.)이 있어야 함
Path: /
Expires: (30일 후)
Size: ~500-1000
HttpOnly: (빈칸)              ← 클라이언트에서 읽기 가능
Secure: ✓                     ← HTTPS만 전송
SameSite: None                ← cross-site 허용
Priority: Medium
```

```
Name: tg_refresh_token
Domain: .talkgate.im          ← 동일
(나머지 속성 동일)
```

13. Header에 **"대시보드"** + **"Logout"** 버튼으로 변경되었는지 확인 ✅

#### 5단계: 메인 서비스에서 쿠키 확인
14. **새 탭**을 열어서 `app.talkgate.im` 접속
15. `Application` → `Cookies` → `https://app.talkgate.im`
16. **동일한 쿠키**가 보이는지 확인 (`tg_access_token`, `tg_refresh_token`)
17. 로그인 상태가 유지되는지 확인 (대시보드 또는 프로젝트 선택 페이지로 이동) ✅

#### 6단계: 크로스 도메인 동기화 확인
18. `app.talkgate.im`에서 **로그아웃**
19. 쿠키가 삭제되었는지 확인 (Application → Cookies)
20. `landing.talkgate.im` 탭으로 이동
21. **페이지 새로고침** (`F5`)
22. Header가 **"Login"** 버튼으로 변경되었는지 확인 ✅
23. `Application` → `Cookies` 확인 - 쿠키가 삭제되었는지 확인 ✅

---

### 테스트 2: Pricing 플로우 (로그아웃 상태)

#### 1단계: 초기 상태
1. 새 시크릿 창 열기
2. `landing.talkgate.im/pricing` 접속
3. 로그아웃 상태 확인 (쿠키 없음)

#### 2단계: 구독하기 클릭
4. 플랜 선택 후 **"구독하기"** 버튼 클릭
5. URL 확인: `app.talkgate.im/login?redirectUrl=https://landing.talkgate.im/pricing`
6. 주소창에 `/pricing`이 포함되어 있는지 확인 ✅

#### 3단계: 로그인 및 복귀
7. 로그인 완료
8. 자동으로 `landing.talkgate.im/pricing`으로 복귀하는지 확인 ✅
9. 쿠키 확인 (Domain: `.talkgate.im`) ✅

#### 4단계: 결제 진행
10. 다시 **"구독하기"** 버튼 클릭
11. 로그인 페이지로 가지 않고 바로 결제 페이지로 이동하는지 확인 ✅

---

### 테스트 3: 소셜 로그인 플로우

#### 1단계: Google 로그인
1. 새 시크릿 창 열기
2. `landing.talkgate.im` 접속
3. **"Login"** 버튼 클릭
4. **Google** 로그인 버튼 클릭
5. Google 계정 선택 및 승인
6. `landing.talkgate.im`으로 자동 복귀 확인 ✅
7. 쿠키 확인 ✅

#### 2단계: Kakao/Naver 로그인
(동일한 방식으로 테스트)

---

## 🚨 문제 해결

### 문제 1: 쿠키가 안 보인다

**증상:**
- 로그인 후 `landing.talkgate.im`에서 쿠키가 보이지 않음
- Header가 여전히 "Login" 버튼으로 표시됨

**확인 사항:**

1. **app.talkgate.im에서 쿠키 확인**
   ```
   Application → Cookies → https://app.talkgate.im
   - tg_access_token이 있는지 확인
   - Domain이 ".talkgate.im"인지 확인 (점으로 시작해야 함!)
   ```

2. **쿠키 속성 확인**
   ```
   Domain: .talkgate.im    ← 점(.)으로 시작해야 함!
   SameSite: None          ← None이어야 cross-site 전송됨
   Secure: ✓               ← 체크되어 있어야 함
   ```

3. **브라우저 콘솔에서 확인**
   ```javascript
   // Console 탭에서 실행
   console.log('Cookies:', document.cookie);
   
   // tg_access_token이 보이면 ✅
   // 안 보이면 ❌ → token.ts의 buildCookieAttributes 확인
   ```

4. **Network 탭에서 확인**
   ```
   Network → 로그인 API 요청 클릭 → Headers 탭
   
   Response Headers에서 찾기:
   Set-Cookie: tg_access_token=...; Domain=.talkgate.im; ...
   
   Domain=.talkgate.im 부분이 있는지 확인!
   ```

**해결:**
- `src/lib/token.ts`의 `buildCookieAttributes` 함수 확인
- `isProductionDomain()` 함수가 올바르게 작동하는지 확인
- Vercel 환경 변수 확인

---

### 문제 2: CORS 에러

**증상:**
```
Access to fetch at 'https://app.talkgate.im/v1/auth/login' 
from origin 'https://landing.talkgate.im' has been blocked by CORS policy
```

**확인 사항:**
1. `next.config.ts`의 `headers()` 함수 확인
2. Vercel 환경 변수 `VERCEL_ENV` 확인
3. Response Headers에 다음 헤더가 있는지 확인:
   ```
   Access-Control-Allow-Origin: https://landing.talkgate.im
   Access-Control-Allow-Credentials: true
   ```

**해결:**
- `next.config.ts` 재배포
- Vercel 빌드 로그 확인

---

### 문제 3: 리디렉션이 안 된다

**증상:**
- 로그인 후 `landing.talkgate.im`으로 복귀하지 않음
- 계속 `app.talkgate.im`에 머물러 있음

**확인 사항:**
1. 로그인 페이지 URL에 `redirectUrl` 파라미터가 있는지 확인
2. `src/app/login/page.tsx`에서 `searchParams.get("redirectUrl")` 확인
3. 콘솔 로그 확인:
   ```
   [LoginPage] ✅ 로그인 성공 + 리디렉션 URL 있음 → ...
   ```

**해결:**
- 랜딩 페이지에서 올바른 URL로 리디렉트하는지 확인
- 메인 서비스의 `login/page.tsx` 재배포

---

## 📊 예상 결과

### ✅ 성공 시나리오

```
1. landing.talkgate.im 접속
   ↓ (쿠키 없음, "Login" 버튼 표시)
   
2. "Login" 버튼 클릭
   ↓ (app.talkgate.im/login?redirectUrl=... 으로 이동)
   
3. 로그인 완료
   ↓ (쿠키 설정: Domain=.talkgate.im)
   
4. landing.talkgate.im으로 자동 복귀
   ↓ (쿠키 공유됨, "대시보드" + "Logout" 버튼 표시)
   
5. app.talkgate.im 접속
   ↓ (동일한 쿠키로 로그인 유지)
   
6. app.talkgate.im에서 로그아웃
   ↓ (쿠키 삭제)
   
7. landing.talkgate.im 새로고침
   ↓ (쿠키 없음, "Login" 버튼 표시)
```

### ❌ 실패 시나리오

```
1. landing.talkgate.im 접속
   ↓
2. "Login" 버튼 클릭
   ↓
3. 로그인 완료
   ↓
4. landing.talkgate.im으로 복귀
   ↓ ❌ 여전히 "Login" 버튼 표시 (쿠키 공유 실패!)
   
원인:
- 쿠키 Domain이 ".talkgate.im"이 아닌 "app.talkgate.im"으로 설정됨
- SameSite=Lax로 설정되어 cross-site 전송 안 됨
- Secure 속성이 없어서 HTTPS에서 전송 안 됨
```

---

## 🎯 핵심 체크포인트

배포 환경 테스트 시 **반드시 확인해야 할 3가지**:

### 1️⃣ 쿠키 Domain 속성
```
✅ Domain: .talkgate.im (점으로 시작!)
❌ Domain: talkgate.im (점 없음)
❌ Domain: app.talkgate.im (서브도메인 포함)
```

### 2️⃣ 쿠키 SameSite 속성
```
✅ SameSite: None (cross-site 허용)
❌ SameSite: Lax (same-site만 허용)
❌ SameSite: Strict (더 제한적)
```

### 3️⃣ 쿠키 Secure 속성
```
✅ Secure: true (HTTPS only)
❌ Secure: false (HTTP도 허용 - 보안 위험!)
```

---

## 📞 문제 발생 시

테스트 중 문제가 발생하면 다음 정보를 캡처해주세요:

1. **브라우저 개발자 도구 스크린샷**
   - Application → Cookies (양쪽 도메인 모두)
   
2. **Network 탭 캡처**
   - 로그인 API 요청의 Response Headers
   - `Set-Cookie` 헤더 전체 내용

3. **Console 로그**
   - `[LoginPage]`, `[Token]`, `[TwoFactorLogin]` 로그

4. **환경 정보**
   - 브라우저 종류 및 버전
   - 배포 환경 (production/preview)
   - 도메인 주소

이 정보를 공유해주시면 정확한 원인 파악이 가능합니다! 🔍
