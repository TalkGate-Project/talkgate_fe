# 본인인증 기능 백로그

## 현재 상태

### ✅ 완료된 작업 (프론트엔드)

#### 1. 회원가입 시 본인인증 (`ProfileStep.tsx`)
- **API**: `POST /v1/verification/phone/account-verification`
- **상태**: 구현 완료, 테스트 필요 (PG사 심사 완료 후)
- **플로우**:
  1. 사용자가 "휴대폰 본인인증" 버튼 클릭
  2. 팝업 창 오픈 (팝업 차단 우회를 위해 클릭 직후 바로 오픈)
  3. API 호출하여 `certViewUrl`, `formData` 수신
  4. 팝업에 form HTML 작성 후 자동 submit
  5. 인증 완료 후 `postMessage`로 결과 수신
  6. 성공 시 토큰 저장 및 회원가입 완료 처리

#### 2. 공통 훅 생성 (`usePhoneVerification.ts`)
- 재사용 가능한 본인인증 훅
- `type: "account" | "sms-sender"` 지원
- `postMessage` 결과 수신 및 콜백 처리

#### 3. 서비스 레이어 (`verification.ts`)
- `getIdentity()`: 본인인증 정보 조회
- `startPhoneVerificationForAccount()`: 계정 인증용
- `startPhoneVerificationForSmsSenderNumber()`: 발신번호 등록용

---

### ⏳ 백엔드 확인 필요 (마이페이지 본인인증)

#### API 엔드포인트 확인 필요
```
POST /v1/verification/phone/sms-sender-number-registration
```

#### 현재 이슈
- 404 에러 발생
- `x-project-id` 헤더는 정상 전송 확인됨

#### 확인 사항
1. 해당 엔드포인트가 백엔드에 구현되어 있는지?
2. 정확한 API 경로가 맞는지?
3. PG사 심사 완료 전에도 엔드포인트가 존재해야 하는지?

#### 프론트엔드 대응 현황
- `ProfileTab.tsx`에 본인인증 버튼 UI 구현 완료 (주석 처리됨)
- 백엔드 API 준비 완료 시 주석 해제하면 바로 동작

---

## API 정리

| 용도 | 엔드포인트 | 헤더 | 상태 |
|------|-----------|------|------|
| 회원가입 본인인증 | `POST /v1/verification/phone/account-verification` | Authorization | ✅ 테스트 대기 |
| 발신번호 등록 인증 | `POST /v1/verification/phone/sms-sender-number-registration` | Authorization, x-project-id | ❌ 404 에러 |
| 인증 상태 조회 | `GET /v1/verification/identity` | Authorization | ✅ 구현 완료 |

---

## 에러 코드 처리 (프론트엔드 대응 완료)

| 코드 | 설명 | 처리 |
|------|------|------|
| `IDENTITY_VERIFICATION_ALREADY_EXISTS` | 이미 본인인증 완료 | 안내 모달 |
| `AlreadyExists` | 이미 발신번호 등록됨 | 안내 모달 |
| `IDENTITY_VERIFICATION_CI_MISMATCH` | CI 불일치 | 에러 모달 |
| `BAD_REQUEST` | param_opt 누락 | 에러 모달 |
| `POPUP_BLOCKED` | 팝업 차단됨 | 팝업 차단 해제 안내 |

---

## 관련 파일

- `src/hooks/usePhoneVerification.ts` - 본인인증 공통 훅
- `src/services/verification.ts` - API 서비스
- `src/types/verification.ts` - 타입 정의
- `src/components/signup/ProfileStep.tsx` - 회원가입 본인인증
- `src/components/my-settings/ProfileTab.tsx` - 마이페이지 본인인증 (비활성화)
- `verification-test.html` - 테스트용 HTML

---

## 다음 단계

1. **백엔드**: `sms-sender-number-registration` API 확인 및 수정
2. **PG사 심사 완료 후**: 회원가입 본인인증 테스트
3. **백엔드 API 준비 후**: 마이페이지 본인인증 활성화 (주석 해제)

