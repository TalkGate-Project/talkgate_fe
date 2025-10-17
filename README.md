# TalkGate Frontend

Next.js 15 + React 19 기반의 프런트엔드. 간결한 네트워크 계층과 Tailwind v4 토큰 전략을 사용합니다. 과하지 않은 엔지니어링과 일관된 컨벤션을 지향합니다.

## Quick Start

1) 의존성 설치:

```bash
npm i
```

2) 환경 변수 설정:

`.env.local`을 만들고 아래 예시를 참고하세요. 전체 키는 `.env.example` 참조.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_API_TIMEOUT_MS=10000

# OAuth Client IDs (작업 후 키를 채워 넣으세요)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_KAKAO_REST_API_KEY=
NEXT_PUBLIC_NAVER_CLIENT_ID=
```

각 소셜 제공자 콘솔에 아래 Redirect URI를 등록하세요:

- Google: `https://YOUR_HOST/auth/callback/google`
- Kakao: `https://YOUR_HOST/auth/callback/kakao`
- Naver: `https://YOUR_HOST/auth/callback/naver`

3) 개발 서버:

```bash
npm run dev
```

## 프로젝트 구조(요약)

- `src/lib/env.ts`: 환경 변수 로더(런타임 유효성 포함)
- `src/lib/apiClient.ts`: fetch 기반 API 클라이언트(타임아웃/JSON 헬퍼)
- `src/hooks/useFetch.ts`: GET 전용 데이터 패칭 훅
- `src/hooks/useMutation.ts`: POST/PUT/PATCH/DELETE 변이 훅
- `src/app/globals.css`: Tailwind v4 디자인 토큰

## API 사용법

간단한 예시:

```tsx
import { useFetch } from "@/hooks/useFetch";

type Me = { id: string; name: string };

export default function Example() {
  const { data, loading, error, refetch } = useFetch<Me>("/v1/me");
  if (loading) return <div>Loading...</div>;
  if (error) return <div>에러</div>;
  return <div>{data?.name}</div>;
}
```

변이 예시:

```tsx
import { useMutation } from "@/hooks/useMutation";

type Input = { title: string };
type Output = { id: string };

export default function CreateButton() {
  const { loading, mutate } = useMutation<Input, Output>({ path: "/v1/posts", method: "POST" });
  return (
    <button disabled={loading} onClick={() => mutate({ title: "hi" })}>Create</button>
  );
}
```

자세한 컨벤션과 UI 토큰 규칙은 `CONVENTION.md`를 확인하세요.