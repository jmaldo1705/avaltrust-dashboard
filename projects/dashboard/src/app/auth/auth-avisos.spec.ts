import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from '../login/login.component';
import { ToastService } from '../services/toast.service';
import { AuthService } from './auth.service';
import { ChangePasswordComponent } from './change-password.component';
import { ResetPasswordComponent } from './reset-password.component';

// Avisos de exito de auth: pasan del banner al snackbar, que sigue visible tras la navegacion.
describe('Avisos de exito de auth', () => {
  function setup<T>(component: Type<T>, auth: Record<string, unknown>, query: Record<string, string> = {}) {
    const toast = { error: vi.fn(), success: vi.fn(), remove: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
        { provide: AuthService, useValue: { isAuthenticated: () => false, user: () => ({ username: 'admin' }), ...auth } },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(component, '');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const cmp = TestBed.createComponent(component).componentInstance;
    return { toast, navigate, cmp };
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('cambiar contrasena: snackbar al terminar y la misma redireccion de siempre', () => {
    const { toast, navigate, cmp } = setup(ChangePasswordComponent, { changePassword: vi.fn(() => of({})) });
    cmp.currentPassword = 'anterior1';
    cmp.newPassword = 'nueva123';
    cmp.confirmPassword = 'nueva123';
    cmp.onSubmit();

    expect(toast.success).toHaveBeenCalledWith('Contrasena actualizada exitosamente');
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(navigate).toHaveBeenCalledWith(['/user/profile']);
  });

  it('restablecer contrasena: snackbar con el mensaje del backend y luego /login?reset=success', () => {
    const { toast, navigate, cmp } = setup(ResetPasswordComponent, { resetPassword: vi.fn(() => of({ message: '' })) }, { token: 't' });
    cmp.newPassword = 'nueva123';
    cmp.confirmPassword = 'nueva123';
    cmp.onSubmit();

    expect(toast.success).toHaveBeenCalledWith('Contraseña actualizada exitosamente.');
    vi.advanceTimersByTime(1600);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reset: 'success' } });
  });

  it('login con ?reset=success: el aviso sale en el snackbar y se quita al enviar el formulario', () => {
    const { toast, cmp } = setup(LoginComponent, {}, { reset: 'success' });

    expect(toast.success).toHaveBeenCalledWith('Contraseña actualizada. Ya puedes iniciar sesión.');
    cmp.onSubmit(); // sin usuario: error en linea
    expect(toast.remove).toHaveBeenCalledTimes(1);
    cmp.onSubmit();
    expect(toast.remove).toHaveBeenCalledTimes(1);
  });

  it('login sin ?reset=success no muestra aviso', () => {
    const { toast, cmp } = setup(LoginComponent, {});
    cmp.onSubmit();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.remove).not.toHaveBeenCalled();
  });
});
