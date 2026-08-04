# 분석(Analysis) API 변경 대응 작업 계획

백엔드 전달 가이드(절차 6종 확장 / 채무 상세입력 / 채무 수정 API) 반영을 위한 프론트 작업 문서.
작성 2026-08-04 / 1차 개정 2026-08-04 (Swagger 스펙·샘플사이트 UI·의사결정 반영).

---

## 진행 현황 (2026-08-04)

백엔드가 신규 스펙을 배포하고 Swagger가 갱신되어, **Phase 1~3 전체와 Phase 4의 타입·서비스 계층,
Phase 5의 서비스 계층까지 완료**했다. 남은 건 채무 상세입력 폼 UI와 채무 수정 모달 UI뿐이다.

검증: `npx tsc --noEmit` 통과 / `npx eslint src/` **0 errors** (경고 68건은 전부 기존 무관 항목).

### 완료

**Phase 1 — 절차 6종 확장**
- `AnalysisProcedureType` 6종 + `isAnalysisProcedureType` / `ANALYSIS_PROCEDURE_ORDER` 신설
- `normalizeProcedureType` 재작성 (Set 판정 — 신규 4종이 개인회생으로 뭉개지던 문제 해소)
- **D-1 통일**: `PROCEDURE_TO_ANALYSIS` / `PROCEDURE_FROM_ANALYSIS` / `PROCEDURE_TO_SCORE_KEY`
  3개 매핑 테이블 제거 + `CustomerLinkedAnalysisSection`의 중복 사본 제거
- 라벨·배지·축약표기·기본값 6키화 (**D-2 무채색** 적용), `RECOMMENDED_PROCEDURE_ORDER` 6종 개방

**Phase 2 — 동적 맵**
- `scores`/`procedureConditions`/`procedureGuides`/`expectedRepayment` → `Partial<Record<…>>`
- `pickProcedureValue` / `procedureEntries` 헬퍼로 조회·순회 일원화
- `buildProcedureScores`는 추천 우선 + 점수 내림차순 정렬 (6종 대응)
- `procedureConditions[key].satisfied` 런타임 크래시 후보 제거
- `expectedRepayment`는 **추적 절차 기준**으로 고르고, 없으면 AI 추천 절차로 폴백

**Phase 3 — overdueMonths / isOperatingBusiness**
- `AnalysisOverduePeriod` / `OverduePeriod` / `OVERDUE_PERIOD_OPTIONS` /
  `OVERDUE_PERIOD_TO·FROM_ANALYSIS` / `OVERDUE_MONTHS_ESTIMATE` 전부 제거
- `DiagnosisFormState.overdueMonths: number | null` — **0(연체 없음)과 null(미입력)을 구분**
- `FormControls`에 `MonthsInput` 신설, `Step3Debts` 연체기간을 숫자 입력으로 교체
  (샘플사이트 문구 "여러 채무가 있으면 가장 긴 연체 기준으로"를 hint로 유지)
- `validateDiagnosisForm`을 모드별 분기(`getMissingDebtFieldLabels`)로 재구성
- `isOperatingBusiness` 폼 필드 + **Step1 기본정보에 토글** 추가, 양방향 매핑 연결
- `DiagnosisCustomerInfoModal` 연체기간 표시를 `N개월` 직접 표기로 교체

**Phase 4 — 채무 입력 모드 / 이자 포함 (타입·서비스 계층)**
- `AnalysisDebtInputMode` / `AnalysisDebtItemType` / `AnalysisRepaymentMethod` /
  `AnalysisDebtItem` / `AnalysisDebtDerivedSignals` 타입 정의
- `DiagnosisFormState`에 `debtInputMode` / `debts` 추가, `createEmptyDebtItem` 헬퍼
- 단위 변환 헬퍼 `wonToManwon` / `manwonToWon` / `aggregateDebtsToBreakdown` 단일화
- `toAnalysisFormInput`이 모드별로 배타적인 필드만 전송
  (상세모드에서는 `debtBreakdown`/`overdueMonths`를 보내지 않는다 — 서버 자동 집계와 어긋나면 모호해지므로)
- `useDiagnosisForm`의 총 채무 합계가 모드별로 계산 (상세는 `principalWon` 합 → 만원)
- 이자 포함 병기: `SectionDebtStatus`(총 채무), `SectionRepaymentPlan`(예상 면책 채무).
  **값이 없으면 항목 자체를 숨긴다** (간편모드 건에서 "0" 표시 금지)

**Phase 5 — 채무 수정 API (서비스 계층만)**
- `UpdateAnalysisDebtsInput` 타입 + `AnalysisService.updateDebts` (`timeoutMs: 120000`)
- `DebtReliefService.updateDiagnosisDebts(projectId, id, form, reanalyze)`

### 남은 작업

| 항목 | 상태 |
|---|---|
| Phase 4-3 채무 상세입력 폼 UI (간편/상세 토글 + N행 테이블) | **미착수** — 스펙·타입 준비 완료, 바로 착수 가능 |
| Phase 5-2 채무 수정 모달 UI | **보류** — D-4 디자인 대기 |
| `debtDerivedSignals` 화면 표시 | 보류 — 화면 정의 없음 + 단위(Q-E) 미확인 |

---

## ⚠️ 최우선 확인 사항 — 공유받은 Swagger는 **변경 전(구) 스펙**이다

전달받은 Swagger 문서를 항목별로 대조한 결과, **가이드에 적힌 변경사항이 하나도 반영되어 있지 않다.**

| 가이드 내용 | 공유된 Swagger의 실제 상태 |
|---|---|
| `RecommendedProcedure` 6종 | `GET /v1/analysis`의 `procedure` 쿼리 = `individual_rehabilitation`, `bankruptcy` **2종만** |
| `scores` 동적 맵(스네이크케이스) | `{ "individualRehabilitation": 0, "bankruptcy": 0 }` **고정 2키 camelCase** |
| `expectedRepayment` 절차별 맵 | **단일 객체** (`monthlyPayment`/`periodMonths`/…) |
| `procedureGuides` 동적 맵 | `individualRehabilitation` / `bankruptcy` **고정 2키** |
| `overduePeriod` → `overdueMonths` | 요청·응답 모두 **`overduePeriod` enum 그대로** |
| `isOperatingBusiness` 필수 추가 | **필드 없음** |
| `debtInputMode` / `debts[]` | **필드 없음** |
| `PATCH /v1/analysis/:id/debts` | **엔드포인트 없음** |

`CreateAnalysisRequest` 스키마 역시 `overduePeriod` enum 5종에 `isOperatingBusiness`가 없어,
이 문서 8번에서 언급된 `analysis-create-request-samples.json`의 실제 내용도 **구 스펙 기준**일 가능성이 높다.

**해석**: 백엔드가 변경분을 아직 배포/문서화하지 않은 상태(개발 브랜치에만 존재)로 보인다.
이 문서는 **가이드 텍스트를 유일한 스펙 근거로 삼아** 작성했다. 즉 아래 작업 내용은 Swagger로 교차검증되지
않았으므로, **신규 스펙이 반영된 Swagger가 올라온 뒤 Phase 1 착수 전에 재대조가 필요하다.**

**Swagger가 갱신되면 반드시 재확인할 것** (가이드만으로는 확정 불가한 항목):
- `scores` / `procedureConditions` / `expectedRepayment` / `procedureGuides`의 **정확한 키 표기**
  (가이드 예시는 스네이크케이스 `individual_rehabilitation`인데, 구 스펙은 camelCase `individualRehabilitation`이었다.
  이 표기가 실제로 바뀌는 게 맞는지가 Phase 2 전체를 좌우한다)
- `GET /v1/analysis/procedures` 응답에 신규 4종이 포함되는지, 각 절차에 `steps`(단계 가이드)가 채워지는지
- `PATCH /v1/analysis/{id}`(`trackingProcedure`)가 신규 4종을 수용하는지
- `AnalysisFilterDto.procedure` 쿼리에 신규 4종이 열리는지

---

## 0. 요약

| # | 백엔드 변경 | 성격 | Phase | 지금 착수 가능? |
|---|---|---|---|---|
| 1 | `RecommendedProcedure` 2종 → 6종 | **Breaking** | Phase 1 | ✅ |
| 2 | `scores`/`procedureConditions`/`expectedRepayment`/`procedureGuides` 동적 맵화 | **Breaking** | Phase 2 | ✅ |
| 5 | `overduePeriod`(버킷) → `overdueMonths`(정수) | **Breaking** | Phase 3 | ✅ |
| 4 | `isOperatingBusiness` 필수 boolean | **Breaking** | Phase 3 | ✅ |
| 3 | `debtInputMode` (간편/상세) + `debts[]` | 신규 | Phase 4 | ✅ (샘플사이트 UI 확정됨) |
| 6 | 이자 포함 필드 | 신규 | Phase 4 | ✅ |
| 7 | `PATCH /analysis/:id/debts` (채무만 수정) | 신규 | Phase 5 | ⛔ **보류 — 디자인 대기** |

**배포 결합**: Phase 1~4는 Breaking 3건이 얽혀 있어 **백엔드 배포와 동시에 나가야 한다.**
프론트가 먼저 나가면 구 서버가 `isOperatingBusiness`/`debtInputMode`를 모르고,
백엔드가 먼저 나가면 구 프론트가 `overduePeriod`를 보내 400이 난다.

**핵심 변경 파일 3개**가 전체 변경량의 약 70%:
`src/types/analysis.ts`, `src/types/debtRelief.ts`, `src/services/debtRelief.ts`.
나머지 20여 개 파일은 이 3개가 바뀌면 타입 에러로 자연히 드러나는 후속 수정.

---

## 확정된 의사결정 (2026-08-04)

| ID | 결정 |
|---|---|
| **D-1** | **절차 코드 이중 체계를 API enum 값으로 통일한다.** 도메인 코드 `individual_rehab` 폐기, `PROCEDURE_TO/FROM_ANALYSIS` 매핑 제거 |
| **D-2** | 신규 4종 절차 색상은 **무채색(흰색/회색/검정)으로 데이터 표시만** 되게 한다. 정식 팔레트는 디자인 확정 후 별도 작업 |
| **D-3** | 채무 상세입력 UI는 **백엔드 샘플사이트 동작을 기준**으로 구현 (아래 §Phase 4 상세 명세) |
| **D-4** | 채무 수정 API(`PATCH /:id/debts`) **이번 작업 범위에서 제외.** 디자인 수령 후 별도 진행 |
| 단위 | 별도 언급이 없으면 **기존 단위(만원) 유지**. `debts[]`의 `*Won` 필드만 원 단위 |

---

## Phase 0 — 착수 전 정리

### Step 0-1. 브랜치 정리

- 현재 `fix/debt-relief-design`에 미커밋 변경 3건 (`SectionCounselMents.tsx`, `services/debtRelief.ts`,
  `types/debtRelief.ts` — "사채"→"대부업체" 라벨). **이 작업과 같은 파일이므로 먼저 커밋/머지한 뒤** 분기.
- 브랜치명: `feat/analysis-6-procedures`

### Step 0-2. 백엔드에 아직 물어야 할 것

가이드만으로 확정되지 않아 **구현 중 막히는** 항목. Phase별로 필요한 시점 표기.

| ID | 질문 | 필요 시점 | 막히면 어떻게 되나 |
|---|---|---|---|
| **Q-A** | `scores`/`procedureConditions`/`expectedRepayment`/`procedureGuides` 키가 정말 **스네이크케이스**로 바뀌는가? (구 스펙은 camelCase) | **Phase 2 (블로킹)** | 키 표기를 틀리면 결과 화면 전체가 빈 값. 가이드 예시대로 스네이크로 가정하고 진행하되, 방어적으로 두 표기 모두 읽는 폴백을 넣을 수 있음 |
| **Q-B** | 신용회복 3종(신속채무조정/프리워크아웃/개인워크아웃)과 새출발기금에 **절차안내 `steps` 데이터가 있는가?** | Phase 1 | 없으면 절차안내 섹션이 빈 상태 → "단계 안내 미제공" 문구로 대체 필요 |
| **Q-C** | 샘플사이트 간편모드에 **"저축은행"이 별도 칩**으로 있는데, `debtBreakdown`·`debts[].debtType` 모두 슬롯이 5개뿐이다(`capitalLoan` 하나). 저축은행을 별도 종류로 받을 계획인가, 아니면 샘플사이트가 앞서간 것인가? | Phase 4 | 현행 프론트는 "캐피탈/저축은행"으로 합쳐 놨다. 답 없으면 **현행 유지**(합친 채로) 진행 |
| **Q-D** | 샘플사이트 간편모드 "연체 기간"이 여전히 **버킷 드롭다운("6~12개월")**이다. 가이드의 `overdueMonths`(정수)와 모순 — 어느 쪽이 맞나? | **Phase 3 (블로킹)** | 가이드(정수)를 신뢰하고 숫자 입력으로 구현. 샘플사이트가 낡은 것으로 판단 |
| **Q-E** | `debtDerivedSignals.highInterestDebtRatio` 단위 (0~1 비율 / 0~100 %) | Phase 4 (표시할 경우) | 화면 정의가 아직 없어 당장은 미표시 → 실질 비블로킹 |
| **Q-F** | 구 데이터 호환: `overduePeriod`로 저장된 기존 건 조회 시 `overdueMonths`가 채워져 오는가(서버 마이그레이션 여부) | Phase 3 | 안 오면 프론트 폴백 필요. 일단 `?? 0` 방어 넣고 진행 |
| **Q-G** | 신규 스펙이 반영된 **Swagger 갱신 시점** | Phase 1 전 | 없어도 가이드 기준으로 진행 가능하나, 배포 전 대조 필수 |

> Q-A / Q-D 두 개만 블로킹이고 나머지는 가정을 두고 진행 가능하다. 두 항목도 **가정을 세워
> 구현을 진행하되, 배포 전 실응답으로 반드시 검증**하는 방식으로 대기 시간 없이 착수한다.

---

## Phase 1 — 절차 6종 확장 (Breaking #1)

### Step 1-1. `src/types/analysis.ts`

- [ ] `AnalysisProcedureType`(:18) 6종 확장
  ```ts
  export type AnalysisProcedureType =
    | "individual_rehabilitation" | "bankruptcy" | "fresh_start_fund"
    | "speedy_debt_adjustment" | "pre_workout" | "personal_workout";
  ```
- [ ] **`normalizeProcedureType`(:24-28) 재작성 — 최우선.**
  현재 `value === "bankruptcy" ? "bankruptcy" : "individual_rehabilitation"` 이라
  **신규 4종이 전부 개인회생으로 오염된다. 이걸 안 고치면 6종 확장이 통째로 무의미하다.**
  → 유효 값 Set 포함 여부로 판정, 미포함(레거시 `debt_adjustment` 등)만 개인회생 폴백.
- [ ] `ANALYSIS_PROCEDURE_ORDER` 상수 신설 (표시 순서 단일 소스)

### Step 1-2. `src/types/debtRelief.ts` — D-1 통일 반영

- [ ] `RecommendedProcedure`(:58)를 **API enum 값과 동일하게** 재정의
      (별칭 유지: `export type RecommendedProcedure = AnalysisProcedureType`도 가능 —
      단계적 치환 중 타입 에러 폭을 줄이려면 이 방식이 안전)
- [ ] `RECOMMENDED_PROCEDURE_LABEL`(:60-63) 6키:
      개인회생 / 개인파산 / 새출발기금 / 신속채무조정 / 프리워크아웃 / 개인워크아웃
      ※ 기존 `bankruptcy` 라벨이 "파산"인데 가이드 표는 "개인파산" → **"개인파산"으로 통일 권장**
        (`CustomerProcedureBadge`의 축약 "파산"은 그대로 유지)
- [ ] `RECOMMENDED_PROCEDURE_ORDER`(:66-69) 6개
- [ ] `PROCEDURE_PROGRESS_STEP_TITLES`(:118-131) — 목록 "진행단계" 폴백.
      신규 4종은 단계명을 모르므로 **빈 배열**로 두고 `getProgressStepMeta`(:133-147)의
      `titles.length === 0` 방어가 "확인 중"으로 떨어지는지 동작 확인 (방어 코드는 이미 있음)
- [ ] `ProcedureStepTitlesByProcedure`(:112) / `DiagnosisHubSummary.progressStepsByProcedure`(:182)가
      `Record<RecommendedProcedure, …>`라 6키를 다 채워야 컴파일된다 → 초기화 코드 정리

### Step 1-3. `src/services/debtRelief.ts` — 매핑 제거

- [ ] `PROCEDURE_TO_ANALYSIS` / `PROCEDURE_FROM_ANALYSIS`(:87-95) **삭제**
- [ ] 호출부 정리: `:444`, `:547`, `:563`, `:660`, `:695`, `:732`, `:741`
- [ ] `getHubSummary`의 `progressStepsByProcedure` 초기화(:653-656) — 하드코딩 2키 →
      `RECOMMENDED_PROCEDURE_ORDER` 순회로 생성
- [ ] `CustomerLinkedAnalysisSection.tsx:29-31`의 **로컬 중복 사본** `PROCEDURE_FROM_ANALYSIS` 삭제

### Step 1-4. UI 후속 (타입 에러로 드러남)

- [ ] `DiagnosisBadges.tsx:62-65` `PROCEDURE_BADGE_STYLE` 6키 — **D-2 무채색 적용**
      제안: 개인회생/개인파산은 기존 색 유지, 신규 4종은
      `bg-neutral-20 text-neutral-80` (라이트) / `dark:bg-neutral-20/90 dark:text-neutral-90` 계열 단일 스타일.
      기존 폴백(`bg-neutral-20 text-neutral-70`)과 톤을 맞춰 "미정 상태"임이 드러나게 한다
- [ ] `CustomerProcedureBadge.tsx:6-9` `PROCEDURE_SHORT_LABEL` 6키 —
      회생 / 파산 / 새출발 / 신속조정 / 프리워크 / 개인워크 (배지 폭 제약, 4자 이내)
- [ ] `DiagnosisFilterModal.tsx:120-123` 절차 필터 칩 — 2개 → 6개, 줄바꿈 레이아웃 확인
- [ ] `SummaryCards.tsx:54-128` 진행단계 절차 셀렉트 6항목, 기본값(`:141`) `"individual_rehabilitation"`으로
- [ ] `SectionProcedureGuide.tsx:90-155` `ProcedureSelect` 6항목 (`:136` filter는 그대로 동작)
- [ ] `useDebtReliefHub.ts:78-82` URL 쿼리 파싱 — `RECOMMENDED_PROCEDURE_ORDER` 기반이라 자동 반영.
      **D-1 통일로 기존 `?procedure=individual_rehab` 링크는 무효**가 되지만 이미 방어 코드가 있어
      필터 미지정(전체 목록)으로 안전하게 떨어진다
- [ ] `ProcedureSelectModal.tsx` — `ScoreRow` 6행 렌더, 모달 높이/스크롤 확인
- [ ] `sms/templates.ts:23,54,108` — 절차 라벨 사용처. 신규 절차 문구가 어색하지 않은지 육안 검토
- [ ] `ResultDetailContent.tsx:87,167`, `ResultHeader.tsx:694,817` — 라벨 조회만 하므로 자동 반영

### Step 1-5. 새출발기금 자격 게이트

- [ ] `isOperatingBusiness=false`면 응답에 `fresh_start_fund` 키 자체가 없다.
      점수/조건분석/변제계획은 **Phase 2의 동적 맵 순회로 자연 해결**된다
- [ ] 반면 허브 **필터**와 절차 **전환 셀렉트**는 응답과 무관한 정적 목록이라 별도 판단:
  - 허브 필터 → 6종 전부 노출 (다른 케이스를 찾는 용도라 자기 케이스의 게이트와 무관)
  - 절차 전환 셀렉트 → **`scores` 키에 있는 절차로 제한** 권장
    (없는 절차로 추적 전환하면 점수·조건·변제계획이 전부 빈 화면이 됨)

---

## Phase 2 — analysisResult 동적 맵 대응 (Breaking #2)

Phase 1과 같은 PR (분리하면 중간 상태가 컴파일되지 않음).
**Q-A(키 표기) 미확정 상태에서 진행** — 가이드대로 스네이크케이스 가정.

### Step 2-1. 응답 타입 재정의 (`src/types/analysis.ts`)

- [ ] `AnalysisScores`(:180-183) → `Partial<Record<AnalysisProcedureType, number>>`
- [ ] `AnalysisProcedureConditionsMap`(:175-178) → `Partial<Record<AnalysisProcedureType, AnalysisProcedureConditions>>`
- [ ] `AnalysisResult.expectedRepayment`(:206) → `Partial<Record<AnalysisProcedureType, AnalysisExpectedRepayment>>`
      (`AnalysisExpectedRepayment` 자체는 항목 타입으로 존치)
- [ ] `AnalysisExpectedRepayment`에 `expectedExemptionWithInterest?: number` 추가 (#6)
- [ ] `AnalysisProcedureGuidesMap`(:244-247) → `Partial<Record<AnalysisProcedureType, AnalysisProcedureGuide>>`
- [ ] `AnalysisExpectedRepayment`의 "원 단위" 주석(:186-192)이 **틀렸다** — 실응답은 만원
      (`services/debtRelief.ts:829-830`에 2026-07-20 검증 기록 있음). 이번에 정정

> **`Partial`을 쓰는 이유**: 자격 게이트로 키가 빠질 수 있어 6키 전부 존재를 타입으로 보장하면
> 거짓말이 된다. `Partial`이면 접근부마다 undefined 처리가 강제되어 런타임 크래시를 컴파일 타임에 잡는다.

- [ ] **Q-A 대비 방어**: 응답 키를 읽는 지점을 헬퍼 하나(`pickProcedureEntry(map, procedure)`)로 모아,
      스네이크/카멜 두 표기를 모두 조회하게 해 두면 백엔드 표기가 어느 쪽이든 동작한다.
      키 표기 확정 후 헬퍼만 정리하면 되므로 **비용 대비 안전 마진이 크다 — 채택 권장**

### Step 2-2. 매핑 계층 (`src/services/debtRelief.ts`)

- [ ] `PROCEDURE_TO_SCORE_KEY`(:464-467) **삭제** (D-1 통일로 절차 코드 = 응답 키)
- [ ] `buildProcedureScores`(:556-570) — 고정 2키 → `Object.entries(scores)` 순회.
      정렬: **추천 절차 우선 + 점수 내림차순** (6개가 되면 점수순 정렬이 사실상 필수)
- [ ] `buildConditionAnalysisByProcedure`(:542-554) — 동적 맵 순회,
      반환 타입 `Partial<Record<RecommendedProcedure, ConditionItem[]>>`
- [ ] `getDiagnosisDetail`(:723~):
  - [ ] `successProbability`(:734) — 동적 키 접근 + `?? 0`
  - [ ] `recommendation.tags`(:807) — `procedureConditions[key].satisfied`.
        **현재 코드는 키가 없으면 런타임 TypeError.** optional 체이닝 필수
  - [ ] `conditionAnalysis`(:812-814) — 동일 처리
  - [ ] `conditionAnalysisByProcedure` 폴백(:817) `{ individual_rehab: [], bankruptcy: [] }` → `{}`
  - [ ] `guideKey`(:758-759) — 절차 코드 직접 접근
  - [ ] `repaymentPlan`(:831-840) — `expectedRepayment[절차]?.…`
        **표시 기준 절차 = `trackingProcedure`** (화면 나머지와 일관), 없으면 `recommendation` 폴백
- [ ] `types/debtRelief.ts:705` `DiagnosisDetail.conditionAnalysisByProcedure`도 `Partial`로

### Step 2-3. UI 후속

- [ ] `SectionProcedureScores.tsx:131` — `?? detail.conditionAnalysis` 폴백 이미 있음. 타입만 정합
- [ ] `SectionProcedureScores.tsx:157` — `grid-cols-1 md:grid-cols-2`에 6행 → 2열×3행.
      **D-2 방침상 레이아웃 임의 변경은 하지 않는다.** 현행 그리드 유지하고 시각 확인만,
      문제 있으면 스크린샷 첨부해 별도 보고
- [ ] `SectionProcedureGuide` — `procedureGuides`에 없는 절차 추적 시 `EMPTY_PROCEDURE_GUIDE`로
      떨어짐(:853-858, 방어 완료). Q-B 결과에 따라 "단계 안내 미제공" 문구 대체 검토
- [ ] `SectionRepaymentPlan.tsx` — 단일 절차(추적 절차) 기준 유지. Step 2-2 결정과 일치

---

## Phase 3 — overdueMonths + isOperatingBusiness (Breaking #5, #4)

Phase 1~2와 같은 PR. **Q-D(샘플사이트 버킷 vs 가이드 정수) 모순 — 가이드(정수)를 채택.**

### Step 3-1. `overduePeriod` → `overdueMonths`

**삭제 대상**
- [ ] `types/analysis.ts:45-50` `AnalysisOverduePeriod`
- [ ] `types/debtRelief.ts:360-367` `OverduePeriod` / `OVERDUE_PERIOD_OPTIONS`
- [ ] `services/debtRelief.ts:153-167` `OVERDUE_PERIOD_TO/FROM_ANALYSIS`
- [ ] `services/debtRelief.ts:478-484` `OVERDUE_MONTHS_ESTIMATE` — 정확값이 오므로 근사 불필요

**교체**
- [ ] `types/analysis.ts:119` `AnalysisFormInput.overduePeriod` → `overdueMonths: number`
- [ ] `types/debtRelief.ts:472,517` `DiagnosisFormState.overduePeriod` → **`overdueMonths: number | null`**
      (기본값 `null`. 아래 검증 항목 참고 — `number`로 두면 안 된다)
- [ ] `services/debtRelief.ts:325` `toAnalysisFormInput` → `overdueMonths: form.overdueMonths ?? 0`
- [ ] `services/debtRelief.ts:392` `fromAnalysisFormInput` → `overdueMonths: input.overdueMonths ?? 0` (Q-F 폴백)
- [ ] `services/debtRelief.ts:825` `debtStatus.overdueMonths` — 근사 → 실값 직접 사용

**UI**
- [ ] `Step3Debts.tsx:113-119` — `PillSelect`(5버킷) → **숫자 입력**.
      `FormControls.tsx`에 `MonthsInput` 추가 (`ManwonInput` 패턴 재사용, 단위 "개월", 0 이상 정수).
      샘플사이트의 보조 문구 **"여러 채무가 있으면 가장 긴 연체 기준으로"**를 hint로 유지
- [ ] `validateDiagnosisForm.ts:19, 51` — **현재 `if (!form.overduePeriod)`는 숫자 0이 falsy라
      "연체 없음(0개월)" 고객이 미입력으로 오판되어 제출이 막힌다.**
      → `if (form.overdueMonths === null)` 로 교체
- [ ] `DiagnosisCustomerInfoModal.tsx:58, 306-311` — `OVERDUE_FROM` 매핑 삭제,
      "연체기간" 행을 `${input.overdueMonths}개월`로 직접 표시
- [ ] `SectionDebtStatus.tsx:57` — 이미 `overdueMonths` 숫자 사용. 값만 정확해짐(변경 불필요)

### Step 3-2. `isOperatingBusiness` 추가

- [ ] `types/analysis.ts` `AnalysisFormInput`에 `isOperatingBusiness: boolean`
- [ ] `types/debtRelief.ts` `DiagnosisFormState`에 `isOperatingBusiness: boolean`,
      `createEmptyDiagnosisForm`(:500-536)에 `false`
- [ ] `services/debtRelief.ts` `toAnalysisFormInput`(:304-343) / `fromAnalysisFormInput`(:377-418) 양방향
- [ ] **폼 UI 배치: Step1 기본정보** (고용형태 인근).
      새출발기금 후보 여부를 가르는 값이고 "현재 또는 과거"라는 정의상 고용형태와 함께 묻는 게 자연스럽다.
      라벨 "사업 영위 이력" / 토글 문구 "현재 또는 과거에 사업을 영위한 적 있음"
- [ ] `validateDiagnosisForm`에는 **넣지 않는다** — boolean 기본값 `false` 자체가 유효한 입력
      (기존 토글 항목들과 동일 정책, `validateDiagnosisForm.ts:4-5` 주석 참고)
- [ ] `DiagnosisCustomerInfoModal` 고객정보 표시 행에 추가

---

## Phase 4 — 채무 입력 모드(간편/상세) + 이자 포함 필드 (#3, #6)

**D-3 확정: 백엔드 샘플사이트 동작을 기준으로 구현.** 아래는 샘플사이트에서 읽어낸 명세.

### 샘플사이트 UI 명세 (구현 기준)

**공통 — 「채무 내역」 카드**
- 카드 헤더 우측에 **간편 / 상세 세그먼트 토글**
- 카드 부제가 모드에 따라 바뀜:
  - 간편: "종류별 잔액만 빠르게 입력"
  - 상세: "채권처·상환방식·금리까지 상세 입력 (원 단위)"
- **「채무 발생 원인」 칩 그룹은 카드 바깥(아래)에 위치** — 두 모드 공유.
  현행 `Step3Debts`는 카드 내부에 있어 배치 조정 필요
- 좌측 사이드바 총 채무는 **모드와 무관하게 만원 단위**로 집계
  (샘플: 상세모드 합계 310,000,000원 → 사이드바 31,000만원)

**간편 모드** (현행과 거의 동일)
- 채무 종류 다중선택 칩 → 선택 항목만 금액 입력(만원, 2열 그리드)
- 안내 문구 "※ 해당 채무의 현재 잔액을 만원 단위로 입력하세요"
- 「총 채무 합계」 행
- 「연체 기간」 입력 (Phase 3에서 숫자 입력으로 교체)
- ⚠️ 샘플사이트는 채무 종류가 **6개(은행대출/카드론/캐피탈/저축은행/사채/개인차용)**인데
  API 슬롯은 5개뿐 → **Q-C 미해결. 현행 "캐피탈/저축은행" 통합 5종 유지**

**상세 모드**
- 채무 종류 칩 / 금액 그리드 / 총 채무 합계 / **연체 기간 입력 모두 사라짐**
  (연체는 행별 입력 → 서버가 최대값 자동 계산)
- 가로 스크롤 테이블. 열 순서:
  `채무종류(select) | 채권처(text) | 상환방식(select) | 연체(개월)(number) |
   대출일(date) | 만기일(date) | 금액(원) | 금리 | 기간 | 월불입 | 총이자 | 총상환`
- 하단 **`+ 행 추가`** 행
- 최하단 **합계 행** (원 단위, 예: `310,000,000원`)
- 테이블 자체에 가로 스크롤바 (프로젝트 규칙: 넓은 표는 `overflow-x: auto` 컨테이너 안에서 스크롤)

### Step 4-1. 타입 정의

- [ ] `types/analysis.ts`:
  ```ts
  export type AnalysisDebtInputMode = "simple" | "detailed";
  export type AnalysisDebtItemType =
    | "bank_loan" | "card_debt" | "capital_loan" | "private_debt" | "personal_borrowing";
  export type AnalysisRepaymentMethod =
    | "equal_principal_and_interest" | "equal_principal" | "bullet_payment" | "interest_only";
  export type AnalysisDebtItem = {
    id: string; debtType: AnalysisDebtItemType; creditorName: string;
    repaymentMethod: AnalysisRepaymentMethod; overdueMonths: number;
    loanDate?: string; maturityDate?: string;
    principalWon: number; interestRate: number; termMonths: number;
    monthlyPaymentWon: number; totalInterestWon: number; totalRepaymentWon: number;
  };
  export type AnalysisDebtDerivedSignals = {
    maxOverdueMonths: number; weightedAverageInterestRate: number;
    highInterestDebtRatio: number; totalInterestWon: number; totalRepaymentWon: number;
  };
  ```
- [ ] `AnalysisFormInput`에 `debtInputMode?: AnalysisDebtInputMode`, `debts?: AnalysisDebtItem[]`
- [ ] `AnalysisInputData`에 `debts?`, `debtDerivedSignals?`, `totalDebtWithInterest?` (상세모드 전용)
- [ ] `types/debtRelief.ts`에 상환방식 라벨 상수
      (원리금균등 / 원금균등 / 만기일시 / 이자만납입 — 샘플사이트 표기 "원리금균등", "만기일시" 준수)
- [ ] **채무종류 코드 매핑 주의**: 기존 폼 `DebtType`(:338-343)과 API `debts[].debtType` 값이 다르다
      (`card_loan`↔`card_debt`, `capital`↔`capital_loan`, `private_loan`↔`private_debt`).
      기존 `DEBT_TYPE_TO_BREAKDOWN_KEY`(:217-223)와 같은 위치에 매핑 테이블 추가

### Step 4-2. 단위 처리 (사고 다발 지점)

**`debts[]`의 금액만 원 단위, 나머지 폼 전체는 만원 단위.**

- [ ] 샘플사이트가 상세모드 입력·합계를 **원 단위로 직접 노출**하므로, 상세모드 행 입력은
      **원 단위 그대로** 받는다 (만원 변환 없음). 사이드바/총채무 표시에서만 `÷ 10000`
- [ ] 변환 헬퍼를 한 곳에 모을 것 — `wonToManwon()` / `manwonToWon()`.
      인라인 `* 10000`이 흩어지면 반드시 사고난다
- [ ] 원→만원 변환 시 반올림 정책 확정 (샘플: 310,000,000원 → 31,000만원, 정확히 나눠떨어짐).
      나머지가 있는 경우 `Math.round` 권장

### Step 4-3. 폼 UI (`Step3Debts.tsx`)

- [ ] 「채무 내역」 카드로 감싸고 헤더에 간편/상세 세그먼트 토글 + 모드별 부제
- [ ] 「채무 발생 원인」을 카드 바깥으로 이동
- [ ] 상세모드 테이블 컴포넌트 신설 (행 추가/삭제, `id`는 `crypto.randomUUID()`)
- [ ] 상세모드에서 채무종류 칩 / 금액 그리드 / 총 채무 합계 / 연체기간 **숨김**
- [ ] `DiagnosisFormState`에 `debtInputMode`, `debts: DebtItemFormState[]` 추가 +
      `createEmptyDiagnosisForm` 기본값 (`"simple"`, `[]`)
- [ ] `useDiagnosisForm.ts`의 `DiagnosisDerivedValues.totalDebtManwon` 계산 모드별 분기
      (상세: `debts[].principalWon` 합 ÷ 10000)
- [ ] `validateDiagnosisForm.ts` — 상세모드는 `debts.length >= 1` + 행별 필수값으로 대체.
      `getOverLimitDebtFields`(담보부/최근3개월/최근1년 합 ≤ 총채무) 검증도 모드별 확인
- [ ] 모바일(<780px) — 12열 테이블이 성립하지 않는다. 가로 스크롤 유지 or 카드형 폴백.
      **레이아웃 방식은 임의 결정하지 않고 구현 중 스크린샷으로 확인받는다**
      (프로젝트 브레이크포인트: md=780 / lg=1080, JS 분기는 `useIsMobile()`)

### Step 4-4. 이자 포함 필드 표시 (#6)

- [ ] `types/debtRelief.ts` `DebtStatusSummary`에 `totalDebtWithInterestManwon?: number`
- [ ] `RepaymentPlan`에 `exemptedDebtWithInterestManwon?: number`
- [ ] `services/debtRelief.ts` `getDiagnosisDetail`에서 매핑 (없으면 `undefined`)
- [ ] `SectionDebtStatus.tsx:44` 총 채무 옆 "(이자 포함 N만원)" 병기
- [ ] `SectionRepaymentPlan.tsx:182` 예상 면책 채무 옆 동일 형태 병기
- [ ] **간편모드 건은 필드 자체가 없다 → 조건부 렌더로 완전히 숨김.** "0" 또는 "-" 표시 금지
- [ ] `debtDerivedSignals`는 화면 정의가 없어 **이번엔 표시하지 않는다** (타입만 정의, Q-E 보류)

---

## Phase 5 — 채무 정보 수정 API (#7) — **보류**

**D-4: 디자인 미수령으로 이번 범위 제외.** 아래는 디자인 도착 시 착수할 항목만 남겨둔다.

- `PATCH /v1/analysis/{id}/debts` 서비스 함수 (`reanalyze: true`면 LLM 호출 → `timeoutMs: 120000`)
- 허용 상태가 기존 `canEditDiagnosisInfo`(`types/debtRelief.ts:43-53`)와 **동일** → 그대로 재사용 가능
- `reanalyze: true`는 되돌릴 수 없음(상태 초기화·채팅 삭제·절차추적 초기화) → 확인 모달 필수
- 참고: 기존 재진단 경로(`PATCH /:id/input`)에도 확인 모달이 **없는 게 이미 미해결 이슈**로
  `services/debtRelief.ts:82-84`에 기록돼 있다. Phase 5 때 함께 처리 검토

> Phase 4에서 상세/간편 입력 UI를 **독립 컴포넌트로 추출**해 두면 Phase 5의 수정 모달이
> 그대로 재사용할 수 있다. 지금 만들 때 이 점을 염두에 둘 것.

---

## Phase 6 — 검증

### Step 6-1. 정적 검증
```bash
npx tsc --noEmit
npx eslint src/
```
`npm run build`는 dev 서버 실행 중이면 돌리지 않는다(`.next` 충돌) — 사전 확인 후에만.

### Step 6-2. 수동 QA

결과는 `docs/ANALYSIS_API_QA_CHECKLIST.md` §2 형식으로 번호를 이어 기록한다.

| # | 시나리오 | 확인 포인트 |
|---|---|---|
| Q1 | 간편모드 + `isOperatingBusiness=false` 생성 | `fresh_start_fund` 미노출, 나머지 5종 점수 카드 렌더 |
| Q2 | 간편모드 + `isOperatingBusiness=true` | 6종 전부 노출 |
| Q3 | **연체 0개월** 입력 후 제출 | 필수값 검증에서 "연체기간 미입력"으로 막히지 않을 것 |
| Q4 | 상세모드 채무 3건 입력 후 생성 | `debtBreakdown` 자동 집계가 화면 총채무와 일치, `overdueMonths`가 최대 연체개월로 채워짐 |
| Q5 | 상세모드 건 결과 화면 | "이자 포함" 값 병기 |
| Q6 | 간편모드 건 결과 화면 | "이자 포함" 영역 **완전 숨김** (0 표시 금지) |
| Q7 | 신용회복 절차로 `trackingProcedure` 전환 | 절차안내 섹션이 빈 상태로 깨지지 않을 것 |
| Q8 | 마이그레이션 전 기존 분석 건 상세 진입 | 레거시 절차값·`overduePeriod` 데이터에서 크래시 없을 것 |
| Q9 | 허브 절차 필터 6종 | 각 절차 필터링 정상, URL 쿼리 복원 정상 |
| Q10 | 고객목록/상세 절차 배지 | 신규 4종 축약 라벨이 배지 폭을 깨지 않을 것 |
| Q11 | 상세↔간편 모드 전환 | 전환 시 입력값 손실 동작이 의도대로인지(경고 필요 여부) |
| Q12 | 모바일(<780px) 상세 채무 테이블 | 페이지 본문이 가로 스크롤되지 않고 표 안에서만 스크롤될 것 |
| Q13 | 실응답 키 표기 대조 (**Q-A 검증**) | `scores` 키가 스네이크/카멜 중 어느 쪽인지 네트워크 탭에서 확인 |

### Step 6-3. 에러 처리
- [ ] `isOperatingBusiness` 누락 400 — 프론트 검증으로 방지하되, 발생 시
      **서버 메시지·에러 코드를 UI에 노출하지 않는다**(CLAUDE.md 최우선 규칙).
      `console.error`로 개발자 로깅 + 일반 친화 문구만
- [ ] 상세모드 `debts` 빈 배열 제출 차단 (프론트 검증)

---

## 부록 A — 영향 파일 (22개)

**핵심 3** — `src/types/analysis.ts` / `src/types/debtRelief.ts` / `src/services/debtRelief.ts`

**폼** — `form/Step3Debts.tsx`, `form/validateDiagnosisForm.ts`, `form/FormControls.tsx`(MonthsInput),
`form/useDiagnosisForm.ts`, `form/Step1BasicInfo.tsx`(isOperatingBusiness)

**결과** — `result/SectionProcedureScores.tsx`, `result/SectionProcedureGuide.tsx`,
`result/SectionRepaymentPlan.tsx`, `result/SectionDebtStatus.tsx`, `result/ProcedureSelectModal.tsx`,
`result/ResultDetailContent.tsx`, `result/ResultHeader.tsx`, `result/DiagnosisCustomerInfoModal.tsx`,
`result/AnalysisReviewBanner.tsx`, `result/FeePaymentInfoModal.tsx`, `result/sms/templates.ts`

**허브** — `DiagnosisBadges.tsx`, `hub/SummaryCards.tsx`, `hub/DiagnosisFilterModal.tsx`,
`hub/DiagnosisFilterAppliedChips.tsx`, `hub/DiagnosisFilterTrigger.tsx`, `hub/DiagnosisTable.tsx`,
`hooks/useDebtReliefHub.ts`

**고객** — `customers/CustomerProcedureBadge.tsx`, `customers/detail/CustomerLinkedAnalysisSection.tsx`,
`types/customers.ts`

**서비스(부수)** — `src/services/analysis.ts`

---

## 부록 B — 리스크

| 리스크 | 영향 | 완화 |
|---|---|---|
| Swagger가 구 스펙 → 가이드 텍스트만 근거 | 키 표기·필드명이 실제와 다를 수 있음 | Q-A 대비 키 조회 헬퍼 단일화, 배포 전 실응답 대조(Q13) |
| `normalizeProcedureType`이 신규 4종을 개인회생으로 뭉갬 | 6종 확장 전체 무력화 | Phase 1-1 최우선 수정 |
| Breaking 3건 배포 타이밍 어긋남 | 진단 생성/재진단 전면 400 | Phase 1~4 단일 PR + 백엔드와 배포 시각 합의 |
| `debts[]` 원/만원 혼동 | 금액 10,000배 오차 | 변환 헬퍼 단일화, QA Q4 실값 대조 |
| 연체 0개월 falsy 오판 | "연체 없음" 고객 제출 불가 | `number \| null` 설계 + QA Q3 |
| `procedureConditions[key]` 부재 접근 | 결과 화면 런타임 크래시 | 응답 타입 `Partial`로 컴파일러 강제 |
| 저축은행 슬롯 부재(Q-C) | 샘플사이트와 종류 목록 불일치 | 현행 통합 5종 유지, 백엔드 회신 후 조정 |
| 구 데이터(`overduePeriod` only) 호환(Q-F) | 기존 건 표시 오류 | `?? 0` 폴백 + QA Q8 |

---

## 부록 C — 스펙 대조 중 발견한 기존 불일치 (이번 범위 밖, 별건 처리 후보)

Swagger 대조 과정에서 이번 변경과 무관하게 드러난 항목. **이번 작업에서는 건드리지 않는다.**

1. **`ConnectableCustomer.assignedMember` 구조 불일치 — 실동작 버그 가능성**
   Swagger: `{ id, name, teamId, teamName }` (평면)
   현행 타입/코드: `{ id, name, team?: { id, name } }` (중첩) — `CustomerMatchModal.tsx:56`이
   `customer.assignedMember?.team?.name`을 읽으므로 **담당팀이 항상 `-`로 표시될 수 있다.**
   → 고객 매칭 모달에서 담당팀 열이 비어 있는지 확인 필요
2. `AnalysisDetail` / `AnalysisListItem`에 Swagger에는 있고 우리 타입에는 없는 필드:
   `lawyerProjectLogoUrl`, `deliveredAt` (현재 미사용이라 무해)
3. `AnalysisDelivery`에 `contact` 필드 추가됨 (미사용)
4. `GET /v1/analysis/procedures` 응답이 Swagger 예시상 **단일 객체**인데 우리 타입은 배열
   (`types/analysis.ts:669-671`에 이미 "실응답 확인 필요"로 주석 있음 — 여전히 미해결)
