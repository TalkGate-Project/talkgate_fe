# 프론트 보안감사 보고서

## 1. 개요

- 감사 목적: `talkgate_fe` 프론트엔드 코드 기준으로 보안 위험 요소를 식별하고, 프론트 단독 조치 항목과 백엔드/인프라 협업 항목을 구분합니다.
- 감사 기준일: 2026-03-18
- 감사 방식: 정적 코드 리뷰 기반 1차 감사
- 대상 범위: 인증, 세션, 권한, 입력값 렌더링, 파일 업로드, 외부 인증/팝업, 환경변수, 보안 헤더, 로깅, 운영 리스크
- 제외 범위: 실제 백엔드 권한 강제 동작, CDN 응답 헤더, WAF, IAM, DB 보안, 인프라 네트워크 정책, 운영 로그 플랫폼 설정

## 2. 감사 범위와 방법

이번 감사는 런타임 침투 테스트가 아니라 프론트엔드 저장소 코드 리뷰를 중심으로 수행했습니다.
따라서 이 보고서의 판정은 다음 세 가지로 구분했습니다.

- `이슈`: 코드상 위험 패턴이 직접 확인된 항목
- `확인 필요`: 프론트만으로 확정할 수 없고 백엔드 또는 인프라 확인이 필요한 항목
- `안전함`: 현재 코드 범위에서는 방어 로직 또는 비교적 안전한 패턴이 확인된 항목

주요 검토 파일:

- 인증/세션: [`src/lib/cookies.ts`](src/lib/cookies.ts), [`src/lib/token.ts`](src/lib/token.ts), [`src/app/api/proxy/[...path]/route.ts`](src/app/api/proxy/[...path]/route.ts), [`src/middleware.ts`](src/middleware.ts)
- 권한/관리자 기능: [`src/utils/permissions.ts`](src/utils/permissions.ts), [`src/components/settings/MemberSettings.tsx`](src/components/settings/MemberSettings.tsx)
- 렌더링/XSS: [`src/providers/PersistentModalProvider.tsx`](src/providers/PersistentModalProvider.tsx), [`src/components/notice/NoticeDetailPageContent.tsx`](src/components/notice/NoticeDetailPageContent.tsx), [`src/components/chat/ChatMainView.tsx`](src/components/chat/ChatMainView.tsx)
- 외부 인증/메시지 전달: [`src/components/login/LoginForm.tsx`](src/components/login/LoginForm.tsx), [`src/hooks/usePhoneVerification.ts`](src/hooks/usePhoneVerification.ts)
- 설정/배포: [`next.config.ts`](next.config.ts), [`.env.example`](.env.example), [`src/lib/crypto.ts`](src/lib/crypto.ts), [`src/app/debug/env/page.tsx`](src/app/debug/env/page.tsx)

## 3. 아키텍처 요약

### 인증/세션

- 인증은 쿠키 기반으로 동작하며, 앱 API 호출은 대체로 [`src/app/api/proxy/[...path]/route.ts`](src/app/api/proxy/[...path]/route.ts) 를 통해 백엔드로 전달됩니다.
- 미들웨어인 [`src/middleware.ts`](src/middleware.ts) 에서 로그인 여부, 프로젝트 선택, 서브도메인 컨텍스트를 기준으로 페이지 접근을 제어합니다.
- 클라이언트에서도 [`src/lib/token.ts`](src/lib/token.ts) 를 통해 인증 토큰 쿠키를 직접 읽고 씁니다.

### 권한

- 프론트 권한 체크는 [`src/utils/permissions.ts`](src/utils/permissions.ts) 와 각 화면 컴포넌트에서 수행됩니다.
- 예를 들어 [`src/components/settings/MemberSettings.tsx`](src/components/settings/MemberSettings.tsx) 는 역할 변경 버튼, 삭제 버튼, 자기 자신 또는 관리자 삭제 제한 등을 UI에서 제어합니다.

### 입력값/렌더링

- 전반적으로 공지/채팅 데이터는 React text 렌더링 방식이 많습니다.
- 다만 [`src/providers/PersistentModalProvider.tsx`](src/providers/PersistentModalProvider.tsx) 에는 `dangerouslySetInnerHTML` 사용 지점이 존재합니다.

### 외부 연동

- 로그인 이후 이동 경로는 [`src/components/login/LoginForm.tsx`](src/components/login/LoginForm.tsx) 에서 처리됩니다.
- 본인인증 결과는 [`src/hooks/usePhoneVerification.ts`](src/hooks/usePhoneVerification.ts) 에서 `postMessage` 로 수신합니다.

## 4. 전체 결과 요약

| 구분 | 개수 | 비고 |
| --- | --- | --- |
| 이슈 | 8 | 코드상 위험 패턴이 직접 확인됨 |
| 확인 필요 | 21 | 백엔드/인프라 또는 추가 런타임 검증 필요 |
| 안전함 | 1 | 현재 코드 기준 비교적 안전한 패턴 확인 |

### 핵심 요약

- 가장 큰 위험은 `JS에서 읽을 수 있는 인증 쿠키`, `토큰 관련 로그`, `HTML 직접 삽입`, `약한 postMessage 검증`입니다.
- 프론트 차원의 권한 UI 제어는 존재하지만, 실제 권한 강제는 반드시 백엔드 재검증이 필요합니다.
- 업로드, 외부 팝업, 디버그 페이지, 보안 헤더, 운영 로그는 프론트만으로 완결 판단이 어려워 협업 점검이 필요합니다.

## 5. 상세 이슈 목록

### F-01. 인증 토큰이 JS에서 직접 읽히는 구조

- 분류: 인증/세션
- 상태: 이슈
- 심각도: 높음
- 근거 코드: [`src/lib/cookies.ts`](src/lib/cookies.ts), [`src/lib/token.ts`](src/lib/token.ts)
- 확인 결과:
  - [`src/lib/cookies.ts`](src/lib/cookies.ts) 에서 인증 쿠키 옵션이 `httpOnly: false` 로 설정되어 있습니다.
  - [`src/lib/token.ts`](src/lib/token.ts) 에서 `document.cookie` 로 액세스 토큰과 리프레시 토큰을 직접 읽고 씁니다.
  - 이 구조는 XSS가 발생할 경우 세션 탈취 영향도를 크게 높입니다.
- 권고사항:
  - 가능하면 인증 쿠키를 `HttpOnly` 로 전환합니다.
  - 웹소켓이나 특수 인증 흐름 때문에 JS 접근이 필요하다면, 토큰 자체가 아닌 별도 세션 티켓 또는 단기 토큰 구조를 검토합니다.

### F-02. 프록시에서 토큰 관련 민감 로그가 남음

- 분류: 인증/세션, 운영
- 상태: 이슈
- 심각도: 높음
- 근거 코드: [`src/app/api/proxy/[...path]/route.ts`](src/app/api/proxy/[...path]/route.ts)
- 확인 결과:
  - refresh token preview, refresh 요청 body preview, refresh token 길이 및 일부 값이 로그에 남도록 작성되어 있습니다.
  - 로그 수집 시스템이 외부 플랫폼과 연동되어 있을 경우 민감정보 확산 위험이 있습니다.
- 권고사항:
  - 토큰 값, token preview, request body preview, 민감 응답 payload 로깅을 제거합니다.
  - 보안 로그에는 요청 ID, 상태 코드, 재시도 여부 같은 비민감 메타데이터만 남기도록 조정합니다.

### F-03. 로그인 후 절대 URL 리다이렉트 허용

- 분류: 외부 연동/리다이렉트
- 상태: 이슈
- 심각도: 중간
- 근거 코드: [`src/components/login/LoginForm.tsx`](src/components/login/LoginForm.tsx)
- 확인 결과:
  - 로그인 후 `redirectUrl` 이 `http://` 또는 `https://` 로 시작하면 그대로 `window.location.replace()` 로 이동합니다.
  - 허용 도메인 검증이 없으면 오픈 리다이렉트 또는 피싱 보조 경로로 악용될 수 있습니다.
- 권고사항:
  - 허용 origin allowlist 기반으로 제한합니다.
  - 가능하면 서버 서명 기반 redirect 파라미터 또는 내부 경로만 허용하는 방식으로 단순화합니다.

### F-04. HTML 직접 삽입 사용 지점 존재

- 분류: 입력/XSS
- 상태: 이슈
- 심각도: 높음
- 근거 코드: [`src/providers/PersistentModalProvider.tsx`](src/providers/PersistentModalProvider.tsx)
- 확인 결과:
  - `headline`, `description` 이 `dangerouslySetInnerHTML` 로 렌더링됩니다.
  - 현재 확인된 로직은 이메일 주소 하이라이트용 문자열 치환이며, 별도 sanitization 보장이 없습니다.
  - 서버 또는 사용자 입력이 이 경로로 들어올 수 있다면 XSS 취약점이 될 수 있습니다.
- 권고사항:
  - 가능하면 일반 text 렌더링으로 바꿉니다.
  - HTML 허용이 꼭 필요하면 sanitization 라이브러리와 허용 태그 정책을 명시합니다.
  - 어떤 호출부가 이 모달에 값을 넣는지 전수 조사합니다.

### F-05. `postMessage` 수신 검증이 약함

- 분류: 외부 연동/메시지 전달
- 상태: 이슈
- 심각도: 높음
- 근거 코드: [`src/hooks/usePhoneVerification.ts`](src/hooks/usePhoneVerification.ts)
- 확인 결과:
  - `PHONE_VERIFICATION_RESULT` 타입만 검사하고 `event.origin`, `event.source`, nonce 상관관계를 검증하지 않습니다.
  - 악성 또는 예기치 않은 창이 동일 메시지 구조를 보내면 인증 흐름을 혼동시킬 수 있습니다.
- 권고사항:
  - 허용 origin 검증을 추가합니다.
  - 팝업 핸들 참조와 `event.source` 비교를 추가합니다.
  - 서버에서 발급한 nonce 또는 state 값을 함께 검증합니다.

### F-06. 암호화 키가 공개 환경변수 네이밍을 사용함

- 분류: 설정/환경변수
- 상태: 이슈
- 심각도: 높음
- 근거 코드: [`.env.example`](.env.example), [`src/lib/crypto.ts`](src/lib/crypto.ts)
- 확인 결과:
  - 암호화 키가 `NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY` 라는 이름으로 선언되어 있습니다.
  - 이 저장소의 규칙상 `NEXT_PUBLIC_*` 값은 클라이언트 노출 가능 값이라는 의미를 갖기 때문에 키 네이밍과 보안 의도가 충돌합니다.
- 권고사항:
  - 서버 전용 환경변수 이름으로 변경합니다.
  - 만약 실제 운영에서 공개 범위로 사용된 적이 있다면 키 교체도 검토합니다.

### F-07. 민감정보 로그 정책이 문서화된 원칙과 충돌 가능성

- 분류: 운영/로깅
- 상태: 이슈
- 심각도: 중간
- 근거 코드: [`src/app/api/proxy/[...path]/route.ts`](src/app/api/proxy/[...path]/route.ts), [`.cursorrules`](.cursorrules)
- 확인 결과:
  - 프로젝트 규칙에는 서버 메시지와 개발 정보를 사용자에게 노출하지 않고, 민감한 내용을 안전하게 로깅해야 한다는 원칙이 있습니다.
  - 현재 프록시 구현 일부는 실제 토큰/요청 body 관련 데이터를 남기므로 운영 보안 원칙과 충돌할 소지가 있습니다.
- 권고사항:
  - 보안/개인정보 로깅 금지 기준을 코드 레벨로 통일합니다.
  - 민감 필드 마스킹 유틸 또는 공통 로거 정책을 도입합니다.

### F-08. 권한 제어가 UI 위주로 보이며 서버 강제 여부가 핵심 리스크

- 분류: 권한/접근제어
- 상태: 이슈
- 심각도: 높음
- 근거 코드: [`src/utils/permissions.ts`](src/utils/permissions.ts), [`src/components/settings/MemberSettings.tsx`](src/components/settings/MemberSettings.tsx)
- 확인 결과:
  - 현재 확인 가능한 범위에서는 역할 기반 버튼 노출, 삭제 제한, 역할 변경 제한이 주로 프론트 UI 로직에 있습니다.
  - 이 자체가 곧 취약점이라는 뜻은 아니지만, 백엔드가 같은 정책을 강제하지 않으면 권한 우회 가능성이 큽니다.
- 권고사항:
  - 관리자 기능 API 목록을 뽑아 서버 강제 검증 여부를 확인합니다.
  - 보고서상 이 항목은 프론트 이슈이면서 동시에 백엔드 협업 최우선 항목으로 관리해야 합니다.

## 6. 안전하다고 판단한 항목

### S-01. 공지/채팅 본문은 전반적으로 text 렌더링 성향이 강함

- 상태: 안전함
- 근거 코드: [`src/components/notice/NoticeDetailPageContent.tsx`](src/components/notice/NoticeDetailPageContent.tsx), [`src/components/chat/ChatMainView.tsx`](src/components/chat/ChatMainView.tsx)
- 판단 근거:
  - 현재 확인된 범위에서는 공지/채팅 본문에 대해 광범위한 HTML 렌더러 사용이 보이지 않았습니다.
  - 직접 HTML 삽입보다 React text 기반 표시가 중심이라, 기본적인 XSS 면에서는 비교적 안전한 방향입니다.
- 잔여 위험:
  - 일부 별도 컴포넌트나 파일 미리보기 경로가 남아 있을 수 있으므로 전체 확정 전에는 지속 확인이 필요합니다.

## 7. 확인 필요 항목

다음 항목은 프론트만 보고 확정할 수 없으므로 백엔드/인프라와 함께 확인해야 합니다.

### 권한/접근제어

- `x-project-id` 를 바꿔 보내도 서버가 프로젝트 소속 검증을 강제하는지
- 멤버 삭제, 역할 변경, 팀 이동, 공지 작성, 설정 수정 API에 서버 권한 검증이 있는지
- 웹소켓 연결 시 토큰뿐 아니라 프로젝트 멤버십과 역할도 검증하는지

### 파일 업로드/다운로드

- presigned URL 발급 시 MIME, 용량, 확장자, 저장 경로를 서버가 강제하는지
- SVG, PDF, Office 파일을 CDN/S3 가 어떤 `Content-Type`, `Content-Disposition` 으로 응답하는지
- 브라우저에서 바로 렌더링되는 파일이 스크립트 실행이나 opener 악용 경로가 없는지

### 세션/보안 정책

- CSRF 방어가 실제로 적용되어 있는지
- refresh token 회전, 로그아웃 무효화, 기기 단위 세션 정책이 있는지
- 디버그 페이지 `/debug/env` 가 운영 환경에서 차단되는지
- CSP, 추가 보안 헤더, 운영 로그 접근 통제가 배포 레벨에서 적용되는지

### 운영/의존성

- 실제 배포 환경에서 source map 이 외부에 노출되는지
- 의존성 취약점 점검이 정기적으로 수행되는지
- 로그 수집 플랫폼에 토큰, 전화번호, 이메일 등이 남는지

## 8. 우선순위별 개선 과제

### P0

- 인증 쿠키의 `HttpOnly` 전환 가능성 검토
- 프록시 토큰/요청 body 로그 제거
- `dangerouslySetInnerHTML` 입력 출처 전수조사 및 렌더링 방식 재검토
- `postMessage` 검증에 `origin`, `source`, nonce 추가
- `NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY` 를 서버 전용 환경변수로 전환

### P1

- 로그인 후 `redirectUrl`, `returnUrl` 허용 정책을 allowlist 기반으로 변경
- `/debug/env` 운영 차단 정책 확정
- CSP 도입 여부 검토 및 CORS 범위 재검토
- SVG, PDF, Office 파일 처리 정책 문서화
- 관리자 기능 API의 서버 권한 검증 여부 점검

### P2

- 의존성 취약점 정기 점검 절차 수립
- 보안 이벤트/에러 로깅 기준 정리
- 프론트/백엔드/인프라 간 보안 책임 경계 문서화

## 9. 결론

이 프로젝트 프론트엔드는 인증 흐름, 프로젝트 컨텍스트, 관리자 UI 제어 등 구조화된 부분이 존재하지만, 현재 코드 기준으로는 다음 네 가지가 가장 우선적인 보안 리스크입니다.

1. 인증 토큰의 JS 접근 가능 구조
2. 토큰 관련 민감 로그
3. `dangerouslySetInnerHTML` 사용
4. 약한 `postMessage` 검증

추가로 권한 강제, 파일 보안, 디버그 노출, 배포 헤더 정책은 프론트만으로 결론 낼 수 없으므로 백엔드와 인프라를 포함한 2차 감사가 필요합니다.

현재 단계의 결론은 다음과 같습니다.

- 프론트 단독으로 바로 수정 가능한 위험은 이미 존재합니다.
- 서버와 함께 검증해야 최종 판정 가능한 항목도 많습니다.
- 따라서 이 보고서는 `1차 프론트 코드 리뷰 결과`로 사용하고, 다음 단계로는 `실제 개선 작업` 또는 `백엔드 합동 보안 점검` 으로 이어지는 것이 적절합니다.
