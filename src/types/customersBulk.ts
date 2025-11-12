// Customers Bulk domain types

export type BulkJobStatus = "pending" | "processing" | "completed" | "failed";

export type BulkJob = {
  id: number;
  projectId: number;
  memberId: number;
  memberName: string;
  fileName: string;
  fileUrl: string;
  status: BulkJobStatus;
  totalRows: number;
  successCount: number;
  failureCount: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type BulkJobFailure = {
  id: number;
  jobId: number;
  rowNumber: number;
  data: string; // JSON string
  errorMessage: string;
  errorCode: string;
  createdAt: string;
};

export type BulkJobDetail = BulkJob & {
  failures: BulkJobFailure[];
};

export type BulkJobListResponse = {
  jobs: BulkJob[];
  total: number;
  page: number;
  limit: number;
};

export type BulkJobListQuery = {
  page?: number;
  limit?: number;
  status?: BulkJobStatus;
};

