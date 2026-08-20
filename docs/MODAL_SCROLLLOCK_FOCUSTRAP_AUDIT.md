# 모달 스크롤락/포커스트랩 전수조사 (2026-08-20)

## 0. 배경

`DiagnosisCustomerInfoModal.tsx`(회생파산 진단 상세의 "필수정보 안내" 모달)가 공용
`BaseModal`(`src/components/common/BaseModal.tsx`)을 쓰지 않고 자체적으로 `fixed inset-0`
오버레이를 그리고 있어서, 모달이 열린 채로 오버레이 빈 공간을 휠스크롤하면 배경 페이지가
그대로 스크롤되는 버그를 재현했다. `BaseModal`은 아래 3가지를 한 번에 보장하는 공용 컴포넌트다.

- **스크롤락**: `window.__tgModalCounter`로 중첩 모달까지 카운팅하며 `document.documentElement` /
  `document.body`의 `overflow`를 잠금
- **포커스트랩**: Tab/Shift+Tab이 모달 내부 포커스 가능 요소 사이에서만 순환하도록 제한, 최초 마운트 시
  첫 포커스 가능 요소에 자동 포커스
- **Escape로 닫기 + `document.body`로의 portal**

이번 조사는 "이 패턴이 프로젝트 전체에 얼마나 퍼져 있는가"를 확인하기 위한 것이며, **코드 수정은
하지 않고 조사·정리만 수행**했다.

## 1. 조사 방법

1. `src/` 하위 `*[Mm]odal*.tsx` 78개 파일(+ `src/providers/*ModalProvider.tsx` 4개) 전수 나열
2. `BaseModal` import 여부로 "이미 안전한 모달" 25개를 우선 분리
3. 나머지 파일에서 `fixed inset-0`(자체 오버레이 렌더링 여부), `document.body.style.overflow`
   /`overflow(-y)?:\s*hidden`류 패턴(자체 스크롤락 여부), `key === "Escape"`(자체 Esc 처리 여부),
   `focusables`/`trapFocus`류 패턴(자체 포커스트랩 여부), `createPortal`(자체 portal 여부)을 각각
   전수 grep
4. 애매한 파일(래퍼/팝오버로 의심되는 5개)은 직접 열어서 실제 구조 확인

**중요 확인 사항**: 프로젝트 전체에 `useScrollLock`/`useBodyScrollLock` 같은 공용 스크롤락 훅이
`BaseModal` 외에는 **존재하지 않는다.** 즉 `BaseModal`을 거치지 않는 모달은 스크롤락이 100% 없다
(구현했는데 다른 방식을 썼을 가능성 없음, 전수 grep으로 확인 완료).

포커스트랩(Tab 순환) 로직도 프로젝트 전체에서 `BaseModal.tsx` 1곳에만 존재한다. 즉 **`BaseModal`을
쓰지 않는 모달은 예외 없이 포커스트랩이 없다.**

## 2. 분류 결과

### 2-A. `BaseModal` 사용 중 — 안전 (25개, 조치 불필요)

스크롤락 + 포커스트랩 + portal + Esc 모두 `BaseModal`이 보장.

```
AnalysisDebtSelectionModal, AnalysisRequiredFieldsModal, DebtDetailModal,
CustomerCreateModal, FeePaymentInfoModal, DebtReliefSmsModal(result/sms),
SmsModal(customers/sms), StaffChatModal, BulkCategoryChangeModal,
CustomerDetailModalDesktop, CustomerDetailModalMobile, ScheduleCreateModal,
AnalysisReviewDecisionModal, ProcedureSelectModal, BulkScheduleCreateModal,
DeleteAccountModal, CategoryHistoryModal(customers/detail), AssignCustomersModal,
UnlinkConversationModal, ReactivateSubscriptionModal, SmsHistoryDetailModal,
SubscriptionPlanSelectModal, DataCollectionModal, MarketingConsentModal,
PrivacyConsignmentModal, ServiceDeleteModal(BaseModal 래핑 확인)
```

### 2-B. 얇은 래퍼 — 별도 분류 불필요 (4개)

- `CustomerDetailModal.tsx` — Desktop/Mobile 스위치만 함 (둘 다 2-A)
- `GlobalStaffChatModal.tsx` — `StaffChatModal` 래핑 (2-A)
- `CustomerCreateMatchModal.tsx` — `CustomerCreateModal` 재사용 (2-A)
- `DiagnosisFilterModal.tsx`(debt-relief/hub) — `fixed`가 아니라 `absolute` 팝오버(필터 버튼 아래
  드롭다운). 전체 화면 오버레이가 아니라 스크롤락 대상이 아님. 포커스트랩/Esc는 없지만 다른
  프로젝트 내 필터 팝오버들과 동일한 패턴이라 이번 조사 범위(전체화면 모달)에서는 제외.

### 2-C. 자체 구현 모달 — 스크롤락 · 포커스트랩 전무 (46개)

`fixed inset-0`으로 직접 오버레이를 그리며 `BaseModal`을 거치지 않는 파일. **전부** 스크롤락과
포커스트랩이 없다. Esc 처리와 `createPortal` 여부만 파일별로 갈린다.

| 파일 | Esc 처리 | portal |
|---|---|---|
| `providers/ConfirmModalProvider.tsx:175` | ✗ | ✗ |
| `providers/ErrorFeedbackModalProvider.tsx:208` | ✗ | ✗ |
| `providers/PersistentModalProvider.tsx:155` | ✗ | ✗ |
| `common/ConfirmModal.tsx:34` | ✗ | ✗ |
| `common/FilterModal.tsx:348` | ✓ | ✗(내부 카테고리 드롭다운만 portal) |
| `common/DeleteMemberModal.tsx:41` | ✗ | ✗ |
| `common/InviteMemberModal.tsx:79` | ✗ | ✗ |
| `common/FailureDetailModal.tsx:106` | ✗ | ✗ |
| `common/MemberStatsFilterModal.tsx:60` | ✓ | ✗ |
| `customers/CustomerExcelUploadModal.tsx:184` | ✗ | ✗ |
| `customers/CustomerShareModal.tsx:209` | ✗ | ✗ |
| `chat/customer-link/CustomerLinkCreateModal.tsx:194` | ✓ | ✓ |
| `chat/customer-link/CustomerLinkExistingModal.tsx:135` | ✓ | ✓ |
| `chat/customer-link/CustomerLinkModeModal.tsx:20` | ✗ | ✗ |
| `chat/ChatFilterModal.tsx:101` | ✗ | ✗ |
| `debt-relief/result/DiagnosisCustomerInfoModal.tsx:673` | ✗ | ✗ (최초 발견 지점) |
| `debt-relief/result/AnalysisProgressChoiceModal.tsx:31` | ✓ | ✗ |
| `debt-relief/result/CustomerMatchModal.tsx:217` | ✓ | ✗ |
| `debt-relief/result/DebtApplyChoiceModal.tsx:47` | ✗ | ✗ |
| `debt-relief/result/FeePlanActionConfirmModal.tsx:67` | ✗ | ✗ |
| `debt-relief/hub/AnalysisShareModal.tsx:463` | ✗ | ✗ |
| `debt-relief/hub/AnalysisShareConfirmModal.tsx:62` | ✗ | ✗ |
| `dashboard/PartnerRequestModal.tsx:82` | ✗ | ✗ |
| `invite/WrongAccountModal.tsx:34` | ✗ | ✗ |
| `stats/StatsFilterModal.tsx:143` | ✓ | ✗ |
| `attendance/AttendanceFilterModal.tsx:55` | ✓ | ✗ |
| `settings/InstagramIntegrationModal.tsx:53` | ✗ | ✗ |
| `settings/LineIntegrationModal.tsx:118` | ✗ | ✗ |
| `settings/TelegramIntegrationModal.tsx:49` | ✗ | ✗ |
| `settings/SelfAuthenticationModal.tsx:38` | ✗ | ✗ |
| `settings/PartnerRegisterModal.tsx:132` | ✗ | ✗ |
| `settings/CommonSenderNumberModal.tsx:180` | ✗ | ✗ |
| `settings/sms-history/SmsHistoryFilterModal.tsx:44` | ✗ | ✗ |
| `settings/customer-api/ApiKeyCreateModal.tsx:45,49` | ✗ | ✗ |
| `settings/customer-api/ApiKeyLinkModal.tsx:124` | ✗ | ✗ |
| `settings/customer-api/ApiKeyRegenerateModal.tsx:24,28` | ✗ | ✗ |
| `settings/teamManagement/TeamMoveConfirmModal.tsx:28` | ✗ | ✗ |
| `settings/teamManagement/TeamMemberInfoModal.tsx:297,313,333` | ✗ | ✗(내부 드롭다운만 portal) |
| `my-settings/ChangePasswordModal.tsx:89` | ✗ | ✗ |
| `my-settings/ChangePaymentMethodModal.tsx:366` | ✗ | ✗ |
| `my-settings/TwoFactorSetupModal.tsx:67` | ✗ | ✗ |
| `my-settings/TwoFactorDisableModal.tsx:77` | ✗ | ✗ |
| `projects/CreateProjectModal.tsx:288` | ✗ | ✗ |
| `projects/SubscribeProjectModal.tsx:230` | ✗ | ✗ |
| `projects/SubscribeProjectExpiredModal.tsx:50` | ✗ | ✗ |
| `projects/ProjectPrivacyConsentModal.tsx:61` | ✓ | ✓ |

## 3. 우선순위 제안 (실사용 영향 기준)

`docs`의 다른 QA 문서와 동일하게, 0순위=비즈니스로직/방어로직 결함에 준하는 **전역 최고빈도**부터
내림차순으로 나열. (아직 아무것도 수정하지 않았음 — 순서만 제안)

### 우선순위 1 — 앱 전체 최고빈도, 즉시 이관 권장 (완료, 2026-08-20)

`layout.tsx`에 루트로 마운트되어 있어 **도메인 불문 앱 전체에서** 삭제확인/에러/성공/시스템공지
때마다 뜨는 4개. 이 4개가 안 고쳐지면 "특정 화면 버그"가 아니라 "이 앱의 모든 확인·에러 모달이
같은 버그를 가진다"가 된다. 영향도가 가장 크다.

- [x] `src/components/common/ConfirmModal.tsx` (일부 화면에서 직접 렌더링하는 구버전 확인 모달)
- [x] `src/providers/ConfirmModalProvider.tsx` (`showConfirmModal` — 전역 확인 다이얼로그)
- [x] `src/providers/ErrorFeedbackModalProvider.tsx` (`showErrorModal` — 전역 에러/성공 안내, CLAUDE.md
      에러 처리 규칙과 직결되는 바로 그 모달)
- [x] `src/providers/PersistentModalProvider.tsx` (`usePersistentModal` — 시스템/talkgate 공지)

**이관 방식**: 바깥 오버레이(`fixed inset-0 ... flex items-center justify-center`)와 배경 클릭
핸들러를 `BaseModal`로 교체하고, 카드 자체는 `disableAutoContainerSizing` + `containerClassName`으로
기존 폭(`w-[440px]` 등)을 그대로 유지. z-index는 파일마다 제각각이던 기존 값(150/150/200/280)을
유지해야 해서 `BaseModal`에 `zIndexClassName` prop(기본값 `z-[100]`, 미지정 시 기존 25개 사용처와
100% 동일)을 새로 추가해 하드코딩된 `z-[100]`을 대체 가능하게 함 — 특히 `ErrorFeedbackModalProvider`가
`z-[280]`을 유지해야 `AnalysisProgressChoiceModal`(z-[270], `fix/debt-relief-design` 브랜치에서 별도
수정)보다 항상 위에 뜨는 관계가 안 깨진다.

바깥 클릭 시 "닫지 않고 흔들리기만" 하는 특수 동작(`ErrorFeedbackModalProvider`의 persistent 모달,
`PersistentModalProvider` 전체)은 `closeOnOverlayClick`을 끄는 대신 `onClose`에 기존 핸들러
(`handleOverlayClick`/`handleBackdropClick`)를 그대로 연결해 유지 — 이 핸들러들은 원래도 "닫을지 흔들지"를
내부에서 판단하므로 그대로 재사용 가능했음. 부작용: 지금까지 처리되지 않던 Escape 키가 이 두 곳에서도
같은 핸들러를 타게 됨(흔들림 or 닫힘) — 회귀가 아니라 의도한 동작과 일치하는 부수 개선.

`npx tsc --noEmit` / `npx eslint` 통과 확인. 브라우저 재현 검증(삭제확인/에러/시스템공지 각 1회씩
스크롤락·포커스트랩·Esc 동작 확인)은 미수행 — 4개 모두 앱 전체에서 쓰이는 만큼 병합 전 권장.

### 우선순위 2 — 회생파산(debt-relief) 도메인, 현재 활발히 개발 중인 영역

이번 조사의 출발점(`DiagnosisCustomerInfoModal`)과 같은 화면군. 지금 이 브랜치가 건드리고 있는
영역이라 QA 동선과 겹쳐 회귀 확인이 쉽다.

- [ ] `debt-relief/result/DiagnosisCustomerInfoModal.tsx` (버그 최초 재현 지점)
- [ ] `debt-relief/result/AnalysisProgressChoiceModal.tsx`
- [ ] `debt-relief/result/CustomerMatchModal.tsx`
- [ ] `debt-relief/result/DebtApplyChoiceModal.tsx`
- [ ] `debt-relief/result/FeePlanActionConfirmModal.tsx`
- [ ] `debt-relief/hub/AnalysisShareModal.tsx`
- [ ] `debt-relief/hub/AnalysisShareConfirmModal.tsx`

### 우선순위 3 — 고객관리(customers) · 채팅(chat), 매일 쓰는 핵심 업무 화면

- [ ] `common/FilterModal.tsx` (고객 목록 필터 — 리스트 화면에서 매우 빈번)
- [ ] `customers/CustomerExcelUploadModal.tsx`
- [ ] `customers/CustomerShareModal.tsx`
- [ ] `common/InviteMemberModal.tsx` / `common/DeleteMemberModal.tsx`
- [ ] `chat/customer-link/CustomerLinkCreateModal.tsx` / `CustomerLinkExistingModal.tsx` /
      `CustomerLinkModeModal.tsx`
- [ ] `chat/ChatFilterModal.tsx`

### 우선순위 4 — 설정(settings) · 내설정(my-settings) · 프로젝트, 상대적 저빈도

한 번 설정하면 자주 재방문하지 않는 화면들. 스크롤 버그 자체는 동일하게 존재하지만 사용자가
마주칠 확률이 낮다.

- [ ] `settings/InstagramIntegrationModal.tsx`, `LineIntegrationModal.tsx`,
      `TelegramIntegrationModal.tsx`, `SelfAuthenticationModal.tsx`, `PartnerRegisterModal.tsx`,
      `CommonSenderNumberModal.tsx`, `sms-history/SmsHistoryFilterModal.tsx`
- [ ] `settings/customer-api/ApiKeyCreateModal.tsx`, `ApiKeyLinkModal.tsx`, `ApiKeyRegenerateModal.tsx`
- [ ] `settings/teamManagement/TeamMoveConfirmModal.tsx`, `TeamMemberInfoModal.tsx`
- [ ] `my-settings/ChangePasswordModal.tsx`, `ChangePaymentMethodModal.tsx`,
      `TwoFactorSetupModal.tsx`, `TwoFactorDisableModal.tsx`
- [ ] `projects/CreateProjectModal.tsx`, `SubscribeProjectModal.tsx`,
      `SubscribeProjectExpiredModal.tsx`, `ProjectPrivacyConsentModal.tsx`

### 우선순위 5 — 통계/근태, 드문 플로우

- [ ] `stats/StatsFilterModal.tsx`, `common/MemberStatsFilterModal.tsx`,
      `attendance/AttendanceFilterModal.tsx`
- [ ] `dashboard/PartnerRequestModal.tsx`, `invite/WrongAccountModal.tsx`,
      `common/FailureDetailModal.tsx`

## 4. 부가 관찰 (스크롤락/포커스트랩과 별개, 참고용)

- **z-index가 파일마다 제각각**: `z-40`, `z-50`, `z-[60]`, `z-[100]`, `z-[110]`, `z-[120]`,
  `z-[150]`, `z-[200]`, `z-[270]`, `z-[280]`이 모달마다 하드코딩되어 있다. `BaseModal`은 항상
  `z-[100]`(`overlayClassName`으로 덮어쓰기 가능). 두 자체 모달이 동시에 열리는 경로가 있다면
  어느 쪽이 위로 뜨는지가 우연에 의존한다 — 이번 조사에서 실제로 동시에 열리는 조합을 찾지는
  못했지만, 이관 작업 시 z-index 값도 같이 정리하는 게 안전.
- **portal 미사용의 부작용**: `createPortal`을 안 쓰는 자체 모달(2-C 대부분)은 호출된 위치의 DOM
  트리 안에 그대로 렌더링된다. 조상 요소 중 하나라도 `transform`/`filter`/`contain` 등으로 새
  stacking/containing context를 만들면 `fixed inset-0`이 뷰포트가 아니라 그 조상 기준으로 잡혀
  레이아웃이 깨질 수 있다. 지금은 우연히 문제가 없어 보이지만, `BaseModal`로 이관하면 이 리스크도
  자동으로 해소된다.
- **Esc 처리가 있는 8개**(`FilterModal`, `MemberStatsFilterModal`, `CustomerLinkCreateModal`,
  `CustomerLinkExistingModal`, `AnalysisProgressChoiceModal`, `CustomerMatchModal`,
  `StatsFilterModal`, `AttendanceFilterModal`, `ProjectPrivacyConsentModal`)도 포커스트랩과
  스크롤락은 없다 — "일부만 되어있으니 낮은 우선순위"로 착각하지 말 것.

## 5. 다음 단계 제안 (아직 미착수)

우선순위 1부터, 모달 본문(JSX)은 그대로 두고 바깥 오버레이 `<div className="fixed inset-0 ...">`
래핑만 `BaseModal`로 교체하는 이관 작업이 될 것으로 예상. `ConfirmModal`류는 `disableAutoContainerSizing`
+ `containerClassName`으로 기존 카드 폭(`w-[440px]` 등)을 유지하면서 스크롤락/포커스트랩/portal만
얻는 방식이 가장 적은 변경으로 끝날 가능성이 높다. 실제 이관은 이 문서 검토 후 우선순위 1부터
별도로 착수.
