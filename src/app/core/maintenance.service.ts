import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CLIENT } from './api-routes';
import { MaintenanceRecord, MaintenanceRecordInput } from './vehicle.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly http = inject(HttpClient);

  list(vehicleId: number): Observable<MaintenanceRecord[]> {
    return this.http.get<MaintenanceRecord[]>(this.url(vehicleId));
  }

  create(vehicleId: number, input: MaintenanceRecordInput): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(this.url(vehicleId), { maintenanceRecord: input });
  }

  private url(vehicleId: number): string {
    return `${API_CLIENT}/vehicles/${vehicleId}/maintenance_records`;
  }
}
