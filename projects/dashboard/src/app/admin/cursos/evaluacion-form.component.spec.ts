import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AdminCursosService } from './admin-cursos.service';
import { EvaluacionFormComponent } from './evaluacion-form.component';

describe('EvaluacionFormComponent', () => {
  it('cierra sesion con AuthService', () => {
    const auth = { logout: vi.fn() };
    TestBed.configureTestingModule({
      imports: [EvaluacionFormComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: AdminCursosService, useValue: {} },
      ],
    });
    TestBed.overrideTemplate(EvaluacionFormComponent, '');

    TestBed.createComponent(EvaluacionFormComponent).componentInstance.onLogout();

    expect(auth.logout).toHaveBeenCalledWith(true);
  });
});
