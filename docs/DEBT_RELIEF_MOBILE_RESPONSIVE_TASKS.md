# /debt-relief 모바일 반응형 작업 Task 문서

## 0. 배경

Figma 모바일 기획(375px, iPhone 프레임 7장)을 기반으로 `/debt-relief` 및 하위 페이지의 모바일 반응형 작업을 정리한다. 제공된 프레임은 다음과 같이 매핑된다.

| 프레임 | 내용 | 대응 페이지/컴포넌트 |
|---|---|---|
| #1 (데스크톱, 참고용) | 진단 목록 허브 | `src/app/debt-relief/page.tsx` |
| #2 | 진단 결과 상세 (개인회생 78/100) | `src/app/debt-relief/[id]/page.tsx` |
| #3 | 새 진단 - 1/5 기본정보 (요약 드로어 접힘) | `src/app/debt-relief/new/page.tsx` |
| #4 | 새 진단 - 1/5 기본정보 (요약 드로어 펼침) | 〃 |
| #5 | 새 진단 - 2/5 자산 현황 | 〃 |
| #6 | 새 진단 - 3/5 채무 현황 | 〃 |
| #7 | 새 진단 - 4/5 소득/지출 | 〃 |
| #8 | 새 진단 - 5/5 기타사항 | 〃 |

**⚠️ 허브(목록) 페이지의 모바일 목업은 제공되지 않았다.** #1은 데스크톱 화면이며, 모바일 리스트 UI에 대한 별도 디자인 확인이 필요하다 (§3 참고).

### Phase 요약

| Phase | 범위 | 규모 | 선행 조건 |
|---|---|---|---|
| **Phase 1** (§1) | 진단 결과 상세 페이지 | 중 — 대부분 [CSS] 보정, 헤더 액션만 컴포넌트 분리 | 없음, 바로 착수 가능 |
| **Phase 2** (§2) | 폼 마법사 — 모바일 셸(요약 드로어·상단 바·하단 액션바) | 대 — [컴포넌트 분리] 3건 신설 + 공유 조각 추출 | §2.3 X 버튼 동작 디자인 컨펌 |
| **Phase 2.5** (§2.5) | 폼 마법사 — 스텝 콘텐츠(Step1~5) 반응형 보정 | 소~중 — [CSS]만, Step별 필드 배치 조정 | 없음. Phase 2 완료 전에도 병행 가능 |
| **Phase 3** (§3) | 진단 목록 허브 페이지 | 소~중 (옵션에 따라 다름) | §3.1 모바일 리스트 방향(테이블 유지 vs 카드형) 디자인 컨펌 |
| **Phase 4** (§4~5) | 공통 점검 + 전 페이지 검증 | 소 — 각 Phase 완료 후 QA 성격 | Phase 1~3(2.5 포함) 완료 |

Phase 1 → 2 → 2.5 → 3 → 4 순으로 착수 권장(이유는 하단 "제안 우선순위" 참고). Phase 2(셸)와 Phase 2.5(스텝 콘텐츠)는 서로 다른 파일을 건드리므로 순서를 바꾸거나 병행해도 무방 — 나누는 이유는 "폼 전체를 감싸는 구조 변경"과 "필드 단위 CSS 보정"의 위험도·리뷰 단위가 달라서다. Phase 2는 §2.3 X 버튼 동작만 컨펌되면 바로 시작 가능하고, Phase 2.5는 선행 조건 없이 지금 바로 시작해도 된다.

### 현재 구현 상태 요약

- `md:` 접두사(Tailwind, 768px 기준 mobile-first)가 이미 부분 적용되어 있음: `DebtReliefHubContent`, `DiagnosisFormContent`, `FormSidebar`, `Step1BasicInfo`, `Step3Debts`, `Step4IncomeExpense`, `ResultDetailContent`, `ResultAnchorNav`, `SectionAiRecommendation`, `SectionCard`, `SectionDebtStatus`, `SectionProcedureGuide`, `SectionProcedureScores`, `SectionRepaymentPlan`, `DebtReliefSmsModal`, `SummaryCards`, `DiagnosisSearchInput`.
- 반응형 클래스가 전혀 없는 파일(모바일 미검증): `DiagnosisBadges`, `DiagnosisTable`, `DiagnosisFilterTabs`, `FormControls`, `FormToggle`, `PillSelect`, `Step2Assets`, `Step5Others`, `ResultHeader`, `SuccessDonut`.
- 브레이크포인트 기준은 기존 컨벤션(Tailwind `md`)을 그대로 따른다. CLAUDE.md에 명시된 줌 정책(데스크톱 0.8 / 모바일 1.0)은 미들웨어 UA 감지 기반으로 별도 처리되므로, 이번 작업은 뷰포트 폭 대응(CSS)에 집중한다.

---

## 0-1. 작업 방식 판단 기준: CSS 반응형 vs 별도 컴포넌트(조건부 렌더링)

이번 작업 대상을 훑어보면 단순히 Tailwind 클래스로 크기/배치만 조정하면 되는 항목과, **모바일에서 아예 다른 인터랙션/상태를 갖는 기능**이라 별도 컴포넌트로 분리해야 하는 항목이 섞여 있다. 후자를 CSS만으로 욱여넣으면 조건 분기가 컴포넌트 내부에 누적되어 유지보수가 어려워지므로, 아래 기준으로 미리 나눠서 작업한다.

- **[CSS]** 레이아웃 크기·배치·줄바꿈만 다름 (같은 마크업, 같은 상태). `grid-cols-1 md:grid-cols-2`, `hidden md:block` 등으로 충분.
- **[컴포넌트 분리]** 모바일에서 별도의 로컬 상태(열림/닫힘 등)를 갖거나, 버튼 구성·인터랙션 자체가 다르거나, `position: fixed` 등 문서 흐름을 벗어나는 배치가 필요한 경우. 데스크톱 컴포넌트를 그대로 두고 모바일 전용 컴포넌트를 새로 만들어야 한다.

**기존 코드베이스에 이미 이 패턴의 선례가 있다.** `src/components/layout/Header.tsx`는 데스크톱 내비게이션(`hidden md:flex`)과 완전히 다른 구조의 `MobileDrawer`(`md:hidden`, 햄버거 버튼 + 슬라이드 드로어) 컴포넌트를 **둘 다 마운트한 상태로 CSS로만 토글**한다. JS `isMobile` 상태값으로 아예 다른 트리를 조건부 렌더링하지 않는 이유는 SSR/CSR 하이드레이션 불일치와 초기 렌더 깜빡임을 피하기 위함이다 — 이번 작업도 이 컨벤션을 따른다:

```tsx
// 두 컴포넌트를 모두 렌더링하고 CSS로만 토글 (권장)
<FormSidebar className="hidden md:block" ... />
<MobileFormSummaryDrawer className="md:hidden" ... />
```

즉 "별도 컴포넌트로 분리"가 곧 "JS 조건부 렌더링"을 의미하지는 않는다 — **컴포넌트 파일은 분리하되, 마운트 자체는 CSS `hidden`/`md:hidden`으로 토글**하는 것이 기본 원칙이다. 다만 모바일 드로어처럼 열림/닫힘을 다루는 로컬 `useState`는 해당 모바일 컴포넌트 내부에 캡슐화하면 되므로 하이드레이션 문제와 무관하다.

---

## Phase 1 · 진단 결과 상세 페이지 (Frame #2)

대상: `ResultDetailContent`, `ResultHeader`, `ResultAnchorNav`, `SectionAiRecommendation`, `SectionProcedureScores`, `SectionDebtStatus`, `SectionRepaymentPlan`, `SectionCounselMents`, `SectionProcedureGuide`, `SectionSmsSend`

이미 세로 카드 스택 + 앵커 내비게이션 구조라 전체 골격은 모바일 친화적이다. 대부분 [CSS] 보정으로 끝나지만, 헤더 액션 영역은 컴포넌트 분리가 필요하다.

**⚠️ 이중 여백 원칙 (모바일):** 허브와 동일 — 바깥 컨테이너는 `px-0`, 콘텐츠 여백은 `SectionCard` 내부 padding(`px-5`) 한 곳에서만. 페이지 `px-4` + 카드 `px-6`이 겹치면 화면이 과도하게 좁아진다.

- [x] **1.1 ResultHeader — [컴포넌트 분리]** 데스크톱 버튼 그룹(`정보수정`/`목록`/`저장하기`)은 `hidden md:flex`로 유지. 모바일은 Figma 스펙대로 뒤로+제목/메타(세로) | 수정·공유(초록 테두리)·저장(다크) 아이콘 3버튼. 공유는 `AnalysisShareModal` 연동. (초기 ⋯ 드롭다운 가정은 Figma와 달라 폐기)
- [x] **1.2 ResultAnchorNav — [CSS]** 가로 스크롤 유지, `scrollbar-hide`. 모바일 바깥 `px` 제거(카드와 정렬·이중 여백 방지), 탭 자체 `px-4`로 가장자리 여유.
- [x] **1.3 SectionAiRecommendation / SuccessDonut — [CSS]** Figma 모바일은 제목·설명·태그(좌) + 도넛(우) 가로 배치 유지(세로 스택 아님). 모바일 도넛 112px. `SuccessDonut` gradient id를 `useId`로 고유화해 이중 마운트 충돌 방지. SectionCard padding 변경에 맞춰 `-mx-5`/`px-5` 페어 유지.
- [x] **1.4 SectionProcedureScores — [CSS]** ScoreRow 라벨 컬럼 `88px→120px(md)`, padding/gap 축소. 조건분석 카드 헤더 `flex-wrap`. 모바일 행 간격 축소.
- [x] **1.5 SectionDebtStatus — [CSS]** 2x2 지표 그리드, 모바일 숫자 `24px→28px(md)`, gap 축소.
- [x] **1.6 SectionRepaymentPlan — [CSS]** 변제 요약/면책채무 카드 padding `px-5→px-8(md)`로 축소.
- [x] **1.7 SectionCounselMents — [CSS]** 멘트 카드·AI 채팅 카드 padding `px-4→px-7(md)`로 축소.
- [x] **1.8 SectionProcedureGuide — [CSS]** 모바일에서 현황 카드(`aside`)를 아코디언 위로(`order`), 현재단계|남은기간 2열, 미니 스테퍼는 현재+다음만 노출(데스크톱은 전체). SMS 버튼 모바일 아이콘만. 배지 `절차 · N단계`.
- [x] **1.9 SectionSmsSend — [CSS]** 기존 `flex-wrap`으로 충분, 변경 불필요.
- [x] **1.10 — [CSS]** `ResultDetailContent` 모바일 `px-0`(이중 여백 제거) + `gap-3 md:gap-9` + `env(safe-area-inset-bottom)`. `SectionCard` 모바일 `px-5 py-6`.

---

## Phase 2 · 폼 마법사 — 모바일 셸(shell) 구조 (Frame #3, #4)

대상: `DiagnosisFormContent`, `FormSidebar`

**컴포넌트 분리가 필수인, 이 문서에서 가장 리스크가 큰 영역.** 데스크톱은 좌측 고정 사이드바(`FormSidebar`, 상시 펼침) + 우측 폼 2열 구조지만, Figma 모바일은 접었다 펼치는 요약 드로어 + 단일 컬럼 폼 + 하단 고정 액션바로 **기능 자체가 다르다** — 단순 리사이즈가 아니라 "항상 보이는 정보"와 "탭해서 펼치는 정보"가 나뉘는 별도 UX이므로 CSS만으로는 구현 불가능하다. `DiagnosisFormContent`의 레이아웃 뼈대를 바꾸는 작업이라 Step 콘텐츠(Phase 2.5)와 분리했다.

- [x] **2.1 모바일 전용 요약 드로어 신설 — [컴포넌트 분리]** `MobileFormSummaryDrawer` 신규 컴포넌트로 구현. 상단 바("N/5 스텝명" + 분석하기 pill + 닫기 X)와 접이식 드로어를 하나의 컴포넌트로 합쳤다(2.2·2.3 포함) — 챕터 아이콘 클릭 시 열리는 드로어가 상단 바와 동일한 로컬 `expanded` 상태를 공유해 별도 파일로 쪼개는 이점이 없었기 때문. 고객 요약/재무 요약/스텝 체크리스트는 `FormCustomerSummary`, `FormFinancialSummary`, `FormStepChecklist`로 추출해 `FormSidebar`(데스크톱)와 `MobileFormSummaryDrawer`(모바일)가 공유.
- [x] **2.2 상단 바 — [컴포넌트 분리]** `MobileFormSummaryDrawer` 상단 고정 바에 통합 구현(위 2.1 참고). "분석하기"는 그라디언트 pill 버튼(`bg-gradient-to-r from-[#A1FF8B] to-[#3F93FF]`)으로 데스크톱의 이미지 배경 버튼과 별도 제작.
- [x] **2.3 닫기(X) 동작 확정** 사용자 확인 완료 — 현재 스텝과 무관하게 항상 이전 페이지(신규 등록이면 `/debt-relief` 허브, 수정이면 `/debt-relief/{id}` 상세)로 이동. `DiagnosisFormContent`의 기존 `goBack`의 `isFirst` 분기와 동일한 목적지를 `handleClose`로 재사용.
- [x] **2.4 하단 액션바 — [컴포넌트 분리]** `FormMobileActionBar` 신규 컴포넌트. `position: fixed bottom-0` + `env(safe-area-inset-bottom)`. 데스크톱 버튼 그룹은 `hidden md:flex`로 전환, 클릭 핸들러(`goBack`/`goNext`)는 `DiagnosisFormContent`에서 그대로 내려받아 로직 중복 없음. 액션바에 가리지 않도록 폼 컨테이너에 `pb-[88px] md:pb-12` 추가.
- [x] **2.5** 상단 바 sticky 처리로 결정 — `sticky top-[54px] z-30`(전역 헤더 54px 아래 고정, `ResultAnchorNav`의 `fixed top-[54px]` 컨벤션과 동일 오프셋 기준). 스크롤 중에도 분석하기 버튼과 스텝 표시가 항상 보이도록.

### 2-x. 컴포넌트 구조 변경 요약 (실제 구현)

```
DiagnosisFormContent
├─ MobileFormSummaryDrawer  (신규, md:hidden 내부 처리, sticky top-[54px])
│   ├─ FormCustomerSummary   (FormSidebar와 공유, 추출)
│   ├─ FormFinancialSummary  (FormSidebar와 공유, 추출)
│   └─ FormStepChecklist     (FormSidebar와 공유, 추출)
├─ FormSidebar               className="hidden md:block"   (공유 조각 사용하도록 리팩터링)
├─ (Step 헤더) 데스크톱 전용 hidden md:flex — 모바일은 MobileFormSummaryDrawer가 대신함
├─ Step1~5 (Phase 2.5에서 [CSS] 보정 완료)
├─ (하단 액션) 데스크톱 전용 hidden md:flex
└─ FormMobileActionBar       (신규, md:hidden 내부 처리, fixed bottom-0)
```

---

## Phase 2.5 · 폼 마법사 — 스텝 콘텐츠(Step1~5) 반응형 보정 (Frame #3~8 내부 필드)

대상: `Step1BasicInfo` ~ `Step5Others`, `FormControls`, `PillSelect`, `FormToggle`

Phase 2의 셸(요약 드로어/상단 바/하단 액션바)과 달리 **마크업·상태 변경 없이 필드 배치만 조정하는 [CSS] 작업**이라 리스크가 낮고, Phase 2 완료를 기다리지 않고 바로 시작하거나 병행해도 된다. Step 컴포넌트는 셸 안쪽에 그대로 끼워지므로 순서는 상관없다.

- [x] **2.5.1 Step 컴포넌트별 — [CSS]**
  - `Step1BasicInfo`: `grid-cols-1 md:grid-cols-2` 확인, `FormField`/`PillSelect`/`TextInput`이 이미 `w-full`·`flex-wrap` 기반이라 별도 수정 불필요.
  - `Step2Assets`: `PillMultiSelect`(부동산 보유 여부)와 `PillSelect`(금융자산/차량 보유) 모두 공용 `PillSelect.tsx`의 `flex-wrap` 덕에 이미 정상 동작 확인 — 수정 불필요. 부동산 시가 입력 그리드도 `grid-cols-1 md:grid-cols-2`로 이미 대응됨.
  - `Step3Debts` / `Step4IncomeExpense`: 채무종류 다중선택 pill, 금액 입력 그리드(`md:grid-cols-2`, `md:grid-cols-3`) 모두 정상. `DebtToggleRow`의 라벨 span에 `flex-1 min-w-0`이 빠져 있어 긴 라벨("최근 2년 내 재산 처분 이력 있음")이 좁은 화면에서 토글 스위치를 밀어낼 수 있는 버그를 발견해 수정.
  - `Step5Others`: `ToggleDetailRow`도 동일한 라벨 wrap 버그가 있어 함께 수정. `FormToggle` 자체에 `shrink-0`이 없어 좁은 flex 행에서 눌릴 수 있던 것도 함께 고침(모든 Step 토글에 공통 적용됨).
- [x] **2.5.2** `/debt-relief/new`, `/debt-relief/[id]/edit` 모두 `DiagnosisFormContent`를 공유하므로 위 수정이 자동 반영됨 — 실기기 수정 모드(기존 데이터 프리필) 렌더링은 사용자 확인 필요.

---

## Phase 3 · 진단 목록 허브 페이지 — 디자인 미확정 영역

대상: `DebtReliefHubContent`, `DiagnosisTable`, `SummaryCards`, `DiagnosisFilterTabs`, `DiagnosisSearchInput`

- [x] **3.1 디자인 방향 결정** — 옵션 (a) 가로 스크롤 테이블 유지로 확정. 실 Figma 모바일 목업이 없는 상태에서 카드형(b)을 지금 새로 설계하면 추후 실제 스펙이 나왔을 때 다시 갈아엎을 가능성이 높아, 이미 구현되어 있고 작업량이 거의 없는 (a)를 선택. `DiagnosisTable`은 변경 없이 유지(`overflow-x-auto` + `min-w-[960px]`). 카드형 전환은 실제 모바일 디자인이 나오면 별도 작업으로 재검토.
- [x] **3.2 SummaryCards — [CSS]** `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`로 이미 모바일에서 세로 스택 확인, 카드 내부 padding도 375px 기준으로 여유 있어 수정 불필요.
- [x] **3.3 DiagnosisFilterTabs / DiagnosisSearchInput — [CSS]** 둘 다 이미 `flex-wrap`/`w-full md:w-[260px]`로 모바일 대응됨, 수정 불필요.
- [x] **3.4 — [CSS]** 상단 타이틀+"새 진단 시작" 버튼 행을 `flex-col md:flex-row`로 전환(모바일에서 줄바꿈 시 버튼과 겹치던 문제 해결). "전체 N건 선택됨 / 공유하기 / 선택해제" 액션바에 `flex-wrap` 추가(고정 한 줄이라 좁은 화면에서 넘칠 수 있었음).

---

## Phase 4 · 공통 점검

브라우저 자동화/스크린샷 도구와 로그인 세션이 없는 환경이라 실제 렌더링 확인은 불가능 — 대신 코드 레벨 정적 감사(픽셀 값 계산, `dark:` 토큰 추적)로 진행했다.

- [x] **터치 영역(44px) 검증 — 실제 버그 수정**
  - `MobileFormSummaryDrawer.tsx`(모바일 전용, 데스크톱 영향 없음): 분석하기 32px→36px, 닫기 X 28px→36px, 펼치기 화살표 28px→32px로 확대.
  - `DiagnosisSearchInput.tsx`: 검색 버튼이 최근 변경으로 (플레이스홀더 안내 + Enter/클릭 검색 방식으로) 실제 클릭 가능한 컨트롤이 됐는데 히트박스가 아이콘 크기(18×18px)에 그쳐 있었음 — 이미 확보돼 있던 입력창 우측 여백(`pr-9`, 36px)만큼 버튼 히트박스를 확장(`h-full w-9`)해 시각적 위치 변화 없이 36×38px로 개선.
- [x] **터치 영역 — 보고만 하고 미수정 (데스크톱과 공유하는 값이라 임의 변경 안 함)**
  - `PillSelect.tsx` 옵션 pill: `h-[40px]` — 44px 미만이지만 데스크톱 Figma 스펙과 동일한 값이라 모바일 작업 범위에서 변경하지 않음.
  - `FormToggle.tsx` 스위치: `w-10 h-6`(24px) — `UserMenuDropdown.tsx`의 다크모드 토글과 동일한 사이트 전역 컨벤션. debt-relief 범위를 넘는 공용 컴포넌트라 미변경.
  - `DiagnosisTable.tsx` 행 체크박스(18px, 히트박스 확장 없음) — Phase 3에서 "데스크톱 테이블을 모바일에서도 가로 스크롤로 유지"하기로 한 결정의 자연스러운 결과. 카드형 UI로 전환하기 전까지는 손대기 애매해 보류.
  - `DiagnosisBadges.tsx`(ProcedureBadge, ProgressStepIndicator) — 클릭 불가능한 표시 전용 `<span>`이라 터치 영역 대상 아님, 확인만 하고 통과.
- [x] **라이트/다크 모드 회귀 확인 — 실제 버그 1건 발견 및 수정**
  - `MobileFormSummaryDrawer.tsx`의 "분석하기" 그라디언트 버튼이 `text-neutral-90`을 사용하고 있었는데, 이 토큰은 라이트모드 `#252525`(어두운색) ↔ 다크모드 `#f5f5f5`(거의 흰색)로 반전되는 값이다. 배경 그라디언트(`#A1FF8B→#3F93FF`)는 테마와 무관하게 항상 밝은 색 고정이라, 다크모드에서 텍스트가 거의 보이지 않게 되는 버그였음 → 고정 색상 `text-[#1A1A1A]`로 교체.
  - debt-relief 전체에서 hardcoded hex 배경(`bg-[#...]`, `from-[#...]`)을 쓰는 다른 파일(`AnalysisShareModal`, `CustomerMatchModal`, `DebtReliefPhonePreview`, `DebtReliefSmsModal`)도 확인했으나 모두 `dark:` 오버라이드가 있거나 고정 hex 텍스트 조합이라 문제없음.
- [x] **`position: fixed` 요소의 하단 safe-area 처리 확인**
  - `FormMobileActionBar`(fixed bottom bar): `env(safe-area-inset-bottom)` 적용 확인.
  - `ResultHeader`의 모바일 `⋯` 드롭다운은 화면 하단이 아니라 버튼 바로 아래 뜨는 요소라 safe-area와 무관 — Phase 1 작성 시점의 문서 문구가 부정확했던 것을 정정.
  - iOS Safari / Android Chrome **실기기 확인은 여전히 필요** — 이 항목만 코드 감사로 대체 불가.

## 5. 검증 체크리스트

- [ ] 375 / 390 / 430px 뷰포트에서 각 페이지 스크린샷을 Figma와 대조. — **실기기/브라우저 확인 필요, 코드 감사로 대체 불가**
- [x] 의도치 않은 가로 스크롤 발생 요소 없는지 확인 — Phase 1(SectionAiRecommendation `min-w` 버그), Phase 3(옵션 a로 허브 테이블은 의도된 가로 스크롤 유지) 과정에서 확인·수정 완료.
- [x] 터치 타겟 44px 이상 — 위 Phase 4 항목에서 감사·수정 완료(일부는 공유 컴포넌트라 보고만 함).
- [x] [컴포넌트 분리] 항목 중복 실행 확인 — `MobileFormSummaryDrawer`/`FormSidebar`, `FormMobileActionBar`/데스크톱 버튼 그룹 모두 부모(`DiagnosisFormContent`)에서 동일 데이터·핸들러를 내려받는 구조라 중복 API 호출 없음.

## 제안 우선순위

1. **결과 상세 페이지 (Phase 1)** — 대부분 [CSS] 보정, 헤더 액션 메뉴(1.1)만 컴포넌트 분리. 가장 빠르게 완성 가능.
2. **폼 마법사 셸 구조 (Phase 2)** — [컴포넌트 분리] 3건(요약 드로어, 상단 바, 하단 액션바) + 공유 조각 추출이 필요해 이 문서에서 리스크·작업량이 가장 큼. 착수 전 X 버튼 동작(§2.3) 컨펌 필요.
3. **폼 마법사 스텝 콘텐츠 보정 (Phase 2.5)** — [CSS]만, 선행 조건 없음. Phase 2와 병행하거나 먼저 끝내도 무방.
4. **허브 리스트 (Phase 3)** — 모바일 목업이 없으므로 디자인 컨펌(§3.1) 후 착수, 옵션(a) 선택 시 작업량 거의 없음.
