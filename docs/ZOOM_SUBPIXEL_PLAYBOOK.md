# Zoom 서브픽셀 이슈 디버깅 플레이북

> 2026-04-20 작성 · 대시보드 "달력 & 일정" next/prev 버튼 깨짐(#795) 사례 기반

## 0. 한 줄 요약

> `zoom: 0.8` × 고정 px × 플렉스/SVG 가 만나면 **일부 브라우저(특히 Firefox)에서 서브픽셀 스냅 오차**가 누적되어 버튼이 쏠리거나 찌그러져 보인다. 해결은 "렌더 사이즈가 zoom 적용 후 **정수 screen px**가 되도록" 값을 맞추는 것.

---

## 1. 왜 이 이슈가 생기는가 (배경)

프로젝트 전체는 데스크톱 폭 ≥ 1080px에서 UI 밀도를 위해 `<body style="zoom: 0.8">`을 적용한다.(`src/app/layout.tsx`, `src/middleware.ts`)

> 실제 기준값은 `src/components/layout/UiScaleToggle.tsx:7`의 `MOBILE_BREAKPOINT = 1080`이며,
> `--breakpoint-lg`(1080)와 일치한다. 같은 파일의 주석과 `CLAUDE.md`에 남아 있는 "1280px"은
> stale이다(2026-07-28 확인).

- 모든 CSS `px` 값이 `* 0.8` 로 축소되어 화면에 그려진다.
- Chromium 계열은 `zoom`에 의한 서브픽셀 레이아웃 계산을 내부적으로 스냅/보정하여 대부분 매끄럽게 처리한다.
- Firefox(Gecko)는 `zoom`을 비교적 최근(126+)에 표준으로 구현했고, **플렉스 누적 반올림**과 **SVG 내부 좌표 라스터화**에서 Chromium보다 오차가 눈에 띈다.

### 특히 문제가 되는 조합

| 조건 | 왜 문제인가 |
|---|---|
| `w-[36px]`, `gap-2`(8px) 같은 5의 배수 아닌 고정 px | `× 0.8` → `28.8px`, `6.4px` 등 **비정수 screen px** |
| 플렉스 `justify-between` | 양 끝 정렬 특성상 누적 반올림 오차가 **가장 오른쪽 항목에 몰림** |
| 플렉스 자식에 `min-w-0` 미지정 | `min-width: auto` = 콘텐츠 폭 → 부모가 초과 시 `shrink-0` 형제(보통 action)가 밀려나 잘림 |
| SVG `viewBox` 와 렌더 사이즈 비율이 zoom 0.8과 맞지 않음 | 내부 path 좌표·stroke가 **비정수 canvas/screen px**로 매핑됨. Firefox가 비대칭 스냅 → "쏠림/눌림" |
| `grid place-items-center` 로 아이콘을 고정 크기 박스에 중앙정렬 | zoom 하에서 `(box - icon) / 2`가 소수 → Firefox가 좌/우로 비대칭 반올림 |

---

## 2. 증상 체크리스트

다음 중 하나라도 해당되면 zoom 서브픽셀 이슈를 의심한다.

- [ ] 같은 아이콘 여러 개가 있는데 **특정 위치(보통 오른쪽 끝)만** 쏠린다
- [ ] Chrome/Edge/Whale에선 멀쩡한데 **Firefox에서만** 깨진다
- [ ] DevTools Computed 값은 정상인데 눈으로 보기엔 한쪽이 잘린 듯하다
- [ ] 브라우저 기본 줌을 100%로 돌리면 증상이 사라진다
- [ ] 모바일(zoom 1.0)에선 정상, 데스크톱(zoom 0.8)에서만 문제

---

## 3. 진단 절차

다음 순서대로 확인한다.

### Step 1. 재현 환경 특정

1. 어떤 브라우저에서 재현되는가? (Firefox 우선 의심)
2. 데스크톱 폭 ≥ 1080px 인가? → `zoom: 0.8` 적용 구간
3. 페이지 이동해서 예외 경로(인증 페이지 등)는 정상인가? → `zoom: 1.0` 구간은 서브픽셀 이슈가 없음

### Step 2. DevTools로 렌더 수치 확인

1. 문제 요소 우클릭 → 검사
2. **Computed** 탭에서 `width`, `height`, `padding`, `gap` 등 값 확인
3. 각 값을 `* 0.8` 해보고 **정수 screen px** 인지 계산
   - `36 × 0.8 = 28.8` ❌ (비정수)
   - `35 × 0.8 = 28.0` ✅ (정수)
   - `40 × 0.8 = 32.0` ✅ (정수)
4. SVG라면 `viewBox` 와 렌더 크기 비율 확인
   - `render × 0.8 / viewBox = integer` 여야 픽셀 클린
   - 예: `35 × 0.8 / 14 = 2.0` ✅
   - 예: `36 × 0.8 / 18 = 1.6` ❌

### Step 3. 플렉스 초과 여부 확인

1. 부모 플렉스 컨테이너의 자식들을 순서대로 보며 **총 min-content 폭 > 컨테이너 폭** 인지 확인
2. 텍스트 자식에 `min-w-0` 이 없으면 content-width 그대로 차지함
3. `shrink-0` 자식의 총합이 컨테이너 폭을 초과하면 초과분이 어딘가로 밀림

### Step 4. 가설 검증

- 의심되는 요소에 임시로 `zoom: 1.25` (= 1/0.8) 를 CSS로 주입 → zoom 효과가 상쇄되어 **native 1:1** 렌더. 증상 사라지면 서브픽셀 문제 확정
- 또는 문서 zoom을 1로 바꿔서 재현 여부 확인

---

## 4. 수정 가이드라인

### 4-1. 기본 원칙: **렌더 × 0.8 = 정수 screen px**

| 원래 px | × 0.8 | 판정 | 권장 대체 |
|---|---|---|---|
| 12 | 9.6 | ❌ | 10(8) / 15(12) |
| 14 | 11.2 | ❌ | 15(12) |
| 16 | 12.8 | ❌ | 15(12) / 20(16) |
| 18 | 14.4 | ❌ | 20(16) |
| 20 | 16 | ✅ | 그대로 |
| 24 | 19.2 | ❌ | 25(20) |
| 28 | 22.4 | ❌ | 30(24) |
| 30 | 24 | ✅ | 그대로 |
| 32 | 25.6 | ❌ | 30(24) / 35(28) |
| 35 | 28 | ✅ | 그대로 |
| 36 | 28.8 | ❌ | 35(28) / 40(32) |
| 40 | 32 | ✅ | 그대로 |

**외우는 요령: 5의 배수는 zoom 0.8에서 항상 정수**다. (5 × 0.8 = 4)

Tailwind 기본 spacing(`gap-2`=8, `gap-3`=12, `gap-4`=16…) 은 대부분 4의 배수라 zoom 0.8에서 **비정수**가 된다. 문제가 되는 곳만 `gap-[10px]` 같은 arbitrary 5배수 값으로 치환한다.

### 4-2. 플렉스 헤더/액션 영역

- 텍스트 타이틀에는 `min-w-0 truncate` 를 기본으로 붙여 **초과분을 title 쪽에서 흡수**하게 한다
- `shrink-0` 자식의 개별 폭을 5의 배수로 맞춘다
- `gap`도 5의 배수로
- 아이콘 중앙정렬은 `grid place-items-center` 대신 `flex items-center justify-center` 권장 (Firefox zoom 환경에서 더 일관적)

### 4-3. SVG 아이콘

**핵심 공식**: `render_px × 0.8 / viewBox_size = 정수` 가 되도록 viewBox와 className을 정한다.

- `render × 0.8 / viewBox = 2` → 1 unit = 2 screen px (일반적 권장)
- `render × 0.8 / viewBox = 1` → 1 unit = 1 screen px (가장 단순, 좌표 직관적)

| 데스크톱 렌더 | 권장 viewBox | unit/screen px | stroke 권장 |
|---|---|---|---|
| 20 | 16 | 1.0 | 1, 2 |
| 25 | 20 | 1.0 | 1, 2 |
| 30 | 12 | 2.0 | 0.5, 1, 1.5 |
| **35** | **14** | **2.0** | **1, 1.5** |
| 40 | 16 | 2.0 | 1, 1.5 |
| 40 | 32 | 1.0 | 1, 2 |

**path 좌표 규칙**
- unit/screen = 1.0 → 좌표 정수 필수
- unit/screen = 2.0 → 정수 또는 0.5 단위 OK (0.5 × 2 = 정수)
- stroke-width × unit/screen = 정수가 되도록 선택

**Figma/외부 툴에서 export된 SVG 흔한 함정**
- `x="0.5" y="-0.5"` 같은 half-pixel 오프셋 → 툴이 테두리 hairline 맞추려고 넣은 것. 뷰박스/렌더 크기를 바꾸면 의도대로 안 맞는다. **제거하고 정수 좌표로 재작성**.
- `transform="matrix(-1 0 0 1 18 1)"` 같은 수평 뒤집기 → 수동으로 좌표만 뒤집어 path를 재작성하면 더 단순해진다.

### 4-4. 포털/플로팅 패널 좌표 계산 — 화면 px vs 레이아웃 px

> 2026-07-28 추가 · DatePicker/MonthPicker/TimePicker 위치 어긋남 수정(`4af4f84`, `ae6f2f8`) 사례 기반

4-1~4-3이 "렌더 결과가 정수 px인가"의 문제라면, 이건 **좌표를 어느 공간에서 재는가**의 문제다.
서브픽셀과 무관하게 수십~수백 px 단위로 어긋나므로 증상이 훨씬 크다.

`zoom: 0.8`이 걸린 body 안에서 값은 두 종류로 나뉜다.

| 종류 | 해당 값 | 성질 |
|---|---|---|
| **화면 px** | `getBoundingClientRect()`의 top/left/width/height, `window.innerWidth/innerHeight`, `scrollX/scrollY` | 이미 zoom이 곱해진 뒤의 실제 화면 좌표 |
| **레이아웃 px** | `offsetWidth/offsetHeight`, CSS에 쓴 상수(`w-[256px]`, `width: 240`), `style`에 넣는 `top`/`left` 값 | zoom이 곱해지기 **전**. 렌더 시 `× zoom` 된다 |

**규칙 두 줄:**

1. 계산은 **화면 px 공간에서 전부** 끝낸다. 레이아웃 px 값을 끌어와야 하면 `× zoom` 해서 화면 px로 바꾼 뒤 쓴다.
2. `style`에 넣기 **직전에 한 번만** `/ zoom` 해서 레이아웃 px로 되돌린다.

```ts
const zoom = getBodyZoom();
const r = anchor.getBoundingClientRect();           // 화면 px

const panelH = (panel?.offsetHeight ?? 400) * zoom; // 레이아웃 → 화면
const panelW = PANEL_WIDTH * zoom;                  // 레이아웃 → 화면

const spaceBelow = window.innerHeight - r.bottom;   // 화면 px
const top  = spaceBelow < panelH + gap ? r.top - panelH - gap : r.bottom + gap;
const left = r.left + (r.width - panelW) / 2;       // 전부 화면 px

setPos({ top: top / zoom, left: left / zoom });     // 마지막에 한 번만 되돌림
```

**실제로 났던 증상 3가지**

- **`/ zoom` 자체를 빼먹음** → 오차가 좌표에 비례(`좌표 × (1-zoom)`). 화면 오른쪽 요소일수록 크게 밀린다. 화면 왼쪽/위쪽은 오차가 작아 멀쩡해 보이므로 **"가로만 틀렸다"고 오진하기 쉽다.**
- **`offsetHeight`를 화면 px과 직접 비교** → 패널 높이를 `1/zoom`배(25%) 크게 잡는다. ①아래에 자리가 있는데도 위로 플립하고 ②위로 띄울 때 간격이 `panelHeight × (1-zoom)`만큼(400px 패널 기준 **80px**) 더 벌어진다.
- **CSS 폭 상수를 화면 px과 직접 비교** → 중앙 정렬·뷰포트 클램프가 `PANEL_WIDTH × (1-zoom) / 2`만큼 어긋난다.

**주의: 모바일 분기는 대체로 무증상이다.** 모바일은 `zoom: 1.0`이라 두 공간이 같아진다.
`viewportWidth < 768` 안쪽의 클램프 코드에 위 혼동이 있어도 오차가 0이므로, 코드가 틀렸다고
급히 고치면 오히려 실동작을 바꾼다. 데스크톱 경로에서만 검증하고 판단할 것.

**체크리스트**

- [ ] `getBoundingClientRect`와 `offsetHeight/offsetWidth`를 같은 식에서 비교하고 있지 않은가
- [ ] CSS로 지정한 패널 크기 상수를 `innerWidth/innerHeight`와 직접 비교하고 있지 않은가
- [ ] `/ zoom`이 **최종 대입 직전 한 번만** 나오는가 (중간에 섞여 있으면 십중팔구 틀림)
- [ ] `position: fixed`인데 `scrollX/scrollY`를 더하고 있지 않은가 (fixed는 스크롤을 따라가지 않음)
- [ ] 패널 폭을 위치 계산과 className 양쪽에 따로 적어두지 않았는가 (상수 하나로 묶고 `style`로 전달)

---

## 5. 수정 방안 우선순위

증상이 나오면 아래 순서대로 시도한다. 위쪽일수록 로컬·저위험.

| 방안 | 리스크 | 효과 범위 | 언제 쓰나 |
|---|---|---|---|
| **A. 픽셀 5배수 정렬 + `min-w-0` 추가** | 낮음 | 해당 패널 | 플렉스 초과/가장자리 밀림 |
| **B. SVG viewBox·render 재정합** | 낮음 | 아이콘 하나 | 아이콘 내부 "눌림/쏠림" |
| **C. SVG 테두리를 CSS border로 분리** | 중 | 해당 버튼 | B로 해결 안 될 때. 테두리가 안정되면 심리적 충격이 줄어듦 |
| **D. 해당 섹션만 zoom 해제** | 중 | 섹션 단위 | 디자인 스케일이 상관없는 유틸 영역 |
| **E. 전역: `zoom` → `transform: scale` 또는 rem 스케일** | 높음 | 전역 | 같은 클래스의 버그가 여러 곳에서 반복될 때 |

---

## 6. 이번 사례 타임라인 (#795)

### 증상
데스크톱 Firefox에서 대시보드 "달력 & 일정" 헤더의 `>` 버튼만 한쪽으로 쏠려 보임. Chrome/Whale 정상.

### 시도 1: D안 — 픽셀 정수화 + 플렉스 보호 (`src/components/dashboard/CalendarSection.tsx`)
- title span: `+ min-w-0 truncate`
- action wrapper: `gap-2` → `gap-[10px]` (6.4 → 8)
- 버튼: `md:w-[36px] md:h-[36px]` → `md:w-[35px] md:h-[35px]` (28.8 → 28)
- 아이콘 중앙정렬: `grid place-items-center` → `flex items-center justify-center`

**결과**: 버튼 외곽은 정수화됐지만 내부 SVG가 여전히 viewBox 18 + render 35로 fractional → 증상 잔존.

### 시도 2: F1안 — SVG 내부까지 정수화 (`CalendarPrevIcon.tsx`, `CalendarNextIcon.tsx`)
- viewBox `18` → `14`
- 렌더 `md:w-9 md:h-9` (36) → `md:w-[35px] md:h-[35px]`
- 35 × 0.8 / 14 = **2.0 per unit** (정수)
- 테두리 rect: `x="0.5" y="-0.5" width="17" height="17" rx="4.5" transform="matrix(-1 0 0 1 18 1)"` → `x="1" y="1" width="12" height="12" rx="3"` (정수, transform 제거)
- arrow path: `M 7.5 12.5 L 11 9 L 7.5 5.5` → `M 6 10 L 9 7 L 6 4` (정수)
- stroke 1.5 유지 (1.5 × 2 = 3 screen px, 정수)

**결과**: 해당 브라우저에서 "눌림" 해소 확인.

---

## 7. 재발 방지 규칙 (신규 코드 작성 시)

### 코드 리뷰 체크리스트

- [ ] 고정 `px` 값은 **5의 배수**로 (zoom 0.8에서 정수)
  - 예외: Tailwind 기본 spacing을 쓰는 경우 시각적으로 민감한 영역(헤더, 버튼, 아이콘)만 신경 쓴다
- [ ] 플렉스 컨테이너 자식 중 텍스트는 `min-w-0 truncate` 기본
- [ ] 고정폭 아이콘 버튼의 중앙정렬은 `flex items-center justify-center` 사용
- [ ] SVG 아이콘을 새로 export했다면 `render × 0.8 / viewBox` 가 정수인지 확인
- [ ] Figma export의 `x="0.5"`, `matrix(-1 0 0 1 ...)` 류는 제거하고 재작성

### 공용 아이콘 작성 규칙

신규 아이콘 컴포넌트 추가 시:
- viewBox = **14** (데스크톱 버튼 35px 기준) 또는 **20** (데스크톱 25px 기준) 중 선택
- path 좌표 = 정수
- stroke-width = 1 또는 1.5

### 테스트 시나리오

QA 가이드(`TESTING_GUIDE.md`)에 아래 시나리오를 추가 권장:
- [ ] Firefox 최신 버전 데스크톱(폭 ≥ 1080px)에서 각 페이지의 아이콘 버튼 시각 점검
- [ ] 브라우저 기본 줌 90% / 100% / 110% 에서 레이아웃 깨짐 없음 확인

---

## 8. 참고

- Tailwind `zoom` 관련 문서: 없음 (`zoom`은 non-standard)
- MDN `zoom`: https://developer.mozilla.org/en-US/docs/Web/CSS/zoom
- Firefox `zoom` 표준화 이슈: Bugzilla #390936 (구현 완료, 그러나 플렉스/SVG 서브픽셀 거동은 계속 개선 중)
- 이 프로젝트의 zoom 적용 지점: `src/app/layout.tsx:90`, `src/middleware.ts:228`
- zoom 보정이 필요한 포털 좌표 계산 예시(작성 규칙은 4-4 참고):
  - `src/components/common/DatePicker.tsx`, `MonthPicker.tsx`, `TimePicker.tsx` — 앵커 패널 3종. 계산 방식이 셋 다 복붙이라 한 곳만 고쳐지고 갈라진 전례가 있다(2026-07-28). 공통 훅으로 추출 예정
  - `src/components/chat/ChatFilterModal.tsx` — 단순 앵커링만 하는 최소 예시
  - `src/hooks/useEmojiPicker.ts` — 모바일 분기에 레이아웃 px 혼용이 있으나 zoom 1.0이라 무증상

---

## 9. 알려진 미수정 건 (백로그)

### 9-1. 플로팅 창 드래그·리사이즈의 zoom 미보정

> 2026-08-28 브라우저 실측으로 확인 · **고객 상세 창은 수정 완료, 직원채팅은 미수정 유지**

두 훅에 `getPointerScale` 옵션을 추가했다. 넘기면 포인터 이동량(화면 px)을 그 값으로 나눠
`bounds`의 좌표계(레이아웃 px)로 바꾸고, 넘기지 않으면 예전 그대로 동작한다.

- `src/hooks/useDraggableFloatingWindow.ts` — `getPointerScale` 지원
- `src/hooks/useResizableFloatingWindow.ts` — `getPointerScale` 지원
- `src/components/customers/FloatingCustomerDetailModal.tsx` — **수정 완료**.
  `getPointerScale: getBodyZoom`을 넘기고, 클램핑 기준도 `innerWidth/innerHeight`가 아니라
  `getViewportInLayoutPx()`(= 화면 px ÷ zoom)를 쓴다
- `src/components/layout/StaffChatModal.tsx` (직원채팅 — 원본) — **그대로 둔다**.
  운영 중이고 사용자들이 현재 동작에 익숙하다. 고칠 때는 위 두 줄만 따라 하면 된다

아래는 수정 전 증상 기록이다(직원채팅에는 아직 그대로 남아 있다).

4-4가 금지하는 혼용이 그대로 있다. 포인터 좌표(`e.clientX/clientY`)와 뷰포트 크기(`window.innerWidth/innerHeight`)는
**화면 px**인데, 그 값으로 계산한 결과를 `style`의 `left`/`top`/`width`/`height`에 **레이아웃 px로 그대로** 넣는다.
중간에 `getBodyZoom()` 변환이 없다.

`zoom: 0.8`(데스크톱 ≥1080px)에서의 실측:

```
positioner inline style : left 698px, top 78px   ← 레이아웃 px (코드가 넣은 값)
실제 화면 위치          : x 558,     y 62        ← 698 × 0.8
```

증상 두 가지:

1. **드래그가 커서를 따라가지 못한다** — 커서를 400px 옮기면 창은 320px만 이동(0.8배). 길게 끌수록 커서와 창이 벌어진다.
2. **창이 화면 좌상단에 갇힌다** — `clampBounds`가 창 크기를 레이아웃 px(height 694)로 보는데 실제 렌더는 555px이다.
   그래서 아래 155px·오른쪽 658px 여백이 남아 있는데도 더 옮길 수 없다.

고객 상세 창에서는 2번 증상 때문에 창이 화면 폭의 정확히 zoom배(0.8) 지점에 보이지 않는 벽이
생겨 오른쪽 여백으로 더 못 나갔다(실측: 창 폭 1915px에서 오른쪽 한계 1532px = 1915 × 0.8).
같은 수정을 직원채팅에 적용할 때도 이 두 곳(포인터 변환 + 클램핑 기준)을 함께 바꿔야 한다.
