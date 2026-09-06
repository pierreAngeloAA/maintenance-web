import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_SHARED } from '@shared/core/api-routes';
import { Fitment, FitmentInput, Order, PartType, Product, ProductInput } from './store.model';

const API_STORE = `${API_SHARED}/store`;

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);

  products(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_STORE}/products`);
  }

  createProduct(input: ProductInput): Observable<Product> {
    return this.http.post<Product>(`${API_STORE}/products`, { product: input });
  }

  /** Cambiar un precio o un stock no deberia costar tres pantallas. */
  updateProduct(id: number, input: Partial<ProductInput>): Observable<Product> {
    return this.http.patch<Product>(`${API_STORE}/products/${id}`, { product: input });
  }

  fitments(productId: number): Observable<Fitment[]> {
    return this.http.get<Fitment[]>(`${API_STORE}/products/${productId}/fitments`);
  }

  addFitment(productId: number, input: FitmentInput): Observable<Fitment> {
    return this.http.post<Fitment>(`${API_STORE}/products/${productId}/fitments`, {
      fitment: input,
    });
  }

  removeFitment(productId: number, id: number): Observable<unknown> {
    return this.http.delete(`${API_STORE}/products/${productId}/fitments/${id}`);
  }

  orders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_STORE}/orders`);
  }

  moveOrder(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${API_STORE}/orders/${id}`, { status });
  }

  /** El catalogo de piezas es compartido: baja del API, nunca se hardcodea. */
  partTypes(): Observable<PartType[]> {
    return this.http.get<PartType[]>(`${API_SHARED}/part_types`);
  }
}
