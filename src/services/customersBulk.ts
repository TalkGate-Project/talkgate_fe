import { apiClient } from "@/lib/apiClient";
import type { 
  BulkJob, 
  BulkJobDetail, 
  BulkJobListResponse, 
  BulkJobListQuery, 
  BulkJobStatus 
} from "@/types/customersBulk";

export const CustomersBulkService = {
  // POST /v1/customers-bulk/import
  createImport(payload: { fileUrl?: string; fileName: string; projectId: string }) {
    const { projectId, ...body } = payload;
    return apiClient.post<BulkJob>("/v1/customers-bulk/import", { body, headers: { "x-project-id": projectId } });
  },

  // GET /v1/customers-bulk/import
  listImports(params: { projectId: string } & BulkJobListQuery) {
    const { projectId, ...query } = params;
    return apiClient.get<BulkJobListResponse>("/v1/customers-bulk/import", { query, headers: { "x-project-id": projectId } });
  },

  // GET /v1/customers-bulk/import/{jobId}
  importDetail(jobId: number, projectId: string) {
    return apiClient.get<BulkJobDetail>(`/v1/customers-bulk/import/${jobId}`, { headers: { "x-project-id": projectId } });
  },

  // GET /v1/customers-bulk/export (blob)
  exportExcel(params: {
    projectId: string;
    query?: Record<string, string | number | boolean | Array<string | number>>;
  }) {
    const { projectId, query } = params;
    return apiClient.get<Blob>("/v1/customers-bulk/export", { query, headers: { "x-project-id": projectId }, responseType: "blob" });
  },
};
