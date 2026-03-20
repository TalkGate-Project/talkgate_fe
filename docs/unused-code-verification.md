# 미사용 코드 재검증 기록

계획서「미사용 코드 조사 보고」후속으로 Knip 실행 및 `AuthService` 정적 검증을 수행한 결과입니다.

## Knip (`npm run knip`)

- **도구**: [Knip](https://github.com/webpro-nl/knip) 5.x — devDependency 및 `knip.json`으로 재현 가능.
- **종료 코드**: 미사용 항목이 있으면 **비 0**으로 끝납니다. CI에서 실패로 쓰려면 별도 조정이 필요합니다.
- **주의**: Knip은 엔트리 추적 한계로 **오탐**이 있을 수 있습니다(예: 동적 import, Next.js 관례 미인식). 삭제 전 수동 확인이 필요합니다.

### 조사 보고서와 교차되는 항목

| 항목 | Knip 결과 |
|------|-----------|
| `src/components/chat/icons/SendIcon.tsx` | **Unused files**에 포함됨 |
| `LoginResponseData` (auth.ts) | **Unused exports**에 포함됨 |
| `SocialSignupForm` (signup/index.ts 배럴) | **Unused exports**에 포함됨 (페이지는 직접 import) |

### 기타 Knip가 보고한 범주 (요약)

- **Unused files**: SendIcon 외 다수(예: `TableSkeleton.tsx` 등 — 프로젝트 전역에서 실제 사용 여부를 별도 확인할 것).
- **Unused exports / types**: 공개 API·타입 재export가 많이 잡힘.
- **Unused dependencies**: `qrcode.react` — 사용처 grep으로 재확인 권장.

설정은 [knip.json](../knip.json)에서 `eslint-config-next`(FlatCompat으로 간접 사용), Windows `clean` 스크립트의 `exist` 바이너리, PostCSS 설정 파일 등에 대한 노이즈를 줄이도록 조정했습니다.

## AuthService `signup` / `verifyEmail` / `refresh`

- **범위**: 본 저장소(`talkgate_fe`) **프론트엔드 `src`만** 기준.
- **방법**: 저장소 루트에서 `src` 대상으로 `AuthService.signup` / `AuthService.verifyEmail` / `AuthService.refresh` 문자열 검색 — **일치 없음** (본 레포 프론트만 해당).
- **해석**: 세 메서드는 `AuthService` 객체에 정의만 있고, 이 레포 내에서는 호출되지 않습니다. 백엔드·모바일·다른 레포에서는 사용하지 않으므로, API 래퍼를 유지할지는 팀 정책으로 결정하면 됩니다.

## ESLint `@typescript-eslint/no-unused-vars`

- [eslint.config.mjs](../eslint.config.mjs)에서 규칙을 **`warn`**으로 켰습니다.
- `_` 접두 인자/변수는 무시하도록 옵션을 두어 점진적 정리에 맞췄습니다.
- `npm run lint` 시 경고가 쌓일 수 있으며, CI에서 `--max-warnings 0`을 쓰지 않으면 기본적으로 exit 0입니다.
