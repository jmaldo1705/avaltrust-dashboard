import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Si no hay roles requeridos, solo verificar autenticación
  const requiredRoles = route.data?.['roles'] as string[];
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Verificar si ya tenemos los datos del perfil cargados
  const userProfile = authService.userProfile();

  if (userProfile) {
    // Ya tenemos el perfil, verificar roles directamente
    return checkRoleAccess(authService, router, requiredRoles, state.url);
  }

  // No tenemos el perfil, cargarlo primero
  return authService.getUserProfile().pipe(
    map(() => checkRoleAccess(authService, router, requiredRoles, state.url)),
    catchError((error) => {
      console.error('Error verificando permisos:', error);
      router.navigate(['/login']);
      return of(false);
    })
  );
};

function checkRoleAccess(
  authService: AuthService,
  router: Router,
  requiredRoles: string[],
  currentUrl: string
): boolean {

  // Verificar si el usuario tiene alguno de los roles requeridos
  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  // No tiene los roles necesarios
  console.warn(`Acceso denegado. Roles requeridos: ${requiredRoles.join(', ')}`);

  // Mostrar mensaje de error
  alert('No tienes permisos para acceder a esta página.');

  // Redirigir a la página apropiada según el rol del usuario
  authService.redirectToAppropriateRoute();

  return false;
}

// Guard específico para administradores
export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  // Establecer roles requeridos para admin y usar el guard principal
  route.data = { ...route.data, roles: ['ROLE_ADMIN'] };
  return authGuard(route, state);
};

// Guard específico para usuarios (incluye admins)
export const userGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  // Establecer roles requeridos para usuarios y usar el guard principal
  route.data = { ...route.data, roles: ['ROLE_USER', 'ROLE_ADMIN'] };
  return authGuard(route, state);
};
