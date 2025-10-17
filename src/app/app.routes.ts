import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { ReportsComponent } from './reports/reports.component';
import { ClaimsComponent } from './claims/claims.component';
import { UsersComponent } from './admin/users/users.component';
import { DashboardAfianzadoComponent } from './afianzado/dashboard-afianzado.component';
import { AliadosComponent } from './aliado/aliados.component';

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
    path: 'documentos',
    component: ReportsComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_USER'] } // NO para AFIANZADO
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_USER'] }, // NO para AFIANZADO
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
    path: 'portfolio',
    component: PortfolioComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_USER'] }, // NO para AFIANZADO
    title: 'Cargue de Cartera - Avaltrust'
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
  // Wildcard - Redirige a dashboard normal (el guard manejará la redirección correcta)
  { 
    path: '**', 
    redirectTo: 'dashboard'
  },
];
