## Frontend API Progress Tracker

본 문서는 프런트엔드에서 연동/타이핑한 API의 진행 상황과 결정 사항을 기록합니다. (최신순)

### 2025-10-28

- 현황 요약
  - 스웨거 총 API: 85개
  - 실제 코드에서 호출 중인 스웨거 API: 31개
  - 현재 연동 진척률: 약 36.5% (31/85)

- 스웨거엔 있으나 프런트 서비스에 미정의(또는 미사용)
  - Asset: `POST /v1/asset/profile-image/presigned-url`
  - Conversations: 서비스 선언 완료(미사용 화면 대기)
  - Customer Bulk: `GET /v1/customers-bulk/export`, `POST /v1/customers-bulk/import`, `GET /v1/customers-bulk/import`, `GET /v1/customers-bulk/import/{jobId}` (현재 FE 경로 불일치로 미정의 취급)
  - Member: `GET /v1/members/my`

- 프런트에 선언되어 있으나 스웨거에 없음/경로 불일치
  - Notifications: `GET /v1/notifications`, `GET /v1/notifications/counts`, `POST /v1/notifications/mark-all-read`, `POST /v1/notifications/{id}/mark-read`
  - Teams: `/v1/teams` 계열 일체 (CRUD, 멤버 추가/삭제, 리더 지정)
  - Projects: `GET /v1/projects/profile`
  - Customers Bulk: `POST/GET /v1/customers-bulk/bulk-import`, `GET /v1/customers-bulk/bulk-import/{jobId}`, `GET /v1/customers-bulk/export-excel` (스웨거는 `/import`, `/export` 경로)

- 코드에서 실제로 호출 중인 스웨거 API (대표)
  - Auth: `POST /v1/auth/login`, `POST /v1/auth/google|kakao|naver`, `POST /v1/auth/refresh`, `GET /v1/auth/user`, `POST /v1/auth/check-email-duplicate`
  - Auth(추가): `PATCH /v1/auth/change-password`, `PATCH /v1/auth/profile`, `POST /v1/auth/resend-email-verification`, `POST /v1/auth/send-password-reset-code`, `POST /v1/auth/verify-password-reset-code`, `POST /v1/auth/reset-password`
  - Customers: `GET /v1/customers`, `GET /v1/customers/{id}`, `PATCH /v1/customers/{id}`, `POST /v1/customers/assign`, `POST/DELETE /v1/customers/notes`, `POST/DELETE /v1/customers/payment-histories`, `POST/DELETE /v1/customers/schedules`, `POST /v1/customers/messengers`
  - Customer Note Categories: `GET /v1/customer-note-categories`
  - Members/MemberTree: `GET /v1/members-tree/tree`, `POST /v1/members/invitations/verify`, `POST /v1/members/invitations/accept`
  - Projects: `GET /v1/projects`, `POST /v1/projects`
  - Assets: `POST /v1/asset/bulk-import/presigned-url`
  - Attendance: `POST /v1/attendance/check-in`, `POST /v1/attendance/check-out`, `GET /v1/attendance/list`, `GET /v1/attendance/my-status`
  - Conversations(서비스 선언): `PATCH /v1/conversations/{conversationId}/customer`, `DELETE /v1/conversations/{conversationId}/customer`, `PATCH /v1/conversations/close/{conversationId}`, `GET /v1/conversations/customers/unconnected`

- 다음 조치 제안
  1) Customers Bulk 경로를 스웨거와 일치하도록 교정 (`/import`, `/export`)
  2) Attendance·Conversations·Auth(비밀번호/프로필/재전송) 영역 서비스 추가 및 화면 연동 계획 수립
  3) Notifications·Teams·Projects profile 등 스웨거 미존재 엔드포인트는 백엔드와 경로 합의 또는 제거/대체

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


