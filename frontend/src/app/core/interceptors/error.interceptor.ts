import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Global HTTP error handler. On a 401 (expired/invalid JWT) it closes the session
 * and sends the user to the login page — so an expired token never leaves them
 * stranded on an empty dashboard. Auth endpoints (login/register/refresh) are
 * exempted so their own error handling still works.
 */
export const errorInterceptor = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthCall = /\/auth\/(login|register|refresh|password-reset)/.test(request.url);
      if (error.status === 401 && !isAuthCall) {
        // Session expired or token invalid → end the session and force re-login.
        if (authService.isLoggedIn()) {
          authService.logout();
        }
        if (!router.url.startsWith('/login')) {
          router.navigate(['/login'], { queryParams: { expired: '1' } });
        }
      }
      return throwError(() => error);
    })
  );
};
