import { apiClient } from "@/lib/apiClient";

export type PresignInput = { fileName: string; fileType: string };
export type PresignOutput = {
  result: true;
  data: {
    uploadUrl: string;
    fileUrl: string;
    fileName?: string;
  };
};

export const AssetsService = {
  // Chat 첨부 파일 Presigned URL 발급 (x-project-id 헤더 필요)
  presignAttachment(input: PresignInput) {
    return apiClient.post<PresignOutput>("/v1/asset/attachment/presigned-url", input);
  },
  // 고객 bulk import용 Presigned URL 발급 (x-project-id 헤더 필요)
  presignBulkImport(input: PresignInput) {
    return apiClient.post<PresignOutput>("/v1/asset/bulk-import/presigned-url", input);
  },
  // 프로필 이미지 업로드용 Presigned URL 발급
  presignProfileImage(input: PresignInput) {
    return apiClient.post<PresignOutput>("/v1/asset/profile-image/presigned-url", input);
  },
  // 프로젝트 로고 업로드용 Presigned URL 발급
  presignProjectLogo(input: PresignInput) {
    return apiClient.post<PresignOutput>("/v1/asset/project-logo/presigned-url", input);
  },
  async uploadToS3(uploadUrl: string, file: File, fileType: string) {
    // Presigned URL 사용 시 주의사항:
    // 1. Content-Type은 presigned URL 생성 시 전달한 fileType과 정확히 일치해야 함
    // 2. 추가 헤더를 보내면 안 됨 (presigned URL 서명에 포함되지 않은 헤더는 거부됨)
    // 3. CORS 설정은 S3 버킷에서 해결해야 함
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": fileType,
      },
      body: file,
      // CORS 요청이므로 credentials는 보내지 않음
      credentials: "omit",
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      const errorDetails = `Status: ${res.status}, StatusText: ${res.statusText}`;
      console.error("S3 upload failed:", {
        url: uploadUrl.split("?")[0], // 보안을 위해 쿼리 파라미터 제거
        status: res.status,
        statusText: res.statusText,
        errorText,
        expectedContentType: fileType,
      });
      throw new Error(`S3 upload failed: ${errorDetails}. ${errorText || "Unknown error"}`);
    }
  },
};


