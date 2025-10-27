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
import { ClaimsService, ClaimRequest } from './claims.service';
import { ClaimsTemplateService } from './claims-template.service';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './claims.component.html',
  styleUrls: ['./claims.component.css']
})
export class ClaimsComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private uiState = inject(UiStateService);
  private claimsService = inject(ClaimsService);
  private claimsTemplateService = inject(ClaimsTemplateService);

  // Estados de UI usando el servicio compartido
  get isSidebarOpen() {
    return this.uiState.isSidebarOpen();
  }

  get isUserMenuOpen() {
    return this.uiState.isUserMenuOpen();
  }

  // Propiedades del componente
  activeTab: 'form' | 'upload' = 'form';
  claimsForm!: FormGroup;
  isLoading = false;
  uploadedFile: File | null = null;
  uploadResult: any = null;
  isDragging = false; // Para drag & drop

  ngOnInit() {
    this.initializeForm();
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
    this.claimsForm = this.fb.group({
      obligacion: ['', [Validators.required]],
      fechaSolicitud: ['', [Validators.required]],
      valorCapital: ['', [Validators.required, Validators.min(0.01)]],
      intereses: ['', [Validators.required, Validators.min(0)]],
      otrosConceptos: [0, [Validators.min(0)]],
      aval: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      codigoDepartamento: ['', [Validators.required]],
      codigoCiudad: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      convenioNit: ['', [Validators.required]],
      nitEmpresa: ['', [Validators.required]]
    });
  }

  setActiveTab(tab: 'form' | 'upload') {
    this.activeTab = tab;
    this.uploadResult = null;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.claimsForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) return 'Este campo es obligatorio';
      if (field.errors?.['pattern']) return 'Formato inválido';
      if (field.errors?.['email']) return 'Email inválido';
      if (field.errors?.['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors?.['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return null;
  }

  onSubmitForm() {
    if (this.claimsForm.valid) {
      this.isLoading = true;
      this.uploadResult = null;

      const currentUser = this.auth.user();
      const username = currentUser?.username || 'sistema';

      const claimData: ClaimRequest = {
        ...this.claimsForm.value,
        valorCapital: Number(this.claimsForm.value.valorCapital),
        intereses: Number(this.claimsForm.value.intereses),
        otrosConceptos: Number(this.claimsForm.value.otrosConceptos) || 0,
        creadoPor: username,
        modificadoPor: username
      };

      console.log('Enviando siniestro al backend:', claimData);

      this.claimsService.createClaim(claimData)
        .pipe(
          catchError(error => {
            console.error('Error al guardar siniestro:', error);
            return of({
              success: false,
              message: 'Error al guardar el siniestro. Por favor, inténtelo nuevamente.',
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
              'Siniestro registrado exitosamente' :
              response.message,
            records: response.success ? 1 : 0,
            errors: response.errors
          };

          if (response.success) {
            this.claimsForm.reset();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
    } else {
      Object.keys(this.claimsForm.controls).forEach(key => {
        this.claimsForm.get(key)?.markAsTouched();
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File) {
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

  removeSelectedFile() {
    this.uploadedFile = null;
    this.uploadResult = null;
    // Reset file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onUploadFile() {
    if (this.uploadedFile) {
      this.isLoading = true;
      this.uploadResult = null;

      const currentUser = this.auth.user();
      console.log(`Subiendo archivo de siniestros: ${this.uploadedFile.name} (Usuario: ${currentUser?.username || 'sistema'})`);

      this.claimsService.uploadClaimsFile(this.uploadedFile)
        .pipe(
          catchError(error => {
            console.error('Error al subir archivo de siniestros:', error);

            let errorMessage = 'Error al procesar el archivo.';
            let errors: string[] = [];

            if (error.error) {
              if (error.error.message) {
                errorMessage = error.error.message;
              }
              if (error.error.errors) {
                errors = Array.isArray(error.error.errors) ? error.error.errors : [error.error.errors];
              }
              if (error.error.validationErrors) {
                errors = [...errors, ...(Array.isArray(error.error.validationErrors) ? error.error.validationErrors : [error.error.validationErrors])];
              }
            }

            if (errors.length === 0) {
              errors = ['Error de conexión con el servidor'];
            }

            return of({
              success: false,
              message: errorMessage,
              processedRecords: 0,
              errors: errors,
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
            message: response.success ?
              `Se procesaron exitosamente ${response.processedRecords || 0} siniestros` :
              response.message,
            records: response.processedRecords || 0,
            errors: response.errors || response.validationErrors || []
          };

          if (response.success) {
            this.uploadedFile = null;
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });

            console.log(`Carga masiva de siniestros completada: ${response.processedRecords} registros procesados`);
          } else {
            console.error('Error en carga masiva de siniestros:', response.errors);
          }
        });
    }
  }

  downloadTemplate() {
    console.log('Descargando plantilla de siniestros...');

    this.claimsService.downloadTemplate()
      .pipe(
        catchError(error => {
          console.error('Error al descargar plantilla del backend:', error);
          console.log('Generando plantilla localmente como respaldo...');
          this.claimsTemplateService.generateClaimsTemplate();
          return of(null);
        })
      )
      .subscribe(blob => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Plantilla_Siniestros_${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          console.log('Plantilla de siniestros descargada exitosamente');
        }
      });
  }
}
