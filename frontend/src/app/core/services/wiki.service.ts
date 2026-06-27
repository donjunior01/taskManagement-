import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface WikiPage {
  id?: number;
  title: string;
  content?: string | null;
  parentId?: number | null;
  icon?: string | null;
  createdById?: number;
  createdByName?: string;
  updatedById?: number;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class WikiService {
  private base = '/wiki-pages';
  constructor(private api: ApiService) {}

  list(): Observable<WikiPage[]> { return this.api.get<WikiPage[]>(this.base); }
  get(id: number): Observable<WikiPage> { return this.api.get<WikiPage>(`${this.base}/${id}`); }
  create(p: WikiPage): Observable<any> { return this.api.post<any>(this.base, p); }
  update(id: number, p: WikiPage): Observable<any> { return this.api.put<any>(`${this.base}/${id}`, p); }
  delete(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }
}
