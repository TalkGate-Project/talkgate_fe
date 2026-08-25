## Frontend Convention

본 문서는 TalkGate FE의 코딩 컨벤션과 UI 토큰 사용 원칙을 요약합니다. "시니어스러운, 과하지 않은 아키텍처"를 목표로 합니다.

### 1. 프로젝트 구조

- `src/lib/`: 프레임워크-무관 유틸리티 (예: `env.ts`, `apiClient.ts`)
- `src/hooks/`: 재사용 가능 훅 (`useFetch`, `useMutation` 등)
- `src/components/`: 프레젠테이션/컴포넌트
- `src/app/`: Next App Router 구조(페이지/레이아웃)

규모가 커지면 `src/features/<domain>/components|hooks|services` 구조로 확장합니다. 불필요한 레이어는 즉시 도입하지 않습니다.

### 2. 환경 변수

- 클라이언트에서 사용하는 값은 반드시 `NEXT_PUBLIC_*` prefix를 가집니다.
- 모든 환경 변수는 `src/lib/env.ts`를 통해 접근합니다.
- `.env.example`에 키를 문서화하고 기본값은 개발자 경험을 해치지 않는 선에서만 설정합니다.

### 3. 네트워크 계층

- 공통 클라이언트는 `src/lib/apiClient.ts` 하나로 시작합니다.
- 기본 원칙
  - 타임아웃 기본값 제공 (`NEXT_PUBLIC_API_TIMEOUT_MS`)
  - `credentials: include` 기본 포함 (세션 쿠키 사용 가정)
  - JSON 본문 자동 처리(`Content-Type` 설정/파싱)
  - 오류는 예외로 던지고, `status`와 `data`를 부가 정보로 포함
- 훅
  - `useFetch`: GET 전용, `select`로 데이터 매핑
  - `useMutation`: 변이 전용, `path`를 함수로 받아 동적 경로 지원

### 4. 상태 관리

- 우선 React 훅(로컬 상태)과 서버 캐시(Next의 fetch 캐시/Route Handler)로 충분히 해결합니다.
- 도메인 복잡도가 증가하면 각 feature 내부에서 가벼운 context를 도입합니다. 범용 글로벌 스토어는 성급히 도입하지 않습니다.

### 5. 컴포넌트 스타일

- Tailwind v4 토큰을 `src/app/globals.css`의 `@theme inline`으로 관리합니다.
- 규칙
  - 임의 px 클래스 남발 지양, 제공되는 `typo-*`, `rounded-*`, `elevation-*`, `surface*` 유틸 우선 사용
  - 토큰이 없어서 임시 픽셀이 필요하면 나중에 토큰으로 승격할 후보로 인지하고 최소화
  - 색상은 우선 `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border` 같은 semantic 클래스 사용

### 6. 네이밍

- 파일/폴더: PascalCase 컴포넌트, camelCase 유틸/훅, 명확한 도메인명 사용
- 변수/함수: 의미 중심의 풀네임, 1~2글자 축약 회피
- 함수는 동사, 값은 명사. 예) `buildQueryString`, `apiClient`, `selectedCustomerId`

### 7. 에러 처리

- 네트워크 에러는 상위에서 사용자 메시지로 전환하십시오.
- 컴포넌트에서는 `error` 상태에 따라 UX를 결정(재시도 버튼, 안내 문구 등).

#### 7.1 에러 메시지 표시 원칙 (중요)

**서버 응답 메시지를 UI에 그대로 표시하지 않습니다.**

```typescript
// ❌ BAD - 서버 메시지를 그대로 표시
showErrorModal({
  headline: "오류 발생",
  description: errorData?.data?.message || "잠시 후 다시 시도해주세요.",
});

// ✅ GOOD - 일반적인 사용자 친화적 메시지 사용
showErrorModal({
  headline: "초대 수락에 실패했습니다.",
  description: "잠시 후 다시 시도해주세요.",
});
```

**이유:**
1. 서버 메시지는 개발자를 위한 기술적 내용이 포함될 수 있음 (예: `Cannot read properties of undefined`)
2. 영어로 된 메시지가 그대로 노출될 수 있음 (예: `Invitation has already been accepted`)
3. 사용자에게 불필요한 기술적 정보 노출은 UX를 해침
4. 개발자는 콘솔 로그로 디버깅, 사용자에게는 친화적 메시지 제공

**에러 코드 기반 분기 처리:**
```typescript
// ✅ GOOD - 에러 코드로 분기하고 적절한 동작 수행
const errorCode = errorData?.data?.code;

if (errorCode === "INVITATION_ALREADY_ACCEPTED") {
  // 에러 모달 없이 자연스럽게 다음 플로우로 이동
  router.replace("/projects");
  return;
}

// 그 외 에러는 일반적인 메시지로 표시
showErrorModal({
  headline: "처리에 실패했습니다.",
  description: "잠시 후 다시 시도해주세요.",
});
```

**로깅:**
- 디버깅을 위해 `console.error`로 원본 에러 객체를 로깅하는 것은 권장됨
- 프로덕션에서는 에러 모니터링 서비스(Sentry 등)로 전송

### 8. 접근성/국제화

- 상호작용 요소에 `aria-*` 속성을 고려하고, 텍스트 대비를 유지합니다.
- 텍스트 상수는 향후 i18n 도입을 고려해 별도 모듈로 분리 가능하나, 과도한 추상화는 지양합니다.

### 9. 테스트(선택)

- 중요 로직(`lib/` 함수, `select` 매퍼)은 단위 테스트 우선 대상입니다.
- UI 스냅샷 테스트는 기여도 대비 유지비가 크므로 최소화합니다.

### 10. 코드 스타일 핵심

- Guard clause 선호, 깊은 중첩 회피
- try/catch는 실제로 필요한 지점에서만 사용
- 불필요한 주석 금지, 비자명한 의도/제약만 짧게 주석으로 남김

### 11. 배포

- 환경 변수는 배포 플랫폼의 Secret/Env에 설정하고, `NEXT_PUBLIC_*`만 공개됩니다.
- 캐시 정책과 데이터 일관성은 API 스펙에 따라 개별 훅/클라이언트 옵션으로 조정합니다.

### 12. 상담 카테고리 필터 패턴

**"일반" 카테고리 처리 원칙:**

상담 카테고리 필터에서 "일반"은 백엔드 API에 존재하지 않는 특수한 카테고리입니다. UI에서는 "일반" 옵션을 표시하되, 백엔드로 전달할 때는 `null` 값을 사용합니다.

**구현 규칙:**

1. **타입 정의**: `categoryIds`는 `(number | null)[]` 타입을 사용합니다. `null`은 "일반" 카테고리를 의미합니다.

```typescript
// ✅ GOOD
export type ChatFilterDefaults = {
  categoryIds?: (number | null)[]; // null은 "일반" 카테고리를 의미
};
```

2. **UI 구현**: 드롭다운에서 "일반" 옵션을 별도로 표시하고, 선택 시 배열에 `null`을 추가합니다.

```typescript
// ✅ GOOD - "일반" 옵션 추가
<label>
  <Checkbox
    checked={categoryIds.includes(null)}
    onChange={(next) =>
      setCategoryIds((prev) => {
        if (next) {
          return prev.includes(null) ? prev : [...prev, null];
        } else {
          return prev.filter((x) => x !== null);
        }
      })
    }
    ariaLabel="일반"
  />
  <span>일반</span>
</label>
```

3. **선택된 항목 표시**: 선택된 카테고리를 표시할 때 `null`이면 "일반"으로 표시합니다.

```typescript
// ✅ GOOD - 선택된 항목 표시
{categoryIds.map((id) => {
  if (id === null) {
    return <Pill key="general" label="일반" onRemove={...} />;
  }
  const category = categoryOptions.find((c) => c.id === id);
  return <Pill key={id} label={category.name} onRemove={...} />;
})}
```

4. **백엔드 전달**: 배열에 `null`이 포함되어 있으면 그대로 전달합니다. 소켓을 통한 JSON 전달은 `null`을 그대로 직렬화합니다.

```typescript
// ✅ GOOD - 소켓을 통한 전달 (JSON 본문)
const requestPayload: any = { limit: 20 };
if (filters.categoryIds && filters.categoryIds.length > 0) {
  requestPayload.categoryIds = filters.categoryIds; // [1, 2, null] 그대로 전달
}
socket.emit("getConversations", requestPayload);
```

**참고:**
- HTTP 쿼리 파라미터로 전달하는 경우 (예: `useCustomersList`), `null`을 문자열 `"null"`로 변환해야 할 수 있습니다.
- 소켓을 통한 JSON 본문 전달은 `null`을 그대로 전달하면 됩니다.
- 이 패턴은 `FilterModal.tsx`의 `CategorySelector`와 `ChatFilterModal.tsx`에서 일관되게 사용됩니다.


