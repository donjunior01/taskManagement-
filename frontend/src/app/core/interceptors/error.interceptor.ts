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
      
      let errorMessage = 'An error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        errorMessage = error.error?.message || `Server returned code ${error.status}`;
      }
      
      return throwError(() => errorMessage);
    })
  );
};
