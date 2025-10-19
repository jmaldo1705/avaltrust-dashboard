import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CursosService } from './cursos.service';
import { EvaluacionService } from './evaluacion.service';
import { Modulo } from './curso.interface';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-detalle-curso',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent],
  templateUrl: './detalle-curso.component.html',
  styleUrls: ['./detalle-curso.component.css']
})
export class DetalleCursoComponent implements OnInit {
  private cursosService = inject(CursosService);
  private evaluacionService = inject(EvaluacionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  modulo: Modulo | null = null;
  loading = true;
  error: string | null = null;
  
  // Para el header y sidebar
  isSidebarOpen = false;
  isUserMenuOpen = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadModulo(id);
    } else {
      this.error = 'ID de módulo no válido';
      this.loading = false;
    }
  }

  loadModulo(id: number): void {
    this.loading = true;
    this.cursosService.getModuloById(id).subscribe({
      next: (data: Modulo) => {
        if (data) {
          this.modulo = data;
        } else {
          this.error = 'Módulo no encontrado';
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar módulo:', err);
        this.error = 'No se pudo cargar el módulo. Por favor, intente de nuevo.';
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/escuela-financiera']);
  }

  irAEvaluacion(): void {
    if (this.modulo?.id) {
      this.router.navigate(['/escuela-financiera', this.modulo.id, 'evaluacion']);
    }
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

  descargarCertificado(): void {
    if (!this.modulo?.id) return;
    
    this.evaluacionService.descargarCertificado(this.modulo.id).subscribe({
      next: (blob) => {
        // Crear URL temporal del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace temporal y disparar descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificado-curso-${this.modulo!.id}.pdf`;
        link.click();
        
        // Liberar memoria
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar certificado:', err);
        alert('No se pudo descargar el certificado. Por favor, intente nuevamente.');
      }
    });
  }
}
