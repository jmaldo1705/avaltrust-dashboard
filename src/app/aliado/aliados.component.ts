import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AliadoService } from './aliado.service';
import { AliadoEstrategico, AliadoEstrategicoRequest } from './aliado.interface';
import { AuthService } from '../auth/auth.service';
import { HasRoleDirective } from '../auth/has-role.directive';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { UiStateService } from '../ui-state.service';

/**
 * Componente para gestión de Aliados Estratégicos
 * Solo accesible por administradores
 */
@Component({
  selector: 'app-aliados',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './aliados.component.html',
  styleUrls: ['./aliados.component.css']
})
export class AliadosComponent implements OnInit {
  private aliadoService = inject(AliadoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private uiState = inject(UiStateService);

  // Estado
  aliados: AliadoEstrategico[] = [];
  loading = false;
  error = '';
  successMessage = '';
  
  // Estados de UI usando el servicio compartido
  get isSidebarOpen() {
    return this.uiState.isSidebarOpen();
  }

  get isUserMenuOpen() {
    return this.uiState.isUserMenuOpen();
  }

  // Filtros
  searchTerm = '';
  mostrarInactivos = false;

  // Modal
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  currentAliado: AliadoEstrategico | null = null;

  // Formulario
  formData: AliadoEstrategicoRequest = this.getEmptyForm();

  ngOnInit(): void {
    // Verificar que es admin
    if (!this.authService.hasRole('ROLE_ADMIN')) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadAliados();
  }

  /**
   * Cargar lista de aliados
   */
  loadAliados(): void {
    this.loading = true;
    this.error = '';

    this.aliadoService.getAll().subscribe({
      next: (data) => {
        this.aliados = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar aliados';
        this.loading = false;
      }
    });
  }

  /**
   * Aliados filtrados
   */
  get aliadosFiltrados(): AliadoEstrategico[] {
    return this.aliados.filter(a => {
      const matchSearch = !this.searchTerm ||
        a.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.nit.includes(this.searchTerm) ||
        a.correo.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchActivo = this.mostrarInactivos || a.activo;

      return matchSearch && matchActivo;
    });
  }

  /**
   * Abrir modal para crear
   */
  openCreateModal(): void {
    this.modalMode = 'create';
    this.currentAliado = null;
    this.formData = this.getEmptyForm();
    this.showModal = true;
    this.error = '';
    this.successMessage = '';
  }

  /**
   * Abrir modal para editar
   */
  openEditModal(aliado: AliadoEstrategico): void {
    this.modalMode = 'edit';
    this.currentAliado = aliado;
    this.formData = {
      nombre: aliado.nombre,
      nit: aliado.nit,
      correo: aliado.correo,
      direccion: aliado.direccion,
      telefono: aliado.telefono,
      activo: aliado.activo,
      observaciones: aliado.observaciones,
      porcentajeCapitalizacion: aliado.porcentajeCapitalizacion || 100
    };
    this.showModal = true;
    this.error = '';
    this.successMessage = '';
  }

  /**
   * Cerrar modal
   */
  closeModal(): void {
    this.showModal = false;
    this.currentAliado = null;
    this.formData = this.getEmptyForm();
  }

  /**
   * Manejar click en el overlay (solo cerrar si se hace click directamente en el overlay)
   */
  onOverlayClick(event: MouseEvent): void {
    // Solo cerrar si el click fue directamente en el overlay, no en sus hijos
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  /**
   * Guardar (crear o actualizar)
   */
  save(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';

    const request$ = this.modalMode === 'create'
      ? this.aliadoService.create(this.formData)
      : this.aliadoService.update(this.currentAliado!.id, this.formData);

    request$.subscribe({
      next: () => {
        this.successMessage = this.modalMode === 'create'
          ? 'Aliado creado exitosamente'
          : 'Aliado actualizado exitosamente';
        this.closeModal();
        this.loadAliados();
        this.loading = false;

        // Ocultar mensaje después de 3 segundos
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al guardar aliado';
        this.loading = false;
      }
    });
  }

  /**
   * Desactivar aliado
   */
  desactivar(aliado: AliadoEstrategico): void {
    if (!confirm(`¿Está seguro de desactivar el aliado "${aliado.nombre}"?`)) {
      return;
    }

    this.loading = true;
    this.aliadoService.delete(aliado.id).subscribe({
      next: () => {
        this.successMessage = 'Aliado desactivado exitosamente';
        this.loadAliados();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al desactivar aliado';
        this.loading = false;
      }
    });
  }

  /**
   * Activar aliado
   */
  activar(aliado: AliadoEstrategico): void {
    this.loading = true;
    this.aliadoService.activate(aliado.id).subscribe({
      next: () => {
        this.successMessage = 'Aliado activado exitosamente';
        this.loadAliados();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = err.message || 'Error al activar aliado';
        this.loading = false;
      }
    });
  }

  /**
   * Validar formulario
   */
  private validateForm(): boolean {
    if (!this.formData.nombre?.trim()) {
      this.error = 'El nombre es requerido';
      return false;
    }
    if (!this.formData.nit?.trim()) {
      this.error = 'El NIT es requerido';
      return false;
    }
    if (!this.formData.correo?.trim()) {
      this.error = 'El correo es requerido';
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.correo)) {
      this.error = 'El correo no es válido';
      return false;
    }

    return true;
  }

  /**
   * Formulario vacío
   */
  private getEmptyForm(): AliadoEstrategicoRequest {
    return {
      nombre: '',
      nit: '',
      correo: '',
      direccion: '',
      telefono: '',
      activo: true,
      observaciones: '',
      porcentajeCapitalizacion: 100
    };
  }

  /**
   * Método de navegación del sidebar
   */
  onSidebarNavigate(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Cerrar sidebar (para compatibilidad con componentes que lo usan)
   */
  onSidebarClose(): void {
    this.uiState.closeSidebar();
  }

  /**
   * Métodos para controlar el sidebar usando UiStateService
   */
  toggleSidebar() {
    this.uiState.toggleSidebar();
  }

  closeSidebar() {
    this.uiState.closeSidebar();
  }

  /**
   * Métodos para controlar el menú de usuario usando UiStateService
   */
  toggleUserMenu() {
    this.uiState.toggleUserMenu();
  }

  closeUserMenu() {
    this.uiState.closeUserMenu();
  }

  /**
   * Navegación principal
   */
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  /**
   * Métodos de navegación del header
   */
  onHeaderNavigate(route: string) {
    this.navigateTo(route);
  }

  /**
   * Método de logout
   */
  logout() {
    this.uiState.closeAllMenus();
    this.authService.logout(true);
  }
}
