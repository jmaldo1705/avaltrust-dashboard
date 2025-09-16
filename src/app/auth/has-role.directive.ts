import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnDestroy, effect } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnDestroy {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private hasView = false;
  private currentRoles: string | string[] | null = null;

  constructor() {
    // Usar effect() para reaccionar a cambios en el signal userProfile
    effect(() => {
      // Este effect se ejecutará cada vez que userProfile cambie
      const profile = this.authService.userProfile();

      // Re-evaluar cuando cambien los datos del perfil
      if (this.currentRoles) {
        this.updateView(this.currentRoles);
      }
    });
  }

  @Input() set appHasRole(roles: string | string[]) {
    this.updateView(roles);
  }

  ngOnDestroy() {
    // Angular automáticamente limpia los effects cuando el componente se destruye
    // No necesitas hacer nada manual aquí
  }

  private updateView(roles: string | string[]): void {
    this.currentRoles = roles;

    // Normalizar roles a array
    const rolesArray = Array.isArray(roles) ? roles : [roles];

    // Verificar si el usuario tiene alguno de los roles
    const hasRequiredRole = rolesArray.some(role => this.authService.hasRole(role));

    if (hasRequiredRole && !this.hasView) {
      // Mostrar el elemento
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRequiredRole && this.hasView) {
      // Ocultar el elemento
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
