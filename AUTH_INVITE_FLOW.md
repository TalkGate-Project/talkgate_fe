# 인증 및 초대 플로우 케이스별 요약

## 핵심 원칙 (QA 요구사항)

1. **초대 플로우에서는 소셜 로그인 불가** - 이메일이 고정되어야 함
2. **초대 플로우에서는 이메일 인증 스킵** - invitationToken이 있으면 이메일 인증 불필요
3. **모든 신규 가입은 프로젝트 가입 페이지를 거침** - 이름/연락처 입력
4. **이메일 불일치 시 모달 표시** - 다른 계정으로 로그인된 경우 처리

---

## 케이스 A: 로그인 안 된 상태 + 초대장 접근

### A-1. 로그인 선택

```
1. /invite?token=xxx 접속 → 초대장 페이지
2. "가입하기" 클릭 → localStorage에 초대 정보 저장 → /login
3. 로그인 페이지:
   - ⚠️ 소셜 로그인 버튼 숨김 (초대 플로우)
   - 초대 안내 배너 표시
   - 초대 이메일로 입력 필드 초기화
4. 로그인 성공:
   - email 비교 (로그인 이메일 vs 초대 이메일)
   - ✅ 일치 → /project-signup (이름/연락처 입력) → 초대수락 API → /projects
   - ❌ 불일치 → 에러 모달 "초대받은 이메일과 다른 계정입니다" → 초대 정보 삭제 → /projects
```

### A-2. 회원가입 선택

```
1. /invite?token=xxx 접속 → 초대장 페이지
2. "가입하기" 클릭 → localStorage에 초대 정보 저장 → /login → "회원가입" 클릭
3. /signup?invite=토큰 페이지:
   - 이메일은 초대 이메일로 고정 (읽기전용)
   - "초대받은 이메일로 가입됩니다" 안내 표시
   - 중복확인 버튼 숨김
4. 회원가입 완료:
   - ⚠️ 이메일 인증 스킵 (invitationToken 있음)
   - 토큰 저장 → /project-signup (이름/연락처 입력) → 초대수락 API → /projects
```

---

## 케이스 B: 로그인된 상태 + 초대장 접근 (동일 이메일)

```
1. /invite?token=xxx 접속
2. AuthService.me()로 로그인 상태 확인
3. 로그인된 email === 초대 email ✅
4. 초대장 페이지 표시 → "수락" 클릭
5. /project-signup (이름/연락처 입력)
   - "나중에 하기" → 이름/연락처 비워도 됨
6. 초대수락 API 호출 → /projects
```

---

## 케이스 C: 로그인된 상태 + 초대장 접근 (다른 이메일)

```
1. /invite?token=xxx 접속
2. AuthService.me()로 로그인 상태 확인
3. 로그인된 email !== 초대 email ⚠️
4. 빈 페이지 + WrongAccountModal 표시:
   - "현재 다른 계정으로 로그인되어 있어 진행할 수 없어요."
   - [취소] → 초대 정보 삭제 → /projects
   - [로그아웃] → 초대 정보 저장 유지 → /logout → /login
5. 이후 케이스 A 플로우로 진행
```

---

## 케이스 D: 일반 회원가입 (초대 없음)

### D-1. 이메일 회원가입

```
1. /signup 접속
2. 이메일/비밀번호 입력 → 이메일 중복확인 필수
3. 회원가입 완료 → 이메일 인증 단계
4. 이메일 인증 완료 → 본인인증 단계 (스킵 가능)
5. /project-signup → /projects
```

### D-2. 소셜 회원가입

```
1. /login 접속 → 소셜 로그인 버튼 클릭 (Google/Kakao/Naver)
2. OAuth 인증 → 콜백 → 토큰 발급
3. isNewUser === true → /social-signup
4. 약관 동의 → 본인인증 (스킵 가능) → /project-signup → /projects
```

---

## 케이스 E: 기존 회원 로그인 (초대 없음)

```
1. /login 접속
2. 이메일/비밀번호 또는 소셜 로그인
3. 로그인 성공 → /projects
```

---

## 주요 파일

| 파일 | 역할 |
|------|------|
| `src/components/invite/InviteLanding.tsx` | 초대장 페이지, 이메일 비교, 모달 표시 |
| `src/components/invite/WrongAccountModal.tsx` | 다른 계정 로그인 시 모달 |
| `src/components/login/LoginForm.tsx` | 로그인, 초대 플로우 시 소셜 버튼 숨김 |
| `src/components/signup/AccountStep.tsx` | 회원가입, 초대 시 이메일 고정 |
| `src/components/signup/SignupForm.tsx` | 회원가입 플로우 관리 |
| `src/components/signup/ProjectSignupForm.tsx` | 프로젝트 가입 (이름/연락처), 초대 수락 |
| `src/components/auth/OAuthCallbackContent.tsx` | OAuth 콜백, isNewUser 체크 |
| `src/components/signup/SocialSignupForm.tsx` | 소셜 회원가입 (약관동의/본인인증) |

---

## localStorage/sessionStorage 키

| 키 | 용도 |
|-----|------|
| `tg_invite_info` | 초대 정보 (localStorage) |
| `tg_redirect_url` | OAuth 리다이렉트 후 복귀 URL (sessionStorage) |

---

## 플로우 다이어그램

### 초대 플로우 (비로그인)

```
/invite?token=xxx
    ↓
[초대장 페이지]
    ↓ "가입하기" 클릭
[초대 정보 localStorage 저장]
    ↓
/login
    ↓
┌─────────────────┬─────────────────┐
│  기존 계정      │  신규 가입       │
│  (로그인)       │  (회원가입)      │
└────────┬────────┴────────┬────────┘
         ↓                  ↓
   [이메일 비교]      [이메일 고정]
         ↓            [이메일 인증 스킵]
         ↓                  ↓
┌────────┴────────┐        ↓
│일치    │불일치  │        ↓
└───┬────┴───┬────┘        ↓
    ↓        ↓              ↓
/project-signup  ← ─ ─ ─ ─ ┘
[에러 모달]      ↓
    ↓       [이름/연락처 입력]
/projects        ↓
            [초대수락 API]
                 ↓
            /projects
```

### 초대 플로우 (로그인된 상태)

```
/invite?token=xxx
    ↓
[로그인 상태 확인]
    ↓
┌─────────────────┬─────────────────┐
│  이메일 일치    │  이메일 불일치   │
└────────┬────────┴────────┬────────┘
         ↓                  ↓
[초대장 페이지]      [WrongAccountModal]
    ↓ "수락"              ↓
/project-signup   ┌───────┴───────┐
    ↓             │취소   │로그아웃│
[이름/연락처]     └───┬───┴───┬───┘
    ↓                 ↓       ↓
[초대수락 API]   /projects  /logout
    ↓                         ↓
/projects                   /login
                              ↓
                        (케이스 A로)
```

