import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { IdempotencyService } from './idempotency.service';

/**
 * Idempotency interceptor. On POST/PUT/PATCH/DELETE requests that carry
 * an `Idempotency-Key` header, checks the stored key before invoking the
 * handler. If the key was already consumed, returns the cached response.
 * On first use, records the response so subsequent attempts with the same
 * key return the identical result.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly idempotencyService: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const method = request.method;
    const endpoint = request.route?.path ?? 'unknown';
    const idempotencyKey = request.headers['idempotency-key'] as
      string | undefined;

    if (
      !idempotencyKey ||
      !['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    ) {
      return next.handle();
    }

    return new Observable<unknown>((subscriber) => {
      this.idempotencyService
        .generateKey(method, endpoint, request.body)
        .then((keyRecord) => {
          response.setHeader('Idempotency-Key', keyRecord);
          next.handle().subscribe(subscriber);
        })
        .catch((error) => {
          this.logger.error(
            `Idempotency key generation failed for ${method} ${endpoint}: ${error.message}`,
          );
          subscriber.error(error);
        });
    });
  }
}
