# 회생·파산(Analysis) API 연동 최종 점검 + 브라우저 QA 체크리스트

작성일: 2026-07-21. 목적: 최신 Swagger(Analysis / Analysis Bulk Action / Analysis Fee / Analysis Fee
Statistics / Analysis Partner)와 현재 코드를 대조해 연동 현황을 확정하고, 배포 전 브라우저에서 직접
눌러봐야 할 플로우를 체크리스트로 정리한다. 데스크톱 우선(§2) → 모바일은 별도 트랙(§3)으로 뺐다.

---

## 1. API 연동 현황

### Analysis

| 엔드포인트 | 연동 상태 | 사용처 |
|---|---|---|
| `POST /v1/analysis` | ✅ | `DebtReliefService.createDiagnosis` → 새 진단 폼 제출 |
| `GET /v1/analysis` | ✅ | `DebtReliefService` 목록 조회 → 허브 테이블/카드 |
| `GET /v1/analysis/{id}` | ✅ | `DebtReliefService.getDiagnosisDetail` → 상세 페이지 전체 |
| `PATCH /v1/analysis/{id}` | ✅ (이번 세션에 상태 게이팅 수정) | `DebtReliefService.updateProcedureProgress` → 절차 전환 + 현재 단계 설정 |
| `DELETE /v1/analysis/{id}` | ✅ | `ResultDeleteButton.tsx` |
| `POST /v1/analysis/{id}/accept` | ✅ | `AnalysisReviewBanner.tsx` (변호사) |
| `GET /v1/analysis/{id}/chat` | ✅ | `useDebtReliefAiChat.ts` |
| `POST /v1/analysis/{id}/chat/stream` | ✅ | `useDebtReliefAiChat.ts` (SSE) |
| `GET /v1/analysis/{id}/connectable-customers` | ✅ | `CustomerMatchModal.tsx` |
| `PATCH /v1/analysis/{id}/customer` | ✅ | `CustomerMatchModal.tsx`, `CustomerCreateMatchModal.tsx` |
| `DELETE /v1/analysis/{id}/customer` | ✅ | `ResultHeader.tsx`(연결 해제) |
| `POST /v1/analysis/{id}/deliver` | ⚠️ 선언만, 미사용 | 단건 공유도 `bulkDeliver`로 통일 처리 — 문제 아님(의도적 단순화) |
| `GET /v1/analysis/{id}/deliveries` | ✅ (제한적) | `ResultDeleteButton.tsx`가 삭제 전 활성 공유 여부 체크용으로만 사용 |
| `PATCH /v1/analysis/{id}/input` | ✅ | `DebtReliefService.updateDiagnosis`(재분석) |
| `GET /v1/analysis/{id}/procedure-changes` | ❌ 미사용 | 노출 화면 없음. 상세의 `procedureStepHistory`로 대체되는 듯 보이나 확인 필요 |
| `POST /v1/analysis/{id}/reject` | ✅ | `AnalysisReviewBanner.tsx` (변호사) |
| `POST /v1/analysis/{id}/send-sms` | ✅ | `SectionSmsSend.tsx`, `SectionProcedureGuide.tsx`(단계별 문자) |
| `GET /v1/analysis/procedures` | ❌ 미사용 | 절차 마스터를 클라이언트 하드코딩 값으로 사용 중(실질 문제 아님, 서버값과 다이버전 리스크만 존재) |
| `GET /v1/analysis/summary` | ✅ | 허브 요약 카드 |

### Analysis Bulk Action

| 엔드포인트 | 상태 | 사용처 |
|---|---|---|
| `POST /v1/analysis/bulk-delete` | ✅ | `DebtReliefHubContent.tsx` 일괄삭제 |
| `POST /v1/analysis/bulk-deliver` | ✅ | `AnalysisShareModal.tsx` (단건/일괄 공유 겸용) |

### Analysis Fee / Fee Statistics

| 엔드포인트 | 상태 | 사용처 |
|---|---|---|
| `POST /v1/analysis/{id}/fee-plan` | ✅ | `FeePaymentInfoModal.tsx` |
| `PATCH /v1/analysis/{id}/fee-plan` | ✅ | `FeePaymentInfoModal.tsx` |
| `POST .../installments/{id}/pay` | ✅ | `FeePaymentInfoModal.tsx` |
| `DELETE .../installments/{id}/pay` | ✅ | `FeePaymentInfoModal.tsx`(납부 취소) |
| `POST .../fee-plan/refund` | ✅ | `FeePaymentInfoModal.tsx` (전달사항 입력 포함) |
| `POST .../fee-plan/stop` | ✅ | `FeePaymentInfoModal.tsx` (전달사항 입력 포함) |
| `GET /v1/analysis/fee-statistics/summary` | ✅ | `FeePaymentStatusPanel.tsx` |
| `GET /v1/analysis/fee-statistics/installments` | ✅ | `FeePaymentStatusPanel.tsx` |

### Analysis Partner

| 엔드포인트 | 상태 |
|---|---|
| `GET /v1/analysis-partners` | ✅ 승인된 목록만 조회(`AnalysisShareModal.tsx`) |
| `POST` / `DELETE /{id}` / `PATCH /{id}/status` / `GET /requests` | 의도적으로 이 프론트엔드 범위 밖 — 별도 외부 admin이 전담 (`services/analysisPartners.ts` 상단 주석 참고) |

---

## 2. 이번 점검에서 새로 발견한 이슈

바로 고칠지는 별도 판단 필요 — 우선 목록만 남긴다.

1. **공유 철회로 이어지지 않는 삭제 안내 (막다른 길)** — 영업점이 공유 중인 진단을 삭제하려 하면
   `ResultDeleteButton.tsx:85` 에서 "공유를 철회한 뒤 다시 시도해주세요"라고 안내하지만, 실제로 공유를
   철회하는 버튼/화면이 어디에도 없다(`AnalysisService.revokeDelivery` 미사용). 안내대로 하려 해도 할
   방법이 없음.
2. ~~공유 시 참고사항(`referenceNote`) 노출 여부 불확실~~ — **원인 확정 후 수정 완료(이번 세션)**.
   `POST /v1/analysis/{id}/deliver`·`/bulk-deliver` 실 스펙 확인 결과 참고사항 필드명은
   `referenceNote`가 아니라 `message`였음. `AnalysisShareModal.tsx`가 `referenceNote`로 보내고 있어
   백엔드가 인식 못 하고 버렸을 가능성이 높음 — `DeliverAnalysisInput`/`BulkDeliverAnalysisItem`
   타입과 전송 지점을 `message`로 수정. `DiagnosisDetail.referenceNote`(읽는 쪽)는 실제 상세 응답
   스키마에 아예 없는 필드라 항상 null이었던 것도 확인됨 — 참고사항은 `messages` 타임라인의 "공유"
   항목으로만 확인 가능(`SectionDeliveryMessages`). §2-D-6에서 실제로 참고사항 입력 후 타임라인에
   찍히는지 확인 필요(수정 후 최초 검증).
3. **모바일 카드 리스트엔 공유 아이콘이 아예 없음** — `DiagnosisMobileCardList.tsx`. 영업점이 모바일에서
   진단을 공유할 방법이 없다. 모바일 대응 범위(`docs/DEBT_RELIEF_MOBILE_RESPONSIVE_TASKS.md`)에 포함됐는지
   확인 필요.
4. **"다시 분석하기"에 확인 모달 없음** — `DiagnosisFormContent.tsx:146` `handleAnalyze`. 재분석 성공 시
   상태/절차/현재단계가 초기화되고 AI 채팅 이력이 삭제되는 되돌릴 수 없는 부수효과가 있는데, 클릭 전
   경고가 없다(기존에 알려진 사항 — 별도 지시 전까지 보류 중인 항목이라 여기선 재확인만).
5. **`/debt-relief/[id]/edit` 라우트에 상태 가드 없음** (2026-07-22 모바일 반응형 실브라우저 QA 중 발견) —
   `ResultHeader.tsx:385` `handleEdit`은 상담중/반려됨이 아니면 클릭 시 "정보수정 불가" 안내 모달로
   막지만, 이 가드는 진입 버튼(`정보수정` 클릭)에만 걸려 있다. `/debt-relief/{id}/edit` 라우트
   자체(`DiagnosisFormContent.tsx`)엔 상태 검사가 전혀 없어서, 계약대기중 이상(절차진행중 등) 건이라도
   URL을 직접 입력하면 기존 데이터가 프리필된 수정 폼이 그대로 로드된다. 주석상 "서버도 이 상태에서만
   허용한다"고 되어 있어 저장 시 백엔드가 거부할 가능성은 있지만(실제 저장까지는 검증 안 함 — 실 데이터
   훼손 위험이 있어 보류), 그렇더라도 사용자가 5단계 폼을 다 채운 뒤에야 막히는 막다른 길이 될 수 있다.
   라우트 진입 시점(`DiagnosisFormContent`)에 `ResultHeader.handleEdit`과 동일한 상태 가드를 추가해
   즉시 안내 후 상세 페이지로 돌려보내는 처리 필요.

---

## 3. 브라우저 QA 체크리스트 (데스크톱)

**사전 준비**: 영업점(analysis) 프로젝트 1개 + 변호사(lawyer) 프로젝트 1개, 두 프로젝트가 파트너로 연결된
테스트 계정 필요(`useProjectType`이 서브도메인 선택 프로젝트의 `type`으로 역할을 가른다).

### A. 영업점(analysis) 프로젝트

- [ ] **새 진단 생성**: `/debt-relief/new` 5단계 폼 입력 → AI 진단 실행 → 결과 상세로 이동
- [ ] **목록/필터**: `/debt-relief` 검색·절차 필터·상태 필터·정렬(상담일)·페이지네이션·표시개수 변경
- [ ] **AI 채팅**: 상세 페이지에서 AI와 채팅 스트리밍 응답 확인
- [ ] **고객 매칭**: 미매칭 진단에 기존 고객 연결 / 신규 고객 생성 후 연결 / 연결 해제
- [ ] **절차 전환(개인회생 ↔ 채무조정 ↔ 파산)**
  - [ ] `계약대기중` 상태에서 절차 전환 셀렉트가 **눌리는지** (이번 세션에 `stepLocked` 분리 — 셀렉트 자체는 여전히 계약대기중부터 허용)
  - [ ] 절차 전환 시 "1단계로 초기화" 확인 모달이 뜨고, 확정 후 실제로 1단계로 초기화되는지
- [ ] **현재 단계로 설정**
  - [ ] `계약대기중` 상태에서 "현재 단계로 설정" 버튼이 **비활성화**되는지 (이번 세션 수정 사항 — 가장 중요하게 확인)
  - [ ] `절차진행중` 상태에서는 버튼이 활성화되고 정상 저장되는지
  - [ ] 현재 단계보다 이전 단계는 버튼이 비활성인지
- [ ] **단계별 문자 발송**: 절차안내 각 단계의 "문자" 버튼 → 발신번호/템플릿/예약발송까지 실제 발송
- [ ] **하단 "고객 문자 전송" 섹션**: 필요서류 안내 / 상담일정 안내 / 분석결과 공유 / 직접작성 템플릿 각각 발송
- [ ] **공유(단건)**: 목록의 공유 아이콘 클릭 → 파트너 선택 → 연락처/참고사항 입력 → 확인 모달 → 발송
- [ ] **공유(일괄)**: 목록에서 여러 건 체크 → 상단 액션에서 일괄 공유(있다면) 또는 각 건 반복 공유
- [ ] **재공유 (이번 세션 핵심 수정 사항)**
  - [ ] 한 번 공유했다가 변호사 쪽에서 반려한 건을 다시 공유 클릭 → **프로젝트 선택 화면 없이 바로 연락처 입력 화면**으로 넘어가는지
  - [ ] 최종 확인 모달에 원래 공유했던 프로젝트명이 정확히 표시되는지
  - [ ] 뒤로가기 클릭 시 "닫기" 확인이 뜨는지(프로젝트 선택 화면으로 안 돌아감)
  - [ ] 한 번도 공유한 적 없는 건은 기존처럼 전체 파트너 목록에서 고르는지
- [ ] **삭제**: 미공유 건 삭제 정상 동작 / 공유 중인 건은 삭제 시 안내 메시지만 뜨고 실제로는 삭제 불가 확인(§1의 이슈 1 재확인)
- [ ] **일괄 삭제**: 여러 건 선택 후 일괄 삭제, 공유 중인 건이 섞여 있으면 해당 건은 제외되고 나머지만 삭제되는지

### B. 변호사(lawyer) 프로젝트

- [ ] **목록**: 자체 생성 건 + 영업점이 공유한 건이 함께 보이는지, 담당직원 컬럼 노출
- [ ] **검토 배너**: 검토중 + 공유중인 건 상세 진입 시 수락/거절 배너 노출
- [ ] **수락**: 수락 사유(메시지) 입력 → 계약대기중으로 전환
- [ ] **거절**: 거절 사유 입력 → 반려됨으로 전환, 전달사항 타임라인에 반영
- [ ] **공유받은 건 읽기 전용 확인**: AI 분석 추천/상담 포인트 섹션 숨김, 절차 전환 셀렉트가 비활성 배지로 표시되는지 (`lawyerReceivedReadOnly`)
- [ ] **자체 생성 건은 정상 편집 가능**: 변호사 프로젝트가 직접 만든 진단은 절차 전환 등 정상 동작하는지 (공유받은 건과 대비 확인)

### C. 수임료(Fee Plan) — 양쪽 다 필요 시

- [ ] **최초 입력**: `계약대기중` 상태에서만 입력 가능한지, 일괄납부/분할납부 각각 생성
- [ ] **수정**: 기존 계획 금액/회차 수정
- [ ] **회차 납부완료 처리 / 취소**: 상태 뱃지·진행률 갱신 확인
- [ ] **중단**: 사유(전달사항) 입력 후 중단 → 상태가 `중도해지` 등으로 반영, **전달사항 타임라인에 "중단"이 반려와 같은 빨간 점으로 표시되는지 (이번 세션 수정 사항)**
- [ ] **환불**: 사유 입력 후 환불 → `환불처리` 상태 반영, **전달사항 타임라인에 "환불"이 빨간 점으로 표시되는지 (이번 세션 수정 사항)**
- [ ] **통계 탭**: `my-settings` 또는 통계 화면에서 수임료 완납/미납/예정/환불 통계가 실제 데이터와 맞는지

### D. 전달사항(메시지 타임라인) — 상세 페이지 상단

- [ ] 공유 시 항목 추가("공유")
- [ ] 수락/거절 시 항목 추가("수락"/"거절", 사유 메시지 표시)
- [ ] 수임료 최초입력/수정 시 항목 추가("결제")
- [ ] 수임료 중단/환불 시 항목 추가("중단"/"환불") — **라벨과 빨간 점 색상 확인 (이번 세션 수정)**
- [ ] 항목 3건 이상일 때 접기/펼치기 및 내부 스크롤 동작
- [ ] §1 이슈 2 확인: 공유 항목에 참고사항(referenceNote)이 어떤 형태로든 보이는지, 안 보이면 별도 UI 필요 여부 판단

### E. 회귀 확인 (이번 세션 변경분과 무관하지만 인접 코드)

- [ ] 고객 문자 전송 섹션 연락처 표시 타이포(semibold 14px) 육안 확인
- [ ] 진단 목록 → 상세 → 목록 뒤로가기 시 필터/검색/페이지 상태 유지

---

## 4. 모바일 — 별도 트랙 (데스크톱 확인 끝난 뒤)

기존 `docs/DEBT_RELIEF_MOBILE_RESPONSIVE_TASKS.md`의 Phase 진행 상황과 함께 아래 항목 추가 확인:

- [ ] `DiagnosisMobileCardList`에 공유 진입점이 없는 것이 의도된 범위인지 디자인 컨펌
- [ ] 이번 세션에 변경된 절차 전환/현재 단계 설정 게이팅이 모바일 상세 페이지(`SectionProcedureGuide`는 공용 컴포넌트)에서도 동일하게 동작하는지
- [ ] 재공유 플로우(프로젝트 선택 스킵)가 모바일 폭에서도 레이아웃 깨짐 없이 동작하는지
