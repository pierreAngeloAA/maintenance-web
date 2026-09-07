import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_WORKSHOP } from './api-routes';
import {
  Inspection,
  ObservationInput,
  Observation,
  ServiceOffer,
  ServiceOrder,
  WorkshopMaintenanceRecord,
  WorkshopVehicle,
} from './workshop.model';

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private readonly http = inject(HttpClient);

  /** Los vehiculos con permiso vigente: los que entraron a este taller. */
  vehicles(): Observable<WorkshopVehicle[]> {
    return this.http.get<WorkshopVehicle[]>(`${API_WORKSHOP}/vehicles`);
  }

  vehicle(vehicleId: number): Observable<WorkshopVehicle> {
    return this.http.get<WorkshopVehicle>(`${API_WORKSHOP}/vehicles/${vehicleId}`);
  }

  /** Todo lo que se le ha hecho al vehiculo, lo haya hecho quien lo haya hecho. */
  history(vehicleId: number): Observable<WorkshopMaintenanceRecord[]> {
    return this.http.get<WorkshopMaintenanceRecord[]>(
      `${API_WORKSHOP}/vehicles/${vehicleId}/maintenance_records`,
    );
  }

  offers(): Observable<ServiceOffer[]> {
    return this.http.get<ServiceOffer[]>(`${API_WORKSHOP}/service_offers`);
  }

  /** Tomar el servicio: el API crea la orden y el permiso sobre el vehiculo. */
  takeOffer(offerId: number): Observable<ServiceOrder> {
    return this.http.patch<ServiceOrder>(`${API_WORKSHOP}/service_offers/${offerId}`, {});
  }

  dismissOffer(offerId: number): Observable<unknown> {
    return this.http.delete(`${API_WORKSHOP}/service_offers/${offerId}`);
  }

  orders(): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${API_WORKSHOP}/service_orders`);
  }

  moveOrder(orderId: number, status: string): Observable<ServiceOrder> {
    return this.http.patch<ServiceOrder>(`${API_WORKSHOP}/service_orders/${orderId}`, { status });
  }

  /** Abre la visita, o retoma la que quedo a medias. */
  openInspection(vehicleId: number, usageValue: number, serviceOrderId?: number): Observable<Inspection> {
    return this.http.post<Inspection>(`${API_WORKSHOP}/inspections`, {
      inspection: { vehicleId, usageValue, serviceOrderId },
    });
  }

  inspection(id: number): Observable<Inspection> {
    return this.http.get<Inspection>(`${API_WORKSHOP}/inspections/${id}`);
  }

  /**
   * Cada medicion se manda apenas se toma, no todas al final: si se cierra la
   * app a mitad de la visita, lo que ya se midio no se pierde.
   */
  measure(inspectionId: number, input: ObservationInput): Observable<Observation> {
    return this.http.post<Observation>(
      `${API_WORKSHOP}/inspections/${inspectionId}/observations`,
      { observation: input },
    );
  }

  closeInspection(inspectionId: number, latitude: number | null, longitude: number | null, photos: File[], summary?: string): Observable<Inspection> {
    const form = new FormData();

    if (latitude !== null && longitude !== null) {
      form.append('inspection[latitude]', String(latitude));
      form.append('inspection[longitude]', String(longitude));
    }

    if (summary) {
      form.append('inspection[summary]', summary);
    }

    photos.forEach((photo) => form.append('photos[]', photo));

    return this.http.patch<Inspection>(`${API_WORKSHOP}/inspections/${inspectionId}`, form);
  }
}
