import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../toast/toast.service';
import { SKIP_ERROR_TOAST } from './http-context.tokens';

export function describeHttpError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Unable to reach the server. Check your connection.';
  }
  const body: unknown = error.error;
  const message =
    typeof body === 'object' && body !== null && 'message' in body
      ? (body as { message: unknown }).message
      : undefined;
  if (Array.isArray(message)) {
    return message.map(String).join(', ');
  }
  if (typeof message === 'string' && message) {
    return message;
  }
  return error.status >= 500
    ? 'Server error. Please try again later.'
    : 'The request could not be completed.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status !== 401 &&
        !req.context.get(SKIP_ERROR_TOAST)
      ) {
        toast.error(describeHttpError(error));
      }
      return throwError(() => error);
    }),
  );
};
