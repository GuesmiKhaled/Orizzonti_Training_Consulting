import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { TokenStorage } from './token-storage.service';

const LOGIN_PATH = '/auth/login';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const tokens = inject(TokenStorage);
  const router = inject(Router);

  const isApiRequest = req.url.startsWith(baseUrl);
  const token = tokens.token;
  const request =
    isApiRequest && token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        isApiRequest &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.endsWith(LOGIN_PATH)
      ) {
        tokens.clear();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
