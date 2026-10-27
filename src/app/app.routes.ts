import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'login', loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./pages/register.component').then((m) => m.RegisterComponent), canActivate: [guestGuard] },
  { path: '**', redirectTo: '' },
];
