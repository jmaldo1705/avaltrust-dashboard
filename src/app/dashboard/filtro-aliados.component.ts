import { Component, inject, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

export interface AliadoEstrategico {
  id: number;
  nombre: string;
  nit: string;
  activo: boolean;
}

export interface FiltroAliadosEvent {
  aliadoIds: number[] | null;  // null = "Todos"
  isAllSelected: boolean;
}

@Component({
  selector: 'app-filtro-aliados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filtro-aliados-container">
      <div class="filtro-header">
        <label class="filtro-label">
          <span class="filtro-icon">🏢</span>
          Filtrar por Aliado Estratégico
        </label>
        <span class="filtro-count" *ngIf="!isAllSelected && selectedIds.size > 0">
          {{ selectedIds.size }} seleccionado{{ selectedIds.size > 1 ? 's' : '' }}
        </span>
      </div>

      <div class="filtro-dropdown" [class.open]="isDropdownOpen">
        <button 
          type="button"
          class="filtro-toggle"
          (click)="toggleDropdown()">
          <span class="toggle-text">
            {{ getSelectedText() }}
          </span>
          <span class="toggle-arrow" [class.open]="isDropdownOpen">▼</span>
        </button>

        <div class="filtro-menu" *ngIf="isDropdownOpen" (click)="$event.stopPropagation()">
          <!-- Barra de búsqueda -->
          <div class="filtro-search">
            <input
              type="text"
              class="search-input"
              placeholder="Buscar aliado..."
              [(ngModel)]="searchTerm"
              (ngModelChange)="filterAliados()">
            <span class="search-icon">🔍</span>
          </div>

          <!-- Opción "Todos" -->
          <div class="filtro-option all-option">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [checked]="isAllSelected"
                (change)="selectAll()">
              <span class="checkbox-text strong">Todos los Aliados</span>
            </label>
          </div>

          <div class="filtro-divider"></div>

          <!-- Lista de aliados -->
          <div class="filtro-options" *ngIf="filteredAliados.length > 0">
            <div class="filtro-option" *ngFor="let aliado of filteredAliados">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [checked]="selectedIds.has(aliado.id)"
                  [disabled]="isAllSelected"
                  (change)="toggleAliado(aliado.id)">
                <span class="checkbox-text" [class.disabled]="isAllSelected">
                  {{ aliado.nombre }}
                  <span class="aliado-nit">{{ aliado.nit }}</span>
                </span>
              </label>
            </div>
          </div>

          <div class="filtro-empty" *ngIf="filteredAliados.length === 0">
            <span class="empty-icon">🔍</span>
            <p>No se encontraron aliados</p>
          </div>

          <!-- Botones de acción -->
          <div class="filtro-actions">
            <button 
              type="button"
              class="btn-action btn-clear"
              (click)="clearAll()"
              [disabled]="selectedIds.size === 0 && isAllSelected">
              Limpiar
            </button>
            <button 
              type="button"
              class="btn-action btn-apply"
              (click)="applyFilter()">
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filtro-aliados-container {
      margin-bottom: 0;
    }

    .filtro-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .filtro-label {
      display: flex;
      align-items: center;
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.9rem;
    }

    .filtro-icon {
      margin-right: 0.4rem;
      font-size: 1rem;
    }

    .filtro-count {
      background: #3498db;
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .filtro-dropdown {
      position: relative;
      width: 100%;
      max-width: 380px;
    }

    .filtro-toggle {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.9rem;
      background: white;
      border: 1.5px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .filtro-toggle:hover {
      border-color: #3498db;
      box-shadow: 0 2px 4px rgba(52, 152, 219, 0.1);
    }

    .filtro-dropdown.open .filtro-toggle {
      border-color: #3498db;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    .toggle-text {
      color: #2c3e50;
      font-weight: 500;
    }

    .toggle-arrow {
      color: #7f8c8d;
      font-size: 0.75rem;
      transition: transform 0.2s ease;
    }

    .toggle-arrow.open {
      transform: rotate(180deg);
    }

    .filtro-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1.5px solid #3498db;
      border-top: none;
      border-radius: 0 0 6px 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      max-height: 350px;
      display: flex;
      flex-direction: column;
    }

    .filtro-search {
      position: relative;
      padding: 0.65rem;
      border-bottom: 1px solid #ecf0f1;
    }

    .search-input {
      width: 100%;
      padding: 0.45rem 2rem 0.45rem 0.7rem;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      font-size: 0.85rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #3498db;
    }

    .search-icon {
      position: absolute;
      right: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .filtro-divider {
      height: 1px;
      background: #ecf0f1;
      margin: 0;
    }

    .filtro-options {
      overflow-y: auto;
      max-height: 240px;
      padding: 0.5rem 0;
    }

    .filtro-option {
      padding: 0.5rem 0.75rem;
      transition: background 0.15s ease;
    }

    .filtro-option:hover {
      background: #f8f9fa;
    }

    .filtro-option.all-option {
      background: #ecf0f1;
      border-bottom: 2px solid #bdc3c7;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-label input[type="checkbox"] {
      margin-right: 0.75rem;
      cursor: pointer;
      width: 18px;
      height: 18px;
    }

    .checkbox-label input[type="checkbox"]:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .checkbox-text {
      font-size: 0.9rem;
      color: #2c3e50;
      display: flex;
      flex-direction: column;
    }

    .checkbox-text.strong {
      font-weight: 600;
      color: #2c3e50;
    }

    .checkbox-text.disabled {
      color: #95a5a6;
    }

    .aliado-nit {
      font-size: 0.8rem;
      color: #7f8c8d;
      margin-top: 0.15rem;
    }

    .filtro-empty {
      padding: 2rem 1rem;
      text-align: center;
      color: #7f8c8d;
    }

    .empty-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .filtro-empty p {
      margin: 0;
      font-size: 0.9rem;
    }

    .filtro-actions {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      border-top: 1px solid #ecf0f1;
      background: #f8f9fa;
    }

    .btn-action {
      flex: 1;
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-clear {
      background: #ecf0f1;
      color: #2c3e50;
    }

    .btn-clear:hover:not(:disabled) {
      background: #bdc3c7;
    }

    .btn-clear:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-apply {
      background: #3498db;
      color: white;
    }

    .btn-apply:hover {
      background: #2980b9;
    }

    @media (max-width: 768px) {
      .filtro-menu {
        max-height: 300px;
      }

      .filtro-options {
        max-height: 180px;
      }
    }
  `]
})
export class FiltroAliadosComponent implements OnInit {
  private http = inject(HttpClient);

  @Input() autoLoad = true;
  @Output() selectionChange = new EventEmitter<FiltroAliadosEvent>();

  aliados: AliadoEstrategico[] = [];
  filteredAliados: AliadoEstrategico[] = [];
  selectedIds: Set<number> = new Set();
  isAllSelected = true;
  isDropdownOpen = false;
  searchTerm = '';
  isLoading = false;

  ngOnInit() {
    if (this.autoLoad) {
      this.loadAliados();
    }
    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', this.closeDropdownOnClickOutside.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.closeDropdownOnClickOutside.bind(this));
  }

  closeDropdownOnClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filtro-dropdown')) {
      this.isDropdownOpen = false;
    }
  }

  loadAliados() {
    this.isLoading = true;
    this.http.get<AliadoEstrategico[]>(`${environment.apiUrl}/api/aliados-estrategicos/activos`)
      .subscribe({
        next: (data) => {
          this.aliados = data;
          this.filteredAliados = [...this.aliados];
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar aliados:', err);
          this.isLoading = false;
        }
      });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.searchTerm = '';
      this.filterAliados();
    }
  }

  filterAliados() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredAliados = [...this.aliados];
    } else {
      this.filteredAliados = this.aliados.filter(a =>
        a.nombre.toLowerCase().includes(term) ||
        a.nit.toLowerCase().includes(term)
      );
    }
  }

  toggleAliado(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
      this.isAllSelected = false;
    }
  }

  selectAll() {
    this.isAllSelected = !this.isAllSelected;
    if (this.isAllSelected) {
      this.selectedIds.clear();
    }
  }

  clearAll() {
    this.selectedIds.clear();
    this.isAllSelected = false;
  }

  applyFilter() {
    const event: FiltroAliadosEvent = {
      aliadoIds: this.isAllSelected ? null : Array.from(this.selectedIds),
      isAllSelected: this.isAllSelected
    };
    this.selectionChange.emit(event);
    this.isDropdownOpen = false;
  }

  getSelectedText(): string {
    if (this.isAllSelected) {
      return 'Todos los Aliados';
    }
    if (this.selectedIds.size === 0) {
      return 'Seleccione aliados...';
    }
    if (this.selectedIds.size === 1) {
      const id = Array.from(this.selectedIds)[0];
      const aliado = this.aliados.find(a => a.id === id);
      return aliado ? aliado.nombre : '1 aliado seleccionado';
    }
    return `${this.selectedIds.size} aliados seleccionados`;
  }
}
