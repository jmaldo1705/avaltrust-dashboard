import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { UiStateService } from '../../ui-state.service';
import { AuthService } from '../../auth/auth.service';
import { UsersService, AppUser } from './users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  private router = inject(Router);
  private uiState = inject(UiStateService);
  private auth = inject(AuthService);
  private usersService = inject(UsersService);

  userProfile = this.auth.userProfile;

  // Sidebar and user menu states via shared service
  get isSidebarOpen() { return this.uiState.isSidebarOpen(); }
  get isUserMenuOpen() { return this.uiState.isUserMenuOpen(); }

  // Local UI state
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Data + filters (usando signals para reactividad)
  users = signal<AppUser[]>([]);
  filterText = signal('');
  roleFilter = signal<string>('all');
  statusFilter = signal<'all' | 'enabled' | 'disabled'>('all');

  // Sorting
  sortBy = signal<keyof AppUser | 'id'>('id');
  sortDir = signal<'asc' | 'desc'>('asc');

  // Pagination
  page = signal(1);
  pageSize = 10;

  // Modal para editar roles
  showRolesModal = false;
  selectedUser: AppUser | null = null;
  selectedRoles: string[] = [];

  // Modal para crear usuario
  showCreateModal = false;
  newUserForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  // Roles disponibles en el sistema
  availableRoles = [
    { value: 'ROLE_USER', label: 'Usuario' },
    { value: 'ROLE_ADMIN', label: 'Administrador' }
  ];

  // Getters/Setters para ngModel
  get filterTextValue() { return this.filterText(); }
  set filterTextValue(value: string) { this.filterText.set(value); }

  get roleFilterValue() { return this.roleFilter(); }
  set roleFilterValue(value: string) { this.roleFilter.set(value); }

  get statusFilterValue() { return this.statusFilter(); }
  set statusFilterValue(value: 'all' | 'enabled' | 'disabled') { this.statusFilter.set(value); }

  // Derived lists
  filteredUsers = computed(() => {
    const term = this.filterText().trim().toLowerCase();
    const roleFilter = this.roleFilter();
    const statusFilter = this.statusFilter();
    let list = [...this.users()];

    if (term) {
      list = list.filter((u: AppUser) =>
        (u.username || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      );
    }

    if (roleFilter !== 'all') {
      list = list.filter((u: AppUser) => (u.roles || []).includes(roleFilter));
    }

    if (statusFilter !== 'all') {
      const desired = statusFilter === 'enabled';
      list = list.filter((u: AppUser) => !!u.enabled === desired);
    }

    return list;
  });

  sortedUsers = computed(() => {
    const list = [...this.filteredUsers()];
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const key = this.sortBy();
    return list.sort((a: any, b: any) => {
      const va = (a?.[key] ?? '').toString().toLowerCase();
      const vb = (b?.[key] ?? '').toString().toLowerCase();
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedUsers().length / this.pageSize)));

  pagedUsers = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.sortedUsers().slice(start, start + this.pageSize);
  });

  ngOnInit() {
    this.loadUsers();
  }

  // Sidebar controls
  onSidebarNavigate(route: string) { this.navigateTo(route); }
  onSidebarClose() { this.uiState.closeSidebar(); }
  toggleSidebar() { this.uiState.toggleSidebar(); }
  closeSidebar() { this.uiState.closeSidebar(); }

  // Header user-menu controls
  toggleUserMenu() { this.uiState.toggleUserMenu(); }
  closeUserMenu() { this.uiState.closeUserMenu(); }

  // Logout from header
  logout() {
    this.uiState.closeAllMenus();
    this.auth.logout(true);
  }

  navigateTo(route: string) { this.router.navigate([route]); }

  // CRUD methods
  loadUsers() {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.usersService.getAllUsers().subscribe({
      next: (data: AppUser[]) => {
        this.users.set(data || []);
        this.isLoading = false;
        this.page.set(1); // reset pagination to first page on load
      },
      error: (err: any) => {
        console.error('Error loading users', err);
        this.errorMessage = this.getErrorMessage(err) || 'Error cargando usuarios';
        this.isLoading = false;
      }
    });
  }

  openCreateModal() {
    this.newUserForm = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    this.showCreateModal = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newUserForm = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
  }

  createUser() {
    this.errorMessage = null;
    this.successMessage = null;

    // Validaciones
    if (!this.newUserForm.username || !this.newUserForm.email || !this.newUserForm.password) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    if (this.newUserForm.username.length < 3) {
      this.errorMessage = 'El nombre de usuario debe tener al menos 3 caracteres';
      return;
    }

    if (this.newUserForm.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.newUserForm.password !== this.newUserForm.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newUserForm.email)) {
      this.errorMessage = 'El formato del email no es válido';
      return;
    }

    this.isLoading = true;
    const payload = {
      username: this.newUserForm.username.trim(),
      email: this.newUserForm.email.trim(),
      password: this.newUserForm.password
    };

    this.usersService.createUser(payload).subscribe({
      next: (response) => {
        this.successMessage = `Usuario "${response.username}" creado exitosamente`;
        this.closeCreateModal();
        this.loadUsers(); // Recargar la lista
      },
      error: (err: any) => {
        console.error('Error creating user', err);
        this.errorMessage = this.getErrorMessage(err) || 'No se pudo crear el usuario';
        this.isLoading = false;
      }
    });
  }

  openEditRoles(user: AppUser) {
    this.selectedUser = user;
    this.selectedRoles = [...user.roles]; // copia de los roles actuales
    this.showRolesModal = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  closeRolesModal() {
    this.showRolesModal = false;
    this.selectedUser = null;
    this.selectedRoles = [];
  }

  toggleRole(role: string) {
    const index = this.selectedRoles.indexOf(role);
    if (index > -1) {
      this.selectedRoles.splice(index, 1);
    } else {
      this.selectedRoles.push(role);
    }
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles.includes(role);
  }

  saveRoles() {
    if (!this.selectedUser) return;

    if (this.selectedRoles.length === 0) {
      this.errorMessage = 'Debe seleccionar al menos un rol';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.usersService.updateUserRoles(this.selectedUser.id, this.selectedRoles).subscribe({
      next: (updatedUser: AppUser) => {
        this.successMessage = 'Roles actualizados correctamente';
        this.closeRolesModal();
        this.loadUsers();
      },
      error: (err: any) => {
        console.error('Error updating roles', err);
        this.errorMessage = this.getErrorMessage(err) || 'No se pudieron actualizar los roles';
        this.isLoading = false;
      }
    });
  }

  // Modal de confirmación para desactivar/activar
  showDeleteModal = false;
  userToDelete: AppUser | null = null;

  openDeleteModal(user: AppUser, mode: 'disable' = 'disable') {
    this.userToDelete = user;
    this.showDeleteModal = true;
    this.errorMessage = null;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    this.toggleUserStatus(this.userToDelete);
  }

  toggleUserStatus(user: AppUser) {
    const newStatus = !user.enabled;
    const action = newStatus ? 'activar' : 'desactivar';
    
    this.isLoading = true;
    this.errorMessage = null;
    
    this.usersService.toggleUserStatus(user.id, newStatus).subscribe({
      next: (updatedUser: AppUser) => {
        this.successMessage = `Usuario "${user.username}" ${newStatus ? 'activado' : 'desactivado'} correctamente`;
        this.closeDeleteModal();
        this.loadUsers();
      },
      error: (err: any) => {
        console.error('Error toggling user status', err);
        this.errorMessage = this.getErrorMessage(err) || `No se pudo ${action} el usuario`;
        this.isLoading = false;
      }
    });
  }

  setSort(field: keyof AppUser | 'id') {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
  }

  goToPage(p: number) {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page.set(p);
  }

  nextPage() { this.goToPage(this.page() + 1); }
  prevPage() { this.goToPage(this.page() - 1); }

  // Simple error extraction
  private getErrorMessage(err: any): string | null {
    if (!err) return null;
    if (typeof err === 'string') return err;
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (err.error.message) return err.error.message;
      if (Array.isArray(err.error.errors)) return err.error.errors.join(', ');
    }
    if (err.message) return err.message;
    return null;
  }

  // Formatea el nombre del rol para mostrarlo de manera amigable
  formatRole(role: string): string {
    const clean = (role || '').replace(/^ROLE_/i, '');
    switch (clean.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'supervisor': return 'Supervisor';
      case 'analyst': return 'Analista';
      case 'user': return 'Usuario';
      case 'guest': return 'Invitado';
      default:
        return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  }
}
