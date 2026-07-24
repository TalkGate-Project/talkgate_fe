# 반응형 브레이크포인트 드리프트(768 vs 780) 정리 Task

## 0. 배경 (2026-07-23, 고객 상세 모달 버그 조사 중 발견)

`globals.css`의 `@theme inline`(174~185줄)에서 Tailwind 기본 브레이크포인트를 프로젝트 전용 값으로
덮어쓰고 있다:

```
--breakpoint-sm: 375px
--breakpoint-md: 780px   (Tailwind 기본값 768px 아님)
--breakpoint-lg: 1080px  (Tailwind 기본값 1024px 아님)
--breakpoint-xl: 1920px
```

즉 이 프로젝트에서 `md:`/`lg:` Tailwind 클래스를 쓰면 자동으로 780/1080 기준으로 맞게 동작하지만,
**JS에서 `window.innerWidth`나 `matchMedia`를 직접 하드코딩(768, 1024, 640 등 Tailwind 기본값)한
곳들은 실제 CSS 브레이크포인트보다 12px(또는 그 이상) 먼저/늦게 전환된다.**

`globals.css` 354~368줄에 이미 이 문제를 정확히 짚은 전례가 있다:
> "779px는 이 앱의 모바일→데스크톱 레이아웃 전환 기준(--breakpoint-tablet/md: 780px)과 맞춘 값 —
> 기존 639px 기준이면 640~779px 구간에서 레이아웃은 아직 모바일 형태인데 배경만 바뀌어
> 이질감이 노출됐다."

## 1. 이번 세션에서 확인·수정 완료

고객 상세 모달(`CustomerDetailModal.tsx`)이 `matchMedia("(max-width: 767px)")`로 모바일/데스크톱
컴포넌트를 분기하고 있었는데, 이 767이 딱 이 버그였다. 768~779px 구간에서 JS는 이미
`CustomerDetailModalDesktop`(데스크톱 셸)로 갈아탔지만, 그 셸 내부의 모든 `md:` Tailwind
클래스(패널 폭, 높이, 그리드)는 실제 기준인 780px 전까지 발동하지 않아 "덜 채워진 UI + 스크롤
안 되는 것처럼 보임" 증상이 발생했다.

**수정한 파일:**
- `src/components/customers/CustomerDetailModal.tsx` — `matchMedia`/주석 767→779로 수정
- `src/components/customers/CustomersTable.tsx` — 호버 미리보기 on/off 판정 8곳
  (`window.innerWidth < 768` / `>= 768`) → 780으로 수정, 드래그 스크롤 `widthRange: { min: 768, max: 1024 }`
  → `{ min: 780, max: 1080 }`으로 수정
- `src/components/customers/detail/BasicTab.tsx`, `DataTab.tsx`, `SalesTab.tsx`,
  `CustomerLinkedAnalysisSection.tsx` — 탭 내부 필드 그리드가 `md:grid-cols-2` 등으로 너무 일찍
  2열 전환되면서(780px 시점엔 오른쪽 상담패널이 이미 붙어 왼쪽 폼 폭이 좁아진 상태) 인풋이
  짜부라지던 문제. `md:` → `lg:`로 전환해 1080px(패널이 384px로 넓어지고 실제 여유 폭이 생기는
  시점)부터 2열이 되도록 정렬.

이 셋을 합쳐서 고객 상세 모달은 이제 <780(모바일 셸) / 780~1079(데스크톱 셸, 탭은 1열) /
1080~(데스크톱 셸, 탭 2열 + zoom 0.8 컴팩트 모드) 3구간으로 일관되게 동작한다. `tsc --noEmit` 통과.

## 2. 남은 작업 — 동일 패턴(768 하드코딩) 사용 중인 파일 9개

고객 모달과 무관한 영역이라 이번 세션에서는 손대지 않음. 전부 `window.innerWidth < 768` 형태로
모바일 여부를 판정하고 있고, 실제 기준(780)보다 12px 먼저 "데스크톱"으로 인식한다. 파일별로
같은 12px 구간에서 동일한 종류의 미세한 레이아웃 불일치가 있을 가능성이 있다 — 방문해서
실제로 어떤 영향이 있는지부터 확인 후 780으로 교체할 것.

- [ ] `src/hooks/useStatsRegistration.ts:26`
- [ ] `src/components/attendance/AttendanceFilterModal.tsx:44`
- [ ] `src/components/common/MemberStatsFilterModal.tsx:49`
- [ ] `src/components/stats/AssignBarChart.tsx:67`
- [ ] `src/components/stats/StatusBarChart.tsx:97`
- [ ] `src/components/common/Pagination.tsx:27`
- [ ] `src/components/stats/StatsSection.tsx:108`
- [ ] `src/components/stats/StatsFilterModal.tsx:95`
- [ ] `src/components/stats/PaymentBarChart.tsx:97`
- [ ] `src/components/stats/RegistrationDetailTable.tsx:53`
- [ ] `src/components/stats/RegistrationChart.tsx:21`

(재검색 필요 — 위 목록은 2026-07-23 조사 시점 grep 결과. 다시 착수할 때
`window.innerWidth\s*[<>]=?\s*(640|768|1024|1280)` 및 `max-width:\s*767|min-width:\s*768|
max-width:\s*1023|min-width:\s*1024` 패턴으로 재grep해서 그 사이 새로 추가된 곳 없는지 확인.)

**재발 방지 고려사항(우선순위 낮음, 논의 필요):** 지금처럼 파일마다 768/1024를 따로 하드코딩하는
구조 자체가 이 버그의 근본 원인이다. `globals.css`의 `--breakpoint-md`/`--breakpoint-lg` 값을
읽어오는 공유 상수나 훅(예: `useIsMobile()`)으로 통일하면 나중에 브레이크포인트 값이 또
바뀌어도 한 곳만 고치면 되지만, 지금은 각자 알아서 숫자를 박아넣는 구조라 매번 드리프트가
재발할 소지가 있음. 9개 파일 정리와 별개로, 이 구조 개선 자체를 할지는 팀 판단 필요.

## 3. 별도로 발견한 문서 드리프트 (버그는 아니지만 부정확함)

- `CLAUDE.md`와 `docs/ZOOM_SUBPIXEL_PLAYBOOK.md`(13줄)는 "데스크톱 ≥1280px에서 zoom 0.8 적용"이라고
  적혀 있지만, 실제 코드(`src/components/layout/UiScaleToggle.tsx:7`, `MOBILE_BREAKPOINT = 1080`)는
  1080px 기준으로 동작한다. 1080은 우연히 `--breakpoint-lg`와 일치하므로 동작 자체는 정상이지만,
  문서상 숫자(1280)는 stale — 두 문서 다 1080으로 정정 필요.
