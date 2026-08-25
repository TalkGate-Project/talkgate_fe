# 이미지 업로드 플로우

본 문서는 TalkGate FE 프로젝트에서 이미지/파일 업로드가 처리되는 핵심 플로우를 설명합니다.

## 개요

이 프로젝트는 **AWS S3 Presigned URL** 방식을 사용하여 이미지를 업로드합니다. 클라이언트는 백엔드로부터 Presigned URL을 받아 S3에 직접 업로드합니다.

## 핵심 플로우

```
1. 사용자 파일 선택
   ↓
2. Presigned URL 발급 요청 (백엔드 API)
   ↓
3. S3에 직접 업로드 (Presigned URL 사용)
   ↓
4. fileUrl을 받아서 실제 API 호출에 사용
```

## 주요 서비스

### `AssetsService` (`src/services/assets.ts`)

#### Presigned URL 발급 메서드들

- `presignAttachment(input)` - 채팅 첨부 파일
- `presignBulkImport(input)` - 고객 bulk import 파일
- `presignProfileImage(input)` - 프로필 이미지
- `presignProjectLogo(input)` - 프로젝트 로고
- `presignSenderNumberDoc(input)` - 발신번호 등록 서류

**입력 타입:**
```typescript
{
  fileName: string;
  fileType: string; // MIME type (예: "image/png", "image/jpeg")
}
```

**응답 타입:**
```typescript
{
  result: true;
  data: {
    uploadUrl: string;  // S3 업로드용 Presigned URL
    fileUrl: string;     // 업로드 후 접근 가능한 URL (API에 전달)
    fileName?: string;
  };
}
```

#### S3 업로드 메서드

- `uploadToS3(uploadUrl: string, file: File, fileType: string)`

**중요 사항:**
- `fileType`은 Presigned URL 발급 시 사용한 값과 **정확히 일치**해야 함
- 추가 헤더를 보내면 안 됨 (Presigned URL 서명에 포함되지 않은 헤더는 거부됨)
- `fetch`를 직접 사용 (apiClient 아님)
- `credentials: "omit"` 사용 (CORS 요청)

## 사용 예시

### 프로젝트 로고 업로드

```typescript
// 1. 파일 타입 감지
const fileType = iconFile.type; // 또는 getFileType(iconFile)

// 2. Presigned URL 발급
const presignedRes = await AssetsService.presignProjectLogo({
  fileName: iconFile.name,
  fileType,
});

const { uploadUrl, fileUrl } = presignedRes.data.data;

// 3. S3에 직접 업로드
await AssetsService.uploadToS3(uploadUrl, iconFile, fileType);

// 4. fileUrl을 API에 전달
await ProjectsService.create({
  name: projectName,
  logoUrl: fileUrl, // ← 여기 사용
});
```

### 프로필 이미지 업로드

```typescript
const presignResponse = await AssetsService.presignProfileImage({
  fileName: file.name,
  fileType: file.type,
});

const { uploadUrl, fileUrl } = presignResponse.data.data;
await AssetsService.uploadToS3(uploadUrl, file, file.type);

// fileUrl을 상태에 저장하거나 API에 전달
setProfileImageUrl(fileUrl);
```

## 프로젝트 스코프 API 주의사항

일부 Presigned URL API는 `x-project-id` 헤더가 필요합니다:

- `presignAttachment` - 자동으로 `x-project-id` 주입됨 (apiClient가 처리)
- `presignBulkImport` - 명시적으로 `projectId` 전달 필요

```typescript
// presignBulkImport는 projectId를 별도로 전달
const presign = await AssetsService.presignBulkImport({
  projectId: "123",
  fileName: file.name,
  fileType: file.type,
});
```

## 파일 타입 감지

일부 컴포넌트에서는 파일 확장자로부터 MIME type을 추론합니다:

```typescript
function getFileType(file: File): string {
  // 파일 확장자 기반 MIME type 추론
  // 또는 file.type 사용
}
```

**권장:** `file.type`을 우선 사용하고, 없으면 확장자 기반 추론

## 에러 처리

- S3 업로드 실패 시 `uploadToS3`가 에러를 throw
- Presigned URL 발급 실패는 `apiClient`가 예외로 처리
- 일반적인 에러 처리 패턴: try-catch로 감싸서 사용자에게 알림

## 참고 파일

- `src/services/assets.ts` - AssetsService 정의
- `src/types/assets.ts` - 타입 정의
- `src/components/projects/CreateProjectModal.tsx` - 프로젝트 로고 업로드 예시
- `src/components/settings/ProfileSettings.tsx` - 프로필 이미지 업로드 예시
- `src/components/customers/sms/SmsModal.tsx` - 채팅 첨부 파일 업로드 예시
