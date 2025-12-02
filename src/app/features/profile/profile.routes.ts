import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/user-profile/user-profile').then(m => m.UserProfile)
  },
  {
    path: 'edit',
    loadComponent: () => import('./pages/edit-profile/edit-profile').then(m => m.EditProfile)
  },
  {
    path: ':userName',
    loadComponent: () => import('./pages/user-profile/user-profile').then(m => m.UserProfile)
  }
];