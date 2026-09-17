import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="session-warning-overlay" *ngIf="show">
      <div class="session-warning-dialog">
        <div class="session-warning-header">
          <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>Sesión por expirar</h2>
        </div>
        
        <div class="session-warning-content">
          <p>Tu sesión está a punto de expirar por inactividad.</p>
          <p class="countdown">Tiempo restante: <strong>{{ timeRemaining }} segundos</strong></p>
          <p class="info-text">¿Deseas continuar trabajando en la plataforma?</p>
        </div>
        
        <div class="session-warning-actions">
          <button class="btn btn-secondary" (click)="onLogout()">
            Cerrar sesión
          </button>
          <button class="btn btn-primary" (click)="onContinue()">
            Continuar trabajando
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-warning-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .session-warning-dialog {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      max-width: 480px;
      width: 90%;
      padding: 0;
      animation: slideIn 0.3s ease-out;
      overflow: hidden;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .session-warning-header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .warning-icon {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .session-warning-header h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }

    .session-warning-content {
      padding: 28px 24px;
    }

    .session-warning-content p {
      margin: 0 0 12px 0;
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
    }

    .countdown {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 6px;
      font-size: 16px;
    }

    .countdown strong {
      color: #d97706;
      font-size: 18px;
    }

    .info-text {
      font-weight: 500;
      color: #1f2937;
      margin-top: 16px;
    }

    .session-warning-actions {
      padding: 20px 24px;
      background: #f9fafb;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 120px;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }

    .btn-secondary {
      background: white;
      color: #6b7280;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f3f4f6;
      color: #374151;
    }

    @media (max-width: 640px) {
      .session-warning-dialog {
        width: 95%;
        max-width: none;
      }

      .session-warning-actions {
        flex-direction: column-reverse;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class SessionWarningComponent {
  @Input() show = false;
  @Input() timeRemaining = 60;
  @Output() continue = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onContinue() {
    this.continue.emit();
  }

  onLogout() {
    this.logout.emit();
  }
}
