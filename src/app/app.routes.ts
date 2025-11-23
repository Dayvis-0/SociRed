import { Routes } from '@angular/router';
import { HomePage } from './features/home/pages/home-page/home-page';
import { FriendsPage } from './features/friends/pages/friends-page/friends-page';
import { ProfilePage } from './features/profile/pages/profile-page/profile-page';
import { Login } from './features/auth/pages/login/login';

export const routes: Routes = [
    { path: '', component : HomePage, title: 'SociAmigos'},
    { path: 'login', component : Login, title: 'Login | SociAmigos'},
    { path: 'home', component : HomePage, title: 'SociAmigos'},
    { path: 'friends', component : FriendsPage, title: 'Amigos | SociAmigos'},
    { path: 'profile', component : ProfilePage, title: 'Perfil | SociAmigos'},
    { path: '**', redirectTo : ''},
];
