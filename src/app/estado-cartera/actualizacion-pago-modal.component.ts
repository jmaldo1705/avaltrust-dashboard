import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';

interface PortfolioItem {
  id: number;
  obligacion: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  totalDeuda: number;
  valorAval: number;
  abonoAval: number;
  valorDesembolso: number;
  interes: number;
  otrosConceptos: number;
  abonoCapital: number;
  estadoCredito: string;
  diasMora: number;
}

@Component({
  selector: 'app-actualizacion-pago-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <h3>Actualización de Pago</h3>
          <button class="btn-close" (click)="closeModal()" type="button">✕</button>
        </div>

        <!-- Info del crédito -->
        <div class="credit-info" *ngIf="portfolio">
          <div class="info-row">
            <span class="info-label">Obligación:</span>
            <span class="info-value">{{ portfolio.obligacion }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span class="info-value">{{ portfolio.nombres }} {{ portfolio.apellidos }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Documento:</span>
            <span class="info-value">{{ portfolio.numeroDocumento }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Deuda:</span>
            <span class="info-value amount-deuda">{{ formatCurrency(portfolio.totalDeuda) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Fianza:</span>
            <span class="info-value amount-fianza">{{ formatCurrency(calculateTotalFianza(portfolio)) }}</span>
          </div>
        </div>

        <!-- Formulario -->
        <form [formGroup]="actualizacionForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <!-- Fecha de Pago -->
            <div class="form-group full-width">
              <label for="fechaPago" class="form-label">
                Fecha de Pago <span class="required">*</span>
              </label>
              <input
                id="fechaPago"
                type="date"
                formControlName="fechaPago"
                class="form-control"
                [class.error]="isFieldInvalid('fechaPago')">
              <div class="error-message" *ngIf="isFieldInvalid('fechaPago')">
                Este campo es obligatorio
              </div>
            </div>

            <!-- Abono Aval -->
            <div class="form-group">
              <label for="abonoAval" class="form-label">
                Abono Fianza
              </label>
              <input
                id="abonoAval"
                type="number"
                formControlName="abonoAval"
                class="form-control"
                placeholder="0.00"
                step="0.01"
                min="0">
            </div>

            <!-- Abono Capital -->
            <div class="form-group">
              <label for="abonoCapital" class="form-label">
                Abono Capital
              </label>
              <input
                id="abonoCapital"
                type="number"
                formControlName="abonoCapital"
                class="form-control"
                placeholder="0.00"
                step="0.01"
                min="0">
            </div>

            <!-- Días de Mora -->
            <div class="form-group">
              <label for="diasMora" class="form-label">
                Días de Mora <span class="required">*</span>
              </label>
              <input
                id="diasMora"
                type="number"
                formControlName="diasMora"
                class="form-control"
                placeholder="0"
                min="0"
                [class.error]="isFieldInvalid('diasMora')">
              <div class="error-message" *ngIf="isFieldInvalid('diasMora')">
                Este campo es obligatorio
              </div>
            </div>

            <!-- Estado del Crédito -->
            <div class="form-group">
              <label for="estadoCredito" class="form-label">
                Estado del Crédito <span class="required">*</span>
              </label>
              <select
                id="estadoCredito"
                formControlName="estadoCredito"
                class="form-control"
                [class.error]="isFieldInvalid('estadoCredito')">
                <option value="">Seleccione estado</option>
                <option value="VIGENTE">Vigente</option>
                <option value="VENCIDO">Vencido</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="CASTIGADO">Castigado</option>
              </select>
              <div class="error-message" *ngIf="isFieldInvalid('estadoCredito')">
                Este campo es obligatorio
              </div>
            </div>
          </div>

          <!-- Nota informativa -->
          <div class="info-note">
            <span class="info-icon">ℹ️</span>
            <span>Esta actualización se guardará como un nuevo registro en el historial de pagos.</span>
          </div>

          <!-- Botones -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn-secondary"
              (click)="closeModal()"
              [disabled]="isSubmitting">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="actualizacionForm.invalid || isSubmitting">
              <span *ngIf="isSubmitting" class="loading-spinner"></span>
              {{ isSubmitting ? 'Guardando...' : 'Guardar Actualización' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-container {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
      padding: 0.25rem;
      line-height: 1;
      transition: color 0.2s ease;
    }

    .btn-close:hover {
      color: #dc2626;
    }

    .credit-info {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    .info-label {
      font-weight: 600;
      color: #475569;
    }

    .info-value {
      color: #1e293b;
    }

    .amount-deuda {
      font-weight: 700;
      color: #dc2626;
      font-size: 1.05rem;
    }

    .amount-fianza {
      font-weight: 700;
      color: #059669;
      font-size: 1.05rem;
    }

    form {
      padding: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .required {
      color: #dc2626;
    }

    .form-control {
      padding: 0.625rem 0.875rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control.error {
      border-color: #dc2626;
    }

    .error-message {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: -0.25rem;
    }

    .info-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: #92400e;
    }

    .info-icon {
      font-size: 1.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn-secondary,
    .btn-primary {
      padding: 0.625rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary:disabled,
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .modal-container {
        max-height: 95vh;
      }
    }
  `]
})
export class ActualizacionPagoModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() portfolio: PortfolioItem | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<any>();

  actualizacionForm: FormGroup;
  isSubmitting = false;
  private toastService = inject(ToastService);

  constructor(private fb: FormBuilder) {
    this.actualizacionForm = this.fb.group({
      fechaPago: ['', Validators.required],
      abonoAval: [0, [Validators.min(0)]],
      abonoCapital: [0, [Validators.min(0)]],
      diasMora: [0, [Validators.required, Validators.min(0)]],
      estadoCredito: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Solo actualizar cuando el modal se abre por primera vez con un portfolio
    if (changes['isOpen'] && this.isOpen && this.portfolio) {
      // Resetear el estado de submitting
      this.isSubmitting = false;
      // Pre-cargar valores actuales
      this.actualizacionForm.patchValue({
        fechaPago: new Date().toISOString().split('T')[0],
        diasMora: this.portfolio.diasMora || 0,
        estadoCredito: this.portfolio.estadoCredito || '',
        abonoAval: 0,
        abonoCapital: 0
      });
    }
  }

  closeModal() {
    this.actualizacionForm.reset();
    this.isSubmitting = false;
    this.close.emit();
  }

  resetSubmitting() {
    this.isSubmitting = false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.actualizacionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    // Prevenir doble envío
    if (this.isSubmitting) {
      console.log('Ya se está procesando una actualización, ignorando...');
      return;
    }

    if (this.actualizacionForm.valid && this.portfolio && this.portfolio.id) {
      // Validar que los abonos no generen valores negativos
      const validationError = this.validateAbonos();
      if (validationError) {
        this.toastService.error(validationError, 5000);
        return;
      }

      console.log('Enviando actualización de pago para portfolio ID:', this.portfolio.id);
      this.isSubmitting = true;
      const formData = {
        portfolioId: this.portfolio.id,
        ...this.actualizacionForm.value
      };
      this.submitForm.emit(formData);
    } else {
      console.error('Formulario inválido o portfolio no disponible', {
        formValid: this.actualizacionForm.valid,
        portfolio: this.portfolio,
        portfolioId: this.portfolio?.id
      });
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.actualizacionForm.controls).forEach(key => {
        this.actualizacionForm.get(key)?.markAsTouched();
      });
    }
  }

  validateAbonos(): string | null {
    if (!this.portfolio) return null;

    const abonoAvalNuevo = Number(this.actualizacionForm.get('abonoAval')?.value) || 0;
    const abonoCapitalNuevo = Number(this.actualizacionForm.get('abonoCapital')?.value) || 0;

    // Validar Fianza
    const valorAval = this.portfolio.valorAval || 0;
    const abonoAvalActual = this.portfolio.abonoAval || 0;
    const totalAbonoAval = abonoAvalActual + abonoAvalNuevo;
    const totalFianzaResultante = valorAval - totalAbonoAval;

    if (totalFianzaResultante < 0) {
      const maximoPermitido = valorAval - abonoAvalActual;
      return `El valor de la fianza no puede ser menor a 0. ` +
             `Máximo abono de fianza permitido: ${this.formatCurrency(maximoPermitido)}`;
    }

    // Validar Deuda
    const valorDesembolso = this.portfolio.valorDesembolso || 0;
    const interes = this.portfolio.interes || 0;
    const otrosConceptos = this.portfolio.otrosConceptos || 0;
    const abonoCapitalActual = this.portfolio.abonoCapital || 0;
    const totalAbonoCapital = abonoCapitalActual + abonoCapitalNuevo;
    const totalAdeudado = valorDesembolso + interes + otrosConceptos;
    const totalDeudaResultante = totalAdeudado - totalAbonoCapital;

    if (totalDeudaResultante < 0) {
      const maximoPermitido = totalAdeudado - abonoCapitalActual;
      return `El valor de la deuda no puede ser menor a 0. ` +
             `Máximo abono de capital permitido: ${this.formatCurrency(maximoPermitido)}`;
    }

    return null;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  calculateTotalFianza(portfolio: PortfolioItem): number {
    const valorAval = portfolio.valorAval || 0;
    const abonoAval = portfolio.abonoAval || 0;
    return valorAval - abonoAval;
  }
}

