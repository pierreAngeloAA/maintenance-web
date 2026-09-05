import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { API_CLIENT, API_SHARED } from '@shared/core/api-routes';
import {
  PartRisk,
  Recall,
  RecallsResponse,
  RisksResponse,
  Vehicle,
  VehicleInput,
  VinLookup,
} from './vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);

  list(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${API_CLIENT}/vehicles`);
  }

  get(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${API_CLIENT}/vehicles/${id}`);
  }

  create(input: VehicleInput): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${API_CLIENT}/vehicles`, { vehicle: input });
  }

  /** Riesgo de falla por pieza, ya ordenado de mayor a menor por el API. */
  risks(vehicleId: number): Observable<PartRisk[]> {
    return this.http
      .get<RisksResponse>(`${API_CLIENT}/vehicles/${vehicleId}/risks`)
      .pipe(map((response) => response.risks));
  }

  /**
   * Recalls de NHTSA. Una lista vacia no significa que el vehiculo este sano:
   * puede ser que NHTSA no lo cubra, cosa comun en Colombia.
   */
  recalls(vehicleId: number): Observable<Recall[]> {
    return this.http
      .get<RecallsResponse>(`${API_CLIENT}/vehicles/${vehicleId}/recalls`)
      .pipe(map((response) => response.recalls));
  }

  /**
   * Autocompletado por VIN. Nunca propaga el error: si el API falla, el usuario
   * llena los datos a mano y el formulario sigue funcionando.
   */
  lookupVin(vin: string): Observable<VinLookup> {
    const normalized = vin.replace(/\s+/g, '').toUpperCase();

    return this.http
      .get<VinLookup>(`${API_SHARED}/vin_lookups/${normalized}`)
      .pipe(catchError(() => of(emptyLookup(normalized))));
  }
}

function emptyLookup(vin: string): VinLookup {
  return { vin, found: false, make: null, model: null, modelYear: null, vehicleType: null };
}
