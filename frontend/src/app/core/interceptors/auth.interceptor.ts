import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const token = localStorage.getItem('jwt_token');
  
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_roles');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
