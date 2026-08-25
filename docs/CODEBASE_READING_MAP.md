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
- [ ] `src/middleware.ts` — 경로별 접근 정책 (CLAUDE.md 표와 대조)
- [ ] `src/components/common/ConditionalHeader.tsx` — 공통 셸

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
