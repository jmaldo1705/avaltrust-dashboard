import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AliadoService } from '../../aliado/aliado.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { UsersComponent } from './users.component';
import { AppUser, UsersService } from './users.service';

const user = (id: number, enabled = true) => ({ id, username: `u${id}`, email: `u${id}@x.co`, roles: ['ROLE_USER'], enabled }) as AppUser;

describe('UsersComponent', () => {
  function setup(service: Record<string, unknown> = {}) {
    const toast = { error: vi.fn(), success: vi.fn() };
    const users = {
      getAllUsers: vi.fn(() => of([user(1), user(2, false)])),
      createUser: vi.fn(() => of({ id: 9, username: 'nuevo' })),
      updateUser: vi.fn(() => of({})),
      updateUserRoles: vi.fn(() => of({})),
      toggleUserStatus: vi.fn(() => of({})),
      ...service,
    };
    TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { userProfile: signal(null), logout: vi.fn() } },
        { provide: AliadoService, useValue: { getActivos: () => of([]), getAll: () => of([]) } },
        { provide: UsersService, useValue: users },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(UsersComponent, '');
    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    return { cmp: fixture.componentInstance, toast, users };
  }

  it('si falla la carga avisa con el snackbar (mensaje del backend o el de siempre)', () => {
    const { toast } = setup({ getAllUsers: vi.fn(() => throwError(() => ({}))) });
    expect(toast.error).toHaveBeenCalledWith('Error cargando usuarios');
  });

  it('crear con datos invalidos deja el error en el modal y no usa el snackbar', () => {
    const { cmp, toast, users } = setup();
    cmp.openCreateModal();
    cmp.saveUser();

    expect(cmp.showEditModal).toBe(true);
    expect(cmp.errorMessage).toBe('El nombre de usuario y el email son obligatorios');
    expect(users.createUser).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('crear bien cierra el modal y avisa con el snackbar', () => {
    const { cmp, toast } = setup();
    cmp.openCreateModal();
    cmp.editUserForm = { ...cmp.editUserForm, username: 'nuevo', email: 'nuevo@x.co', password: 'secreta1', confirmPassword: 'secreta1' };
    cmp.saveUser();

    expect(cmp.showEditModal).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('Usuario "nuevo" creado exitosamente');
  });

  it('si falla crear el error se queda en el modal abierto', () => {
    const { cmp, toast } = setup({ createUser: vi.fn(() => throwError(() => ({ error: { message: 'Ya existe' } }))) });
    cmp.openCreateModal();
    cmp.editUserForm = { ...cmp.editUserForm, username: 'nuevo', email: 'nuevo@x.co', password: 'secreta1', confirmPassword: 'secreta1' };
    cmp.saveUser();

    expect(cmp.showEditModal).toBe(true);
    expect(cmp.errorMessage).toBe('Ya existe');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('activar o desactivar bien avisa con el snackbar; si falla, el error queda en la confirmacion', () => {
    const ok = setup();
    ok.cmp.openDeleteModal(user(1));
    ok.cmp.confirmDelete();
    expect(ok.toast.success).toHaveBeenCalledWith('Usuario "u1" desactivado correctamente');
    expect(ok.cmp.showDeleteModal).toBe(false);

    TestBed.resetTestingModule();
    const ko = setup({ toggleUserStatus: vi.fn(() => throwError(() => ({}))) });
    ko.cmp.openDeleteModal(user(2, false));
    ko.cmp.confirmDelete();
    expect(ko.cmp.showDeleteModal).toBe(true);
    expect(ko.cmp.errorMessage).toBe('No se pudo activar el usuario');
    expect(ko.toast.error).not.toHaveBeenCalled();
  });
});
