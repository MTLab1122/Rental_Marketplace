import { GlobalExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, BadRequestException, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@rental-peshawar/shared-types';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({
          id: 'test-trace-id',
          headers: {},
        }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should format 404 NotFoundException into standard error envelope', () => {
    const notFoundException = new NotFoundException('Resource not found');

    filter.catch(notFoundException, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        error: expect.objectContaining({
          code: ErrorCode.NOT_FOUND,
          message: 'Resource not found',
          requestId: 'test-trace-id',
        }),
      }),
    );
  });

  it('should format validation errors with details array', () => {
    const validationException = new BadRequestException({
      message: ['email must be an email', 'password is too short'],
      error: 'Bad Request',
    });

    filter.catch(validationException, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        error: expect.objectContaining({
          code: ErrorCode.VALIDATION_ERROR,
          details: [{ message: 'email must be an email' }, { message: 'password is too short' }],
        }),
      }),
    );
  });
});
