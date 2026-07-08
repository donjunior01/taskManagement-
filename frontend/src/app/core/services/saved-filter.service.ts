import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SavedFilter {
  id?: number;
  name: string;
  resource?: string;
  criteria?: string | null;   // opaque JSON string (frontend-defined)
  shared?: boolean;
  createdAt?: string;
}

/** Server-side saved filters / views (per-user, tenant-scoped, optionally shared org-wide). */
@Injectable({ providedIn: 'root' })
export class SavedFilterService {
  private base = '/saved-filters';
  constructor(private api: ApiService) {}

  list(resource = 'tasks'): Observable<SavedFilter[]> {
    return this.api.get<SavedFilter[]>(this.base, new HttpParams().set('resource', resource));
  }
  create(f: SavedFilter): Observable<SavedFilter> { return this.api.post<SavedFilter>(this.base, f); }
  update(id: number, f: SavedFilter): Observable<SavedFilter> { return this.api.put<SavedFilter>(`${this.base}/${id}`, f); }
  delete(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }
}
