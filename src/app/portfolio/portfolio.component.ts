import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '../auth/auth.service';
import { UiStateService } from '../ui-state.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private uiState = inject(UiStateService);

  // Estados de UI usando el servicio compartido
  get isSidebarOpen() {
    return this.uiState.isSidebarOpen();
  }

  get isUserMenuOpen() {
    return this.uiState.isUserMenuOpen();
  }

  // Propiedades del componente
  activeTab: 'form' | 'upload' = 'form';
  portfolioForm!: FormGroup;
  isLoading = false;
  uploadedFile: File | null = null;
  uploadResult: any = null;

  // Opciones para los selects
  documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'NIT', label: 'NIT' },
    { value: 'TI', label: 'Tarjeta de Identidad' }
  ];

  clientTypes = [
    { value: 'NATURAL', label: 'Persona Natural' },
    { value: 'JURIDICA', label: 'Persona Jurídica' }
  ];

  creditStates = [
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'VENCIDO', label: 'Vencido' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'CASTIGADO', label: 'Castigado' }
  ];

  ngOnInit() {
    this.initializeForm();
    this.loadFormOptions();
  }

  // Métodos de navegación del sidebar
  onSidebarNavigate(route: string) {
    this.navigateTo(route);
  }

  onSidebarClose() {
    this.uiState.closeSidebar();
  }

  // Métodos de navegación del header
  onHeaderNavigate(route: string) {
    this.navigateTo(route);
  }

  // Métodos para controlar el sidebar
  toggleSidebar() {
    this.uiState.toggleSidebar();
  }

  closeSidebar() {
    this.uiState.closeSidebar();
  }

  // Métodos para controlar el menú de usuario
  toggleUserMenu() {
    this.uiState.toggleUserMenu();
  }

  closeUserMenu() {
    this.uiState.closeUserMenu();
  }

  // Navegación principal
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.uiState.closeAllMenus();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // Métodos específicos del componente
  initializeForm() {
    this.portfolioForm = this.fb.group({
      obligacion: ['', [Validators.required]],
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      tipoCliente: ['', [Validators.required]],
      fechaDesembolso: ['', [Validators.required]],
      plazoInicial: ['', [Validators.required, Validators.min(1), Validators.max(360)]],
      valorDesembolso: ['', [Validators.required, Validators.min(0.01)]],
      valorAval: ['', [Validators.required, Validators.min(0)]],
      interes: ['', [Validators.required, Validators.min(0)]],
      tasaAval: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      otrosConceptos: [0],
      abonoAval: [0],
      abonoCapital: [0],
      totalDeuda: ['', [Validators.required]],
      fechaVencimiento: ['', [Validators.required]],
      diasMora: [0],
      fechaPago: [''],
      estadoCredito: ['', [Validators.required]],
      periodicidad: ['', [Validators.required]]
    });

    // Calcular total deuda automáticamente
    this.portfolioForm.valueChanges.subscribe(() => {
      this.calculateTotalDebt();
    });
  }

  loadFormOptions() {
    // Cargar opciones adicionales si es necesario
  }

  calculateTotalDebt() {
    const formValue = this.portfolioForm.value;
    const valorDesembolso = Number(formValue.valorDesembolso) || 0;
    const valorAval = Number(formValue.valorAval) || 0;
    const interes = Number(formValue.interes) || 0;
    const otrosConceptos = Number(formValue.otrosConceptos) || 0;
    const abonoAval = Number(formValue.abonoAval) || 0;
    const abonoCapital = Number(formValue.abonoCapital) || 0;

    const totalDeuda = valorDesembolso + valorAval + interes + otrosConceptos - abonoAval - abonoCapital;

    this.portfolioForm.patchValue({ totalDeuda: totalDeuda }, { emitEvent: false });
  }

  setActiveTab(tab: 'form' | 'upload') {
    this.activeTab = tab;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.portfolioForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) return 'Este campo es obligatorio';
      if (field.errors?.['pattern']) return 'Formato inválido';
      if (field.errors?.['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors?.['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return null;
  }

  onSubmitForm() {
    if (this.portfolioForm.valid) {
      this.isLoading = true;

      // Simular envío
      setTimeout(() => {
        console.log('Form submitted:', this.portfolioForm.value);
        this.isLoading = false;
        this.uploadResult = {
          success: true,
          message: 'Registro guardado exitosamente',
          records: 1
        };
      }, 2000);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadedFile = file;
    }
  }

  onUploadFile() {
    if (this.uploadedFile) {
      this.isLoading = true;

      // Simular procesamiento
      setTimeout(() => {
        console.log('File uploaded:', this.uploadedFile);
        this.isLoading = false;
        this.uploadResult = {
          success: true,
          message: 'Archivo procesado exitosamente',
          records: 150
        };
      }, 3000);
    }
  }

  downloadTemplate() {
    console.log('Downloading template...');
    // Implementar descarga de plantilla
  }
}
