import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Capture whether a token existed before isLoggedIn() (which clears an expired one).
  const hadToken = !!localStorage.getItem('jwt_token');

  if (authService.isLoggedIn()) {
    return true;
  }

  // A token that was present but is now gone means it had expired → tell the login page so it can
  // show "session expired" instead of silently landing on a blank login form.
  router.navigate(['/login'], hadToken ? { queryParams: { expired: '1' } } : {});
  return false;
};
