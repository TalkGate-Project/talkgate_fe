# 프론트 보안감사 체크리스트 초안

## 목적

이 문서는 `talkgate_fe` 프론트엔드에 대해 먼저 수행할 수 있는 보안감사 항목을 정리한 초안입니다.
실제 코드 기준으로 점검 범위를 나누고, 현재까지 확인된 내용, 우선 점검할 항목, 보고서 작성 형식을 한 번에 사용할 수 있도록 구성했습니다.

## 사용 방법

1. 아래 `현재 파악한 내용`을 기준으로 고위험 항목부터 검토합니다.
2. `감사 체크리스트`의 각 항목에 대해 상태와 근거를 채웁니다.
3. `감사 수행 투두리스트`를 따라 실제 검증 순서를 관리합니다.
4. 감사가 끝나면 `보고서 템플릿` 형식으로 결과를 정리합니다.

## 상태 및 심각도 기준

### 상태

- `안전함`: 프론트 코드상 방어 로직이 확인되고, 현재 보이는 범위에서는 우회 가능성이 낮음
- `확인 필요`: 프론트만 봐서는 확정할 수 없고 백엔드 또는 인프라 확인이 필요함
- `이슈`: 현재 코드상 위험 패턴이 확인되거나 정책 부재가 명확함

### 심각도

- `높음`: 세션 탈취, 권한 우회, XSS, 민감정보 노출 등 직접 악용 시 영향이 큼
- `중간`: 단독으로 치명적이지는 않지만 다른 이슈와 결합 시 위험도가 올라감
- `낮음`: 운영상 개선 필요 또는 정책 정리 필요 수준

## 현재 파악한 내용

### 핵심 감사 지점

- 인증/세션/쿠키: [`src/lib/cookies.ts`](src/lib/cookies.ts), [`src/app/api/proxy/[...path]/route.ts`](src/app/api/proxy/[...path]/route.ts), [`src/lib/token.ts`](src/lib/token.ts), [`src/middleware.ts`](src/middleware.ts)
- 로그인 후 이동/외부 인증: [`src/components/login/LoginForm.tsx`](src/components/login/LoginForm.tsx), [`src/components/auth/OAuthCallbackContent.tsx`](src/components/auth/OAuthCallbackContent.tsx), [`src/hooks/usePhoneVerification.ts`](src/hooks/usePhoneVerification.ts)
- 사용자/서버 데이터 렌더링: [`src/providers/PersistentModalProvider.tsx`](src/providers/PersistentModalProvider.tsx), [`src/components/notice/NoticeDetailPageContent.tsx`](src/components/notice/NoticeDetailPageContent.tsx), [`src/components/chat/ChatMainView.tsx`](src/components/chat/ChatMainView.tsx)
- 파일 업로드/다운로드: [`src/components/layout/StaffChatModal.tsx`](src/components/layout/StaffChatModal.tsx), [`src/components/customers/CustomerExcelUploadModal.tsx`](src/components/customers/CustomerExcelUploadModal.tsx), [`src/components/projects/CreateProjectModal.tsx`](src/components/projects/CreateProjectModal.tsx)
- 환경변수/배포/로그: [`next.config.ts`](next.config.ts), [`.env.example`](.env.example), [`src/lib/crypto.ts`](src/lib/crypto.ts), [`src/app/debug/env/page.tsx`](src/app/debug/env/page.tsx)
- 권한/UI 접근제어: [`src/components/settings/MemberSettings.tsx`](src/components/settings/MemberSettings.tsx), [`src/components/settings/SettingsClient.tsx`](src/components/settings/SettingsClient.tsx), [`src/utils/permissions.ts`](src/utils/permissions.ts)

### 현재까지의 예비 판단

| ID | 분류 | 상태 | 심각도 | 현재 파악 내용 | 근거 |
| --- | --- | --- | --- | --- | --- |
| AUTH-01 | 인증/세션 | 이슈 | 높음 | 인증 쿠키가 현재 JS에서 읽히는 구조라 XSS 발생 시 토큰 탈취 영향이 큼 | [`src/lib/cookies.ts`](src/lib/cookies.ts), [`src/lib/token.ts`](src/lib/token.ts) |
| AUTH-02 | 인증/세션 | 이슈 | 높음 | `/api/proxy`에서 refresh token 관련 로그가 남아 민감정보 로깅 점검이 필요함 | [`src/app/api/proxy/[...path]/route.ts`](src/app/api/proxy/[...path]/route.ts) |
| AUTH-03 | 권한 | 확인 필요 | 높음 | 프론트에서 역할 기반 UI 차단은 보이나 실제 권한 강제는 백엔드 검증이 필요함 | [`src/components/settings/MemberSettings.tsx`](src/components/settings/MemberSettings.tsx), [`src/utils/permissions.ts`](src/utils/permissions.ts) |
| REDIR-01 | 외부 연동 | 이슈 | 중간 | 로그인 후 절대 URL 리다이렉트 허용 로직이 있어 오픈 리다이렉트 위험 검토가 필요함 | [`src/components/login/LoginForm.tsx`](src/components/login/LoginForm.tsx) |
| XSS-01 | 입력/XSS | 이슈 | 높음 | `dangerouslySetInnerHTML` 사용 지점이 있어 전달 데이터 신뢰성과 sanitization 여부를 확인해야 함 | [`src/providers/PersistentModalProvider.tsx`](src/providers/PersistentModalProvider.tsx) |
| MSG-01 | 외부 연동 | 이슈 | 높음 | `postMessage` 수신부에서 origin/source 검증이 약한 흐름이 확인됨 | [`src/hooks/usePhoneVerification.ts`](src/hooks/usePhoneVerification.ts) |
| CONF-01 | 설정/환경변수 | 이슈 | 높음 | 암호화 키가 `NEXT_PUBLIC_*` 이름으로 선언되어 공개 변수 모델과 충돌함 | [`.env.example`](.env.example), [`src/lib/crypto.ts`](src/lib/crypto.ts) |
| CONF-02 | 설정/배포 | 확인 필요 | 중간 | `/debug/env` 페이지가 배포 환경에서 차단되는지 확인이 필요함 | [`src/app/debug/env/page.tsx`](src/app/debug/env/page.tsx), [`src/middleware.ts`](src/middleware.ts) |
| HDR-01 | 설정/헤더 | 확인 필요 | 중간 | CORS 설정은 있으나 CSP 등 추가 보안 헤더는 코드상 확인되지 않음 | [`next.config.ts`](next.config.ts) |
| SAFE-01 | 렌더링 | 안전함 | 중간 | 공지/채팅 본문은 대체로 React text로 렌더링되어 직접 HTML 삽입이 많지 않음 | [`src/components/notice/NoticeDetailPageContent.tsx`](src/components/notice/NoticeDetailPageContent.tsx), [`src/components/chat/ChatMainView.tsx`](src/components/chat/ChatMainView.tsx) |
| SAFE-02 | 링크 보안 | 안전함 | 낮음 | 일부 외부 링크에는 이미 `noopener noreferrer`가 적용되어 있음 | [`src/components/layout/StaffChatModal.tsx`](src/components/layout/StaffChatModal.tsx) |

## 감사 체크리스트

아래 항목은 실제 점검 시 그대로 복사해 표를 채우거나, 이 문서에서 상태를 업데이트하며 사용할 수 있습니다.

### 1. 인증/세션

| ID | 점검 항목 | 확인 방법 | 상태 | 심각도 | 담당 영역 |
| --- | --- | --- | --- | --- | --- |
| AUTH-01 | 액세스 토큰, 리프레시 토큰이 어디에 저장되는가 | 쿠키, `localStorage`, `sessionStorage`, 메모리 저장 여부 확인 | 이슈 | 높음 | 프론트 |
| AUTH-02 | 인증 쿠키에 `HttpOnly`, `Secure`, `SameSite`, `domain`이 적절히 설정되는가 | 쿠키 생성/삭제 로직과 배포 환경 동작 비교 | 이슈 | 높음 | 프론트 |
| AUTH-03 | 세션 만료, 로그아웃, 토큰 재발급이 일관되게 처리되는가 | 로그인, 새로고침, 만료, 로그아웃 흐름 검증 | 확인 필요 | 중간 | 프론트/백엔드 |
| AUTH-04 | 웹소켓 인증이 토큰 탈취에 취약하지 않은가 | 소켓 연결 시 토큰 전달 방식과 만료 처리 확인 | 확인 필요 | 높음 | 프론트/백엔드 |
| AUTH-05 | 서브도메인 간 쿠키 공유 정책이 의도대로 동작하는가 | 메인 도메인, 서브도메인, 로그아웃 삭제 정책 비교 | 확인 필요 | 중간 | 프론트 |
| AUTH-06 | 세션 복구 중 민감정보가 로그에 남지 않는가 | 프록시, 인증 API Route 로그 확인 | 이슈 | 높음 | 프론트 |

### 2. 권한/접근제어

| ID | 점검 항목 | 확인 방법 | 상태 | 심각도 | 담당 영역 |
| --- | --- | --- | --- | --- | --- |
| AUTHZ-01 | 관리자 전용 UI가 일반 사용자에게 노출되지 않는가 | 멤버 설정, 공지 작성, 팀 관리 UI 확인 | 확인 필요 | 중간 | 프론트 |
| AUTHZ-02 | 프론트 차단과 별개로 백엔드가 동일 권한을 강제하는가 | 관리자 기능 API 목록을 정리하고 서버 검증 필요 항목 표시 | 확인 필요 | 높음 | 백엔드 |
| AUTHZ-03 | 프로젝트 ID, 멤버 ID, 팀 ID를 바꿔 호출해도 권한 우회가 불가능한가 | `x-project-id` 기반 요청과 대상 변경 API 확인 | 확인 필요 | 높음 | 백엔드 |
| AUTHZ-04 | 본인 계정 삭제, 관리자 삭제, 역할 변경 제한이 서버에서도 동일한가 | 프론트 UI 조건과 실제 API 정책 비교 | 확인 필요 | 높음 | 프론트/백엔드 |

### 3. 입력값/XSS/렌더링

| ID | 점검 항목 | 확인 방법 | 상태 | 심각도 | 담당 영역 |
| --- | --- | --- | --- | --- | --- |
| XSS-01 | `dangerouslySetInnerHTML` 사용 데이터가 신뢰 가능한가 | 호출부, 서버 응답, 사용자 입력 유입 경로 확인 | 이슈 | 높음 | 프론트 |
| XSS-02 | 사용자 입력을 다시 출력하는 화면이 HTML이 아닌 text로 렌더링되는가 | 공지, 채팅, 설정값 표시 컴포넌트 확인 | 안전함 | 중간 | 프론트 |
| XSS-03 | 에러 메시지나 서버 메시지를 UI에 직접 노출하지 않는가 | 모달, 토스트, 인라인 에러 처리 확인 | 확인 필요 | 중간 | 프론트 |
| XSS-04 | URL, 쿼리파라미터, 리다이렉트 값이 그대로 DOM 또는 네비게이션에 사용되지 않는가 | 로그인 후 이동, OAuth callback, returnUrl 확인 | 이슈 | 중간 | 프론트 |

### 4. 파일 업로드/다운로드

| ID | 점검 항목 | 확인 방법 | 상태 | 심각도 | 담당 영역 |
| --- | --- | --- | --- | --- | --- |
| FILE-01 | 업로드 파일의 확장자, MIME, 용량 검사가 충분한가 | 업로드 모달별 프론트 검증 로직 비교 | 확인 필요 | 중간 | 프론트 |
| FILE-02 | SVG, PDF, Office 파일 업로드 및 렌더링 정책이 안전한가 | 미리보기, 새 창 열기, CDN 응답 헤더 확인 | 확인 필요 | 높음 | 프론트/인프라 |
| FILE-03 | presigned URL 업로드가 의도한 타입과 크기만 허용하는가 | 프론트 검증 외 서버 presign 제약 확인 | 확인 필요 | 높음 | 백엔드 |
| FILE-04 | 새 창으로 여는 다운로드 링크에 opener 방어가 적용되는가 | `<a target=\"_blank\">`, `window.open` 사용처 점검 | 확인 필요 | 중간 | 프론트 |

### 5. 외부 연동/팝업/메시지 전달

| ID | 점검 항목 | 확인 방법 | 상태 | 심각도 | 담당 영역 |
| --- | --- | --- | --- | --- | --- |
| EXT-01 | OAuth/본인인증 팝업이 허용된 출처만 신뢰하는가 | `postMessage`의 `origin`, `source`, nonce 검증 확인 | 이슈 | 높음 | 프론트 |
| EXT-02 | `window.open` 사용 시 `noopener,noreferrer`를 적용하는가 | 외부 결제, 인증, 링크 이동 흐름 확인 | 확인 필요 | 중간 | 프론트 |
| EXT-03 | 로그인 이후 이동할 URL이 allowlist 또는 서명 기반으로 검증되는가 | `redirectUrl`, `returnUrl` 처리 로직 확인 | 이슈 | 중간 | 프론트/백엔드 |
| EXT-04 | `window.opener`를 통한 데이터 전달이 부모 창 검증과 함께 사용되는가 | OAuth callback, 외부 인증 callback 흐름 점검 | 확인 필요 | 중간 | 프론트 |

### 6. 설정/환경변수/배포 보안

| ID | 점검 항목 | 확인 방법 | 상태 | 심각도 | 담당 영역 |
| --- | --- | --- | --- | --- | --- |
| CONF-01 | `NEXT_PUBLIC_*`로 공개되면 안 되는 값이 포함되어 있지 않은가 | `.env.example`, `env.ts`, 실제 사용처 확인 | 이슈 | 높음 | 프론트 |
| CONF-02 | 디버그 페이지와 진단용 UI가 프로덕션에서 차단되는가 | `/debug/env` 접근 가능 여부, 배포 규칙 확인 | 확인 필요 | 중간 | 프론트/인프라 |
| CONF-03 | CSP, CORS, 보안 관련 응답 헤더가 최소 기준을 만족하는가 | `next.config.ts`, 배포 프록시/플랫폼 헤더 확인 | 확인 필요 | 중간 | 프론트/인프라 |
| CONF-04 | 서버 로그나 브라우저 로그에 토큰, 개인식별정보, 민감값이 남지 않는가 | 프록시 로깅, 콘솔 로깅, 에러 로깅 정책 확인 | 이슈 | 높음 | 프론트/인프라 |
| CONF-05 | 프로덕션 소스맵과 클라이언트 번들에서 내부 정보가 과다 노출되지 않는가 | 빌드 설정, 배포 산출물, 모니터링 연계 여부 확인 | 확인 필요 | 낮음 | 프론트/인프라 |

### 7. 의존성/운영 리스크

| ID | 점검 항목 | 확인 방법 | 상태 | 심각도 | 담당 영역 |
| --- | --- | --- | --- | --- | --- |
| OPS-01 | 사용 중인 주요 패키지에 알려진 취약점이 없는가 | `package.json`, lockfile 기준 취약점 점검 | 확인 필요 | 중간 | 프론트 |
| OPS-02 | 보안 이슈 대응 시 로그, 모니터링, 재현 경로를 확보할 수 있는가 | 에러 모니터링, 감사 로그, 장애 대응 체계 확인 | 확인 필요 | 중간 | 프론트/인프라 |
| OPS-03 | 프론트 정책과 백엔드 정책의 책임 경계가 문서화되어 있는가 | 권한, 파일 검증, 토큰 처리 책임 분리 확인 | 확인 필요 | 낮음 | 프론트/백엔드 |

## 프론트가 바로 점검할 수 있는 우선순위 투두리스트

### P0

- `AUTH-01`: 인증 쿠키를 JS에서 읽어야만 하는지 재검토하고, 가능하면 `HttpOnly` 기반 구조로 전환 검토
- `AUTH-02`: `/api/proxy`에서 refresh token preview, 요청 body preview, 토큰 값 로깅 제거
- `XSS-01`: `dangerouslySetInnerHTML` 사용 지점에 대해 입력 출처를 전수 조사하고 sanitization 또는 text 렌더링 전환 검토
- `EXT-01`: `postMessage` 수신 시 `origin`, `source`, nonce 검증 추가 여부 검토
- `CONF-01`: `NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY`를 서버 전용 환경변수로 변경해야 하는지 검토

### P1

- `REDIR-01`: 로그인 후 `redirectUrl`, `returnUrl` 허용 정책을 allowlist 기반으로 정리
- `CONF-02`: `/debug/env`의 프로덕션 차단 정책 확인
- `CONF-03`: CSP 추가 여부와 CORS 범위 축소 가능성 검토
- `FILE-02`: SVG, PDF, Office 파일의 업로드/다운로드/렌더링 정책 점검
- `AUTHZ-02`: 관리자 기능 API에 대해 서버 권한 검증 항목 목록화

### P2

- `OPS-01`: 의존성 취약점 정기 점검 절차 수립
- `OPS-02`: 에러 로깅과 보안 이벤트 모니터링 체계 확인
- `OPS-03`: 프론트와 백엔드의 보안 책임 분리를 문서화

## 백엔드 또는 인프라와 반드시 함께 확인할 항목

- `x-project-id`를 바꿔 보내도 서버가 프로젝트 소속 검증을 강제하는지
- 관리자 전용 기능이 API 레벨에서도 차단되는지
- 웹소켓 연결 시 토큰과 프로젝트 권한을 함께 검증하는지
- presigned URL 발급 시 MIME, 크기, 확장자, 저장 위치를 강제하는지
- S3/CDN가 SVG, PDF, Office 파일을 어떤 `Content-Type`과 `Content-Disposition`으로 서빙하는지
- CSRF 방어가 실제로 적용되어 있는지
- 로그 수집 플랫폼에 토큰, 전화번호, 이메일, 개인식별정보가 남는지

## 안전하다고 볼 수 있는 항목 후보

아래는 현재 코드 기준으로 상대적으로 긍정적인 신호입니다. 다만 최종 보고서에서는 실제 검증 결과와 함께 다시 판정해야 합니다.

- 공지/채팅 본문 렌더링은 전반적으로 직접 HTML 삽입보다 React text 렌더링에 가깝습니다.
- API 호출이 대체로 [`src/lib/apiClient.ts`](src/lib/apiClient.ts) 와 [`src/app/api/proxy/[...path]/route.ts`](src/app/api/proxy/[...path]/route.ts) 로 모여 있어 네트워크 정책을 중앙에서 점검하기 좋습니다.
- 일부 외부 링크는 이미 `noopener noreferrer`를 사용하고 있습니다.
- 인증 흐름에서 2FA 토큰을 평문 쿼리스트링으로 직접 노출하지 않으려는 의도는 보입니다.
- 업로드 기능 일부는 파일 타입과 크기 제한을 이미 구현하고 있습니다.

## 감사 보고서 템플릿

아래 템플릿을 그대로 복사해서 결과 보고서로 사용할 수 있습니다.

### 1. 개요

- 감사 목적:
- 감사 기간:
- 대상 서비스:
- 범위:
- 제외 범위:

### 2. 아키텍처 요약

- 인증 방식:
- 세션 저장 위치:
- API 통신 경로:
- 외부 연동:
- 파일 업로드 경로:

### 3. 전체 결과 요약

| 구분 | 개수 | 비고 |
| --- | --- | --- |
| 이슈 |  |  |
| 확인 필요 |  |  |
| 안전함 |  |  |

### 4. 상세 결과

| ID | 항목명 | 분류 | 상태 | 심각도 | 근거 코드 | 확인 결과 | 권고사항 | 담당 영역 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-01 | 인증 토큰 저장 방식 | 인증/세션 |  |  |  |  |  |  |

### 5. 안전하다고 판단한 항목

- 항목:
- 근거:
- 잔여 위험:

### 6. 백엔드/인프라 확인 필요 항목

- 항목:
- 왜 프론트만으로 판단 불가한지:
- 확인 요청 대상:

### 7. 우선순위별 개선 과제

#### P0

- 과제:
- 기대 효과:
- 담당:

#### P1

- 과제:
- 기대 효과:
- 담당:

#### P2

- 과제:
- 기대 효과:
- 담당:

## 감사 기록 예시

| ID | 항목명 | 분류 | 상태 | 심각도 | 근거 코드 | 확인 결과 | 권고사항 | 담당 영역 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-01 | 인증 쿠키 JS 접근 가능 여부 | 인증/세션 | 이슈 | 높음 | [`src/lib/cookies.ts`](src/lib/cookies.ts) | `httpOnly: false`로 설정되어 있어 브라우저 JS가 인증 쿠키를 읽을 수 있음 | 가능하면 `HttpOnly` 전환, 소켓 인증 구조 재설계 검토 | 프론트/백엔드 |
| XSS-01 | HTML 직접 삽입 사용 여부 | 입력/XSS | 이슈 | 높음 | [`src/providers/PersistentModalProvider.tsx`](src/providers/PersistentModalProvider.tsx) | `dangerouslySetInnerHTML`가 사용되며 별도 sanitization 확인이 어려움 | 입력 출처 전수조사, text 렌더링 또는 sanitization 적용 | 프론트 |
| CONF-02 | 디버그 페이지 노출 | 확인 필요 | 중간 | [`src/app/debug/env/page.tsx`](src/app/debug/env/page.tsx) | 코드상 페이지는 존재하나 배포 차단 여부는 프론트만으로 확정 불가 | 운영 환경 노출 여부 점검 및 필요 시 차단 | 프론트/인프라 |
