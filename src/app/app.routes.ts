import { Routes } from '@angular/router';

import { VehicleDetail } from './vehicles/vehicle-detail/vehicle-detail';
import { VehicleForm } from './vehicles/vehicle-form/vehicle-form';
import { VehicleList } from './vehicles/vehicle-list/vehicle-list';
import { MaintenanceForm } from './vehicles/maintenance-form/maintenance-form';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'vehicles' },
  { path: 'vehicles', component: VehicleList },
  // Tiene que ir antes de 'vehicles/:id': si no, ':id' se traga la palabra "new".
  { path: 'vehicles/new', component: VehicleForm },
  { path: 'vehicles/:id', component: VehicleDetail },
  { path: 'vehicles/:id/maintenance/new', component: MaintenanceForm },
];
