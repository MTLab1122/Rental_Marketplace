import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '@rental-peshawar/shared-types';
import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const path = req.path || '';

    // Bypass envelope for raw assets or docs if applicable
    if (path.includes('/docs-json') || path.includes('/favicon.ico')) {
      return next.handle();
    }

    const requestId = req.id || (req.headers[REQUEST_ID_HEADER] as string) || 'unknown-request-id';

    return next.handle().pipe(
      map((resData) => {
        // If already structured response
        if (
          resData !== null &&
          typeof resData === 'object' &&
          'success' in resData &&
          'data' in resData
        ) {
          return {
            ...resData,
            meta: {
              requestId,
              timestamp: new Date().toISOString(),
              ...(resData.meta || {}),
            },
          };
        }

        return {
          success: true,
          data: resData ?? {},
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
          },
          error: null,
        };
      }),
    );
  }
}
