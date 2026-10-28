import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter that normalizes every error response to an
 * RFC 9457 Problem Details shape while preserving the `message` field the
 * Angular error interceptor already depends on (string or string[]), so the
 * existing API contract is not broken.
 *
 * Added to address audit finding #3 (no global exception filter / Problem
 * Details). The real error is logged server-side; clients only receive a
 * generic detail for 5xx errors to avoid leaking implementation details.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const problem = this.toProblemDetails(status, body, exception.name);
      response.status(status).json(problem);
      return;
    }

    // Unexpected errors: never leak internals to the client.
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(status).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status,
      detail: 'Internal server error',
      message: 'Internal server error',
    });
  }

  private toProblemDetails(
    status: number,
    body: unknown,
    name: string,
  ): Record<string, unknown> {
    const title = this.titleFor(status, name);
    const base: Record<string, unknown> = {
      type: 'about:blank',
      title,
      status,
    };

    if (typeof body === 'string') {
      base.detail = body;
      base.message = body;
      return base;
    }

    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      // Preserve the existing `message` contract (string or string[]).
      if ('message' in obj) base.message = obj.message;
      if ('error' in obj && typeof obj.error === 'string') {
        base.title = obj.error;
      }
      // Prefer a human-readable detail from the first message entry.
      if ('message' in obj) {
        const msg = obj.message;
        if (Array.isArray(msg) && msg.length > 0) {
          base.detail = String(msg[0]);
          base.errors = msg;
        } else if (typeof msg === 'string') {
          base.detail = msg;
        }
      } else if ('error' in obj && typeof obj.error === 'string') {
        base.detail = obj.error;
      }
      return base;
    }

    base.detail = title;
    base.message = title;
    return base;
  }

  private titleFor(status: number, name: string): string {
    const reason =
      HttpStatus[status as unknown as keyof typeof HttpStatus] ?? name;
    return typeof reason === 'string' ? reason : name;
  }
}
