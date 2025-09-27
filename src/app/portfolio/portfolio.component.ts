import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { UiStateService } from '../ui-state.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PortfolioService, PortfolioRequest } from './portfolio.service';

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
  private portfolioService = inject(PortfolioService);

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

  periodicityOptions = [
    { value: 'MENSUAL', label: 'Mensual' },
    { value: 'BIMESTRAL', label: 'Bimestral' },
    { value: 'TRIMESTRAL', label: 'Trimestral' },
    { value: 'SEMESTRAL', label: 'Semestral' },
    { value: 'ANUAL', label: 'Anual' }
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
    this.uploadResult = null; // Limpiar resultados al cambiar de pestaña
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
      this.uploadResult = null;

      // Preparar datos para envío
      const portfolioData: PortfolioRequest = {
        ...this.portfolioForm.value,
        // Asegurar que los números sean del tipo correcto
        plazoInicial: Number(this.portfolioForm.value.plazoInicial),
        valorDesembolso: Number(this.portfolioForm.value.valorDesembolso),
        valorAval: Number(this.portfolioForm.value.valorAval),
        interes: Number(this.portfolioForm.value.interes),
        tasaAval: Number(this.portfolioForm.value.tasaAval),
        otrosConceptos: Number(this.portfolioForm.value.otrosConceptos) || 0,
        abonoAval: Number(this.portfolioForm.value.abonoAval) || 0,
        abonoCapital: Number(this.portfolioForm.value.abonoCapital) || 0,
        totalDeuda: Number(this.portfolioForm.value.totalDeuda),
        diasMora: Number(this.portfolioForm.value.diasMora) || 0
      };

      console.log('Enviando datos al backend:', portfolioData);

      // Enviar al backend
      this.portfolioService.createPortfolioRecord(portfolioData)
        .pipe(
          catchError(error => {
            console.error('Error al guardar registro:', error);
            return of({
              success: false,
              message: 'Error al guardar el registro. Por favor, inténtelo nuevamente.',
              errors: error.error?.errors || ['Error de conexión con el servidor']
            });
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe(response => {
          this.uploadResult = {
            success: response.success,
            message: response.success ?
              'Registro de cartera guardado exitosamente' :
              response.message,
            records: response.success ? 1 : 0,
            errors: response.errors
          };

          if (response.success) {
            this.portfolioForm.reset();
            // Scroll to top to show result
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.portfolioForm.controls).forEach(key => {
        this.portfolioForm.get(key)?.markAsTouched();
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.uploadResult = {
          success: false,
          message: 'Tipo de archivo no permitido. Use Excel (.xls, .xlsx) o CSV (.csv)',
          errors: ['Formato de archivo inválido']
        };
        return;
      }

      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.uploadResult = {
          success: false,
          message: 'El archivo es demasiado grande. El tamaño máximo permitido es 10MB.',
          errors: ['Archivo demasiado grande']
        };
        return;
      }

      this.uploadedFile = file;
      this.uploadResult = null;
    }
  }

  onUploadFile() {
    if (this.uploadedFile) {
      this.isLoading = true;
      this.uploadResult = null;

      console.log('Subiendo archivo al backend:', this.uploadedFile.name);

      this.portfolioService.uploadPortfolioFile(this.uploadedFile)
        .pipe(
          catchError(error => {
            console.error('Error al subir archivo:', error);
            return of({
              success: false,
              message: 'Error al procesar el archivo. Por favor, verifique el formato y vuelva a intentar.',
              processedRecords: 0,
              errors: error.error?.errors || ['Error de conexión con el servidor'],
              validationErrors: []
            });
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe(response => {
          this.uploadResult = {
            success: response.success,
            message: response.message,
            records: response.processedRecords || 0,
            errors: response.errors || response.validationErrors || []
          };

          if (response.success) {
            this.uploadedFile = null;
            // Reset file input
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
            // Scroll to top to show result
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
    }
  }

  downloadTemplate() {
    console.log('Descargando plantilla...');
    this.portfolioService.downloadTemplate()
      .pipe(
        catchError(error => {
          console.error('Error al descargar plantilla:', error);
          this.uploadResult = {
            success: false,
            message: 'Error al descargar la plantilla. Inténtelo nuevamente.',
            errors: ['Error de conexión']
          };
          return of(null);
        })
      )
      .subscribe(blob => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_cartera.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      });
  }
}
