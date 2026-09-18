# 프론트 성능 감사 보고서 (브라우저 네이티브 위임 관점)

## 1. 개요

- 감사 목적: "메인 스레드 JS로 직접 제어하는 코드"와 "브라우저 네이티브 엔진(컴포지터·레이아웃)에 위임하는 코드"를 구분하는 관점에서, `talkgate_fe`가 불필요하게 직접 제어를 떠안고 있는 지점을 식별합니다. ([Write Code That Runs in the Browser, or Write Code the Browser Runs](https://blog.jim-nielsen.com/2025/write-code-that-runs-in-the-browser/) 논의에서 출발)
- 감사 기준일: 2026-09-16
- 감사 방식: 정적 코드 리뷰 기반 1차 감사 (setInterval/setTimeout/requestAnimationFrame, getBoundingClientRect, scroll/resize 리스너, 네이티브 요소 대체 여부, 리스트 렌더링을 카테고리별로 분리 조사)
- 대상 범위: 타이머·수동 애니메이션, DOM 측정·스크롤·포지셔닝, 모달/드롭다운/셀렉트의 네이티브 요소 대체, 드래그앤드롭, 리스트 가상화, 폼 검증
- 제외 범위: 번들 사이즈, 네트워크 워터폴, 서버 컴포넌트/SSR 성능, React Query 캐시 전략, 실측 프로파일링(Lighthouse/DevTools Performance 탭 기반 수치 검증)

## 2. 판정 기준

- `문제 사례`: 코드상 실제 성능 영향(강제 레이아웃 반복, 불필요한 리렌더 폭증, 무제한 누적 등)이 확인된 항목
- `경미`: 스타일·구조 차이는 있으나 현재 규모에서는 성능 영향이 낮은 항목
- `문제 아님`: 조사했으나 네이티브 API를 정당하게 활용했거나, 제약상 불가피한 항목

## 3. 결과 요약

| 우선순위 | 개수 | 비고 |
| --- | --- | --- |
| 높음 | 3 | 스크롤/렌더 성능에 직접 영향, 다수 파일에 중복된 패턴 포함 |
| 중간 | 3 | 발생 빈도가 낮거나 비용이 상대적으로 가벼움 |
| 경미 | 3 | 성능보다는 접근성·유지보수 관점 |
| 모범사례 | 2 | 참고용 |

## 4. 문제 사례 (우선순위 높음)

### 4-1. 스크롤·리사이즈 시 쓰로틀 없는 좌표 재계산 (4곳 중복)

- 파일: [`src/hooks/useAnchoredPanel.ts:121-127`](src/hooks/useAnchoredPanel.ts), [`src/components/common/filterFields.tsx:208-218`](src/components/common/filterFields.tsx), [`src/components/common/ColorPalettePopover.tsx:124-132`](src/components/common/ColorPalettePopover.tsx), [`src/components/customers/detail/CategoryDropdownPortal.tsx:84-92`](src/components/customers/detail/CategoryDropdownPortal.tsx)
- 문제: `window.addEventListener("scroll", updatePosition, true)`를 캡처 모드로 등록해두고, 스크롤 프레임마다 `getBoundingClientRect`(강제 레이아웃 읽기) → `setState`(리렌더)를 쓰로틀 없이 그대로 실행. 드롭다운·팝오버를 띄운 채 배경을 스크롤하면 스크롤 자체가 끊길 수 있음. 동시에 여러 패널이 열려 있으면 비용이 배수로 증가.
- 참고: zoom(0.8) 보정 계산(`getBodyZoom` 등, [`docs/ZOOM_SUBPIXEL_PLAYBOOK.md`](docs/ZOOM_SUBPIXEL_PLAYBOOK.md) §4-4 제약) 자체는 불가피하므로 문제 삼지 않음. 문제는 "그 계산을 원시 이벤트마다 무조건 실행한다"는 빈도 제어 부재.
- 대안: `updatePosition`을 rAF 플래그로 감싸 프레임당 1회로 제한. `useAnchoredPanel`에 적용 후 나머지 3곳을 해당 훅으로 마이그레이션. (코드 주석에 이미 "아직 이 훅으로 못 옮김"이라는 메모가 있어, 통합이 원래 목표였던 것으로 보임 — 추정)

### 4-2. `ChatMainView.tsx` — 무제한 메시지 누적 + 매 렌더 reverse + 무쓰로틀 스크롤

- 파일: [`src/components/chat/ChatMainView.tsx:186`](src/components/chat/ChatMainView.tsx), [`src/components/chat/ChatMainView.tsx:188-201`](src/components/chat/ChatMainView.tsx)
- 문제:
  - `[...messages].reverse()`가 메모이제이션 없이 매 렌더마다 새로 생성됨.
  - 위로 스크롤할 때 과거 메시지를 계속 누적하는 무한 스크롤 구조인데 windowing이 없어, 상담이 길어질수록 DOM 노드 수와 reverse 비용이 함께 증가.
  - `onMessagesScroll`이 쓰로틀 없이 매 틱 `scrollTop`을 읽음. `loadOlderMessages`의 in-flight 중복 호출 가드 여부는 이번 조사로 확정하지 못함 (`ChatProvider`/`TeamChatProvider` 쪽 추가 확인 필요 — 추정).
- 대안: `messages` 변경 시에만 `useMemo`로 reverse, 일정 개수 이상이면 windowing 적용 검토, 스크롤 핸들러는 IntersectionObserver(상단 sentinel)로 대체.
- 비고: 실제 상담 채팅 도메인 특성상 대화가 길어지는 경우가 흔해 체감 영향이 클 수 있음.

#### 2026-09-16 실측 및 결정

- `src/app/test/chat-perf/page.tsx`에서 실제 `ChatMainView`와 React Profiler를 사용해 새 메시지 1건 추가 비용을 측정함.
- 개발 모드 기준 대표 측정값은 200개에서 약 30~47ms, 1,000개에서 약 12~213ms, 5,000개에서 약 61~220ms, 10,000개에서 약 122~279ms였음. 개발 모드와 측정 편차를 감안해도 누적 메시지 수가 커질수록 긴 커밋이 반복되는 경향은 명확함.
- `[...messages].reverse()`는 `useMemo`로 변경함. 이는 입력 상태 변경처럼 `messages`가 그대로인 리렌더 비용만 줄이며, 새 메시지 추가 시 전체 목록 커밋 비용을 해결하지는 않음.
- 결론: 장기 대화의 전체 가상화는 필요함. 다만 현재 목록은 이미지·동영상·오디오·스티커 등 로드 후 높이가 바뀌는 항목과 과거 메시지 prepend 시 스크롤 위치 보존을 함께 처리하므로, 고정 높이 자체 구현은 적용하지 않음. 가변 높이와 prepend 위치 보존을 지원하는 가상화 도구를 선정한 뒤 별도 변경으로 진행함.
- 현재 변경에서는 과거 메시지 추가 시 `scrollHeight` 증가분 보정, 지연 로드 콘텐츠용 `ResizeObserver`, 대화방 전환 시 스크롤 추적값 초기화까지만 적용함.

### 4-3. `AnimatedBriefingAmount.tsx` / `SectionProcedureScores.tsx` — 동일한 rAF 카운트업 로직 중복

- 파일: [`src/components/debt-relief/result/AnimatedBriefingAmount.tsx:36-53`](src/components/debt-relief/result/AnimatedBriefingAmount.tsx), [`src/components/debt-relief/result/SectionProcedureScores.tsx:104-124`](src/components/debt-relief/result/SectionProcedureScores.tsx)
- 문제: 숫자 카운트업 애니메이션을 rAF 루프로 직접 구현하며 매 프레임 React state를 갱신. 브리핑 화면에 지표별로 여러 인스턴스가 동시에 마운트되면 애니메이션 구간 동안 리렌더가 순간적으로 몰릴 수 있음. 동일 로직이 두 파일에 완전히 복붙되어 있어 유지보수 부담도 이중.
- 잘 된 부분: `prefers-reduced-motion` 체크, `cancelAnimationFrame`/`clearTimeout` 클린업은 정확히 구현됨. 다만 결정론적(0→목표값) 애니메이션이라 원칙적으로 브라우저에 위임 가능한 케이스.
- 대안: Web Animations API(`element.animate()`) 또는 CSS `@property`+`counter()`로 이관 (구형 브라우저 지원 범위 확인 필요), 공용 `useCountUp` 훅으로 중복 제거.

## 5. 문제 사례 (우선순위 중간)

| 항목 | 파일 | 비고 |
| --- | --- | --- |
| resize 리스너 쓰로틀 없음 | [`DisclaimerInfoTooltip.tsx:81`](src/components/debt-relief/result/DisclaimerInfoTooltip.tsx), [`ChatRightSidebar.tsx:200-201`](src/components/chat/ChatRightSidebar.tsx), [`TeamManagementSettings.tsx:308`](src/components/settings/TeamManagementSettings.tsx) | scroll보다 발화 빈도가 낮아 4-1보다는 급하지 않음. `ChatRightSidebar`는 최초 호출을 rAF로 감싸 절반은 이미 개선됨 |
| 대화 목록 스크롤 트리거 무쓰로틀 | [`ChatLeftSidebar.tsx:163-169`](src/components/chat/ChatLeftSidebar.tsx) `onConversationsScroll` | 읽는 프로퍼티 자체는 가벼워 심각하진 않으나 습관적으로 고칠 가치 있음 |
| 전화번호 입력 커서 위치 복원 rAF 코드 5곳 중복 | `ChangePaymentMethodModal.tsx`, `CustomerCreateModal.tsx`, `CustomerLinkCreateModal.tsx`, `BasicTab.tsx`, `ProjectSignupForm.tsx` | 성능 문제는 아니고 재사용성 문제. 공용 훅 추출 후보 |

## 6. 경미 (성능 영향은 낮음, 참고용)

| 항목 | 파일 | 비고 |
| --- | --- | --- |
| `<dialog>` 미사용, 포커스 트랩 매 Tab마다 `querySelectorAll` 재계산 | [`BaseModal.tsx:47-58, 90-116`](src/components/common/BaseModal.tsx) | DOM 규모가 크지 않아 실질 영향 미미. 2026-08-21 스크롤락/오버레이클릭 구조 개선은 이미 완료됨(별도 사안) |
| 폼 검증 전부 JS 정규식 재구현, 네이티브 `required`/`pattern` 미사용 | `AccountStep.tsx` 등 인증 폼 전반 | 성능보다는 접근성 이슈. 실시간 비밀번호 강도 체크리스트 UX는 네이티브 validation만으로 구현 어려워 커스텀 자체는 불가피 |
| 리스트 비가상화 | `CustomersTable.tsx`(서버 페이지네이션 있어 위험 낮음), `DebtItemsTable.tsx`(사용자 직접 입력이라 규모 작음) | 현재는 문제 아님. 목록 규모가 커지면 재검토 대상 |

## 7. 모범사례

### A. `src/hooks/useFakeProgress.ts`

`setInterval` 누적 대신 `performance.now()` 기반 순수함수(`progressAt`)로 진행률을 계산해 rAF로 그림. 타이머 드리프트, 백그라운드 탭 스로틀링 이후 값 어긋남까지 고려해 이렇게 설계한 이유를 주석에 남겨둠. 표시 갱신도 `PERCENT_STEP` 단위로 양자화해 불필요한 리렌더를 의도적으로 차단. 이 코드베이스에서 타이머를 가장 신중하게 설계한 사례.

### B. `src/providers/ErrorFeedbackModalProvider.tsx:181-187`

모달 흔들림(shake) 효과 재생 트리거. JS는 `animate-shake` CSS 클래스를 껐다가 rAF 한 프레임 뒤 다시 켜는 "애니메이션 리플레이" 역할만 하고, 실제 흔들림은 전부 CSS `@keyframes`(컴포지터)에 위임. "브라우저에 무엇을 시킬지"만 결정하고 실행은 넘기는 패턴.

## 8. 참고 — 안티패턴이 아닌 정당한 rAF 직접 제어 사례

`src/components/settings/teamManagement/TeamTreeView.tsx:90-106` (조직도 캔버스 가장자리 드래그팬): 매 프레임 `canvasRef.current.style.transform`만 직접 수정하며 재귀적으로 `requestAnimationFrame`을 호출. `transform` 속성만 건드려 레이아웃/페인트를 피했고, 포인터 위치에 실시간 반응하는 무한 길이 팬닝은 CSS로 선언할 방법이 없는 영역이라 JS 직접 제어가 정당한 사례임. 4-3과 대비해 "언제 rAF 직접 제어가 정당한가"의 기준점으로 남겨둠.

## 9. 권장 우선순위

1. **4-1 (드롭다운 스크롤 쓰로틀)** — 파일 하나(`useAnchoredPanel.ts`) 수정으로 4곳이 동시에 개선되는 구조라 비용 대비 효과가 가장 큼.
2. **4-2 (채팅 무한스크롤)** — 상담 채팅 도메인 특성상 체감 영향이 클 수 있어 다음 순위.
3. **4-3 (카운트업 애니메이션 중복)** — 급하진 않지만 리렌더 폭증 가능성과 코드 중복이 함께 걸려 있어 정리 가치 있음.
4. 중간/경미 항목은 위 세 가지를 먼저 처리한 뒤 여유가 있을 때 검토.
