import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  // Estados compartidos usando signals
  private _isSidebarOpen = signal<boolean>(false);
  private _isUserMenuOpen = signal<boolean>(false);

  // Getters públicos
  get isSidebarOpen() {
    return this._isSidebarOpen.asReadonly();
  }

  get isUserMenuOpen() {
    return this._isUserMenuOpen.asReadonly();
  }

  // Métodos para cambiar el estado
  toggleSidebar(): void {
    this._isSidebarOpen.update(current => !current);
  }

  setSidebarOpen(isOpen: boolean): void {
    this._isSidebarOpen.set(isOpen);
  }

  closeSidebar(): void {
    this._isSidebarOpen.set(false);
  }

  toggleUserMenu(): void {
    this._isUserMenuOpen.update(current => !current);
  }

  setUserMenuOpen(isOpen: boolean): void {
    this._isUserMenuOpen.set(isOpen);
  }

  closeUserMenu(): void {
    this._isUserMenuOpen.set(false);
  }

  // Cerrar todos los menús
  closeAllMenus(): void {
    this._isSidebarOpen.set(false);
    this._isUserMenuOpen.set(false);
  }
}
