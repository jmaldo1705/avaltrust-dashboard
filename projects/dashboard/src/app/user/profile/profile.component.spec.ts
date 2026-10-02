import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  function setup(auth: Record<string, unknown> = {}) {
    const toast = { error: vi.fn(), success: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            userProfile: signal(null),
            user: signal(null),
            userPermissions: signal(null),
            getUserProfile: vi.fn(() => of({})),
            getUserPermissions: vi.fn(() => of({})),
            changePassword: vi.fn(() => of({})),
            logout: vi.fn(),
            ...auth,
          },
        },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(ProfileComponent, '');
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    return { cmp: fixture.componentInstance, toast };
  }

  it('si falla la carga del perfil avisa con el snackbar', () => {
    const { toast } = setup({ getUserProfile: vi.fn(() => throwError(() => new Error('500'))) });
    expect(toast.error).toHaveBeenCalledWith('No fue posible cargar la informacion del perfil.');
  });

  it('cambiar la contrasena bien cierra el formulario y avisa con el snackbar', () => {
    const { cmp, toast } = setup();
    cmp.togglePasswordForm();
    cmp.currentPassword = 'anterior1';
    cmp.newPassword = 'nueva123';
    cmp.confirmPassword = 'nueva123';
    cmp.submitPasswordChange();

    expect(toast.success).toHaveBeenCalledWith('Contrasena actualizada correctamente.');
    expect(cmp.isPasswordFormOpen).toBe(false);
  });

  it('los errores del cambio de contrasena se quedan en el formulario', () => {
    const { cmp, toast } = setup({ changePassword: vi.fn(() => throwError(() => ({ message: 'Clave actual incorrecta' }))) });
    cmp.togglePasswordForm();
    cmp.submitPasswordChange();
    expect(cmp.passwordError).toBe('Completa todos los campos para actualizar la contrasena.');

    cmp.currentPassword = 'anterior1';
    cmp.newPassword = 'nueva123';
    cmp.confirmPassword = 'nueva123';
    cmp.submitPasswordChange();
    expect(cmp.passwordError).toBe('Clave actual incorrecta');
    expect(cmp.isPasswordFormOpen).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
