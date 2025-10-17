import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AfianzadoService } from './afianzado.service';
import { DashboardAfianzado, Obligacion } from './dashboard-afianzado.interface';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard-afianzado',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent],
  templateUrl: './dashboard-afianzado.component.html',
  styleUrls: ['./dashboard-afianzado.component.css']
})
export class DashboardAfianzadoComponent implements OnInit {
  dashboard: DashboardAfianzado | null = null;
  loading = true;
  error: string | null = null;
  
  // Para el header y sidebar
  isSidebarOpen = false;
  isUserMenuOpen = false;

  constructor(
    private afianzadoService: AfianzadoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.afianzadoService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        this.error = 'No se pudo cargar la información. Por favor, intente de nuevo.';
        this.loading = false;
      }
    });
  }

  // Métodos para header y sidebar
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  onSidebarClose(): void {
    this.isSidebarOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  onSidebarNavigate(route: string): void {
    this.router.navigate([route]);
    this.closeSidebar();
  }

  onHeaderNavigate(route: string): void {
    this.router.navigate([route]);
    this.closeUserMenu();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  descargarCertificado(numeroObligacion: string): void {
    this.afianzadoService.descargarCertificado(numeroObligacion).subscribe({
      next: (blob) => {
        // Crear un enlace temporal para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Certificado_Fianza_${numeroObligacion}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar certificado:', err);
        alert('No se pudo descargar el certificado. Por favor, intente de nuevo.');
      }
    });
  }

  getEstadoClass(estado: string): string {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('vigente') || estadoLower.includes('al día')) {
      return 'estado-vigente';
    } else if (estadoLower.includes('mora')) {
      return 'estado-mora';
    } else if (estadoLower.includes('vencido')) {
      return 'estado-vencido';
    }
    return 'estado-default';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
