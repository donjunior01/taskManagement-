import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const userRoles = authService.getUserRoles();
  const hasAccess = allowedRoles.some(role => 
    userRoles.includes(role) || userRoles.includes(`ROLE_${role}`)
  );

  if (!hasAccess) {
    router.navigate(['/login']); // Redirect back to login or default dashboard instead of broken unauthorized
    return false;
  }

  return true;
};
