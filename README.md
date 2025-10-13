# TalkGate Frontend – 디자인 시스템 가이드 (Tailwind v4)

Tailwind CSS v4 환경에서 색상/타이포/섀도/반지름 등 디자인 토큰을 `src/app/globals.css`의 `@theme inline`으로 정의했습니다. 임의 값(`text-[22px]`) 사용을 지양하고, 의미 있는 유틸리티 클래스로 통일합니다.

## 환경

- Next.js 15, React 19
- Tailwind v4 (`postcss.config.mjs`에 `@tailwindcss/postcss` 등록)
- 폰트: `next/font`로 Inter(본문), Roboto Mono(코드) 로드 → `src/app/layout.tsx`

## 토큰 위치

- 라이트/다크 변수: `src/app/globals.css`의 `:root`와 `@media (prefers-color-scheme: dark)`
- Tailwind 토큰: `@theme inline` 내부의 `--color-*`, `--text-*`, `--leading-*`, `--radius-*`, `--shadow-*`

## 색상 사용

- 기본/표면: `bg-background text-foreground`, `bg-card border border-border`
- 상태: `bg-primary | bg-success | bg-warning | bg-danger`
- 팔레트 직접 접근: `text-gray-600`, `bg-blue-400`, `border-amber-300`
- 문서용 라벨 컬러: `typo-label` (Roboto Mono 700, 20/32, 35% 블랙)

## 타이포그래피 유틸리티

임의 사이즈 대신 다음 클래스를 사용하세요.

- 제목: `typo-h1` 42/58 Bold, `typo-h2` 32/40 Bold, `typo-h3` 24/36 Bold, `typo-h3-medium` 24/36 Medium
- 타이틀: `typo-title-1` 20/24 Medium, `typo-title-2` 18/22 Bold, `typo-title-3` 18/22 Semibold, `typo-title-4` 16/20 Semibold
- 본문: `typo-body-1` 16/20 Regular, `typo-body-2` 14/22 Medium, `typo-body-3` 14/22 Regular
- 캡션: `typo-caption-1` 12/20 Medium, `typo-caption-2` 12/20 Regular

예시:

```tsx
<h1 className="typo-h1">헤드라인</h1>
<p className="typo-body-1 text-muted-foreground">보조 설명</p>
```

## 섀도(드랍섀도) 토큰

`@theme inline`에 다음이 정의되어 있으며, 클래스는 `shadow-*`로 직접 사용하거나 `elevation-*` 헬퍼를 권장합니다.

- `--shadow-elevation-1`: 작은 부유감 (리스트/버튼)
- `--shadow-elevation-2`: 카드/모달 표면 기본
- `--shadow-elevation-3`: 대화상자/오버레이 강한 깊이감

사용:

```tsx
<div className="surface rounded-card elevation-2">콘텐츠</div>
```

## 표면/라운드

- 문서의 “Light/Light-10” 표면: `surface-muted` → 배경 `#F8F8F8`
- 카드 라운드(30px): `rounded-card`

피그마 스펙 예시(사각형 1235×361, 절대 위치):

```tsx
<div className="surface-muted rounded-card shadow-none w-[1235px] h-[361px] absolute left-[103px] top-[264px]" />
```

## 레이아웃(오토 레이아웃 대응)

피그마의 Auto layout은 Tailwind 유틸리티로 다음처럼 대응합니다.

```tsx
<section className="flex flex-col items-start gap-[80px] absolute left-[163px] top-[214px] w-[1080px] h-[1798px]" />
```

필요 시 고정 값(`w-[1080px]`)은 유지하되, 텍스트 크기만은 위 `typo-*` 클래스를 사용하세요.

## 다크 모드

시스템 선호(`prefers-color-scheme: dark`)를 기본으로 합니다. 수동 토글이 필요하면 `<html class="dark">` 등으로 변수만 오버라이드하세요.

## 참고
- 반응형 브레이크포인트
  - 정의: `mobile 390px`, `tablet 768px`, `desktop 1280px`, `desktop-full 1920px`
  - Tailwind 별칭 매핑: `sm=390`, `md=768`, `lg=1280`, `xl=1920`
  - 사용 예시:

```tsx
{/* 768 이상에서 배치 변경, 1280 이상에서 간격 확대 */}
<div className="flex flex-col md:flex-row gap-4 lg:gap-8">
  ...
</div>

{/* 모바일(390) 기준 숨김, 태블릿부터 표시 */}
<aside className="hidden md:block w-[300px]" />

{/* 1920 풀폭에서만 보이기 */}
<div className="hidden xl:block">대형 화면 전용</div>
```

- Tailwind v4에서는 `tailwind.config.js` 없이 CSS 안의 `@theme`로 토큰을 선언합니다.
- 브랜드 팔레트/추가 폰트가 확정되면 `@theme inline`의 토큰 값을 교체하면 됩니다.