import { Routes } from '@angular/router';

import { Login } from '@shared/auth/login/login';
import { Register } from '@shared/auth/register/register';
import { authGuard } from '@shared/core/auth.guard';
import { Servicios } from './servicios/servicios';
import { Inspeccion } from './inspeccion/inspeccion';
import { Vehiculos } from './vehiculos/vehiculos';
import { Vehiculo } from './vehiculo/vehiculo';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'servicios' },

  // Publicas: la identidad es una sola, se entra por cualquiera de las tres apps.
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  { path: 'servicios', component: Servicios, canActivate: [authGuard] },

  // Los vehiculos que entraron al taller, y la ficha de cada uno con su historial.
  { path: 'vehiculos', component: Vehiculos, canActivate: [authGuard] },
  { path: 'vehiculos/:vehicleId', component: Vehiculo, canActivate: [authGuard] },
  { path: 'inspeccion/:orderId', component: Inspeccion, canActivate: [authGuard] },
];
