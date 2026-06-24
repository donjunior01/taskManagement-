import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Webhook {
  id?: number;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  lastStatus?: number;
  lastDeliveryAt?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class WebhookService {
  private base = '/webhooks';
  constructor(private api: ApiService) {}

  catalog(): Observable<string[]> { return this.api.get<string[]>(`${this.base}/events`); }
  list(): Observable<Webhook[]> { return this.api.get<Webhook[]>(this.base); }
  create(w: Webhook): Observable<any> { return this.api.post<any>(this.base, w); }
  update(id: number, w: Webhook): Observable<any> { return this.api.put<any>(`${this.base}/${id}`, w); }
  delete(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }
  test(id: number): Observable<any> { return this.api.post<any>(`${this.base}/${id}/test`, {}); }
}
