import { ApiErrorPayload } from './errors.js';

/**
 * Standard Success API Response Envelope
 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta: ResponseMeta;
  error: null;
}

/**
 * Standard Error API Response Envelope
 */
export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiErrorPayload;
}

/**
 * Standard Metadata for pagination and request tracing
 */
export interface ResponseMeta {
  requestId?: string;
  timestamp?: string;
  pagination?: PaginationMeta;
  [key: string]: unknown;
}

/**
 * Cursor-based pagination metadata
 */
export interface PaginationMeta {
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor?: string | null;
  limit: number;
  total?: number;
}

/**
 * Standard query parameters for cursor pagination
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}
