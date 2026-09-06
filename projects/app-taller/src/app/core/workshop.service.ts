import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_WORKSHOP } from './api-routes';
import { Inspection, ObservationInput, Observation, ServiceOffer, ServiceOrder } from './workshop.model';

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private readonly http = inject(HttpClient);

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
