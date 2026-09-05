import { Routes } from '@angular/router';

import { VehicleDetail } from './vehicles/vehicle-detail/vehicle-detail';
import { VehicleForm } from './vehicles/vehicle-form/vehicle-form';
import { VehicleList } from './vehicles/vehicle-list/vehicle-list';
import { MaintenanceForm } from './vehicles/maintenance-form/maintenance-form';
import { Login } from '@shared/auth/login/login';
import { Register } from '@shared/auth/register/register';
import { authGuard } from '@shared/core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'vehicles' },

  // Publicas.
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // Todo lo demas exige sesion: el API tambien lo exige.
  { path: 'vehicles', component: VehicleList, canActivate: [authGuard] },
  // Tiene que ir antes de 'vehicles/:id': si no, ':id' se traga la palabra "new".
  { path: 'vehicles/new', component: VehicleForm, canActivate: [authGuard] },
  { path: 'vehicles/:id', component: VehicleDetail, canActivate: [authGuard] },
  { path: 'vehicles/:id/maintenance/new', component: MaintenanceForm, canActivate: [authGuard] },
];
