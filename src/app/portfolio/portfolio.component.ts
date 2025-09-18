import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { HasRoleDirective } from '../auth/has-role.directive';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

// Interfaces para el formulario de cartera
interface PortfolioRecord {
  obligacion: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaDesembolso: string;
  plazoInicial: number;
  valorDesembolso: number;
  valorAval: number;
  interes: number;
  otrosConceptos: number;
  abonoAval: number;
  abonoCapital: number;
  totalDeuda: number;
  fechaVencimiento: string;
  diasMora: number;
  fechaPago?: string;
  estadoCredito: string;
  tipoCliente: string;
  tasaAval: number;
  observaciones?: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  records?: number;
  errors?: string[];
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HasRoleDirective,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  userProfile = this.auth.userProfile;
  isSidebarOpen = false;
  activeTab: 'form' | 'upload' = 'form';
  isLoading = false;

  portfolioForm: FormGroup = this.fb.group({});
  uploadedFile: File | null = null;
  uploadResult: UploadResult | null = null;

  // Opciones para campos select
  documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'NIT', label: 'NIT' }
  ];

  creditStates = [
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'EN_MORA', label: 'En Mora' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'CASTIGADO', label: 'Castigado' },
    { value: 'RENOVADO', label: 'Renovado' }
  ];

  clientTypes = [
    { value: 'PERSONA_NATURAL', label: 'Persona Natural' },
    { value: 'PERSONA_JURIDICA', label: 'Persona Jurídica' },
    { value: 'MICROEMPRESA', label: 'Microempresa' },
    { value: 'PYME', label: 'PYME' }
  ];

  ngOnInit() {
    this.initializeForm();

    if (!this.userProfile()) {
      this.auth.getUserProfile().subscribe();
    }
  }

  private initializeForm() {
    this.portfolioForm = this.fb.group({
      obligacion: ['', [Validators.required, Validators.minLength(3)]],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      fechaDesembolso: ['', Validators.required],
      plazoInicial: ['', [Validators.required, Validators.min(1), Validators.max(360)]],
      valorDesembolso: ['', [Validators.required, Validators.min(0.01)]],
      valorAval: ['', [Validators.required, Validators.min(0)]],
      interes: ['', [Validators.required, Validators.min(0)]],
      otrosConceptos: [0, [Validators.min(0)]],
      abonoAval: [0, [Validators.min(0)]],
      abonoCapital: [0, [Validators.min(0)]],
      totalDeuda: ['', [Validators.required, Validators.min(0.01)]],
      fechaVencimiento: ['', Validators.required],
      diasMora: [0, [Validators.min(0)]],
      fechaPago: [''],
      estadoCredito: ['', Validators.required],
      tipoCliente: ['', Validators.required],
      tasaAval: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      observaciones: ['', Validators.maxLength(500)]
    });

    // Auto-calcular total deuda cuando cambian los valores
    this.portfolioForm.get('valorDesembolso')?.valueChanges.subscribe(() => this.calculateTotalDebt());
    this.portfolioForm.get('interes')?.valueChanges.subscribe(() => this.calculateTotalDebt());
    this.portfolioForm.get('otrosConceptos')?.valueChanges.subscribe(() => this.calculateTotalDebt());
    this.portfolioForm.get('abonoAval')?.valueChanges.subscribe(() => this.calculateTotalDebt());
    this.portfolioForm.get('abonoCapital')?.valueChanges.subscribe(() => this.calculateTotalDebt());
  }

  private calculateTotalDebt() {
    const valorDesembolso = this.portfolioForm.get('valorDesembolso')?.value || 0;
    const interes = this.portfolioForm.get('interes')?.value || 0;
    const otrosConceptos = this.portfolioForm.get('otrosConceptos')?.value || 0;
    const abonoAval = this.portfolioForm.get('abonoAval')?.value || 0;
    const abonoCapital = this.portfolioForm.get('abonoCapital')?.value || 0;

    const totalDeuda = (valorDesembolso + interes + otrosConceptos) - (abonoAval + abonoCapital);
    this.portfolioForm.get('totalDeuda')?.setValue(Math.max(0, totalDeuda), { emitEvent: false });
  }

  setActiveTab(tab: 'form' | 'upload') {
    this.activeTab = tab;
    this.uploadResult = null;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.portfolioForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    const errors = field.errors;
    if (errors['required']) return 'Este campo es requerido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;
    if (errors['pattern']) return 'Formato inválido';

    return 'Campo inválido';
  }

  onSubmitForm() {
    if (this.portfolioForm.invalid) {
      this.portfolioForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.portfolioForm.value as PortfolioRecord;

    // Simular llamada al backend
    this.http.post<{ success: boolean, message: string }>('/api/portfolio/create', formData)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.uploadResult = {
              success: true,
              message: 'Registro de cartera creado exitosamente',
              records: 1
            };
            this.portfolioForm.reset();
          } else {
            this.uploadResult = {
              success: false,
              message: response.message
            };
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.uploadResult = {
            success: false,
            message: 'Error al crear el registro. Por favor intente nuevamente.'
          };
          console.error('Error creating portfolio record:', error);
        }
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.uploadResult = {
        success: false,
        message: 'Por favor seleccione un archivo Excel (.xls, .xlsx) o CSV (.csv)'
      };
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      this.uploadResult = {
        success: false,
        message: 'El archivo no debe exceder 10MB'
      };
      return;
    }

    this.uploadedFile = file;
    this.uploadResult = null;
  }

  onUploadFile() {
    if (!this.uploadedFile) {
      this.uploadResult = {
        success: false,
        message: 'Por favor seleccione un archivo'
      };
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('file', this.uploadedFile);

    // Simular llamada al backend
    this.http.post<UploadResult>('/api/portfolio/upload', formData)
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.uploadResult = result;
          if (result.success) {
            this.uploadedFile = null;
            // Reset file input
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.uploadResult = {
            success: false,
            message: 'Error al procesar el archivo. Por favor intente nuevamente.'
          };
          console.error('Error uploading file:', error);
        }
      });
  }

  downloadTemplate() {
    // Crear template de Excel con las columnas requeridas
    const templateData = [
      [
        'Obligación', 'Tipo Documento', 'Número Documento', 'Nombres', 'Apellidos',
        'Fecha Desembolso', 'Plazo Inicial', 'Valor Desembolso', 'Valor Aval', 'Interés',
        'Otros Conceptos', 'Abono Aval', 'Abono Capital', 'Total Deuda', 'Fecha Vencimiento',
        'Días Mora', 'Fecha Pago', 'Estado Crédito', 'Tipo Cliente', 'Tasa Aval', 'Observaciones'
      ]
    ];

    // Simular descarga (en implementación real usarías una librería como SheetJS)
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_cartera.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Navigation methods
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeSidebar();
  }

  onSidebarNavigate(route: string) {
    this.navigateTo(route);
  }

  onSidebarClose() {
    this.closeSidebar();
  }

  onHeaderNavigate(route: string) {
    this.navigateTo(route);
  }

  logout() {
    this.auth.logout(true);
  }
}
