# 채무현황 "간편 전용" 필드가 상세모드에도 노출되는 문제 — Task

## 0. 배경 (2026-08-07)

`/debt-relief/new?step=3`과 수정 페이지의 「채무내역」 카드는 간편/상세 두 입력 모드를 토글로
구분해서 렌더링한다. 그런데 다음 4개 필드는 원래 **간편모드에서만 기재하는 값**인데도 현재
코드에서는 상세모드에서도 그대로 노출·전송되고 있다.

- 최근 3개월 내 채무액 (`recentDebtWithin3Months`)
- 최근 6개월 내 채무액 (`recentDebtWithin6Months`)
- 최근 1년 내 채무액 (`recentDebtWithin1Year`)
- 담보부채무 (`securedDebt`)

기존에 상세모드로 저장된 데이터는 손대지 않는다(마이그레이션 없음) — 표시만 모드 기준으로
정리하고, 과거에 값이 들어간 레코드는 그냥 더 이상 보여주지 않는 방향으로 처리.

**실 시행 시점:** §2 코드 수정은 2026-08-07에 완료(`tsc --noEmit`, `eslint` 통과). 3000번
포트가 다른 작업으로 사용 중이라 브라우저 수동 검증만 사용자가 별도로 지시할 때 진행한다.

## 1. 확인된 현재 동작 (조사 완료)

### 1-1. 폼 UI — `src/components/debt-relief/form/DebtHistoryCard.tsx`
- 153번 줄 `form.debtInputMode === "detailed" ? <DebtItemsTable /> : (간편 전용 필드들)` 분기는
  채무종류/채무종류별 잔액/채권자 수만 감싸고 있음.
- 232~265번 줄(구분선 + 4개 필드 grid)은 이 분기 **바깥**에 있어 상세모드에서도 그대로 렌더링됨.
- 232번 줄 주석 "입력 방식(간편/상세)과 상관없이 항상 필요한 항목"이 애초에 잘못된 전제.

### 1-2. 초과검증 — `src/components/debt-relief/form/validateDiagnosisForm.ts`
- `isRecentAndSecuredDebtOverTotal`(130~140번 줄)이 이 4개 필드 합이 총 채무 합계를 넘는지
  모드 구분 없이 검사. `getOverLimitDebtFields`도 동일하게 모드 무관.
- 상세모드에서 이 필드들이 숨겨지면 이 초과검증 자체가 상세모드에선 의미 없어짐(그리고 폼에
  남아있는 과거 간편모드 값 때문에 상세모드에서 갑자기 초과 판정이 뜨는 오탐 가능성도 있음).

### 1-3. 제출 — `src/services/debtRelief.ts`
- `toAnalysisFormInput`(391~394번 줄): `collateralDebt`/`debtIncurredLast3Months`/
  `debtIncurredLast6Months`/`debtIncurredLast1Year`를 `isDetailed` 분기 없이 무조건 `form.securedDebt`
  등 폼 값 그대로 전송. 바로 위(384번 줄)에서 `debts` vs `debtBreakdown`은 모드별로 분기하면서
  이 4개만 놓친 것으로 보임.
- `updateDiagnosisDebts`(1057~1080번 줄, PATCH `/v1/analysis/{id}/debts`)도 동일 패턴
  (1073~1076번 줄) — 결과화면 「채무 상세」 모달에서 저장할 때도 같은 문제.

  **단, `types/analysis.ts`의 `AnalysisFormInput`/`UpdateAnalysisDebtsInput`에서
  `collateralDebt`/`debtIncurredLast3Months`/`debtIncurredLast6Months`/`debtIncurredLast1Year`는
  `debtBreakdown?`/`debts?`와 달리 **optional이 아닌 필수 `number`** 다(171~195번, 246~256번 줄).
  즉 백엔드 계약상 이 필드들은 모드와 무관하게 항상 값을 요구한다 — 그래서 상세모드에서
  "아예 안 보낸다"는 선택지는 없고, **UI에서는 숨기되 제출 시 0으로 고정해서 보내는** 방식이
  맞다(값은 폼 상태에 남겨둬도 되지만 전송 직전에 모드에 따라 0으로 덮어써야 함).**

### 1-4. 결과화면 표시 — `src/components/debt-relief/result/DiagnosisCustomerInfoModal.tsx`
- `debtRightRows`(280~287번 줄)가 `input.debtInputMode`를 전혀 참조하지 않고 4개 행을 무조건 표시.
- 이 컴포넌트는 `debtInputMode`/`debts`를 아예 안 쓴다(grep 결과 0건) — 참고로 `debtLeftRows`의
  채무종류/은행대출/카드론/캐피탈저축은행 breakdown도 상세모드 레코드에서는 `debtBreakdown`이
  채워지지 않으므로 이미 별도로 깨져 있을 가능성이 있음. **이건 이번 요청 범위 밖**(사용자가
  명시한 건 4개 필드뿐)이라 별도 이슈로만 남겨둔다 — 손대지 않음.

### 1-5. 결과화면 「채무 상세」 모달 — `src/components/debt-relief/result/DebtDetailModal.tsx`
- `DebtHistoryCard`를 그대로 재사용(211~218번 줄)하므로 1-1 수정이 반영되면 자동으로 같이 해결됨.
- `computeTotalDebtManwon`(51~60번 줄)은 이미 모드 분기가 있어 손댈 필요 없음.

### 1-6. sms `templates.ts`
- 최초 grep 매치는 "최근 3개월 급여명세서"라는 무관한 문자열이었음 — 이 파일은 스코프 밖.

## 2. 계획한 수정 (2026-08-07 완료)

- [x] `DebtHistoryCard.tsx`: 4개 필드 grid를 `form.debtInputMode !== "detailed"`일 때만
      렌더링하도록 조건부 처리(구분선 포함 `<>...</>`로 감쌈). 주석도 "간편모드 전용"으로 정정.
- [x] `validateDiagnosisForm.ts`: `isRecentAndSecuredDebtOverTotal` 최상단에
      `if (form.debtInputMode === "detailed") return false;` 가드 추가
      (→ `getOverLimitDebtFields`도 자동으로 `[]`).
- [x] `services/debtRelief.ts`:
  - `toAnalysisFormInput`: 4개 필드를 `isDetailed ? 0 : form.xxx`로 분기.
  - `updateDiagnosisDebts`: 동일 패턴으로 `isDetailed` 분기 추가(기존 `isDetailed` 변수 재사용).
- [x] `DiagnosisCustomerInfoModal.tsx`: `debtRightRows`에서 4개 필드 행을
      `input.debtInputMode === "detailed"`일 때 스프레드로 제외("연체기간"/"채무발생원인"만 유지).
- [x] `types/debtRelief.ts` 590~595번 줄 주석에 "간편모드 전용 — 상세모드는 제출 시 0 고정" 명시.
- [x] `npx tsc --noEmit` 통과 / `npx eslint`(변경 파일 5개) 통과.
- [x] 브라우저 수동 검증(2026-08-07, 사용자도 별도 탭에서 동시 확인):
      - `/debt-relief/new?step=3` — 간편↔상세 토글 시 4개 필드 숨김/노출 정상, 값 입력 후 왕복해도
        유지됨 확인.
      - 결과화면 「채무 현황 → 자세히 보기」(`DebtDetailModal`) — 기존 간편모드 레코드(id 85)를
        열어 4개 필드 정상 표시 확인, 상세 탭 전환 시 숨김 확인(저장은 하지 않고 취소 — 실제
        PATCH 전송 페이로드까지는 미검증).
      - 결과화면 「고객정보」모달(`DiagnosisCustomerInfoModal`) — 기존 간편모드 레코드 2건(id 85,
        63)에서 4개 필드 행이 정상 표시됨을 확인(회귀 없음). 이 환경엔 상세모드로 저장된 기존
        레코드가 없어(둘 다 신규 기능 이전 데이터) 상세모드 저장 건에서 4개 행이 실제로 숨는지는
        미검증.
      - **미검증(추후 필요 시 확인)**: 상세모드로 실제 저장(적용하기/분석하기 제출) 시 네트워크
        요청 바디에 4개 필드가 0으로 나가는지, 상세모드 제출 시 초과검증 가드가 오탐 없이
        통과하는지 — 둘 다 실제 데이터 변경(PATCH/POST)이 필요해 이번 세션에서는 보류.
- [x] 커밋 완료 (`1725971`).

## 3. 스코프 밖으로 명시적으로 제외한 것

- 기존에 상세모드로 저장된 분석 건에 이미 들어가 있는 4개 필드 값 — 마이그레이션하지 않음,
  표시만 안 하게 됨.
- `DiagnosisCustomerInfoModal.tsx`의 `debtLeftRows`(채무종류/은행대출/카드론/캐피탈저축은행
  breakdown)가 상세모드 레코드에서 제대로 표시되는지 여부 — 별도 조사 필요, 이번 요청과는 무관.
