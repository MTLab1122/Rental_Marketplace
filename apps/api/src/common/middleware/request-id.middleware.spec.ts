import { RequestIdMiddleware, REQUEST_ID_HEADER } from './request-id.middleware';
import { Request, Response } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('should generate a new request id if not provided', () => {
    const req = { headers: {} } as Request;
    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    const reqWithId = req as Request & { id: string };
    expect(reqWithId.id).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, reqWithId.id);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should reuse existing request id from incoming headers', () => {
    const existingId = 'client-provided-trace-id-123';
    const req = {
      headers: { [REQUEST_ID_HEADER]: existingId },
    } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    const reqWithId = req as Request & { id: string };
    expect(reqWithId.id).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, existingId);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
