import { Routes } from '@angular/router';
import { HomePage } from './features/home/pages/home-page/home-page';
import { FriendsPage } from './features/friends/pages/friends-page/friends-page';

export const routes: Routes = [
    { path: '', component : HomePage, title: 'SociAmigos'},
    { path: 'friends', component : FriendsPage, title: 'Amigos | SociAmigos'},
    { path: '**', redirectTo : ''},
];
