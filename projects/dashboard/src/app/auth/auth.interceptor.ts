import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  // No agregar token solo a los endpoints públicos de auth
  const publicAuthEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
  const isPublicAuthEndpoint = publicAuthEndpoints.some(endpoint => req.url.includes(endpoint));
  
  if (isPublicAuthEndpoint) {
    return next(req);
  }

  // Agregar token si está disponible (incluyendo /api/auth/change-password)
  const authReq = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado o inválido - hacer logout
        console.warn('Token expirado o inválido. Cerrando sesión.');
        authService.logout(true);
      } else if (error.status === 403) {
        // Sin permisos - log para debugging
        console.warn('Acceso denegado (403)');
        console.log('URL:', req.url);
        console.log('Token presente:', !!token);
      }

      return throwError(() => error);
    })
  );
};
