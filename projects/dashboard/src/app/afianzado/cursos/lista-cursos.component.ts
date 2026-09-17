import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CursosService } from './cursos.service';
import { Modulo } from './curso.interface';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-lista-cursos',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent],
  templateUrl: './lista-cursos.component.html',
  styleUrls: ['./lista-cursos.component.css']
})
export class ListaCursosComponent implements OnInit {
  private cursosService = inject(CursosService);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  modulos: Modulo[] = [];
  loading = true;
  
  // Para el header y sidebar
  isSidebarOpen = false;
  isUserMenuOpen = false;

  ngOnInit(): void {
    this.loadModulos();
  }

  loadModulos(): void {
    this.loading = true;
    this.cursosService.getAllModulos().subscribe({
      next: (data: Modulo[]) => {
        this.modulos = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar módulos:', err);
        this.loading = false;
      }
    });
  }

  verModulo(id: number): void {
    this.router.navigate(['/escuela-financiera', id]);
  }

  /**
   * Descarga el certificado del curso
   * @param event Evento del click para prevenir propagación
   * @param cursoId ID del curso
   */
  descargarCertificado(event: Event, cursoId: number): void {
    event.stopPropagation(); // Evitar que se navegue al módulo
    this.cursosService.descargarCertificado(cursoId);
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  handleSidebarClose(): void {
    this.isSidebarOpen = false;
  }

  handleUserMenuClose(): void {
    this.isUserMenuOpen = false;
  }

  onSidebarNavigate(route: string): void {
    this.router.navigate([route]);
    this.isSidebarOpen = false;
  }

  onHeaderNavigate(route: string): void {
    this.router.navigate([route]);
    this.isUserMenuOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
