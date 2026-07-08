import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SearchItem {
  type: 'project' | 'task' | 'wiki';
  id: number;
  title: string;
  subtitle?: string | null;
  snippet?: string | null;
}

export interface SearchResponse {
  query: string;
  total: number;
  projects: SearchItem[];
  tasks: SearchItem[];
  wiki: SearchItem[];
}

/** Server-side global full-text search across projects, tasks and wiki pages (tenant-scoped). */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private base = '/search';
  constructor(private api: ApiService) {}

  search(query: string, limit = 8): Observable<SearchResponse> {
    const params = new HttpParams().set('q', query).set('limit', String(limit));
    return this.api.get<SearchResponse>(this.base, params);
  }
}
