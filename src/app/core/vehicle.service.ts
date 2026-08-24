import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { Recall, RecallsResponse, Vehicle, VehicleInput, VinLookup } from './vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1`;

  list(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.baseUrl}/vehicles`);
  }

  get(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.baseUrl}/vehicles/${id}`);
  }

  create(input: VehicleInput): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.baseUrl}/vehicles`, { vehicle: input });
  }

  /**
   * Recalls de NHTSA. Una lista vacia no significa que el vehiculo este sano:
   * puede ser que NHTSA no lo cubra, cosa comun en Colombia.
   */
  recalls(vehicleId: number): Observable<Recall[]> {
    return this.http
      .get<RecallsResponse>(`${this.baseUrl}/vehicles/${vehicleId}/recalls`)
      .pipe(map((response) => response.recalls));
  }

  /**
   * Autocompletado por VIN. Nunca propaga el error: si el API falla, el usuario
   * llena los datos a mano y el formulario sigue funcionando.
   */
  lookupVin(vin: string): Observable<VinLookup> {
    const normalized = vin.replace(/\s+/g, '').toUpperCase();

    return this.http
      .get<VinLookup>(`${this.baseUrl}/vin_lookups/${normalized}`)
      .pipe(catchError(() => of(emptyLookup(normalized))));
  }
}

function emptyLookup(vin: string): VinLookup {
  return { vin, found: false, make: null, model: null, modelYear: null, vehicleType: null };
}
