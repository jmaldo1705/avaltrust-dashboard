import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  // No agregar token a requests de auth
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  // Agregar token si está disponible
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
        // Sin permisos - mostrar mensaje y redirigir al dashboard
        console.warn('Acceso denegado. Permisos insuficientes.');
        alert('No tienes permisos para acceder a este recurso.');
        router.navigate(['/dashboard']);
      }

      return throwError(() => error);
    })
  );
};
