import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [publicGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'feed',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/pages/feed/feed').then(m => m.Feed)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes)
  },
  {
    path: 'friends',
    canActivate: [authGuard],
    loadChildren: () => import('./features/friends/friends.routes').then(m => m.friendsRoutes)
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  },
];