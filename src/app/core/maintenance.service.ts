import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { MaintenanceRecord, MaintenanceRecordInput } from './vehicle.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1`;

  list(vehicleId: number): Observable<MaintenanceRecord[]> {
    return this.http.get<MaintenanceRecord[]>(this.url(vehicleId));
  }

  create(vehicleId: number, input: MaintenanceRecordInput): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(this.url(vehicleId), { maintenanceRecord: input });
  }

  private url(vehicleId: number): string {
    return `${this.baseUrl}/vehicles/${vehicleId}/maintenance_records`;
  }
}
