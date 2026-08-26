# 구독·결제 도메인 메모 (2026-08-26)

`my-settings` 결제 화면(`ProjectBillingDetail` → `billing/*`)과 `services/subscription.ts` 주변에서
반복해서 헷갈리거나, 스펙에는 있는데 화면에는 없는 것들을 모아둔다.

## 1. 쿠폰은 두 종류이고 엔드포인트가 다르다

가장 자주 착각하는 지점. 이름이 둘 다 "쿠폰"이라 기존 코드를 그대로 복사하면 엉뚱한 API를 부른다.

| 구분 | 무료 구독 쿠폰 | 할인쿠폰 |
|---|---|---|
| 조회 | `POST /v1/subscriptions/coupon/info` | `POST /v1/subscriptions/discount-coupon/info` |
| 적용 | `POST /v1/subscriptions/coupon/apply` | `POST /v1/subscriptions/discount-coupon/apply` |
| 대상 | 구독이 없는 상태에서 무료로 활성화 | **이미 활성인 구독**에 다음 갱신부터 할인 예약 |
| 진입점 | `projects/SubscribeProjectModal.tsx` | `my-settings/billing/DiscountCouponApplyModal.tsx` |
| 제한 | 프로젝트당 모든 쿠폰 통틀어 1회 | 구독당 1개 (`DISCOUNT_COUPON_ALREADY_USED`) |

백엔드도 둘을 구분한다 — 무료쿠폰 조회에 할인쿠폰 코드를 넣으면
`DISCOUNT_COUPON_ENTERED_AS_FREE_COUPON`이 돌아온다.

재사용해도 되는 것은 **모달 UI 골격, `formatCouponCodeForDisplay`(대문자 변환), 에러 분기 패턴**까지다.
엔드포인트와 에러 코드는 반드시 갈아끼울 것.

## 2. 할인쿠폰 적용 후 캐시 갱신 설계

적용 성공 시 서버를 다시 부르지 않는다. `applyDiscountCoupon` 응답에 들어 있는 구독 정보와,
적용 직전에 조회해둔 가격 정보를 React Query 캐시에 직접 넣는다
(`DiscountCouponApplyModal.tsx`의 `queryClient.setQueryData` 두 번).

- 제거된 요청: 적용 직후의 `GET /v1/subscriptions`, 그리고 그로 인해 연쇄로 발생하던
  중복 `POST /discount-coupon/info`.
- 캐시 키는 `subscriptionQueryKeys`(`hooks/useSubscription.ts`)로 단일화했다. 모달과 훅이 각자
  배열 리터럴을 쓰면 조용히 어긋나므로 **키를 새로 만들지 말고 이 팩토리를 쓸 것.**
- 쿠폰 키에는 `updatedSubscription.discountCoupon?.code`를 쓴다. 서버가 코드 표기를 정규화해
  내려줘도 훅이 만들 키와 정확히 일치시키기 위함이다.
- `useSubscriptionDiscountCouponInfo`에 개별 `staleTime`이 없어 전역 5분이 적용된다. 그래서
  `setQueryData` 직후 fresh 상태가 되고 재요청이 나가지 않는다. **이 훅에 `staleTime: 0`을 주면
  위 최적화가 통째로 무효가 된다.**
- 반대로 **모달의 쿠폰 조회 자체는 캐시를 타지 않는다.** 만료·사용가능 여부는 매번 서버가 다시
  판정해야 하므로 의도적으로 직접 호출한다.

## 3. 할인쿠폰 적용 에러 코드 (2026-08-26 스펙 대조 완료)

`DiscountCouponApplyModal.tsx`가 분기하는 6개는 모두 실제 스펙에 존재한다. 재확인 불필요.

| 코드 | HTTP | 분기 |
|---|---|---|
| `INVALID_DISCOUNT_COUPON` | 400 | O |
| `DISCOUNT_COUPON_EXPIRED` | 400 | O |
| `SUBSCRIPTION_INACTIVE` | 402 | O |
| `FORBIDDEN` | 403 | O |
| `ALREADY_CANCELLED` | 409 | O |
| `DISCOUNT_COUPON_ALREADY_USED` | 409 | O |

개별 분기가 없는 나머지는 전부 일반 메시지로 수렴하며, 그게 맞다.

- `MISSING_AUTHENTICATION_TOKEN` / `UNAUTHORIZED` / `INVALID_ACCESS_TOKEN`(401) — 프록시가 토큰
  refresh·로그아웃을 처리하는 구간이라 모달이 관여할 것이 없다.
- `MISSING_PROJECT_ID`(400) — `x-project-id`는 항상 붙이므로 발생 시 클라이언트 버그다.
- `NOT_PROJECT_MEMBER`(400), `PROJECT_NOT_FOUND` / `SUBSCRIPTION_NOT_FOUND`(404) — 이 화면에
  도달할 수 없는 상태.

## 4. 할인율 표시 규칙

`discountValue`는 `discountType`에 따라 단위가 바뀌는 필드다 — `percentage`면 퍼센트, `fixed`/
`fixed_amount`면 원 단위 금액. 따라서 **"할인율" 라벨은 정률 쿠폰일 때만 노출한다.**

- `PaymentInfoSection.tsx`의 할인정보 툴팁: `showDiscountRate`로 행 자체를 렌더하지 않음
- `DiscountCouponApplyModal.tsx`: 같은 규칙 적용 (2026-08-26, 커밋 1c63d3f)

정액 쿠폰은 `pricing.discountAmount`(할인금액) 한 줄로 정보가 충분하다.

## 5. 결제 화면 버튼의 다크모드 관례

Figma 시안이 라이트 기준 hex(`#FFFFFF` / `#E2E2E2` / `#000000`)로 내려오므로, **라이트는 시안 그대로
두고 `dark:` 변형만 얹는다.** 시안을 semantic 토큰으로 바꿔 쓰지 않는다(픽셀이 기준).

```
bg-white          dark:bg-neutral-10      /* #ffffff → #1e1e1e */
border-[#E2E2E2]  dark:border-neutral-30  /* #e2e2e2 → #444444 */
text-black        dark:text-white
hover:bg-neutral-10  dark:hover:bg-neutral-20  /* #f8f8f8 / #222222 */
```

- `hover:bg-neutral-10`은 테마 무관 유틸이라 다크에서도 걸린다(#1e1e1e). `text-black`과 겹치면
  **hover 시 글자가 사라진다** — 이게 실제로 났던 버그다. `dark:hover:`를 반드시 같이 줄 것
  (`:is([data-theme="dark"] *)` 컴파운드 덕에 명시도로 이긴다).
- 다크 hover 폭은 `neutral-10 → neutral-20`(#1e1e1e→#222222)으로 얕게 유지한다. 어두운 화면에서
  hover가 크게 튀는 것을 원하지 않는다는 판단(2026-08-26). `neutral-30`은 테두리 색과 같아져
  hover 시 외곽선이 사라지므로 쓰지 말 것.
- 같은 감각의 선례: `projects/SubscribeProjectModal.tsx`의 쿠폰등록 버튼.

## 6. 백로그 — 응답에는 있는데 화면에 없는 필드

`Subscription`의 **플랜 변경 예약 관련 3개 필드는 코드 어디에서도 읽히지 않는다.**

- `pendingPlanId`, `pendingBillingCycle` — 이전부터 타입에만 존재, 소비자 0건
- `pendingPlanAppliesAt` — 2026-08-26에 타입만 추가(스펙 응답에 있으나 누락돼 있었음)

즉 "변경 예정 플랜" 개념이 UI에 존재한 적이 없다. `src/mocks/billingMockData.ts`에도 없다.

**화면에 붙이려면 새 UI를 만들어야 하므로 디자인 결정이 선행되어야 한다.** 시안 없이 임의로 만들지 말 것.
자리 후보와 성격:

1. `PaymentInfoSection`의 "다음 결제 예정일" 행 아래 한 줄 — 이미 날짜를 다루는 영역이라 자연스러움
2. `ProjectBillingHeader`의 플랜명 옆 배지 — 눈에 잘 띄지만 헤더가 복잡해짐
3. 플랜 변경 모달 안에서만 안내 — 범위가 가장 좁고 안전

붙이기 전 확인할 것: **백엔드가 실제로 `pendingPlanAppliesAt`을 채워 보내는지.** 스펙 문서에 있다고
항상 내려오지는 않는다. `SubscriptionService.changePlan`(`services/subscription.ts:111`)으로 변경을
예약한 뒤 `GET /v1/subscriptions` 응답을 확인하면 된다. 데모 모드로 보려면 목 데이터에도 필드를
추가해야 한다.
