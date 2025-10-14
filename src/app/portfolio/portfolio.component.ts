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
import { ExcelTemplateService } from './excel-template.service';
import * as XLSX from 'xlsx';

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
  private excelTemplateService = inject(ExcelTemplateService);

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

      // Obtener el usuario logueado
      const currentUser = this.auth.user();
      const username = currentUser?.username || 'sistema';

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
        diasMora: Number(this.portfolioForm.value.diasMora) || 0,
        // Campos de auditoría
        creadoPor: username,
        modificadoPor: username
      };

      console.log('Enviando datos al backend (con usuario):', portfolioData);

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

      const currentUser = this.auth.user();
      console.log(`Subiendo archivo al backend: ${this.uploadedFile.name} (Usuario: ${currentUser?.username || 'sistema'})`);

      this.portfolioService.uploadPortfolioFile(this.uploadedFile)
        .pipe(
          catchError(error => {
            console.error('Error al subir archivo:', error);

            // Manejo detallado de errores
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
          const friendly = this.toUserFriendlyUploadResult(response);
          this.uploadResult = friendly;

          if (friendly.success) {
            this.uploadedFile = null;
            // Reset file input
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
            // Scroll to top to show result
            window.scrollTo({ top: 0, behavior: 'smooth' });

            console.log(`Carga masiva completada: ${friendly.records} registros procesados`);
          } else {
            console.error('Error en carga masiva:', friendly.errors);
          }
        });
    }
  }

  private sanitizeText(value: string): string {
    if (!value) return '';
    // Normalizar y quitar diacriticos
    let clean = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Remplazos especificos
    clean = clean.replace(/ñ/g, 'n').replace(/Ñ/g, 'N');
    // Quitar caracteres no ASCII excepto basicos
    clean = clean.replace(/[^A-Za-z0-9 %()_\-.,\/ ]+/g, '');
    // Colapsar espacios
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
  }

  private sanitizeWorkbookHeadersAndSheets(wb: XLSX.WorkBook): XLSX.WorkBook {
    // Renombrar hojas
    wb.SheetNames = wb.SheetNames.map(name => this.sanitizeText(name) || 'Hoja');

    // Limpiar encabezados de cada hoja (primera fila)
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      if (!ws || !ws['!ref']) continue;
      const range = XLSX.utils.decode_range(ws['!ref']);
      const headerRow = range.s.r; // primera fila
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c });
        const cell = ws[cellAddr];
        if (cell && typeof cell.v === 'string') {
          const sanitized = this.sanitizeText(cell.v);
          cell.v = sanitized;
          cell.w = sanitized;
          cell.t = 's';
        }
      }
    }
    return wb;
  }

  private toUserFriendlyUploadResult(response: any): { success: boolean; message: string; records: number; errors: string[] } {
    if (response?.success) {
      return {
        success: true,
        message: `Se procesaron exitosamente ${response.processedRecords || 0} registros`,
        records: response.processedRecords || 0,
        errors: []
      };
    }

    const rawErrors: any[] = [];
    if (Array.isArray(response?.errors)) rawErrors.push(...response.errors);
    if (Array.isArray(response?.validationErrors)) rawErrors.push(...response.validationErrors);

    const duplicateValuesSet = new Set<string>();
    const otherErrors: string[] = [];

    for (const err of rawErrors) {
      if (typeof err === 'string') {
        const m = err.match(/Obligaci[óo]n duplicada en BD:\s*(.+)$/i);
        if (m && m[1]) {
          duplicateValuesSet.add(String(m[1]).trim());
        } else {
          otherErrors.push(err);
        }
      } else if (err && typeof err === 'object') {
        const field = (err.field || '').toString().toLowerCase();
        const isDup = field === 'obligacion' && /duplicad/i.test(String(err.error || ''));
        if (isDup && err.value != null) {
          duplicateValuesSet.add(String(err.value).trim());
        } else {
          const row = (typeof err.row === 'number' && err.row > 0) ? `Fila ${err.row}: ` : '';
          const fld = err.field ? `${err.field}` : 'Campo';
          const msg = err.error ? `${err.error}` : 'Error de validación';
          const val = (err.value !== undefined && err.value !== null && err.value !== '') ? ` (Valor: ${err.value})` : '';
          otherErrors.push(`${row}${fld} - ${msg}${val}`);
        }
      }
    }

    const duplicates = Array.from(duplicateValuesSet);
    const duplicatesCount = duplicates.length;
    const displayErrors: string[] = [];

    if (duplicatesCount > 0) {
      if (duplicatesCount <= 5) {
        for (const v of duplicates) {
          displayErrors.push(`Obligacion duplicada en BD: ${v}`);
        }
      } else {
        const examples = duplicates.slice(0, 5).join(', ');
        displayErrors.push(`Obligaciones duplicadas en BD: ${duplicatesCount}. Ejemplos: ${examples}`);
      }
    }

    // Agregar otros errores luego del resumen de duplicados
    displayErrors.push(...otherErrors);

    const friendlyMessage = duplicatesCount > 0 && otherErrors.length === 0
      ? `Se encontraron ${duplicatesCount} obligaciones duplicadas en el archivo/BD`
      : (response?.message || 'Se encontraron errores en el archivo');

    return {
      success: false,
      message: friendlyMessage,
      records: response?.processedRecords || 0,
      errors: displayErrors.length > 0 ? displayErrors : [friendlyMessage]
    };
  }

  downloadTemplate() {
    console.log('Descargando plantilla...');

    // Opción 1: Descargar desde el backend (recomendado)
    this.portfolioService.downloadTemplate()
      .pipe(
        catchError(error => {
          console.error('Error al descargar plantilla del backend:', error);

          // Fallback: generar plantilla del lado del cliente
          console.log('Generando plantilla localmente como respaldo...');
          this.excelTemplateService.generatePortfolioTemplate();

          return of(null);
        })
      )
      .subscribe(blob => {
        if (blob) {
          // Sanitizar el contenido de la plantilla descargada (encabezados y nombres de hojas)
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const data = new Uint8Array(reader.result as ArrayBuffer);
              const wb = XLSX.read(data, { type: 'array' });
              const cleanWb = this.sanitizeWorkbookHeadersAndSheets(wb);
              const out = XLSX.write(cleanWb, { bookType: 'xlsx', type: 'array' });
              const cleanBlob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

              const url = window.URL.createObjectURL(cleanBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Plantilla_Cartera_${new Date().toISOString().split('T')[0]}.xlsx`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);

              console.log('Plantilla descargada y sanitizada exitosamente');
            } catch (e) {
              console.warn('No fue posible sanitizar la plantilla, se descargara el archivo original.', e);
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Plantilla_Cartera_${new Date().toISOString().split('T')[0]}.xlsx`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }
          };
          reader.readAsArrayBuffer(blob);
        }
      });
  }
}
