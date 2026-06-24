import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  createdByName?: string;
  createdAt?: string;
  lastUsedAt?: string;
  revoked: boolean;
  plaintextKey?: string; // only on creation
}

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private base = '/api-keys';
  constructor(private api: ApiService) {}

  list(): Observable<ApiKey[]> { return this.api.get<ApiKey[]>(this.base); }
  create(name: string): Observable<any> { return this.api.post<any>(this.base, { name }); }
  revoke(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }
}
