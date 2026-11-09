import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ApiErrorResponse, ApiErrorDetail } from '@rental-peshawar/shared-types';
import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const requestId =
      request.id || (request.headers[REQUEST_ID_HEADER] as string) || 'unknown-request-id';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred. Please try again later.';
    let details: ApiErrorDetail[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const respObj = exceptionResponse as Record<string, unknown>;
        message = (respObj['message'] as string) || exception.message;

        // Check if class-validator returned an array of messages
        if (Array.isArray(respObj['message'])) {
          code = ErrorCode.VALIDATION_ERROR;
          message = 'Validation failed for one or more fields.';
          details = respObj['message'].map((msg: unknown) => {
            if (typeof msg === 'string') {
              return { message: msg };
            }
            return msg as ApiErrorDetail;
          });
        }

        if (respObj['error'] && typeof respObj['error'] === 'string') {
          if (!code || code === ErrorCode.INTERNAL_SERVER_ERROR) {
            code = respObj['error'].toUpperCase().replace(/\s+/g, '_');
          }
        }
      }

      switch (status) {
        case HttpStatus.BAD_REQUEST:
          code = code || ErrorCode.VALIDATION_ERROR;
          break;
        case HttpStatus.UNAUTHORIZED:
          code = ErrorCode.UNAUTHORIZED;
          break;
        case HttpStatus.FORBIDDEN:
          code = ErrorCode.FORBIDDEN;
          break;
        case HttpStatus.NOT_FOUND:
          code = ErrorCode.NOT_FOUND;
          break;
        case HttpStatus.CONFLICT:
          code = ErrorCode.CONFLICT;
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          code = ErrorCode.RATE_LIMIT_EXCEEDED;
          break;
        case HttpStatus.SERVICE_UNAVAILABLE:
          code = ErrorCode.SERVICE_UNAVAILABLE;
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `[${requestId}] Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(`[${requestId}] Non-error thrown: ${String(exception)}`);
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      data: null,
      error: {
        code,
        message,
        details: details || [],
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(errorPayload);
  }
}
