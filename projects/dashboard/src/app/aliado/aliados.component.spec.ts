import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';
import { AliadoEstrategico } from './aliado.interface';
import { AliadoService } from './aliado.service';
import { AliadosComponent } from './aliados.component';

const aliado = { id: 3, nombre: 'Aliado', nit: '900', correo: 'a@x.co', activo: true } as AliadoEstrategico;

describe('AliadosComponent', () => {
  function setup(service: Record<string, unknown> = {}) {
    const toast = { error: vi.fn(), success: vi.fn() };
    const aliados = {
      getAll: vi.fn(() => of([aliado])),
      create: vi.fn(() => of(aliado)),
      update: vi.fn(() => of(aliado)),
      delete: vi.fn(() => of(void 0)),
      activate: vi.fn(() => of(aliado)),
      ...service,
    };
    TestBed.configureTestingModule({
      imports: [AliadosComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasRole: () => true, logout: vi.fn() } },
        { provide: AliadoService, useValue: aliados },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(AliadosComponent, '');
    const fixture = TestBed.createComponent(AliadosComponent);
    fixture.detectChanges();
    return { cmp: fixture.componentInstance, toast, aliados };
  }

  it('si falla la carga avisa con el snackbar', () => {
    const { toast } = setup({ getAll: vi.fn(() => throwError(() => ({}))) });
    expect(toast.error).toHaveBeenCalledWith('Error al cargar aliados');
  });

  it('la validacion del modal se queda en el modal', () => {
    const { cmp, toast, aliados } = setup();
    cmp.openCreateModal();
    cmp.save();

    expect(cmp.showModal).toBe(true);
    expect(cmp.error).toBe('El nombre es requerido');
    expect(aliados.create).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('crear y editar bien cierran el modal y avisan con el snackbar', () => {
    const { cmp, toast } = setup();
    cmp.openCreateModal();
    cmp.formData = { ...cmp.formData, nombre: 'Nuevo', nit: '901', correo: 'n@x.co' };
    cmp.save();
    expect(toast.success).toHaveBeenCalledWith('Aliado creado exitosamente');
    expect(cmp.showModal).toBe(false);

    cmp.openEditModal(aliado);
    cmp.save();
    expect(toast.success).toHaveBeenLastCalledWith('Aliado actualizado exitosamente');
  });

  it('si falla guardar el error queda en el modal abierto', () => {
    const { cmp, toast } = setup({ create: vi.fn(() => throwError(() => ({ message: 'Ya existe' }))) });
    cmp.openCreateModal();
    cmp.formData = { ...cmp.formData, nombre: 'Nuevo', nit: '901', correo: 'n@x.co' };
    cmp.save();

    expect(cmp.showModal).toBe(true);
    expect(cmp.error).toBe('Ya existe');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('activar avisa con el snackbar; si falla, el error tambien va al snackbar', () => {
    const ok = setup();
    ok.cmp.activar(aliado);
    expect(ok.toast.success).toHaveBeenCalledWith('Aliado activado exitosamente');

    TestBed.resetTestingModule();
    const ko = setup({ activate: vi.fn(() => throwError(() => ({}))) });
    ko.cmp.activar(aliado);
    expect(ko.toast.error).toHaveBeenCalledWith('Error al activar aliado');
    expect(ko.cmp.loading).toBe(false);
  });

  it('desactivar (tras confirmar) avisa con el snackbar', () => {
    const { cmp, toast } = setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    cmp.desactivar(aliado);
    expect(toast.success).toHaveBeenCalledWith('Aliado desactivado exitosamente');
  });
});
