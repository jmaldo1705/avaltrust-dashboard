import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './login/login.component';
import { ChangePasswordComponent } from './auth/change-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { ReportsComponent } from './reports/reports.component';
import { ClaimsComponent } from './claims/claims.component';
import { UsersComponent } from './admin/users/users.component';
import { DashboardAfianzadoComponent } from './afianzado/dashboard-afianzado.component';
import { AliadosComponent } from './aliado/aliados.component';
import { ListaCursosComponent } from './afianzado/cursos/lista-cursos.component';
import { DetalleCursoComponent } from './afianzado/cursos/detalle-curso.component';
import { EvaluacionCursoComponent } from './afianzado/cursos/evaluacion-curso.component';
import { AdminCursosComponent } from './admin/cursos/admin-cursos.component';
import { CursoFormComponent } from './admin/cursos/curso-form.component';
import { EvaluacionFormComponent } from './admin/cursos/evaluacion-form.component';
import { EstadoCarteraComponent } from './estado-cartera/estado-cartera.component';
import { CertificadosComponent } from './certificados/certificados.component';

export const routes: Routes = [
  { 
    path: '', 
    pathMatch: 'full', 
    redirectTo: 'dashboard' // El authGuard se encargará de redirigir según el rol
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Iniciar sesión - Avaltrust'
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [authGuard],
    title: 'Cambiar Contraseña - Avaltrust'
  },
  {
    path: 'documentos',
    component: ReportsComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_USER', 'ROLE_CONSULTA'] } // NO para AFIANZADO
  },
  {
    path: 'certificados',
    component: CertificadosComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_USER', 'ROLE_CONSULTA'] }, // NO para AFIANZADO
    title: 'Certificados - Avaltrust'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_USER', 'ROLE_CONSULTA'] }, // NO para AFIANZADO
    title: 'Dashboard - Avaltrust'
  },
  {
    path: 'dashboard-afianzado',
    component: DashboardAfianzadoComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_AFIANZADO'] }, // SOLO para AFIANZADO
    title: 'Mi Dashboard - Avaltrust'
  },
  {
    path: 'escuela-financiera',
    component: ListaCursosComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_AFIANZADO'] }, // SOLO para AFIANZADO
    title: 'Escuela Financiera - Avaltrust'
  },
  {
    path: 'escuela-financiera/:id',
    component: DetalleCursoComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_AFIANZADO'] }, // SOLO para AFIANZADO
    title: 'Módulo - Escuela Financiera - Avaltrust'
  },
  {
    path: 'escuela-financiera/:cursoId/evaluacion',
    component: EvaluacionCursoComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_AFIANZADO'] }, // SOLO para AFIANZADO
    title: 'Evaluación - Escuela Financiera - Avaltrust'
  },
  {
    path: 'portfolio',
    component: PortfolioComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_USER'] }, // NO para AFIANZADO
    title: 'Cargue de Cartera - Avaltrust'
  },
  {
    path: 'estado-cartera',
    component: EstadoCarteraComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_USER', 'ROLE_CONSULTA'] }, // NO para AFIANZADO
    title: 'Estado de Cartera - Avaltrust'
  },
  {
    path: 'claims',
    component: ClaimsComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_USER'] } // NO para AFIANZADO
  },
  {
    path: 'admin/users',
    component: UsersComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }, // SOLO para ADMIN
    title: 'Gestión de Usuarios - Avaltrust'
  },
  {
    path: 'aliados',
    component: AliadosComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }, // SOLO para ADMIN
    title: 'Gestión de Aliados Estratégicos - Avaltrust'
  },
  {
    path: 'admin/cursos',
    component: AdminCursosComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }, // SOLO para ADMIN
    title: 'Administración de Cursos - Avaltrust'
  },
  {
    path: 'admin/cursos/nuevo',
    component: CursoFormComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }, // SOLO para ADMIN
    title: 'Nuevo Curso - Avaltrust'
  },
  {
    path: 'admin/cursos/editar/:id',
    component: CursoFormComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }, // SOLO para ADMIN
    title: 'Editar Curso - Avaltrust'
  },
  {
    path: 'admin/cursos/:id/evaluacion',
    component: EvaluacionFormComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }, // SOLO para ADMIN
    title: 'Gestión de Evaluación - Avaltrust'
  },
  // Wildcard - Redirige a dashboard normal (el guard manejará la redirección correcta)
  { 
    path: '**', 
    redirectTo: 'dashboard'
  },
];
