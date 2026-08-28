import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  const apiKey = authService.apiKey();

  let clonedReq = req;

  const headersToSet: Record<string, string> = {};

  if (token) {
    headersToSet['Authorization'] = `Bearer ${token}`;
  }

  if (apiKey) {
    headersToSet['x-api-key'] = apiKey;
  }

  if (Object.keys(headersToSet).length > 0) {
    clonedReq = req.clone({
      setHeaders: headersToSet
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If token/key is invalid or expired (401/403), clear session and route to /login
      if ((error.status === 401 || error.status === 403) && !req.url.includes('/api/auth/login')) {
        authService.logout(false);
      }
      return throwError(() => error);
    })
  );
};

