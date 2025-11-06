// Common API response types used across the application

export type ApiSuccess<T> = {
  result: true;
  data: T;
};

export type ApiError = {
  result: false;
  code: string;
  message: string;
  traceId?: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// Legacy alias for backward compatibility
export type ApiSuccessResponse<T> = ApiSuccess<T>;
export type ApiErrorResponse = ApiError;

