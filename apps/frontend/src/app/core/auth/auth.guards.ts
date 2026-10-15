import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

/** Requires a token; anonymous users are sent to /login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.parseUrl('/login');
};

/**
 * Lazy-route guard: the chunk is only fetched when the signed-in user holds
 * `permission`. Others are redirected to the forbidden page.
 */
export function permissionGuard(permission: string): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.ensureProfile().pipe(
      map((profile) => {
        if (!profile) {
          return router.parseUrl('/login');
        }
        return auth.has(permission) ? true : router.parseUrl('/admin/forbidden');
      }),
      catchError(() => of(router.parseUrl('/login'))),
    );
  };
}
