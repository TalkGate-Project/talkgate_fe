import { apiClient } from "@/lib/apiClient";
import type { BulkJob, BulkJobStatus } from "@/types/customersBulk";

export const CustomersBulkService = {
  // POST /v1/customers-bulk/import
  createImport(payload: { fileUrl?: string; fileName: string; projectId: string }) {
    const { projectId, ...body } = payload;
    return apiClient.post<BulkJob>("/v1/customers-bulk/import", body, { headers: { "x-project-id": projectId } });
  },

  // GET /v1/customers-bulk/import
  listImports(params: { projectId: string; page?: number; limit?: number; status?: BulkJobStatus }) {
    const { projectId, ...query } = params;
    return apiClient.get<BulkJob[]>("/v1/customers-bulk/import", { query, headers: { "x-project-id": projectId } });
  },

  // GET /v1/customers-bulk/import/{jobId}
  importDetail(jobId: string, projectId: string) {
    return apiClient.get<BulkJob>(`/v1/customers-bulk/import/${jobId}`, { headers: { "x-project-id": projectId } });
  },

  // GET /v1/customers-bulk/export (blob)
  exportExcel(params: {
    projectId: string;
    query?: Record<string, string | number | boolean | Array<string | number>>;
  }) {
    const { projectId, query } = params;
    return apiClient.getBlob("/v1/customers-bulk/export", { query, headers: { "x-project-id": projectId } });
  },
};
