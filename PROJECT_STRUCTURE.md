# Talkgate Frontend 프로젝트 구조

> Next.js 기반 React 프로젝트의 디렉터리 구조를 트리로 표현한 문서입니다.

```
talkgate_fe/
│
├── public/                          # 정적 자산 (이미지, 아이콘, SVG 등)
│   ├── icons/platform/              # 소셜/메신저 플랫폼 아이콘 (카카오, 라인, 텔레그램 등)
│   └── *.png, *.svg                 # 로고, 뱃지, UI 아이콘, robots.txt
│
├── src/
│   │
│   ├── app/                         # Next.js App Router - 페이지 및 라우팅
│   │   ├── (auth)/                  # 인증 관련 레이아웃
│   │   │   └── layout.tsx
│   │   ├── api/                     # API Routes
│   │   │   ├── auth/                # 로그인, 로그아웃, 소셜 로그인, 2FA
│   │   │   └── proxy/               # 백엔드 프록시
│   │   ├── auth/callback/[provider]/# OAuth 콜백 페이지
│   │   ├── logout/                  # 로그아웃 라우트
│   │   ├── attendance/              # 출퇴근 페이지
│   │   ├── consult/                 # 상담 페이지
│   │   ├── customers/               # 고객 관리 페이지
│   │   ├── dashboard/               # 대시보드
│   │   ├── debug/                   # 환경변수 디버깅
│   │   ├── forgot-password/         # 비밀번호 찾기
│   │   ├── instagram/callback/      # 인스타그램 연동 콜백
│   │   ├── invite/                  # 초대 수락/초대 랜딩
│   │   ├── login/                   # 로그인, 2FA 로그인
│   │   ├── my-settings/             # 내 설정
│   │   ├── notice/, notices/        # 공지사항 목록/상세/작성
│   │   ├── notifications/           # 알림 페이지
│   │   ├── project-signup/          # 프로젝트 가입
│   │   ├── projects/                # 프로젝트 목록
│   │   ├── settings/                # 프로젝트 설정
│   │   ├── signup/                  # 회원가입
│   │   ├── social-signup/           # 소셜 회원가입
│   │   ├── stats/                   # 통계 페이지
│   │   ├── test/                    # 테스트 페이지
│   │   ├── layout.tsx               # 루트 레이아웃
│   │   ├── page.tsx                 # 홈 페이지
│   │   ├── globals.css              # 전역 스타일
│   │   └── not-found.tsx            # 404 페이지
│   │
│   ├── assets/                      # 앱 내부 사용 이미지 (PNG 등)
│   │
│   ├── components/                  # UI 컴포넌트
│   │   ├── attendance/              # 출퇴근 관련 컴포넌트
│   │   ├── auth/                    # 인증 폼, OAuth 버튼 등
│   │   ├── chat/                    # 채팅 UI (채널, 메시지, 입력창, 필터 등)
│   │   ├── common/                  # 공통 UI (모달, 버튼, 테이블, 아이콘, 스켈레톤 등)
│   │   │   └── icons/               # 공통 아이콘 컴포넌트
│   │   ├── customers/               # 고객 관리 컴포넌트
│   │   │   ├── detail/              # 고객 상세 탭, 상담 패널, 폼 훅
│   │   │   └── sms/                 # SMS 발송 모달, 폼, 미리보기
│   │   ├── dashboard/               # 대시보드 (캘린더, KPI, 랭킹, 일정 모달)
│   │   ├── icons/                   # 메뉴/기능별 아이콘 (출근, 상담, 고객, 설정 등)
│   │   ├── instagram/               # 인스타그램 연동 콜백 UI
│   │   ├── invite/                  # 초대 랜딩, 봉투 애니메이션, 초대 수락 폼
│   │   ├── layout/                  # 헤더, 네비게이션, 알림벨, 사용자 메뉴 등
│   │   ├── login/                   # 로그인 폼
│   │   ├── my-settings/             # 내 설정 페이지 컴포넌트
│   │   ├── notice/                  # 공지사항 테이블, 검색, 작성/상세 UI
│   │   ├── notifications/           # 알림 UI
│   │   ├── projects/                # 프로젝트 선택/생성 관련
│   │   ├── settings/                # 프로젝트 설정 페이지 컴포넌트
│   │   │   ├── customer-api/        # 고객 API 키 관리
│   │   │   ├── sms-history/         # SMS 발송 내역
│   │   │   ├── teamManagement/      # 팀/조직/부서 관리
│   │   │   └── icons/               # 설정 메뉴 아이콘
│   │   ├── signup/                  # 회원가입 단계별 폼 (약관, 프로필, 인증 등)
│   │   └── stats/                   # 통계 차트, 랭킹, 할당/결제 테이블
│   │
│   ├── contexts/                    # React Context (데모 모드 등)
│   │
│   ├── hooks/                       # 커스텀 훅
│   │   └── *.ts                    # 출근, 채팅, 고객, 공지, 팀, 인증, 결제 등 도메인별 훅
│   │
│   ├── lib/                         # 핵심 라이브러리 및 설정
│   │   ├── utils/                   # 유틸 함수 (billingUtils 등)
│   │   ├── apiClient.ts             # API 클라이언트
│   │   ├── auth-utils.ts, authSession.ts
│   │   ├── token.ts, cookies.ts
│   │   ├── env.ts, constants.ts
│   │   ├── oauth.ts, invite.ts, signup.ts, logout.ts
│   │   ├── realtime.ts, notificationSocket.ts
│   │   └── subdomain.ts 등
│   │
│   ├── mocks/                       # 목 데이터 (결제 mock 등)
│   │
│   ├── providers/                   # React Context Provider
│   │   └── ChatProvider, ConfirmModal, Notification 등
│   │
│   ├── services/                    # API 호출 서비스
│   │   └── *.ts                    # auth, customers, billing, notices, teams 등 도메인별 API
│   │
│   ├── types/                       # TypeScript 타입 정의
│   │   └── *.ts                    # API 응답/요청, 도메인 모델 타입
│   │
│   ├── utils/                       # 비즈니스/UI 유틸 함수
│   │   └── attendance, calendar, format, error, permissions 등
│   │
│   └── middleware.ts                # Next.js 미들웨어 (인증, 리다이렉트 등)
│
├── .cursorrules                     # Cursor AI 규칙
├── .env.example                     # 환경변수 예시
├── .gitignore, .onedriveignore
├── eslint.config.mjs                # ESLint 설정
├── next.config.ts                   # Next.js 설정
├── package.json, package-lock.json
├── postcss.config.mjs
├── tsconfig.json                    # TypeScript 설정
├── README.md
├── AUTH_FLOW.md, CODE_REVIEW_AUTH.md
├── CONVENTION.md
├── GITHUB_AUTH_SETUP.md
├── IMAGE_UPLOAD_FLOW.md
├── LOCALSTORAGE_EXPLANATION.md
├── LOGOUT_REFACTORING.md
├── Process.md
├── SUBDOMAIN_REDIRECT_REPORT.md
└── TESTING_GUIDE.md                 # 테스트 가이드
```

---

## 디렉터리 요약

| 경로 | 설명 |
|------|------|
| `public/` | 정적 자산 (이미지, 아이콘, 로고, robots.txt) |
| `src/app/` | Next.js App Router - 페이지, API 라우트, 레이아웃 |
| `src/components/` | 페이지/기능별 UI 컴포넌트 |
| `src/hooks/` | 비즈니스 로직·상태 관리용 커스텀 훅 |
| `src/lib/` | API 클라이언트, 인증, 환경변수 등 코어 유틸 |
| `src/services/` | 백엔드 API 호출 함수 |
| `src/types/` | TypeScript 타입 정의 |
| `src/utils/` | 포맷팅, 에러 처리, 권한 등 유틸 함수 |
| `src/providers/` | 전역 Context Provider |
| `src/contexts/` | Context 정의 |
| `src/mocks/` | 개발/테스트용 목 데이터 |
