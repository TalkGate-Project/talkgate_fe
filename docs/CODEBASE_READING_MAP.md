# 코드베이스 읽기 지도 (2026-08-25 시작)

구현 작업이 아니라 코드 숙지·위험 지점 파악이 목적입니다. 폴더별 탐색이 아니라 **한 요청의 수명주기**를 따라 읽습니다: `middleware → session/project context → API request → proxy → service/hook → UI → realtime`.

파일은 이 문서를 보고 있는 편집기에서 직접 엽니다. 이 문서는 순서·질문·메모만 담당합니다.

## 각 단계에서 반복할 루프

1. **예상** — 파일을 열기 전, "내가 짠다면 어떻게 구현했을까"를 한두 줄로 먼저 적습니다.
2. **추적** — 실제 코드를 열어 입력→출력 흐름을 따라갑니다.
3. **대조** — 예상과 실제가 어디서 갈렸는지 적습니다.
4. **Why** — "왜 이렇게 설계했을까"를 코드/커밋/문서 근거로 추론합니다.
5. **분류** — 아래 세 칸 중 하나로 기록합니다.
   - **관찰**: 코드에서 실제로 확인한 사실
   - **가설**: 위험할 수도 있다고 의심되지만 아직 미확인
   - **확정 문제**: 코드·주석·재현으로 이미 검증된 문제 (=> `docs/ANALYSIS_API_QA_CHECKLIST.md` §2에 번호 붙여 이관)

### 파일당 메모 템플릿

```
### <파일 경로>
- 책임:
- 입력:
- 출력:
- 불변식:
- 예상과 실제 차이:
- Why (설계 이유 추론):
- 관찰 / 가설 / 확정 문제:
```

---

## 1단계 — 요청 경계와 앱 골격

목적: URL 하나가 어떤 정책을 통과하고 어떤 Provider 아래 렌더링되는지 파악.

- [v] `src/app/layout.tsx` — 루트 레이아웃, Provider 순서
- [v] `src/middleware.ts` — 경로별 접근 정책 (CLAUDE.md 표와 대조)
- [v] `src/components/common/ConditionalHeader.tsx` — 공통 셸

질문:
- 이 경로는 인증만 필요한가, 프로젝트도 필요한가?
- 메인 도메인과 서브도메인에서 결과가 어떻게 갈라지는가?
- 미들웨어의 경로 배열과 matcher가 어긋나면 어떤 보호가 조용히 빠지는가?

## 2단계 — 세션과 프로젝트 문맥

목적: 사용자·프로젝트 값이 쿠키/localStorage/이벤트/React Query 사이에서 어떻게 동기화되는지 추적.

- [ ] `src/lib/cookies.ts` — 서버 쿠키 (⚠ httpOnly:false, 아래 "이미 확정된 리스크" 참고)
- [ ] `src/lib/token.ts` — 클라이언트 토큰
- [ ] `src/lib/project.ts` — 프로젝트 문맥
- [ ] `src/hooks/useSelectedProjectId.ts` — 프로젝트 구독
- [ ] `src/components/common/AuthSessionWatcher.tsx` — 만료 처리

질문:
- 각 값의 진짜 원본(source of truth)은 무엇인가?
- 다른 탭·서브도메인·새로고침에서도 같은 값이 보장되는가?
- 로그인/토큰갱신/로그아웃 시 상태 변경 순서는?

## 3단계 — 네트워크 왕복

목적: 실제 요청 하나(고객 목록)를 UI → 백엔드 응답, 401 재시도까지 왕복 추적.

- [ ] `src/lib/apiClient.ts` — 클라이언트 요청
- [ ] `src/app/api/proxy/[...path]/route.ts` — 서버 프록시, 401→refresh→재시도
- [ ] `src/hooks/useFetch.ts` — 기본 조회 훅
- [ ] `src/hooks/useMutation.ts` — 기본 변경 훅
- [ ] `src/providers/ReactQueryProvider.tsx` — 서버 캐시 정책

질문:
- 프로젝트 ID, 토큰, Content-Type은 어디서 추가·보존되는가?
- 동시에 401이 여러 건 발생하면 refresh는 정말 한 번만 도는가, 아니면 각자 도는가?
- useFetch/useMutation과 React Query의 캐시·재시도 규칙이 실제로 갈라지는지 확인 (가정하지 말 것 — 이전 리뷰에서 근거 없이 "분산된다"고 단정했던 지점)

## 4단계 — 한 도메인의 수직 절단면 (고객 목록)

목적: page → 조정 컴포넌트 → 훅 → 서비스 → 타입 순서로 끝까지 관통.

- [ ] `src/app/customers/page.tsx`
- [ ] `src/components/customers/CustomersPageContent.tsx`
- [ ] `src/hooks/useCustomersList.ts`
- [ ] `src/hooks/useCustomersFilters.ts`
- [ ] `src/services/customers.ts`
- [ ] `src/types/customers.ts`

질문:
- 서버 상태, URL 상태, 선택 상태, 모달 상태의 소유자는 각각 누구인가?
- 전체 선택 vs 현재 페이지 선택이 API payload로 어떻게 갈라지는가?
- 변경 성공/실패 후 화면과 캐시가 어떻게 다시 일치하는가?
- catch 블록마다 CLAUDE.md 에러 처리 규칙(서버 메시지 미노출)이 실제로 지켜지는가?

## 5단계 — 실시간·전역 상태

목적: 일반 HTTP 흐름을 익힌 뒤에만 연결 수명주기·이벤트 병합·정리 로직을 읽는다.

- [ ] `src/lib/realtime.ts` — TalkgateSocket 싱글톤 (⚠ 2단계 httpOnly 이슈와 연결됨)
- [ ] `src/providers/ChatProvider.tsx`
- [ ] `src/providers/TeamChatProvider.tsx`
- [ ] `src/providers/NotificationProvider.tsx`

질문:
- 연결을 만드는 주체와 끊는 주체가 같은가?
- 프로젝트 변경/페이지 이동 시 구독이 중복되지 않는가?
- 재연결(5회, 1~5초) 도중 들어온 이벤트와 기존 캐시 중 무엇이 최신 상태를 결정하는가?

## 6단계 — 위험 지도와 정리 후보

이해가 끝난 뒤에만 개선안을 적습니다. 먼저 불변식과 실패 시나리오를 문장으로 남깁니다.

- [ ] `docs/FRONTEND_SECURITY_AUDIT_REPORT.md`
- [ ] `docs/TESTING_GUIDE.md`
- [ ] `docs/ZOOM_SUBPIXEL_PLAYBOOK.md` §4-4
- [ ] `docs/unused-code-verification.md` (37줄, 최신 상태로 재검증)
- [ ] `docs/MODAL_SCROLLLOCK_FOCUSTRAP_AUDIT.md` — 미검증 3개 특수조건 확인
- [ ] `knip.json` / `npm run knip` 결과

질문:
- 중복된 정책이나 상태 원본은 어디에 있는가?
- 실패해도 사용자가 모르는 경로, 데이터 손실 경로는 무엇인가?
- 문서가 있다는 사실을 정답으로 보지 말고 현재 코드와 한 줄씩 대조했는가?

---

## 이미 확정된 리스크 (오늘 재확인용, 새로 찾은 게 아님)

- **`src/lib/cookies.ts:35, 178`** — `httpOnly: false`, 코드 주석에 "테스트를 위해 false (프로덕션에서는 true로 변경 필요)"라고 명시. 미해결 TODO.
- 이 값에 의존하는 코드가 이미 존재: `src/services/analysis.ts:165` (`getAccessToken()`으로 non-httpOnly 쿠키를 직접 읽어 수동 헤더 구성, `realtime.ts`와 동일 패턴). 즉 단순히 `true`로 바꾸면 끝나는 게 아니라 저 두 파일의 토큰 접근 방식도 같이 손봐야 하는 구조적 부채.
- 오늘은 고치지 않음 — 2단계/5단계 읽을 때 이 의존 관계를 직접 확인하고 메모만 남길 것.

## 오늘 새로 발견한 것

(읽으면서 "확정 문제"로 분류된 항목만 여기 추가. 형식은 `docs/ANALYSIS_API_QA_CHECKLIST.md` §2 컨벤션 참고)

1. ~~**근태 메뉴 설정 변경이 다른 기기/브라우저에 즉시 반영되지 않음**~~ — **수정 완료(2026-08-25, 커밋 b5033ed)**.
   `src/lib/project.ts`의 두 getter를 쿠키 우선 + localStorage 폴백으로 반전하고, `deleteAuthCookies`
   삭제 목록에 `tg_project_type`을 추가했다(우선순위 반전 후에는 미들웨어 강제 로그아웃 시 살아남은
   이 쿠키가 정상적으로 비워진 localStorage를 이기므로 함께 처리해야 했음).
   localhost dev에서 localStorage와 쿠키를 의도적으로 불일치시켜 양방향 검증함 — 쿠키 `true`/로컬 `false`면
   근태 메뉴가 나타나고, 쿠키 `false`/로컬 stale `true`(= 실제 버그 상황)면 메뉴가 사라지며 localStorage도
   교정되는 것까지 확인. 아래는 원래 분석 기록.

   원인: `getUseAttendanceMenu()`가
   localStorage에 값이 있으면 쿠키 확인 없이 그 값을 그대로 반환함(133~134줄, `stored === "true" || "false"`일 때 즉시 return).
   반면 미들웨어(`src/middleware.ts` 386~433줄)는 매 요청마다 서버의 최신 `project.useAttendanceMenu`와 비교해 쿠키는
   정상적으로 갱신함. 즉 **쿠키는 최신인데 localStorage가 그걸 덮어써서 안 보게 되는 구조**.
   - 재현: PC 브라우저에서 프로젝트 설정(Settings > General)의 근태 메뉴를 끄고, 같은 프로젝트에 이미 로그인해 있던
     별개 기기(휴대폰)에서 새로고침 → 근태 메뉴가 여전히 표시됨. (2026-08-25 실기기 재현 완료 — Chrome 데스크톱에서 끄고
     모바일에서 새로고침해도 유지되는 것 확인)
   - 갱신되는 유일한 경로는 `ProjectsContent.tsx`(프로젝트 선택 화면에서 명시적으로 `setUseAttendanceMenu()` 호출)와
     `useGeneralSettings.ts:63`(Settings > General 페이지 로드 시)뿐 — 그 외 경로(대시보드 새로고침 등)로는 절대 재동기화 안 됨.
   - 원인 특성상 사이드이펙트 범위가 넓어(다른 기기/세션에서 프로젝트 정보를 다시 읽는 모든 지점) 오늘은 고치지 않고
     기록만 남김. 고칠 땐 `getUseAttendanceMenu()`가 쿠키 값과 localStorage 값이 다를 때 쿠키를 우선하도록 바꾸는 게
     가장 단순한 수정으로 보임(단, `setProjectType`도 `src/lib/project.ts:195`에 동일한 패턴이라 같이 봐야 함).
   - **같은 결함이 영업점(analysis)/법무법인(lawyer) 메뉴 노출에도 적용됨 (코드 확인, 발현 조건은 낮음)**:
     `useDebtReliefMenu.ts` → `useProjectType.ts:42~46`도 `getProjectType()`이 캐시값을 반환하면 서버 재확인 없이
     그대로 씀. 다만 `project.type`은 근태와 달리 생성 후 UI에서 바꾸는 경로가 안 보여서(지금까지 읽은 범위에서
     `setProjectType` 호출부는 전부 "서버값을 캐시에 반영"용, "설정 변경"용은 없었음) 실제 트리거 조건은 거의 없음 —
     같은 뿌리 원인(`src/lib/project.ts`의 "localStorage 있으면 쿠키/서버 확인 안 함" 헬퍼 패턴)이라 고칠 때 세트로 처리.
     → `getProjectType()`도 같은 커밋에서 동일하게 반전 처리함.

2. ~~**공지 상세·작성 페이지에 인증 가드 없음**~~ — **수정 완료(2026-08-25, 커밋 712e5eb)**. 미들웨어의
   `AUTHENTICATED_PROJECT_PATHS`와 matcher에 `/notices`(목록)만 등록돼 있었고, 실제 상세(`/notice/{id}`)와
   작성(`/notice/write`)은 `src/app/notice/` 아래 별개 라우트라 인증·프로젝트 가드가 전혀 걸리지 않았다.
   URL 직접 접근으로 우회 가능했고, 특히 작성 페이지가 무방비였음. `/notice` 계열을 양쪽에 추가.
   `matchesPath`는 정확히 일치하거나 `"{경로}/"`로 시작할 때만 매칭하므로 기존 `/notices`와 충돌하지 않는다.
   비인증 상태로 `/notice`·`/notice/{id}`·`/notice/write` 요청 시 모두 `/login`으로 리다이렉트되고,
   `/login` 자체는 리다이렉트되지 않는 것(과차단 아님)까지 확인함.
   - 참고: `/notice`(단수) 목록 페이지와 `/notices`(복수)는 렌더링 내용이 완전히 동일한 중복 라우트다.
     헤더·드로어 링크는 전부 `/notices`를, 상세/작성 링크는 전부 `/notice/...`를 가리킨다. 정리 후보.

3. ~~**소셜 로그인 2FA 경로에서 뒤로가기 시 콜백 재진입 → 로그인 실패 화면**~~ — **수정 완료(2026-08-26, 커밋 3a6ef47)**.
   `OAuthCallbackContent.tsx:206`이 `router.push`로 2FA 페이지에 진입해, 소진된 인가 코드가 붙은 콜백 URL이
   히스토리에 남아 있었다. 2FA 화면에서 뒤로가기를 누르면 콜백이 다시 마운트되고, 일회용인 authorization code로
   토큰 교환을 재시도해 실패 → 빨간 에러 화면이 떴다. `router.replace`로 콜백 엔트리를 덮어 히스토리에서 제거함.
   - **세션이 깨지는 문제는 아니었다.** catch 블록에 쿠키 삭제가 없어서 기존 로그인 상태는 그대로 유지된다.
     "로그인 실패"처럼 보이지만 실제 피해는 UX에 한정.
   - `LoginForm.tsx:194`의 동일한 `router.push`는 **의도적으로 유지**했다. 이메일/비번 로그인은 URL에 소진되는
     인가 코드가 없고, 2FA에서 뒤로가기 = `/login` 복귀가 기대 동작이다. 같은 목적지로 간다고 함께 바꾸면
     멀쩡한 흐름을 망가뜨린다.
   - 파급 범위 확인: `router.back()`/`history.back()` 의존 0건, `document.referrer` 사용 0건,
     `/auth/callback` 참조 9곳은 전부 `pathname.startsWith(...)` 형태라 히스토리와 무관하다.
   - **곁가지 관찰(문제 아님)**: `/auth/callback`은 `UNAUTHENTICATED_PATHS`에 속하지만 미들웨어가 인증 상태를
     검사하지 않는다. `middleware.ts:335-336`에 "클라이언트 측에서 처리하므로 여기서는 pass"라고 명시돼 있고,
     `/login`·`/signup`도 마찬가지다. 즉 "비회원 전용"은 서브도메인 정규화만 의미하고 로그인 사용자의 접근을
     막지 않는다. 의도된 설계.

## 가설 (코드 추론만 — 재현 안 됨, 확정 문제 아님)

1. **알림 딥링크를 메인 도메인에서 클릭하면 강제 로그아웃될 수 있음**

   `navigateByNotificationProject`(`src/components/layout/NotificationBell.tsx:202`,
   `src/components/notifications/NotificationsPageContent.tsx:132`)는 알림의 프로젝트 서브도메인이
   없으면 현재 도메인에서 그대로 이동한다:

   ```ts
   const targetSubdomain = notification.project?.subDomain?.trim();
   if (!targetSubdomain) {
     router.push(path);   // 서브도메인 없이 현재 도메인에서 이동
     return;
   }
   ```

   `/notifications`는 `AUTHENTICATED_OPTIONAL_SUBDOMAIN_PATHS`라 메인 도메인에서도 열린다. 이 상태에서
   `project.subDomain`이 빈 알림을 클릭해 서브도메인 필수 경로(`/customers`, `/debt-relief`, `/dashboard`,
   그리고 2026-08-25부터 `/notice`)로 이동하면, 미들웨어 3번 섹션의 `if (!subdomain)` 분기가
   `deleteAuthCookies()`로 토큰까지 지우고 로그인으로 보낸다(`src/middleware.ts:379-384`). 즉 단순 리다이렉트가
   아니라 **강제 로그아웃**이다.

   - **미확정인 이유**: `notification.project.subDomain`이 실제로 비는 경우가 있는지 확인하지 못했다.
     백엔드가 항상 채워 보내면 이 경로는 영영 실행되지 않는다. 코드가 명시적으로 폴백을 두고 있다는 점만이
     "빌 수 있다"는 근거다.
   - **확인 방법**: 알림 목록 API 응답에서 `project.subDomain`이 비어 오는 케이스가 있는지 확인하거나,
     메인 도메인 `/notifications`에서 해당 알림을 실제로 클릭해 본다.
   - **범위 주의**: 이건 `/notice` 가드 추가로 새로 생긴 함정이 아니다. `/customers`·`/debt-relief`·`/dashboard`는
     이전부터 서브도메인 필수라 같은 폴백을 타면 지금도 동일하게 로그아웃된다. `/notice` 추가는 기존 동작에
     경로 하나를 맞춘 것이고, 실패 양상이 "깨진 화면"에서 "로그아웃"으로 바뀐 것은 사실이다.
   - **손댄다면**: 폴백에서 서브도메인을 못 구했을 때 `router.push` 대신 `/projects`로 유도하거나, 미들웨어의
     "서브도메인 없음 → 토큰 삭제" 정책이 과한지 재검토하는 두 방향이 있다. 정책 변경이라 별도 판단 필요.

2. **개발 환경에서 인가 코드가 두 번 교환될 수 있음 (StrictMode 이중 실행)**

   `OAuthCallbackContent`의 토큰 교환 effect에는 1회 실행을 보장하는 ref 가드가 없다. 초기화 effect에는
   `hasInitializedRef`(55줄)가 있지만 교환 쪽에는 없고, deps(308줄)에 `redirectUrl`·`isInviteFlow`·`isInitialized`가
   들어 있다. `next.config.ts`에 `reactStrictMode` 설정이 없으므로 Next 15에서는 기본값 `true` — dev에서 effect가
   두 번 돈다.

   - **미확정인 이유**: 실제로 이 증상을 관측한 적이 없다. 성공 경로가 `window.location.replace`(272줄)라
     첫 호출이 성공하면 페이지가 통째로 날아가 두 번째 실패가 렌더될 틈이 없는 것으로 보인다.
   - **프로덕션 빌드에서는 StrictMode 이중 실행이 일어나지 않는다.** 즉 이득 범위가 dev로 한정된다.
   - **검토 후 보류(2026-08-26)**: `hasExchangedRef`를 추가하는 안을 검토했으나 넣지 않기로 했다.
     (a) 증상 미관측 + 프로덕션 무영향이라 이득이 작고, (b) ref를 걸면 deps 변화로 우연히 살아나던 재시도
     경로까지 막혀 일시적 네트워크 실패가 곧바로 에러 화면으로 확정되며(막으려면 catch에서 ref를 되돌리는
     한 겹 더 미묘한 코드가 필요), (c) 검증에 provider 3개 × (신규가입/기존로그인/2FA/초대) 실 OAuth 왕복이
     필요해 변경 크기 대비 비용이 과하다. **실제로 dev에서 이유 없는 콜백 에러 화면을 목격하면 그때 재검토할 것.**
   - **주의**: 이 가드는 뒤로가기 재진입에는 효과가 없다. 새 마운트마다 ref가 새로 생기므로 같은 마운트 안의
     이중 실행만 막는다. 뒤로가기 쪽은 위 3번(`router.replace`)으로 이미 해결됨.
