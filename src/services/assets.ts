import { apiClient } from "@/lib/apiClient";

export type PresignInput = { fileName: string; fileType: string };
export type PresignOutput = unknown; // to be refined

export const AssetsService = {
  // Chat 첨부 파일 Presigned URL 발급
  presignAttachment(input: PresignInput) {
    return apiClient.post<PresignOutput>("/v1/asset/attachment/presigned-url", input);
  },
  // 고객 bulk import용 Presigned URL 발급
  presignBulkImport(input: PresignInput) {
    return apiClient.post<PresignOutput>("/v1/asset/bulk-import/presigned-url", input);
  },
  async uploadToS3(uploadUrl: string, file: File) {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
  },
};


