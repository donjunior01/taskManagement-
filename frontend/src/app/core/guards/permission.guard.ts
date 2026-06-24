import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { PermissionService } from '../services/permission.service';

/**
 * Blocks a route unless the user's effective RBAC permissions include `required`. Fail-open: if
 * permissions haven't loaded (or the load failed) the route is allowed, so a normal user is never
 * locked out. When denied, redirects to the user's role dashboard rather than a dead end.
 */
export function permissionGuard(required: string): CanActivateFn {
  return () => {
    const perm = inject(PermissionService);
    const router = inject(Router);
    return perm.ensureLoaded().pipe(
      map(set => {
        if (!perm.isLoaded() || set.has(required)) return true;
        const roles = (localStorage.getItem('user_roles') || '').toUpperCase();
        const home = roles.includes('ADMIN') ? '/admin/dashboard'
          : roles.includes('PROJECT_MANAGER') ? '/pm/dashboard'
          : '/user/dashboard';
        router.navigate([home]);
        return false;
      })
    );
  };
}
