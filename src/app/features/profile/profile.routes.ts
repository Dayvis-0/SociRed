import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/user-profile/user-profile').then(m => m.UserProfile)
  }
];