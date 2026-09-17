import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts" 
        class="toast"
        [ngClass]="'toast-' + toast.type"
        [@slideIn]>
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'warning'">⚠</span>
          <span *ngIf="toast.type === 'info'">ℹ</span>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" (click)="removeToast(toast.id)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      background: white;
      min-width: 320px;
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success {
      border-left-color: #10b981;
      background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
    }

    .toast-error {
      border-left-color: #ef4444;
      background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
    }

    .toast-warning {
      border-left-color: #f59e0b;
      background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
    }

    .toast-info {
      border-left-color: #3b82f6;
      background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
    }

    .toast-icon {
      font-size: 20px;
      font-weight: bold;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .toast-success .toast-icon {
      background: #10b981;
      color: white;
    }

    .toast-error .toast-icon {
      background: #ef4444;
      color: white;
    }

    .toast-warning .toast-icon {
      background: #f59e0b;
      color: white;
    }

    .toast-info .toast-icon {
      background: #3b82f6;
      color: white;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
      line-height: 1.5;
      color: #1f2937;
      font-weight: 500;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .toast-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #1f2937;
    }

    @media (max-width: 640px) {
      .toast-container {
        left: 20px;
        right: 20px;
        max-width: none;
      }

      .toast {
        min-width: auto;
      }
    }
  `]
})
export class ToastContainerComponent {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  removeToast(id: string) {
    this.toastService.remove(id);
  }
}

