# 본인인증 관련 코드 리뷰 결과

## 📋 리뷰 대상 파일
- `src/services/auth.ts` - 인증 서비스
- `src/lib/auth-utils.ts` - 인증 유틸리티
- `src/services/verification.ts` - 본인인증 서비스
- `src/components/signup/PhoneVerificationStep.tsx` - 전화번호 인증 컴포넌트
- `src/hooks/usePhoneVerification.ts` - 전화번호 인증 훅
- `src/types/auth.ts` - 인증 타입
- `src/types/verification.ts` - 본인인증 타입
- `src/lib/token.ts` - 토큰 관리
- `src/middleware.ts` - 미들웨어

---

## 🔒 보안 취약점 및 개선 사항

### 1. **토큰 저장 방식 (중요도: 높음)**

**문제점:**
- `src/lib/token.ts`에서 토큰을 클라이언트 측 쿠키에 저장하고 있음
- HttpOnly 플래그가 없어 XSS 공격에 취약할 수 있음
- 주석에 "백엔드에서 Set-Cookie 헤더로 처리하는 것이 바람직"이라고 명시되어 있지만, 실제로는 클라이언트에서도 저장 중

**현재 상태:**
```typescript
// src/lib/token.ts:4-5
// NOTE: Tokens in non-HttpOnly cookies can be read by JS. Use only as required for this app's policy.
// NOTE: 상세한 쿠키 보안 설정(HttpOnly, Secure 등)은 백엔드에서 Set-Cookie 헤더로 처리하는 것이 바람직합니다.
```

**개선 제안:**
- 백엔드에서 httpOnly 쿠키로 토큰을 설정하는 것이 확인됨 (`src/services/auth.ts:140, 175, 279`)
- 클라이언트 측 `setTokens()` 함수는 제거하거나, 백엔드 쿠키 설정 실패 시에만 사용하도록 변경
- 토큰 읽기는 가능하지만, 쓰기는 백엔드에 위임하는 것이 안전

### 2. **본인인증 팝업 보안 (중요도: 중간)**

**문제점:**
- `usePhoneVerification.ts`에서 팝업 창을 열어 본인인증을 처리
- `postMessage`를 통한 통신에서 origin 검증이 없음

**현재 코드:**
```typescript
// src/hooks/usePhoneVerification.ts:77-89
const handleMessage = (event: MessageEvent) => {
  if (event.data?.type === "PHONE_VERIFICATION_RESULT") {
    const result = event.data.data as VerificationResult;
    // origin 검증 없음!
  }
};
```

**개선 제안:**
```typescript
const handleMessage = (event: MessageEvent) => {
  // 본인인증 서비스의 예상 origin을 검증
  const allowedOrigins = [
    'https://cert.kcp.co.kr',
    'https://nice.checkplus.co.kr',
    // 실제 사용하는 본인인증 서비스 도메인 추가
  ];
  
  if (!allowedOrigins.includes(event.origin)) {
    console.warn('[usePhoneVerification] 허용되지 않은 origin:', event.origin);
    return;
  }
  
  if (event.data?.type === "PHONE_VERIFICATION_RESULT") {
    const result = event.data.data as VerificationResult;
    // ...
  }
};
```

### 3. **에러 메시지 노출 (중요도: 낮음)** ✅ **수정 완료**

**문제점:**
- 일부 에러 메시지가 사용자에게 직접 노출될 수 있음
- 민감한 정보가 포함될 수 있는 에러를 그대로 표시

**개선 완료:**
- ✅ `src/utils/errorMessages.ts` - 에러 메시지 변환 유틸리티 함수 생성
- ✅ `src/hooks/usePhoneVerification.ts` - 본인인증 에러 메시지 변환 적용
- ✅ `src/components/auth/OAuthCallbackContent.tsx` - OAuth 에러 메시지 개선
- ✅ `src/components/invite/InviteLanding.tsx` - 초대 에러 메시지 개선
- ✅ `src/components/chat/customer-link/CustomerLinkExistingModal.tsx` - 고객 연동 에러 메시지 개선
- ✅ 에러 메시지를 사용자 친화적인 메시지로 변환
- ✅ 민감한 정보(스택 트레이스, 내부 에러 코드 등)는 로그에만 기록

### 4. **2FA 토큰 처리 (중요도: 중간)**

**현재 상태:**
- `twoFactorToken`이 메모리에 저장되고 있음
- 세션 스토리지나 안전한 저장소 사용 고려 필요

**개선 제안:**
- 2FA 토큰은 짧은 수명을 가지므로 현재 방식도 괜찮지만, 명시적인 만료 시간 설정 권장

---

## 📝 코드 품질 개선 사항

### 1. **타입 안정성**

**문제점:**
- `src/services/auth.ts`에서 `any` 타입 사용이 다수 발견됨
- `LoginResponseData.user`가 `any` 타입

**예시:**
```typescript
// src/services/auth.ts:33
user?: any;
```

**개선 제안:**
```typescript
// src/types/auth.ts에 User 타입 정의 필요
export type User = {
  id: string | number;
  email: string;
  name: string;
  // ... 기타 필드
};

// src/services/auth.ts
user?: User;
```

### 2. **에러 처리 일관성**

**문제점:**
- 에러 처리 방식이 파일마다 다름
- 일부는 try-catch, 일부는 .then().catch() 사용

**개선 제안:**
- 통일된 에러 처리 유틸리티 함수 생성
- 에러 타입 정의 및 타입 가드 사용

### 3. **중복 코드**

**문제점:**
- `src/services/auth.ts`에서 소셜 로그인 함수들(`loginGoogle`, `loginKakao`, `loginNaver`)이 거의 동일한 로직 반복

**개선 제안:**
```typescript
// 공통 함수로 추출
function createSocialLoginHandler(provider: 'google' | 'kakao' | 'naver') {
  return (input: SocialLoginInput): Promise<SocialLoginResult> => {
    return fetch(`/api/auth/social/${provider}`, {
      // ... 공통 로직
    });
  };
}

export const AuthService = {
  loginGoogle: createSocialLoginHandler('google'),
  loginKakao: createSocialLoginHandler('kakao'),
  loginNaver: createSocialLoginHandler('naver'),
  // ...
};
```

### 4. **로깅 과다**

**문제점:**
- 프로덕션 환경에서도 많은 console.log가 실행됨
- 디버그 로그가 사용자 콘솔에 노출

**개선 제안:**
```typescript
const isDev = process.env.NODE_ENV === 'development';

function debugLog(message: string, data?: unknown) {
  if (isDev) {
    console.log(message, data);
  }
}
```

---

## ✅ 잘 구현된 부분

### 1. **세션 관리**
- `auth-utils.ts`에서 세션 정리 로직이 잘 구현됨
- 디버그 로깅 시스템이 체계적으로 구성됨

### 2. **타입 정의**
- `types/auth.ts`와 `types/verification.ts`에서 타입이 잘 정의됨
- API 응답 타입이 명확함

### 3. **에러 핸들링**
- `PhoneVerificationStep.tsx`에서 다양한 에러 케이스를 처리
- 사용자 친화적인 에러 메시지 제공

### 4. **보안 고려사항**
- 쿠키에 Secure, SameSite 속성 설정
- 프로덕션/개발 환경 구분

---

## 🎯 우선순위별 개선 권장사항

### 높은 우선순위
1. ✅ **postMessage origin 검증 추가** (`usePhoneVerification.ts`)
2. ✅ **any 타입을 구체적인 타입으로 변경** (`auth.ts`)
3. ✅ **소셜 로그인 중복 코드 제거** (`auth.ts`)

### 중간 우선순위
4. ✅ **에러 처리 통일** (전체 파일)
5. ✅ **프로덕션 로깅 제거** (전체 파일)
6. ✅ **2FA 토큰 만료 시간 명시**

### 낮은 우선순위
7. ✅ **에러 메시지 사용자 친화적 변환** - **완료 (2024-12-26)**
8. ⏳ **코드 주석 보완**

---

## 📊 종합 평가

### 보안 점수: 7/10
- 기본적인 보안 조치는 되어 있으나, 일부 개선 필요
- XSS 방지를 위한 추가 조치 권장

### 코드 품질: 8/10
- 전반적으로 잘 구조화되어 있음
- 타입 안정성과 중복 코드 제거 필요

### 유지보수성: 8/10
- 코드 구조가 명확하고 이해하기 쉬움
- 디버깅 도구가 잘 구성됨

---

## 💡 추가 권장사항

1. **단위 테스트 추가**
   - 인증 플로우에 대한 테스트 작성
   - 본인인증 훅 테스트

2. **문서화**
   - 인증 플로우 다이어그램
   - 에러 코드 문서화

3. **모니터링**
   - 인증 실패율 모니터링
   - 보안 이벤트 로깅

