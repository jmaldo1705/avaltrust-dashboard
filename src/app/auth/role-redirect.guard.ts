import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard que redirige automáticamente al dashboard correcto según el rol del usuario
 */
export const roleRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no está autenticado, redirigir a login
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Redirigir según el rol
  if (authService.hasRole('ROLE_AFIANZADO')) {
    router.navigate(['/dashboard-afianzado'], { replaceUrl: true });
  } else {
    router.navigate(['/dashboard'], { replaceUrl: true });
  }

  return false; // Siempre retorna false porque ya redirigimos
};
