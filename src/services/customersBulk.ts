import { apiClient } from "@/lib/apiClient";

export type BulkJob = unknown; // refine later

export const CustomersBulkService = {
  createImport(payload: Record<string, unknown>) {
    return apiClient.post<BulkJob>("/v1/customers-bulk/bulk-import", payload);
  },
  listImports(query?: Record<string, string | number | boolean>) {
    return apiClient.get<BulkJob[]>("/v1/customers-bulk/bulk-import", { query });
  },
  importDetail(jobId: string) {
    return apiClient.get<BulkJob>(`/v1/customers-bulk/bulk-import/${jobId}`);
  },
  exportExcel(query?: Record<string, string | number | boolean>) {
    return apiClient.getBlob("/v1/customers-bulk/export-excel", { query });
  },
};


