# 서브도메인 변경 시 로컬 스토리지 데이터 유지에 대한 설명

## 개요

서브도메인 변경 후 새 도메인으로 이동했을 때, 이전 도메인의 로컬 스토리지 정보가 그대로 들어가 있는 이유를 step by step으로 설명합니다.

## 핵심 개념: 브라우저의 Origin 기반 저장소

브라우저는 **Origin** 단위로 저장소를 관리합니다. Origin은 `프로토콜://도메인:포트`로 구성됩니다.

### 예시
- `https://project-abc.app-dev.talkgate.im` (Origin: `https://project-abc.app-dev.talkgate.im`)
- `https://project-xyz.app-dev.talkgate.im` (Origin: `https://project-xyz.app-dev.talkgate.im`)

**이 두 Origin은 서로 다른 저장소를 사용합니다.**

## 그렇다면 왜 데이터가 유지되는가?

### Step 1: 쿠키의 도메인 공유 설정

**가장 중요한 이유**: 쿠키는 **도메인 공유 설정**이 되어 있습니다.

```typescript
// src/lib/project.ts, src/lib/token.ts 참고
// 프로덕션 환경에서 쿠키 설정 시
attrs.push("Domain=.talkgate.im");  // 서브도메인 간 공유
```

**동작 방식**:
- 쿠키를 `Domain=.talkgate.im`으로 설정하면
- `project-abc.app-dev.talkgate.im`에서 설정한 쿠키를
- `project-xyz.app-dev.talkgate.im`에서도 읽을 수 있습니다

### Step 2: 프로젝트별 데이터 저장 방식

로컬 스토리지는 Origin별로 분리되어 있지만, **프로젝트 ID를 키로 사용**하여 저장합니다.

#### 예시: 알림 설정

```typescript
// src/utils/notificationSettings.ts 참고

// 저장: 프로젝트 ID를 키로 사용
const allSettings = {
  "123": { consultationChat: true, news: false },  // 프로젝트 ID 123
  "456": { consultationChat: false, news: true },  // 프로젝트 ID 456
};
localStorage.setItem("talkgate_notification_settings", JSON.stringify(allSettings));
```

**핵심**: 프로젝트 ID는 동일하므로:
1. `project-abc.app-dev.talkgate.im`에서 프로젝트 ID 123의 설정을 저장
2. `project-xyz.app-dev.talkgate.im`으로 이동 (같은 프로젝트 ID 123)
3. 프로젝트 ID 123의 설정을 읽으면 동일한 데이터를 얻을 수 있음

### Step 3: 실제 플로우 (Step by Step)

#### 시나리오: project-abc → project-xyz로 서브도메인 변경

1. **사용자가 project-abc에서 설정 저장**
   ```
   URL: https://project-abc.app-dev.talkgate.im/settings
   Origin: https://project-abc.app-dev.talkgate.im
   
   localStorage 저장:
   - "talkgate_notification_settings": {"123": {...}}
   - "tg_use_attendance_menu": "true"
   
   Cookie 저장 (Domain=.talkgate.im):
   - tg_access_token: "xxx"
   - tg_selected_project_id: "123"
   - tg_use_attendance_menu: "true"
   ```

2. **서브도메인 변경 API 호출 성공**
   ```typescript
   await ProjectsService.update({ subDomain: "project-xyz" }, ...);
   ```

3. **리디렉션 발생**
   ```typescript
   window.location.href = "https://project-xyz.app-dev.talkgate.im/settings";
   ```

4. **새 도메인에서 페이지 로드**
   ```
   URL: https://project-xyz.app-dev.talkgate.im/settings
   Origin: https://project-xyz.app-dev.talkgate.im (새 Origin!)
   ```

5. **쿠키에서 프로젝트 ID 읽기**
   ```typescript
   // src/lib/project.ts
   const projectId = getCookieValue("tg_selected_project_id"); // "123"
   // ✅ 성공! Domain=.talkgate.im으로 설정되어 있어서 읽을 수 있음
   ```

6. **로컬 스토리지에서 프로젝트별 데이터 읽기**
   ```typescript
   // src/utils/notificationSettings.ts
   const allSettings = getAllProjectSettings(); // 새 Origin의 로컬 스토리지
   // 첫 접속 시: {} (빈 객체)
   
   // 하지만 프로젝트 ID는 쿠키에서 가져올 수 있으므로
   const currentProjectId = getSelectedProjectId(); // "123"
   const settings = allSettings[currentProjectId] ?? DEFAULT_SETTINGS;
   // 프로젝트 ID 123의 설정이 없으면 기본값 사용
   ```

## 왜 "데이터가 그대로 들어가 있다"고 느끼는가?

### 이유 1: 쿠키 기반 복구

대부분의 중요한 데이터가 **쿠키에 저장**되어 있습니다:
- 인증 토큰 (`tg_access_token`)
- 프로젝트 ID (`tg_selected_project_id`)
- 근태 메뉴 설정 (`tg_use_attendance_menu`)

쿠키는 서브도메인 간 공유되므로 **즉시 복구**됩니다.

### 이유 2: 프로젝트 ID 기반 저장소 설계

프로젝트별 데이터는 **프로젝트 ID를 키로 사용**하도록 설계되어 있습니다:
- 알림 설정: `{ [projectId]: settings }`
- 근태 메뉴: 프로젝트 ID와 무관하게 쿠키로 저장

**프로젝트 ID가 동일하면**, 새 도메인에서도 같은 프로젝트의 데이터를 참조하게 됩니다.

### 이유 3: 기본값 처리

프로젝트별 설정이 없으면 **기본값**을 사용하도록 설계되어 있습니다:
```typescript
// src/utils/notificationSettings.ts
const DEFAULT_SETTINGS: NotificationSettings = {
  consultationChat: true,
  news: true,
};
return allSettings[currentProjectId] ?? DEFAULT_SETTINGS;
```

사용자가 "그대로 들어가 있다"고 느끼는 이유는:
- 대부분의 설정이 기본값과 동일하거나
- 중요한 설정은 쿠키에 저장되어 있거나
- API에서 실시간으로 데이터를 가져오기 때문

### 이유 4: API 기반 데이터 로드

많은 데이터는 **API에서 실시간으로 가져옵니다**:
- 프로젝트 정보: `ProjectsService.detailById()`
- 사용자 정보: `useMe()` 훅
- 알림 목록: API 호출

로컬 스토리지가 없어도 **API에서 데이터를 가져오므로** 문제없이 작동합니다.

## 실제로 "사라지는" 데이터

### 전역 설정 (Origin별 저장)
- **테마 설정**: `tg_theme` (새 도메인에서 기본값 사용)
- **최근 사용한 이모지**: `tg_recent_emojis` (새 도메인에서 빈 배열)
- **초대 토큰** (일시적 데이터)

### 영향도
- **낮음**: 사용자가 다시 설정하면 되는 정도
- 중요한 데이터는 모두 쿠키 또는 프로젝트 ID 기반 저장소 사용

## 요약

### 왜 데이터가 유지되는가?

1. ✅ **쿠키 공유**: `Domain=.talkgate.im` 설정으로 서브도메인 간 쿠키 공유
   - 인증 토큰, 프로젝트 ID 등 핵심 데이터 유지

2. ✅ **프로젝트 ID 기반 설계**: 프로젝트 ID를 키로 사용
   - 같은 프로젝트면 같은 데이터 참조 가능
   - 새 도메인에서 프로젝트 ID를 알면 설정 복구 가능

3. ✅ **API 기반 데이터**: 대부분의 데이터는 API에서 실시간 로드
   - 로컬 스토리지가 없어도 API에서 데이터 획득

4. ✅ **기본값 처리**: 설정이 없으면 기본값 사용
   - 사용자 경험 해치지 않음

### 실제로 사라지는 데이터

- 전역 설정 (테마, 최근 이모지 등)
- 영향도: 낮음 (사용자가 재설정 가능)

## 결론

**특별한 마이그레이션 작업 없이도** 데이터가 유지되는 이유:

1. **쿠키의 도메인 공유 설정**이 핵심
2. **프로젝트 ID 기반 저장소 설계**로 프로젝트별 데이터 복구 가능
3. **API 기반 데이터 로드**로 실시간 동기화
4. 전역 설정만 초기화 (영향도 낮음)

이는 **처음부터 서브도메인 구조를 고려한 설계**의 결과입니다! 🎯
