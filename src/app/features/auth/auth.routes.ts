import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.Register)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'complete-profile',
    loadComponent: () => import('./pages/complete-profile/complete-profile').then(m => m.CompleteProfile)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];