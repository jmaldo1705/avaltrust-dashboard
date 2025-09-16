import { Routes } from '@angular/router';
import { authGuard, adminGuard, userGuard } from './auth/auth.guard';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminComponent } from './admin/admin.component';
import { UserComponent } from './user/user.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Iniciar sesión - Avaltrust'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    title: 'Dashboard - Avaltrust'
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    title: 'Panel Admin - Avaltrust'
  },
  {
    path: 'user',
    component: UserComponent,
    canActivate: [userGuard],
    title: 'Área Usuario - Avaltrust'
  },
  // Si necesitas rutas anidadas para admin, usa esta estructura:
  /*
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        component: AdminComponent,
        title: 'Panel Admin - Avaltrust'
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/manage-users/manage-users.component').then(m => m.ManageUsersComponent),
        title: 'Gestionar Usuarios - Avaltrust'
      },
      {
        path: 'reports',
        loadComponent: () => import('./admin/reports/reports.component').then(m => m.ReportsComponent),
        title: 'Reportes - Avaltrust'
      }
    ]
  },
  */
  // Wildcard to catch-all
  { path: '**', redirectTo: 'dashboard' },
];
