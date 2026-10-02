import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AdminCursosService } from './admin-cursos.service';
import { CursoFormComponent } from './curso-form.component';

describe('CursoFormComponent', () => {
  it('cierra sesion con AuthService', () => {
    const auth = { logout: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CursoFormComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: AdminCursosService, useValue: {} },
      ],
    });
    TestBed.overrideTemplate(CursoFormComponent, '');

    TestBed.createComponent(CursoFormComponent).componentInstance.onLogout();

    expect(auth.logout).toHaveBeenCalledWith(true);
  });
});
