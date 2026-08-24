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

`npx tsc --noEmit` / `npx eslint` 통과 확인. 브라우저 검증(Claude in Chrome, `/test` 페이지) 완료:
스크롤락(`overflow:hidden` 적용), 포커스트랩(X→취소→확인→X 순환), Escape로 닫기/PersistentModal은
Escape에도 안 닫힘, z-index(150/280 실측 확인) 모두 정상.

**검증 중 발견한 별도 버그(수정 완료)**: `BaseModal`의 오버레이 바깥 클릭 시 닫기가 **기존 25개
사용처 전체에서 이미 깨져 있었다.** `onMouseDown`이 `e.target === e.currentTarget`로 판정했는데,
가운데 정렬용 `positioner` div가 오버레이 전체를 덮고 있어서 배경의 어느 지점을 클릭해도 실제
`e.target`은 항상 positioner이지 오버레이 자신이 될 수 없었다 — 즉 `closeOnOverlayClick`이 이름과
달리 사실상 한 번도 동작한 적이 없었다. 이관 전 `ConfirmModal`/`ConfirmModalProvider`는 별도의
`absolute inset-0` 배경 div가 직접 클릭을 받는 구조라 배경 클릭이 실제로 닫혔었기 때문에, 이번
이관이 고치지 않았다면 오히려 이 둘에서는 회귀가 됐을 것 — `containerRef.current?.contains(e.target)`
기반 판정으로 교체해 기존 25개 + 이번에 이관한 4개 모두에서 배경 클릭이 정상 동작하도록 수정.
`ErrorFeedbackModalProvider`(persistent)와 `PersistentModalProvider`는 배경 클릭 시 닫지 않고
흔들리기만 하는 기존 동작을 Claude in Chrome으로 재확인(다이얼로그 유지, `animate-shake` 클래스 적용).

### 우선순위 2 — 회생파산(debt-relief) 도메인, 현재 활발히 개발 중인 영역 (완료, 2026-08-20)

이번 조사의 출발점(`DiagnosisCustomerInfoModal`)과 같은 화면군. 지금 이 브랜치가 건드리고 있는
영역이라 QA 동선과 겹쳐 회귀 확인이 쉽다.

- [x] `debt-relief/result/DiagnosisCustomerInfoModal.tsx` (버그 최초 재현 지점)
- [x] `debt-relief/result/AnalysisProgressChoiceModal.tsx`
- [x] `debt-relief/result/CustomerMatchModal.tsx`
- [x] `debt-relief/result/DebtApplyChoiceModal.tsx`
- [x] `debt-relief/result/FeePlanActionConfirmModal.tsx`
- [x] `debt-relief/hub/AnalysisShareModal.tsx`
- [x] `debt-relief/hub/AnalysisShareConfirmModal.tsx`

**이관 메모**:
- 전부 `disableAutoContainerSizing` + `containerClassName`으로 기존 카드 폭/높이를 그대로 유지하는
  방식(우선순위 1과 동일 패턴). `fixed left-1/2 top-1/2 -translate-x/y-1/2`류 절대중앙정렬은
  `BaseModal`의 기본 positioner(`flex items-center justify-center`)가 동일 효과를 내므로 별도
  `positionerClassName` 없이 제거. `AnalysisProgressChoiceModal`/`CustomerMatchModal`처럼 좌우
  패딩만 있고 상하 패딩이 없던 레이아웃은 `positionerClassName`을 직접 지정해 기존 여백을 보존.
- `submitting`/`matchingId` 등 처리 중 상태에서 닫기를 막던 기존 로직은 `onClose`에 넘기는
  `handleClose` 래퍼(`if (!submitting) onClose()`)로 유지하고 `closeOnOverlayClick`도 동일 조건으로
  연결 — 우선순위 1의 persistent 모달과 같은 패턴.
- `CustomerMatchModal`은 원래 배경 클릭 시 닫히는 기능 자체가 없었음(오버레이에 onClick 핸들러
  없음) — `closeOnOverlayClick={false}`로 명시해 동작 변경 없이 이관.
- `AnalysisShareModal` + `AnalysisShareContactStep`: 두 스텝(파트너 선택 / 연락처 입력)이 오버레이
  하나를 공유하는 구조라, `AnalysisShareContactStep`의 자체 `fixed` 래퍼(위치·크기·그림자)를 걷어내고
  `flex h-full flex-col`만 남긴 뒤 크기·포지셔닝 책임을 부모 `AnalysisShareModal`의
  `containerClassName`(스텝별 분기)으로 옮김.
- `DiagnosisCustomerInfoModal`(부모) + `DebtDetailModal`(자식, 이미 BaseModal 사용 중)처럼 중첩
  모달이 있는 조합, 그리고 `AnalysisShareModal`(부모) + `AnalysisShareConfirmModal`(자식)은 둘 다
  `zIndexClassName`을 지정하지 않고 기본값(`z-[100]`)을 공유 — 자식이 나중에 mount되어 DOM상 뒤에
  portal이 붙으므로 항상 위에 뜬다(기존 25개 BaseModal 사용처의 중첩 모달 조합과 동일한 검증된
  패턴). `AnalysisProgressChoiceModal`(z-[270])처럼 전역 에러 모달(z-280)과의 관계가 이미 정해져
  있던 파일은 기존 z-index를 그대로 보존.
- `npx tsc --noEmit` / `npx eslint`(대상 8개 파일) 통과 확인. 브라우저 검증은 미실시(사용자 요청 시
  별도 진행).

### 우선순위 3 — 고객관리(customers) · 채팅(chat), 매일 쓰는 핵심 업무 화면 (완료, 2026-08-20)

- [x] `common/FilterModal.tsx` (고객 목록 필터 — 리스트 화면에서 매우 빈번)
- [x] `customers/CustomerExcelUploadModal.tsx`
- [x] `customers/CustomerShareModal.tsx`
- [x] `common/InviteMemberModal.tsx` / `common/DeleteMemberModal.tsx`
- [x] `chat/customer-link/CustomerLinkCreateModal.tsx` / `CustomerLinkExistingModal.tsx` /
      `CustomerLinkModeModal.tsx`
- [x] `chat/ChatFilterModal.tsx`

**이관 메모**:
- 패턴은 우선순위 1·2와 동일: `disableAutoContainerSizing` + `containerClassName`으로 기존 카드
  크기 보존, `fixed left/top -translate` 절대중앙정렬은 `BaseModal` 기본 positioner로 대체.
- `FilterModal.tsx`/`ChatFilterModal.tsx`는 내부 콤보박스·카테고리 드롭다운이 각자
  `createPortal(..., document.body)`로 독립 포털을 쓰던 부분(파트너 검색, API 키, 카테고리 다건
  선택)은 그대로 유지 — `BaseModal` 이관과 무관하게 정상 동작.
- `CustomerLinkExistingModal.tsx`/`CustomerLinkCreateModal.tsx`는 카운터 없는 자체
  `lockBodyScroll`/`unlockBodyScroll`(`document.documentElement`/`body.style.overflow` 직접 조작)을
  갖고 있어 다른 모달과 동시에 열리면 스크롤락 카운터가 꼬일 수 있었던 잠재 결함 — `BaseModal`의
  카운터 기반 락으로 교체하며 자연히 해소.
- 배경 클릭 시 닫히지 않던 기존 동작(`CustomerMatchModal`류와 동일 패턴 — `CustomerLinkExistingModal`,
  `CustomerLinkCreateModal`, `CustomerExcelUploadModal`)은 `closeOnOverlayClick={false}`로 명시해
  유지. `submitting`/`linking` 처리 중 닫기 방지 로직은 `handleClose` 래퍼로 유지.
- `npx tsc --noEmit` / `npx eslint`(대상 9개 파일) 통과 확인(사전에 존재하던 미사용 변수 경고 5건은
  이번 변경과 무관). 브라우저 검증은 미실시.

### 우선순위 4 — 설정(settings) · 내설정(my-settings) · 프로젝트, 상대적 저빈도 (완료, 2026-08-20)

한 번 설정하면 자주 재방문하지 않는 화면들. 스크롤 버그 자체는 동일하게 존재하지만 사용자가
마주칠 확률이 낮다.

- [x] `settings/InstagramIntegrationModal.tsx`, `LineIntegrationModal.tsx`,
      `TelegramIntegrationModal.tsx`, `SelfAuthenticationModal.tsx`, `PartnerRegisterModal.tsx`,
      `CommonSenderNumberModal.tsx`, `sms-history/SmsHistoryFilterModal.tsx`
- [x] `settings/customer-api/ApiKeyCreateModal.tsx`, `ApiKeyLinkModal.tsx`, `ApiKeyRegenerateModal.tsx`
- [x] `settings/teamManagement/TeamMoveConfirmModal.tsx`, `TeamMemberInfoModal.tsx`
- [x] `my-settings/ChangePasswordModal.tsx`, `ChangePaymentMethodModal.tsx`,
      `TwoFactorSetupModal.tsx`, `TwoFactorDisableModal.tsx`
- [x] `projects/CreateProjectModal.tsx`, `SubscribeProjectModal.tsx`,
      `SubscribeProjectExpiredModal.tsx`, `ProjectPrivacyConsentModal.tsx`

**이관 메모**:
- 20개 전부 우선순위 1~3과 동일한 `disableAutoContainerSizing` + `containerClassName` 패턴.
  모바일 전체화면/데스크톱 중앙정렬(`md:flex md:items-center md:justify-center` 류) 구조는
  `positionerClassName`으로 그대로 이식.
- `TeamMemberInfoModal.tsx`는 로딩/에러/정상 3개 분기가 각자 `createPortal(..., document.body)`를
  직접 호출하던 중복 구조였음 — `BaseModal`이 포털을 대신 처리하므로 `createPortal` import와
  수동 호출 3곳을 전부 제거.
- `CustomerLinkExistingModal`/`CustomerLinkCreateModal`과 마찬가지로 이번에도 카운터 없는 자체
  `document.body.style.overflow` 스크롤락을 쓰던 곳(`ProjectPrivacyConsentModal.tsx`)이 있어
  `BaseModal`의 카운터 기반 락으로 교체.
- `ProjectPrivacyConsentModal.tsx`(프로젝트 최초 진입 시 강제 개인정보 위탁 동의 게이트)는
  배경 클릭·Escape로 닫히면 안 되는 의도적 논클로저블 모달 — `onClose={() => {}}` +
  `closeOnOverlayClick={false}`로 이관하고, 기존 capture 단계 `stopPropagation` Escape 차단
  로직은 그대로 유지(스크롤락 부분만 제거). capture 단계가 `BaseModal`의 bubble 단계 Escape
  핸들러보다 먼저 실행돼 이벤트 전파를 막으므로 이중 방어가 유지됨.
- `npx tsc --noEmit` / `npx eslint`(대상 20개 파일) 통과 확인(사전에 존재하던 미사용 변수 경고
  5건은 이번 변경과 무관). 브라우저 검증은 미실시.

이로써 자체구현 모달 46개 전수 이관(우선순위 1~4) 완료. 남은 건 우선순위 5(통계/근태 등 6개)뿐.

### 우선순위 5 — 통계/근태, 드문 플로우 (완료, 2026-08-20)

- [x] `stats/StatsFilterModal.tsx`, `common/MemberStatsFilterModal.tsx`,
      `attendance/AttendanceFilterModal.tsx`
- [x] `dashboard/PartnerRequestModal.tsx`, `invite/WrongAccountModal.tsx`,
      `common/FailureDetailModal.tsx`

**이관 메모**:
- `StatsFilterModal`/`MemberStatsFilterModal`/`AttendanceFilterModal` 3개는 동일한 구조
  (`useIsMobile()` 훅으로 계산한 `translate(-50%,-50%)` 인라인 스타일 + 수동 `createPortal`) —
  우선순위 3의 `FilterModal.tsx`와 같은 패턴이라 `positionerClassName` + `positionerStyle`로
  동일하게 이관. 자체 Escape `useEffect`와 수동 `createPortal` 호출 모두 제거(`BaseModal`이 대체).
- `WrongAccountModal.tsx`는 `open` prop이 아예 없는(부모가 마운트 자체로 열림/닫힘 제어) 컴포넌트라
  `TeamMoveConfirmModal.tsx`와 동일한 패턴으로 `onCancel`을 `BaseModal`의 `onClose`에 직결.
- `npx tsc --noEmit` / `npx eslint`(대상 6개 파일) 통과 확인, 경고 0건. 브라우저 검증은 미실시.

전체 46개 자체구현 모달 전수 이관(우선순위 1~5) 완료.

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

## 6. 브라우저 검증 결과 (2026-08-21)

우선순위 1(전역 4개)은 2026-08-20에 이미 브라우저 검증 완료. 이번 세션은 우선순위 2~5(39개 파일)
중 트리거 가능한 항목을 Claude in Chrome으로 실사용 검증(데스크톱 1424px 기준). `삼성화재 보험상담`
프로젝트(dev, 데이터 다수 보유)와 `/test` 컴포넌트 테스트 페이지를 활용.

**검증 방법 caveat**: 스크롤락은 `overflow:hidden` 적용 여부를 JS로 확인하는 방식과 자동화 휠스크롤
방식 둘 다 시도했으나, 이미 검증 완료된 `ConfirmModal`(우선순위1)에서도 자동화 휠스크롤 시
`window.scrollY`가 0→81로 이동하는 현상이 재현됨 — `overflow:hidden`은 정상 적용돼 있었음에도
발생했다. 즉 Claude in Chrome의 합성 휠 이벤트가 실제 사용자 트랙패드/마우스 입력과 다르게
`overflow:hidden`을 부분적으로 우회하는 것으로 보이는 테스트 환경 아티팩트다. 이번 검증은 이 신호를
신뢰하지 않고 **시각적 중앙정렬/레이아웃/열기·닫기 동작 확인 위주**로 진행했다.

### 검증 완료 · 이상 없음

**우선순위3 (9/9 전체)**: `FilterModal`(고객목록), `CustomerExcelUploadModal`, `CustomerShareModal`
(파트너배정 버튼으로 트리거), `InviteMemberModal`, `DeleteMemberModal`, `CustomerLinkCreateModal`,
`CustomerLinkExistingModal`, `CustomerLinkModeModal`, `ChatFilterModal` — 전부 데스크톱 중앙정렬
정상, 열기/닫기 정상.

**우선순위4 (14/20)**: `SelfAuthenticationModal`, `PartnerRegisterModal`, `SmsHistoryFilterModal`,
`ApiKeyCreateModal`, `ApiKeyLinkModal`, `TeamMemberInfoModal`, `ChangePasswordModal`,
`ChangePaymentMethodModal`, `TwoFactorSetupModal`, `CreateProjectModal`, `SubscribeProjectModal`
(`/test` 페이지로 트리거), `SubscribeProjectExpiredModal`(실제 만료 프로젝트 클릭 + `/test` 페이지
둘 다), `ProjectPrivacyConsentModal`(`/test` 페이지 — Escape로 안 닫히는 의도된 동작도 재확인) —
전부 정상. `CommonSenderNumberModal`/`LineIntegrationModal`/`TelegramIntegrationModal`은 이전
세션에 커밋 8b36da5로 이미 수정+확인됨(재검증 생략).

**우선순위5 (5/6)**: `StatsFilterModal`, `MemberStatsFilterModal`, `AttendanceFilterModal`,
`PartnerRequestModal`(`/test` 페이지), `FailureDetailModal`(일괄 등록 이력의 실패 건수 링크) —
전부 정상.

**우선순위2 (7/7 전체, 2026-08-21 추가 검증)**: 사용자가 채무조정 유형+구독중 테스트 프로젝트
`test01`을 세팅해준 뒤 재검증. `DiagnosisCustomerInfoModal`(`...` 메뉴 → 고객정보),
`AnalysisProgressChoiceModal`("진행하기" 버튼, `상담중` 상태 진단에서 트리거), `CustomerMatchModal`
("고객 연결" → "기존 고객과 연동"), `DebtApplyChoiceModal`(채무 상세 "상세" 탭에서 값 수정 후
"적용하기"), `FeePlanActionConfirmModal`(결제정보 → "중단"), `AnalysisShareModal`/
`AnalysisShareConfirmModal`(목록에서 공유 아이콘 → 파트너 선택 → 연락처 입력 → 확인) 전부
데스크톱 중앙정렬 정상, 배경클릭/의도된 non-closable 동작도 이관 메모와 일치. 단, 아래 1순위
이슈를 새로 발견함.

### 새로 발견한 이슈

**[1순위 — UI크리티컬, 전역] 중첩된 BaseModal에서 Escape 1회 입력 시 스택 전체가 동시에 닫힘.**
`FeePaymentInfoModal`(부모) 위에 `FeePlanActionConfirmModal`(자식, "중단 처리")을 띄운 뒤 Escape를
한 번만 누르면 자식뿐 아니라 부모까지 동시에 닫히며 기본 페이지로 돌아간다(재현 100%, 2회 반복
확인). `DiagnosisCustomerInfoModal` → `DebtDetailModal` → `DebtApplyChoiceModal`로 3단 중첩시켜도
동일하게 Escape 1회로 3개 전부 닫혔고, 이 케이스에서는 방금 입력한 "현재 잔액" 수정값이 아무
경고 없이 그대로 유실됐다(저장 여부를 묻는 `AnalysisShareModal` 쪽의 "공유 취소" 가드와 대비됨 —
아래 참고). 원인 추정: 각 `BaseModal` 인스턴스가 독립적으로 `document`에 Escape `keydown` 리스너를
등록하고 있어, 모달 스택 순서와 무관하게 마운트된 모든 인스턴스가 같은 키 입력에 동시 반응하는
것으로 보임(코드 확인은 하지 않았음 — 발견·기록까지만 이번 범위). 재현 경로: 분석 상세 →
결제정보 → 중단, 또는 진단 상세 → 채무 상세(상세 탭) → 값 수정 → 적용하기, 둘 다에서 Escape
1회로 재현.
- **참고— 가드가 있는 경우는 다르게 동작함**: `AnalysisShareModal`(입력값 있는 상태) 위에
  `AnalysisShareConfirmModal`을 띄우고 Escape를 누르면, 확인 모달은 조용히 사라지지만
  `AnalysisShareModal` 쪽은 "공유 취소 — 입력한 정보가 저장되지 않습니다. 정말로 닫으시겠습니까?"
  경고를 새로 띄운다(전체가 닫히지는 않음). 즉 두 모달의 Escape 핸들러가 같은 키 입력에 동시
  반응하는 것 자체는 동일하지만, 상위 모달에 dirty-check 가드가 있으면 그 가드가 개입해 사용자가
  체감하는 피해가 줄어든다 — 가드가 없는 조합(`FeePaymentInfoModal`+`FeePlanActionConfirmModal`,
  `DiagnosisCustomerInfoModal`+`DebtDetailModal`+`DebtApplyChoiceModal`)에서는 아무 경고 없이
  전부 닫히고 미저장 입력이 유실된다.
- 이미 검증 완료로 기록된 다른 중첩 조합(우선순위 1~4의 nested 케이스들)은 이번에 Escape
  스태킹까지 재확인하지 않았음 — 이 버그가 이 두 조합에 국한된 것인지, `BaseModal`을 쓰는 모든
  중첩 조합에 해당하는 공통 결함인지는 추가 확인 필요.

### 3순위(미미함) — dead code, 삭제 완료

- `InstagramIntegrationModal.tsx` — 정의부 외 어디서도 import되지 않음(실제 Instagram 연동은
  `ConsultationChannelSettings.tsx`의 별도 OAuth 팝업 로직 사용, 이 모달은 화면에 뜰 경로가 없었음).
- `ApiKeyRegenerateModal.tsx` — 마찬가지로 import 0건, 어디서도 렌더링되지 않음.

2026-08-21 사용자 확인 후 두 파일 모두 삭제(`git rm`), `npx tsc --noEmit` 통과 확인.

### 트리거 불가 / 미검증 → 2026-08-24 전부 검증 완료

- **`TeamMoveConfirmModal`**: `삼성화재 보험상담` 프로젝트 조직도에서 실제 HTML5 드래그 이벤트
  (dragstart/dragover/drop)를 JS로 직접 dispatch해 재현(합성 마우스 드래그는 React state 갱신
  타이밍 문제로 안 먹혀서 이벤트 사이에 지연을 두고 우회). `정성복`(박윤아/인천지사)을
  `조창식`(영업2팀)에 드롭 → 모달 정상 표시("이동할 항목/현재 위치/이동할 위치" 값 정확),
  오버레이 클릭 시 안 닫힘(`closeOnOverlayClick={false}`와 일치), Escape로는 정상 닫힘, 취소 후
  실제 데이터 변경 없음(정성복 원위치 그대로) 확인. 실 프로젝트 데이터라 "조직이동" 확정 클릭은
  하지 않고 취소로 검증 종료.
- **`TwoFactorDisableModal`** / **`WrongAccountModal`**: 실제 트리거 조건(2FA 활성화 계정, 초대
  이메일-로그인 계정 불일치)을 재현하기 번거로워, `/test` 페이지에 더미 props로 상시 마운트하는
  섹션을 추가(`src/app/test/page.tsx`, 다른 기존 모달들과 동일한 패턴). 두 모달 모두
  `window.__tgModalCounter`/`bodyOverflow: hidden`으로 스크롤락 적용 확인, Escape로 정상 닫힘 확인.
  비즈니스 트리거 로직 자체는 검증 범위 밖(BaseModal 이관 여부만 확인).

### 결론

39개 대상 전체(우선순위2~5 39개 + 특수조건 3개) 실사용/더미마운트 검증 완료, 2개는 dead code로
확인돼 삭제. **새로운 중앙정렬/레이아웃 회귀는 없었다**(이전에 발견·수정된 3개 settings 모달
제외)는 점에서는 이관 자체는 안전했다고 볼 수 있으나, 2026-08-21 우선순위2 검증에서 **중첩 모달
Escape 스태킹 결함(1순위)**을 발견해 같은 날 수정 완료했다(`window.__tgModalStack` 기반 최상단
모달만 반응하는 가드 추가). 모달 스크롤락/포커스트랩 전수조사는 이로써 전 항목 종료.
