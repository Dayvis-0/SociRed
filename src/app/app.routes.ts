import { Routes } from '@angular/router';
import { HomePage } from './features/home/pages/home-page/home-page';

export const routes: Routes = [
    { path: '', component : HomePage, title: 'Inicio'},
    { path: '', component : HomePage, title: 'Inicio'},
    { path: '**', redirectTo : ''},
];
