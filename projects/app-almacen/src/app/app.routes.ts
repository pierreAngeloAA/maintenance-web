import { Routes } from '@angular/router';

import { Login } from '@shared/auth/login/login';
import { Register } from '@shared/auth/register/register';
import { authGuard } from '@shared/core/auth.guard';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },

  // Publicas: la identidad es una sola, se entra por cualquiera de las tres apps.
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  { path: 'inicio', component: Home, canActivate: [authGuard] },
];
