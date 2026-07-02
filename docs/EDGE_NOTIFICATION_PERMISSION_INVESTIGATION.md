# Edge 브라우저 알림 권한 팝업 미노출 이슈 조사 기록

> 2026-07-02 작성 · "Edge에서 알림 권한 팝업이 안 뜨고 알림이 안 된다"는 제보 기반 · **조사 중, 미해결**

## 0. 한 줄 요약

> Edge에서 `Notification.requestPermission()`을 호출해도 네이티브 팝업 대신 주소창 우상단에 조용한 아이콘(quiet UI)만 뜨는 증상. 코드/설정/정책을 하나씩 소거법으로 배제한 결과, **"이 브라우저/사이트가 무엇을 했느냐"보다 "최근 Chromium이 절대다수의 사이트에 대해 기본값을 quiet UI로 바꿔버린 것 아니냐"는 가설**까지 왔음. 강제로 네이티브 팝업을 띄우는 방법은 없다는 게 확인된 사실이고, 남은 선택지는 **보조 UI로 사용자에게 수동 허용을 안내**하는 것뿐.

---

## 1. 증상

- Edge 사용자가 알림을 켜지 못한다는 제보
- `requestNotificationPermission()`을 호출해도 브라우저 네이티브 "허용/차단" 팝업이 뜨지 않고, 주소창 우상단에 종모양 아이콘만 생김
- 콘솔에서 직접 호출해도 동일:
  ```js
  Notification.requestPermission().then(p => console.log(p))
  // → Promise {<pending>} 상태로 멈춤 (아이콘을 사용자가 직접 클릭하기 전까지 resolve 안 됨)
  ```

---

## 2. 1차 조치: 자동 요청 → 제스처 기반 요청으로 전환 (완료, 커밋됨)

기존에는 로그인 후 1초 타이머로 자동 요청 + pointerdown 폴백으로 권한을 요청하고 있었음. 이건 Chromium의 "제스처 없는 요청은 quiet UI로 처리되기 쉽다"는 알려진 패턴에 해당할 수 있어, 실제 사용자 제스처(클릭) 시점으로 요청 트리거를 이동함.

**변경 파일:**
- `src/providers/NotificationProvider.tsx` — 자동 타이머/pointerdown 폴백 제거, 중복 정의된 `requestNotificationPermission` 제거
- `src/providers/ChatProvider.tsx` — 로그인 시 자동 요청 useEffect 제거
- `src/utils/notification.ts` — `requestNotificationPermission()`을 단일 소스로 통일
- `src/components/layout/NotificationBell.tsx` — 종 아이콘 클릭(드롭다운 열 때) 시 요청
- `src/components/layout/Header.tsx`, `LiteHeader.tsx` — "상담" 링크 클릭, "직원채팅" 버튼 클릭 시 요청
- `src/components/layout/MobileDrawer.tsx` — 모바일 드로워 "상담" 항목 클릭 시 요청

**결과: 효과 없음.** 제스처를 붙여도 여전히 quiet UI(종모양)만 뜸. → 코드 문제가 아니라는 방향으로 조사 전환.

> 참고: 한 번 시도했던 "권한이 default로 남으면 안내 토스트를 띄우는" 구현(`NotificationPermissionHint.tsx` + 이벤트 발행)은 **더 구체화해서 다시 만들기로 하고 일단 되돌림(revert)**. 현재 코드베이스에는 없음.

---

## 3. 원인 후보를 소거법으로 좁혀나간 과정

### 가설 A: 우리 사이트가 크라우드소싱 "낮은 승인율" 블랙리스트에 올랐다 (사이트 평판)

- Chromium은 사이트별 알림 권한 승인율을 크라우드소싱(Chrome UX Report/CrUX)으로 집계해서, 승인율이 매우 낮은 사이트는 전 사용자에게 quiet UI를 강제 적용함 ([Chromium Blog 2020](https://blog.chromium.org/2020/01/introducing-quieter-permission-ui-for.html))
- **검증**: 서브도메인을 `test1.app.myservice.im` → `test3.app.myservice.im`(신규, 방문 이력 없음)으로 바꿔도 동일 증상 → 데이터가 없는 신규 오리진에서도 즉시 quiet UI가 뜸
- **검증 2**: 우리 서비스와 완전 무관한 `rebemon.xyz`, 심지어 대형 사이트인 `news.kbs.co.kr`에서도 콘솔로 직접 호출 시 동일하게 quiet UI 재현
- **결론**: 우리 사이트가 "나쁜 평판으로 블랙리스트에 오른" 게 아님. 오히려 **"검증된 좋은 평판이 없는 절대다수의 사이트가 기본적으로 quiet 취급을 받는" 구조**에 가까움 (아래 가설 C 참고)

### 가설 B: 이 PC/계정에 엔터프라이즈 정책 또는 브라우저 설정이 걸려있다

- **검증 1**: 완전히 새로운 Edge 프로필을 만들어서 재접속 → 동일 증상 재현 (개인 프로필에 학습된 "거부 성향" 데이터가 아니라는 뜻)
- **검증 2**: `edge://settings/content/notifications` → "보내기 전에 확인(권장)"으로 정상 설정돼 있음 (quieter messaging으로 강제되어 있지 않음)
- **검증 3**: `edge://policy`에서 `notification` 검색 → `DefaultNotificationsSetting`, `NotificationsAllowedForUrls`, `NotificationsBlockedForUrls` 등 전부 **"설정되지 않았습니다"**
- **결론**: 엔터프라이즈/그룹 정책도 아니고, 브라우저 자체 설정도 정상. **가설 B는 기각.**

### 가설 C (현재 유력): 절대다수의 사이트가 기본적으로 quiet UI 처리되는 최신 Chromium 기본 동작

- 가설 A, B가 모두 기각된 상태에서, 무관한 사이트(`rebemon.xyz`, `news.kbs.co.kr`)까지 전부 동일 증상을 보인다는 건 → **"우리 사이트/이 PC가 특별해서"가 아니라, 애초에 절대다수 사이트가 기본값으로 quiet 처리되고 있다**는 뜻으로 해석하는 게 가장 정합적
- KBS 뉴스처럼 트래픽이 많은 사이트라도, 그 사이트가 실제로 `Notification.requestPermission()`을 자주 호출해서 **승인 이력 자체가 쌓여 있지 않다면** Chrome 입장에선 "판단 데이터 없음" = 우리와 동일한 취급을 받을 수 있음 (트래픽 ≠ 알림 권한 승인 이력)
- 즉 네이티브 팝업은 이제 Gmail 등 **알림을 핵심 기능으로 쓰고 실제 대규모 승인 이력이 축적된 극소수 서비스**에게만 남아있는, 웹 전반에서 희귀해진 UX일 가능성이 높음
- **미검증**: 이 가설을 완전히 확정하려면, 알림 승인 이력이 확실히 많다고 알려진 사이트(예: Gmail, 카카오톡 웹 등)에서도 동일하게 콘솔 테스트를 해봐야 함. **← 다음 조사 시 우선 진행**

---

## 4. 확정된 사실 (더 이상 의심할 필요 없음)

1. JS로 알림 권한을 강제로 `granted`로 만드는 방법은 **존재하지 않음**. `Notification.permission`은 읽기 전용이고, `requestPermission()`은 브라우저 UI를 요청할 뿐 그 UI의 형태(팝업 vs quiet)나 사용자의 선택 결과를 코드로 제어/우회할 수 없음 (스펙상 의도된 보안 경계)
2. quiet UI 상태에서 `requestPermission()`의 Promise는 사용자가 주소창 아이콘을 직접 클릭해서 응답하기 전까지 **pending 상태로 멈춤**
3. 사용자가 quiet UI 아이콘을 클릭해서 "허용"을 선택하면 실제로 `granted`로 바뀜 (즉 완전 차단은 아니고, 사용자의 추가 클릭이 필요한 상태일 뿐)
4. `Notification.permission`을 단순 재확인하는 대신, `navigator.permissions.query({ name: "notifications" })`가 반환하는 `PermissionStatus.onchange` 이벤트를 구독하면 **새로고침 없이 실시간으로 허용 여부 변화를 감지**할 수 있음 (아직 코드에 미적용)

---

## 5. 다음에 이어서 할 일

- [ ] 가설 C 확정을 위해 승인 이력이 확실한 사이트(Gmail 등)에서 동일 콘솔 테스트 진행
- [ ] 보조 UI(quiet UI 상태 안내) 설계를 구체화해서 다시 구현
  - 노출 조건/타이밍 (요청 직후 vs 항상 상태 표시)
  - 노출 위치/디자인 (토스트 vs 배너 vs 상시 인디케이터)
  - 재노출 정책 (닫으면 언제 다시 보여줄지)
  - `navigator.permissions.query`의 `onchange`로 새로고침 없이 실시간 반영
- [ ] (참고용, 지금 코드베이스엔 없음) 이전에 만들었다 되돌린 `NotificationPermissionHint.tsx` 구조를 재활용할지 처음부터 다시 설계할지 결정

---

## 8. 2026-07-02 추가: "다른 기능과 번들링돼서 차단되는 것 아니냐" 가설 검증용 테스트 버튼

**가설**: 헤더의 "상담"/"직원채팅"/"종모양" 클릭 시 알림 권한 요청이 다른 기능 로직과 함께 실행되기 때문에 차단되는 것 아닐까? → 순수하게 권한 요청만 하는 버튼을 만들어서 검증해보자는 제안.

**사전 판단**: 가능성 낮음. `requestNotificationPermission()`(`src/utils/notification.ts`)은 원래도 다른 로직과 섞이지 않은 순수 함수이고, 2절에서 이미 제스처 기반 순수 호출로도 효과가 없었음을 확인함. 또한 3절 가설 A 검증에서 완전히 무관한 다른 사이트(rebemon.xyz, news.kbs.co.kr)에 콘솔로 아무 것도 섞이지 않은 순수 `Notification.requestPermission()`을 호출해도 동일하게 quiet UI가 떴으므로, "번들링이 원인"이라는 설명과는 이미 상충하는 증거가 있음. 가설 C(승인 이력 없는 사이트에 대한 Chromium 기본 quiet UI 정책)가 여전히 유력.

**그래도 진행한 이유**: 기존 무관 사이트 테스트는 모두 "우리 오리진이 아닌 곳"에서 진행됐음. 우리 오리진에서 완전히 격리된 호출을 테스트해본 적은 없었으므로, 확인 차원 + 5절에 있던 "보조 UI" 작업의 일부로 겸사겸사 구현.

**구현**: `/my-settings?tab=notification` 페이지(`src/components/my-settings/NotificationTab.tsx`) 최하단에 `BrowserPermissionTestSection` 추가.
- 현재 `Notification.permission` 상태를 표시 (`granted`/`denied`/`default`/미지원)
- `navigator.permissions.query({ name: "notifications" })`의 `onchange`를 구독해 새로고침 없이 상태 실시간 반영 (4절의 확정된 사실 #4 적용)
- "권한 요청 테스트" 버튼 클릭 시 `requestNotificationPermission()`만 단독 호출 (네비게이션, 채팅창 열기 등 다른 로직 전혀 없음)

**다음 검증 방법**: Edge에서 이 버튼을 눌러봐서
- 그래도 quiet UI만 뜬다 → 번들링 가설 기각 확정, 가설 C에 무게 실림 (예상되는 결과)
- 네이티브 팝업이 뜬다 → 번들링 가설이 맞았다는 뜻이므로, 헤더 클릭 핸들러들에서 권한 요청과 다른 로직(네비게이션 등)의 실행 순서/타이밍을 분리하는 방향으로 재작업 필요

---

## 6. 참고 자료

- [Chromium Blog: Introducing quieter permission UI for notifications (2020.01)](https://blog.chromium.org/2020/01/introducing-quieter-permission-ui-for.html)
- [Google Chrome Help: Use notifications to get alerts](https://support.google.com/chrome/answer/3220216)
- [research.google: "Shhh...be quiet!" Reducing the Unwanted Interruptions of Notification Permission Prompts on Chrome (USENIX Security 2021)](https://research.google/pubs/shhhbe-quiet-reducing-the-unwanted-interruptions-of-notification-permission-prompts-on-chrome/)
- [Chrome for Developers: Adding notification permission data to the Chrome User Experience Report](https://developer.chrome.com/blog/notification-permission-data-in-crux)
- [Chromium Blog: Reducing notification overload for a quieter browsing experience in Chrome (2025.10)](https://blog.google/chromium/automatic-notification-permission/)
- [Google Chrome Enterprise Help: Manage Chrome policies with Windows registry](https://support.google.com/chrome/a/answer/9131254)

---

## 7. 관련 코드 위치

- `src/utils/notification.ts` — `requestNotificationPermission()` 단일 소스
- `src/providers/NotificationProvider.tsx` — 일반 알림(공지/고객등록/일정 등) 브라우저 알림 표시 로직
- `src/providers/ChatProvider.tsx` — 상담 채팅 새 메시지 브라우저 알림 표시 로직 (`showChatNotification`)
- `src/components/layout/NotificationBell.tsx`, `Header.tsx`, `LiteHeader.tsx`, `MobileDrawer.tsx` — 권한 요청 트리거 지점(종 아이콘, 상담 이동, 직원채팅)
