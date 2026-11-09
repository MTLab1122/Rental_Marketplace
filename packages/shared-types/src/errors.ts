/**
 * Standard System Error Codes
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  OUTSIDE_SERVICE_BOUNDARY = 'OUTSIDE_SERVICE_BOUNDARY',
  INVALID_ELIGIBILITY = 'INVALID_ELIGIBILITY',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorPayload {
  code: ErrorCode | string;
  message: string;
  details?: ApiErrorDetail[];
  requestId?: string;
  timestamp?: string;
}
