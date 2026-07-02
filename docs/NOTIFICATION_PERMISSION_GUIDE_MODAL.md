# 알림 권한 안내 모달 설계 문서

> 2026-07-02 작성 · **구현 완료** · 관련 문서: [`EDGE_NOTIFICATION_PERMISSION_INVESTIGATION.md`](./EDGE_NOTIFICATION_PERMISSION_INVESTIGATION.md)
>
> **구현 요약**: `src/utils/notification.ts`에 `requestNotificationPermissionWithGuide()` 추가, 기존 `requestNotificationPermission()`은 호출부가 없어져 제거함. `Header.tsx`/`LiteHeader.tsx`/`NotificationBell.tsx`/`MobileDrawer.tsx`의 4개 호출부를 새 함수로 교체. 설계와 다른 점 하나: **모바일에서도 권한 요청 자체는 그대로 수행**(안내 모달만 생략) — `MobileDrawer.tsx`가 실제로 모바일 전용 컴포넌트라서, 기존처럼 모바일에서도 권한 요청은 동작해야 하는 걸 구현 중 확인함(1-2절 "모바일 제외"는 안내 모달에만 적용, 권한 요청 자체를 막는 게 아님). `npx tsc --noEmit`, `npx eslint`, `npm run build` 모두 에러 없이 통과 확인(2026-07-02).
>
> **추가(2026-07-02)**: "다시 보지 않기" 버튼 추가. `showErrorModal`의 `cancelText: "다시 보지 않기"` + `onCancel`로 `tg_notification_guide_modal_dismissed_forever` localStorage 플래그를 영구 기록하고, `requestNotificationPermissionWithGuide()`가 이 플래그를 24시간 쿨다운보다 먼저 체크해서 한 번이라도 "다시 보지 않기"를 누르면 이후 영구적으로 모달을 띄우지 않는다. 브라우저 알림 권한 요청(`Notification.requestPermission()`) 자체는 이 플래그와 무관하게 계속 수행됨(모달만 억제).

## 0. 배경 한 줄 요약

Edge/Chrome 등 Chromium 계열 브라우저는 알림 권한 승인 이력이 충분히 쌓이지 않은 사이트에 대해 기본적으로 **quiet UI**(네이티브 팝업 대신 주소창의 작은 알림 아이콘만 표시)를 적용한다. 이 상태에서는 사용자가 그 아이콘을 스스로 찾아 클릭해야 "허용/차단"을 선택할 수 있는데, 대부분의 사용자는 이 아이콘의 존재 자체를 모른다. 이 문서는 그런 사용자에게 "지금 알림이 꺼져 있고, 이렇게 하면 켤 수 있다"를 안내하는 **모달**의 설계를 다룬다. (원인 조사는 investigation 문서에서 이미 종결됨 — 코드로 우회 불가능한 브라우저 정책이 원인)

---

## 1. 대원칙 (최우선, 타협 불가)

### 1-1. 이미 허용된 사용자에게는 절대 뜨면 안 된다

이 모달의 존재 이유는 "허용을 못 받은 사용자를 돕는 것"이다. 이미 정상적으로 `granted` 상태인 사용자에게 뜨면 안내가 아니라 방해가 되고, 제품 신뢰도를 깎는다. 이건 기능의 성공/실패를 가르는 기준이다.

**이걸 보장하기 위한 구현 원칙:**
- 마운트 시점에 `Notification.permission`을 먼저 확인하고, `granted`면 애초에 렌더링하지 않는다 (깜빡임 없이 즉시 판단).
- 세션 도중 사용자가 quiet UI 아이콘을 눌러 직접 허용할 수도 있으므로, `navigator.permissions.query({ name: "notifications" })`가 반환하는 `PermissionStatus.onchange` 이벤트를 구독해서 **새로고침 없이 실시간으로 감지**하고, `granted`로 바뀌는 즉시 모달을 닫는다. (investigation 문서 4절에서 이미 확정된 기법)
- "요청 중" 또는 "방금 요청을 보냈고 아직 결과를 모르는" 애매한 타이밍에 성급하게 모달을 띄우지 않는다. 상태가 명확히 `default`(또는 `denied`)로 확인된 이후에만 노출한다.

### 1-2. Notification API를 지원하지 않는 환경, 그리고 모바일에서는 뜨지 않는다

`"Notification" in window`이 false인 구형 브라우저에서는 "허용해주세요" 안내 자체가 성립하지 않으므로 모달을 띄우지 않는다.

**모바일(결정됨, 2026-07-02)**: 이번 범위에서 완전히 제외한다. iOS Safari 일반 탭처럼 웹 푸시 지원 자체가 브라우저/OS별로 근본적으로 제한적인 환경(PWA 설치 필요 등)까지 대응하려면 별도 과제로 분리해야 하고, 이 서비스는 반응형 대응은 돼 있지만 모바일이 메인 사용 환경은 아니므로 우선순위가 낮다고 판단. 데스크톱 Chromium 계열(Edge/Chrome/Whale 등)만 대상으로 한다. 판별은 UA 기반 데스크톱/모바일 구분으로 충분(이미 `ChatMainView.tsx`에 iOS 판별 패턴 존재).

### 1-3. 특정 브라우저의 UI 요소를 과도하게 구체적으로 지칭하지 않는다 (일반화, 결정됨)

이전 논의에서는 "Edge는 종모양 아이콘, Chrome은 자물쇠 옆 아이콘" 식으로 브라우저별 맞춤 문구를 고려했으나, **범용적인 문구 하나로 대부분의 Chromium 계열 브라우저를 커버**하는 쪽으로 단순화하기로 확정. 브라우저 종류/버전에 따라 아이콘 모양과 정확한 위치가 조금씩 달라 브라우저 판별(UA 스니핑)에 의존한 정밀 안내는 깨지기 쉽고 유지보수 부담이 크다.

**2차 결정(2026-07-02)**: 실제로 풀리는 경로도 상황에 따라 "주소창 아이콘 클릭"과 "브라우저 설정에서 직접 허용" 둘 다 있을 수 있어서, 위치를 정밀하게 못박기보다("오른쪽 끝" 등) **"주소창의 알림 아이콘 클릭 또는 브라우저 설정에서 허용"처럼 두 경로를 함께 언급**해 사용자가 넓게 인지하고 자기 상황에 맞는 쪽을 택하게 한다. 문장이 늘어지지 않도록 위치 묘사는 최소화한다 (7절 최종 문구 참고 — 시각 자료 미포함 결정과 같은 맥락).

---

## 2. Notification.permission 상태별 처리

JS에서 확인 가능한 상태는 `granted` / `denied` / `default` 세 가지뿐이다. 이 모달과 관련해서는 상태별로 성격이 다르다.

| 상태 | 의미 | 이 모달의 처리 |
|---|---|---|
| `granted` | 정상 작동 중 | **절대 노출 안 함** (1-1절) |
| `denied` | 명시적으로 차단됨(사용자가 직접 차단했거나, 브라우저가 반복 무시/거부로 자동 차단) | **결정됨(2026-07-02): 이번 범위에서 제외, 모달 노출 안 함.** 사용자가 이미 명시적으로 거부 의사를 표현한 상태에 다시 팝업을 띄우는 건 UX상 맞지 않다고 판단. |
| `default` | 아직 결정 안 됨 | 두 가지 경우가 섞여 있어 JS로 구분 불가: (a) 애초에 한 번도 요청한 적이 없음 (b) 요청은 시도했지만 quiet UI라 사용자가 아직 아이콘을 안 눌러서 계속 default로 남아있음. → **로컬에 "이 브라우저에서 알림 권한을 요청한 적이 있다" 플래그를 별도로 기록**해서 (b)인 경우에만 이 모달의 대상으로 삼는다. (a)는 애초에 사용자가 알림이 필요한 기능을 아직 안 써봤다는 뜻이라, 굳이 먼저 나서서 안내할 필요 없음. |

**결론(확정)**: 이 모달이 실제로 다루는 케이스는 **`default` + "요청 시도 이력 있음" (quiet UI 케이스) 단 하나뿐**. `granted`/`denied`는 모두 노출 대상에서 제외.

---

## 3. 노출 조건 (트리거) — 결정됨: 기능 사용 시점 연동

상담 채팅 진입, 알림 벨 클릭 등 "지금 알림이 필요한 순간"에 권한 요청(`requestNotificationPermission()`)을 시도한 직후, 결과가 여전히 `default`면 그 자리에서 모달을 노출한다. (`denied`는 2절 결정에 따라 노출 안 함)

- 요청 직후 바로 판단 가능 — 별도의 전역 체크 타이밍(로그인 후, 대시보드 진입 시 등)을 새로 설계할 필요 없음
- 사용자가 "지금 이 기능에 알림이 필요하다"고 느끼는 바로 그 시점에 안내하므로 맥락이 자연스러움
- 기존에 권한을 요청하던 지점들(`Header.tsx`, `LiteHeader.tsx`, `NotificationBell.tsx`, `MobileDrawer.tsx`)의 호출부에서 결과를 받아 그대로 판단에 활용 가능

> 메모: 이전 세션에서 실험용으로 잠깐 만들었던 `/my-settings?tab=notification` 테스트 버튼(`BrowserPermissionTestSection`, 현재는 제거됨)은 이 트리거와 무관 — 그건 "개발자 검증용", 이건 "실사용자 안내용"으로 목적이 다름.

---

## 4. 노출 위치/형태

사용자 확인: **모달**로 확정 (배너/토스트 아님).

- 모달이므로 화면을 가리는 만큼, 1절의 "granted면 절대 안 뜸" 원칙이 더 중요해짐 (배너보다 침습적이라 오탐의 비용이 큼)
- **시각 자료(스크린샷/화살표 등): 미포함으로 결정(2026-07-02).** 브라우저 UI는 버전업마다 바뀌기 때문에 스크린샷/캡처를 넣으면 몇 년 뒤 다시 손봐야 하는 관리 포인트가 늘어나 지속성이 떨어짐. 대신 텍스트 문구를 신경 써서 작성하는 쪽으로 (7절 참고).
- **배치(결정됨, 2026-07-02)**: 데스크톱은 화면 중앙, 모바일은 하단 시트 — 기존 기능 모달들(`CustomerCreateModal.tsx` 등)이 이미 쓰는 `md:items-center md:justify-center` + 모바일 풀스크린/하단 패턴과 통일. 다만 1-2절 결정에 따라 **모바일은 이번 범위에서 제외**이므로, 하단 시트 레이아웃은 지금 당장 실사용되지 않고 향후 모바일 지원을 붙일 때를 대비한 컨벤션 통일 차원의 결정임 (모바일 범위를 다시 여는 결정은 아님).

---

## 5. 재노출 / 닫기 정책 — 결정됨: 24시간 쿨다운 (default 상태일 때만)

- `denied`/`granted`는 애초에 모달을 안 띄우므로 재노출 정책 자체가 해당 없음 — 이 정책은 오직 `default`(quiet UI 추정) 케이스에만 적용
- 모달을 닫으면 로컬에 타임스탬프를 기록하고, **24시간 이내에는 재노출 트리거 조건(3절)이 다시 충족되더라도 모달을 띄우지 않는다**
- 하루 한 번 정도로 제한해 사용자를 귀찮게 하지 않으면서도, 다음날 다시 접속했을 때는 다시 상기시켜줌 (리마인드와 거슬림 사이 균형)
- **추가(2026-07-02)**: 24시간 쿨다운과 별개로 "다시 보지 않기" 버튼을 추가해, 사용자가 명시적으로 선택하면 24시간 제한과 무관하게 **영구적으로** 재노출을 막을 수 있게 함(7절 참고). 24시간 쿨다운은 "일단 넘어감", "다시 보지 않기"는 "이제 그만 물어봐"에 해당하는 별개의 두 단계 억제 장치.

---

## 6. 실시간 동기화 기법 + 트리거 구현 방식 (기술 메모, 구현 시 참고)

### 6-1. ⚠️ `requestPermission()`은 quiet UI일 때 Promise가 끝나지 않는다 (구현에 영향 큼)

investigation 문서 4절에서 이미 확정된 사실: quiet UI 상태에서 `Notification.requestPermission()`의 Promise는 **사용자가 주소창 아이콘을 직접 클릭해서 응답하기 전까지 pending 상태로 멈춘다.** 즉 3절 트리거를 `await requestNotificationPermission(); if (result === "default") showModal()` 식으로 단순 구현하면, quiet UI일 때 그 `await`가 세션 내내 끝나지 않아 모달을 띄우는 코드에 도달하지 못한다.

**따라서 트리거는 타임아웃 기반으로 구현한다**:
1. 클릭 시 `Notification.requestPermission()`을 **await하지 않고 fire-and-forget으로 호출**(나중에 사용자가 실제로 아이콘을 눌렀을 때 resolve되면 그 결과는 `permissions.query`의 `onchange`로 감지, 6-2절 참고)
2. 별도로 약 **2.5초 타이머**를 건다
3. 타이머가 끝난 시점에 `Notification.permission`을 다시 동기적으로 읽어서 여전히 `"default"`면 quiet UI로 판단하고 모달 노출

타임아웃 값(2.5초)은 임의로 정한 합리적 기본값 — 너무 짧으면 실제 느리게 반응하는 네이티브 팝업 케이스와 혼동될 수 있고, 너무 길면 사용자가 기다리는 체감이 생김. 구현 후 실측하며 조정 가능.

### 6-2. `granted`로 바뀌면 실시간으로 모달 닫기

```js
// 마운트 시
if (Notification.permission === "granted") return; // 아예 렌더링 안 함

const result = await navigator.permissions.query({ name: "notifications" });
// result.state: 'granted' | 'denied' | 'prompt' (Permissions API 자체 표기는 Notification.permission과 약간 다름 — 매핑 필요)
result.onchange = () => {
  if (Notification.permission === "granted") {
    hideErrorModal(); // 6절 최종 결정: 기존 전역 모달 시스템 재사용 (9절 참고)
  }
};
```

- `Notification.permission`과 `PermissionStatus.state`는 값 표기가 다를 수 있음(`default` vs `prompt`) — 실제 판단 기준은 `Notification.permission`으로 통일하고, `permissions.query`의 `onchange`는 "변화 감지 트리거" 용도로만 사용.
- 리스너는 모달을 띄우는 시점에 등록하고, 모달이 닫히면(어떤 경로로든) 해제한다 (메모리 누수/중복 방지).

### 6-3. 24시간 쿨다운 타임스탬프는 "표시 시점"에 기록한다 (닫는 시점 아님)

9절에서 재사용하기로 한 기존 전역 모달(`showErrorModal`/`hideErrorModal`)은 X 버튼이나 오버레이 클릭으로 닫을 때 별도 콜백(`onCancel` 등)을 거치지 않고 바로 닫힌다 — 즉 "어떻게 닫혔는지"를 안정적으로 훅킹할 수 없다. 그래서 5절의 24시간 쿨다운 타임스탬프는 **모달을 닫을 때가 아니라 처음 띄우는 순간(`showErrorModal()` 호출 직전)에 기록**한다. 스로틀링 목적상 "보여줬다"는 사실 자체가 중요하지 "어떻게 닫았는지"는 중요하지 않으므로 결과적으로 동일하고, 구현은 오히려 더 단순해진다.

---

## 7. 문구 초안 (검토 필요 — 텍스트만으로 승부해야 하므로 특히 중요)

이 모달이 다루는 케이스는 `default`(quiet UI 추정) 하나뿐(2절 결정). 시각 자료 없이 텍스트만으로 사용자가 실제 아이콘을 찾아 클릭하게 만들어야 하므로, 위치 설명이 명확해야 함.

### 외부 피드백(GPT-5.4) 검토 결과 (2026-07-02)

"허용하라"보다 "왜 필요한지"를 먼저 설명하는 편이 승인율에 유리하다는 리뷰를 받아 검토함. 이는 Chrome/Google이 실제로 권장하는 패턴이라 **톤은 채택** — 문구에 혜택(실시간 알림을 놓치지 않음)을 먼저 언급.

다만 리뷰가 제안한 아래 두 가지는 채택하지 않기로 함(둘 다 위 5절 질문에서 확정):
- **2단계 프라이밍(커스텀 UI로 먼저 동의 구하고, 승낙 시에만 실제 브라우저 API 호출)**: 장기적으로 승인율 개선에 도움될 수 있는 아이디어지만, 지금은 3절에서 이미 합의한 "제스처 시 바로 API 호출 → default면 안내" 단일 단계 설계를 유지하기로 함. 필요해지면 별도 과제로 재검토.
- **`default` 상태 문구를 "곧 브라우저 권한 요청이 표시됩니다"로 쓰자는 제안**: 채택 안 함 — **저희 트리거 시점(3절) 기준으로는 사실과 다름.** 이 모달이 뜨는 시점은 이미 `requestNotificationPermission()`을 호출했고 quiet UI 때문에 네이티브 팝업이 뜨지 않은 걸 확인한 뒤이므로, "곧 나타난다"고 안내하면 사용자가 오지 않을 팝업을 기다리게 됨. 대신 "지금 바로 아이콘을 클릭하라"는 능동적 지시로 간다.
- denied 케이스 별도 안내, 브라우저별 조건부 문구는 기존 결정(denied 제외, 범용 문구 하나)을 그대로 유지하기로 재확인함.

### 2차 수정: 해결 경로를 하나로 못박지 않고 넓힘 (2026-07-02)

"주소창 아이콘 클릭"만 안내하면, 실제로는 아이콘 클릭이 아니라 **브라우저 설정(사이트 설정 > 알림)에서 직접 허용**해야 풀리는 상황도 있어서 안내가 너무 좁다는 지적. 사용자가 처한 정확한 상황(quiet UI 아이콘이 보이는지, 어느 브라우저인지 등)을 문구가 다 예측할 수 없으므로, **"아이콘 클릭 또는 브라우저 설정에서 허용"** 두 경로를 모두 언급해서 사용자가 자기 상황에 맞는 쪽을 택하게 한다. 대신 문장이 길어지지 않도록 위치 설명("오른쪽 끝" 등)은 덜어내고 핵심 동작만 남긴다 — 1-3절의 "일반화" 원칙과 같은 방향(정확한 위치 묘사보다 넓은 인지 가능성을 우선).

### 최종 확정 (2026-07-02)

> **헤드라인**: 실시간 알림을 받아보세요
>
> **설명**: 중요한 알림을 놓치지 않도록 브라우저 알림을 사용할 수 있어요.
> 주소창의 알림 아이콘을 클릭하거나, 브라우저 설정에서 알림을 허용해주세요.
>
> **버튼**: 확인(주 버튼) / 다시 보지 않기(보조 버튼, 2026-07-02 추가 — 클릭 시 `tg_notification_guide_modal_dismissed_forever` 영구 기록)

9절에서 정한 대로 기존 전역 모달(`showErrorModal`)을 그대로 쓰므로, 실제 호출 payload는 다음과 같다:

```js
showErrorModal({
  type: "info",
  title: "", // 상단에 "알림" 같은 중복 라벨이 뜨지 않도록 명시적으로 비움
  headline: "실시간 알림을 받아보세요",
  description:
    '중요한 알림을 놓치지 않도록 브라우저 알림을 사용할 수 있어요.\n주소창의 알림 아이콘을 클릭하거나, 브라우저 설정에서 알림을 허용해주세요.',
  confirmText: "확인",
  cancelText: "다시 보지 않기",
  onCancel: () => {
    window.localStorage.setItem("tg_notification_guide_modal_dismissed_forever", "true");
  },
});
```

`description`은 `whitespace-pre-line`으로 렌더링되므로 `\n`으로 두 줄 분리 가능(기존 `ErrorFeedbackModalProvider` 확인 완료).

---

## 8. 모달 컴포넌트 위치 — 결정됨: 새 컴포넌트 만들지 않고 기존 전역 모달 재사용

`src/providers/ErrorFeedbackModalProvider.tsx`(이미 `src/app/layout.tsx`에 전역 마운트됨)와 `src/lib/errorModalEvents.ts`의 `showErrorModal()` / `hideErrorModal()`을 그대로 재사용한다. 이 시스템은 `NotificationTab.tsx` 등에서 이미 쓰이고 있는, 이름은 "Error"지만 실제로는 `error`/`success`/`info` 3가지 타입을 지원하는 범용 피드백 모달이다.

**재사용을 택한 이유**:
- `type: "info"`가 이미 중앙 정렬 원형 아이콘 + 헤드라인(굵게, 중앙) + 설명(중앙) + 버튼 레이아웃을 제공 — 4절에서 정한 "데스크톱 중앙" 배치와 정확히 일치, 새로 만들 이유가 없음
- `showErrorModal()`/`hideErrorModal()`은 React 트리 바깥 어디서든(이벤트 버스 기반) 호출 가능 — `src/utils/notification.ts`의 유틸 함수 안에서 바로 호출 가능해서 `Header.tsx`/`LiteHeader.tsx`/`NotificationBell.tsx`/`MobileDrawer.tsx` 각각에 모달 렌더링 로직을 새로 심을 필요가 없음
- CLAUDE.md 원칙("불필요한 추상화/중복 금지")과 일치 — 이미 있는 걸 또 만들지 않음

**단, 모바일 하단 시트는 이 시스템에 없음**: `ErrorFeedbackModalProvider`는 항상 중앙 정렬(`items-center justify-center`)이라 모바일 하단 시트 패턴은 지원하지 않는다. 1-2절 결정대로 지금은 모바일이 범위 밖이라 문제 되지 않지만, **나중에 모바일 지원을 추가하게 되면 이 재사용 결정을 다시 검토**해야 한다(그때는 `CustomerCreateModal.tsx` 같은 반응형 모달 패턴으로 전용 컴포넌트를 새로 만드는 쪽이 맞을 가능성이 높음).

**로직이 위치할 곳**: 새 UI 컴포넌트는 없지만, "요청 → 2.5초 대기 → 여전히 default면 쿨다운 체크 후 `showErrorModal()` 호출 → `permissions.query` onchange로 자동 닫기" 오케스트레이션 로직은 `src/utils/notification.ts`에 새 함수(예: `requestNotificationPermissionWithGuide()`)로 추가한다. 기존 4개 호출부(`Header.tsx`, `LiteHeader.tsx`, `NotificationBell.tsx`, `MobileDrawer.tsx`)는 `requestNotificationPermission()` 대신 이 새 함수를 호출하도록 바꾼다. investigation 문서에서 이미 "`requestNotificationPermission()`은 단일 소스"라고 정리된 것과 같은 원칙을 그대로 따르는 것.

---

## 9. 결정 사항 요약 — 설계 완료, 구현 준비됨

모든 설계 항목이 결정 완료됐다(1~8절). 요약:

| 항목 | 결정 |
|---|---|
| 대상 상태 | `default`(quiet UI 추정)만. `granted`/`denied`는 모달 노출 안 함 |
| 트리거 | 기능 사용 시점(권한 요청 직후), 단 **2.5초 타임아웃 기반**(6-1절, pending Promise 이슈로 인해 필수) |
| 위치/형태 | 모달, 데스크톱 중앙(모바일은 범위 밖) |
| 재노출 | 24시간 쿨다운, **모달 표시 시점**에 타임스탬프 기록 |
| 시각 자료 | 없음, 텍스트만 |
| 로컬 저장 | `localStorage`, 프로젝트 ID 없이 단순 키(오리진 단위로 이미 격리됨) |
| 문구 | 7절 최종 확정 |
| 컴포넌트 | 신규 컴포넌트 없음, 기존 `showErrorModal()`/`hideErrorModal()` 재사용. 오케스트레이션 로직은 `src/utils/notification.ts`에 신규 함수로 추가 |

다음 단계는 코드 구현이다. 구현 시 손댈 파일: `src/utils/notification.ts`(신규 함수), `Header.tsx`/`LiteHeader.tsx`/`NotificationBell.tsx`/`MobileDrawer.tsx`(호출부 교체).
