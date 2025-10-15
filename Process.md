## Frontend API Progress Tracker

본 문서는 프런트엔드에서 연동/타이핑한 API의 진행 상황과 결정 사항을 기록합니다. (최신순)

### 2025-10-15

- 공통
  - API Base: dev `https://api-dev.talkgate.im`, prod `https://api.talkgate.im` (`src/lib/env.ts`)
  - `apiClient` 개선: 쿼리 배열 직렬화, `responseType (auto|json|text|blob)` 지원
  - 헤더 규칙: 프로젝트 요구 API는 반드시 `x-project-id` 헤더 사용
  - 서비스-타입 분리: 서비스는 `src/services/*`, 타입은 `src/types/*`에서 import

- Customers (완료 범위)
  - List: GET `/v1/customers` with query + `x-project-id`
    - Types: `CustomersListQuery`, `CustomersListResponse`
  - Create: POST `/v1/customers` + `x-project-id`
    - Types: `CreateCustomerInput`, `CreateCustomerResponse`
  - Detail: GET `/v1/customers/{customerId}` + `x-project-id`
    - Types: `CustomerDetail`, `CustomerDetailResponse`
  - Update: PATCH `/v1/customers/{customerId}` + `x-project-id`
    - Types: `UpdateCustomerInput`, `UpdateCustomerResponse`
  - Delete: DELETE `/v1/customers/{customerId}` + `x-project-id`
    - Service 사용: `CustomersService.remove(id).withProject(projectId)`
  - Assign: POST `/v1/customers/assign` + `x-project-id`
    - Types: `AssignCustomersInput`, `AssignCustomersResponse`
  - Unassign: POST `/v1/customers/unassign` + `x-project-id`
    - Types: `UnassignCustomersInput`, `UnassignCustomersResponse`
  - Messengers: POST/DELETE `/v1/customers/messengers`/`/v1/customers/messengers/{messengerId}` + `x-project-id`
    - Types: `AddCustomerMessengerInput`, `RemoveCustomerMessengerInput`
  - Notes: POST/DELETE `/v1/customers/notes`/`/v1/customers/notes/{noteId}` + `x-project-id`
    - Types: `AddCustomerNoteInput`, `RemoveCustomerNoteInput`
  - Payment histories: POST/DELETE `/v1/customers/payment-histories`/`.../{paymentHistoryId}` + `x-project-id`
    - Types: `AddCustomerPaymentHistoryInput`, `RemoveCustomerPaymentHistoryInput`
  - Schedules: POST/DELETE `/v1/customers/schedules`/`.../{scheduleId}` + `x-project-id`
    - Types: `AddCustomerScheduleInput`, `RemoveCustomerScheduleInput`

- Assets
  - Presign: POST `/v1/asset/attachment/presigned-url`, `/v1/asset/bulk-import/presigned-url`
  - S3 업로드 유틸: `AssetsService.uploadToS3(uploadUrl, file)`

- Auth
  - Social: POST `/v1/auth/google|kakao|naver`
  - Basic: POST `/v1/auth/login|signup|refresh|terms|verify-email`, GET `/v1/auth/user`

- Bulk customers
  - Import: POST/GET `/v1/customers-bulk/bulk-import`, GET detail, GET export-excel(blob)

- Notices
  - CRUD: `/v1/notices` + `/v1/notices/{noticeId}`

- Teams/Projects/Members
  - Teams: CRUD + 멤버 추가/삭제 + 리더 지정
  - Projects: 생성/수정/삭제(바디), 목록, 내 프로필
  - Members: 목록/상세/자기정보수정/삭제(바디) + 초대 흐름 일체

### 개발 원칙 요약

- 타입은 도메인 폴더 `src/types/<domain>.ts`에 배치하고 서비스에서 가져다 쓴다.
- 프로젝트 스코프 API는 반드시 `x-project-id`를 헤더로 전달한다.
- 실패(4xx/5xx)는 `apiClient`가 예외로 던지며, 서버 에러 바디는 `error.data`(`code`, `message`, `traceId`)로 확인한다.
- 배열 쿼리(`categoryIds`)는 반복 파라미터(`key=1&key=2`)로 직렬화된다.


