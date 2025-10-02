import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { ReportsComponent } from './reports/reports.component';
import { ClaimsComponent } from './claims/claims.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Iniciar sesión - Avaltrust'
  },
  {
    path: 'documentos',
    component: ReportsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    title: 'Dashboard - Avaltrust'
  },
  {
    path: 'portfolio',
    component: PortfolioComponent,
    canActivate: [authGuard],
    title: 'Cargue de Cartera - Avaltrust'
  },
  {
    path: 'claims',
    component: ClaimsComponent,
    canActivate: [authGuard]
  },
  // Wildcard to catch-all
  { path: '**', redirectTo: 'dashboard' },
];
