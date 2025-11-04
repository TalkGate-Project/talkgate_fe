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


