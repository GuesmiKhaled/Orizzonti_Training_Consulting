import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Requires a loaded profile; anonymous users are sent to /login. With the
 * cookie-based auth flow there is no readable token, so this calls
 * `ensureProfile()` to determine auth state.
 */
export const signedInGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return auth.ensureProfile().pipe(
    map((profile) => (profile ? true : router.parseUrl('/login'))),
    catchError(() => of(router.parseUrl('/login'))),
  );
};

/**
 * Guards the admin area: needs a profile, and an account that must pick a new
 * password is sent to /change-password before anything else loads.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureProfile().pipe(
    map((profile) => {
      if (!profile) {
        return router.parseUrl('/login');
      }
      return profile.mustChangePassword
        ? router.parseUrl('/change-password')
        : true;
    }),
    catchError(() => of(router.parseUrl('/login'))),
  );
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
