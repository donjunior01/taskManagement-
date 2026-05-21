import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const errorInterceptor = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);
      // Re-throw the original HttpErrorResponse so components can read status and body
      return throwError(() => error);
    })
  );
};
