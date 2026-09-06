import { Routes } from '@angular/router';

import { Login } from '@shared/auth/login/login';
import { Register } from '@shared/auth/register/register';
import { authGuard } from '@shared/core/auth.guard';
import { Catalogo } from './catalogo/catalogo';
import { Ventas } from './ventas/ventas';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalogo' },

  // Publicas: la identidad es una sola, se entra por cualquiera de las tres apps.
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  { path: 'catalogo', component: Catalogo, canActivate: [authGuard] },
  { path: 'ventas', component: Ventas, canActivate: [authGuard] },
];
