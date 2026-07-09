import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardLayout {
  widgets: string[];
}

/** Per-user customizable dashboard layout (ordered KPI widget keys). */
@Injectable({ providedIn: 'root' })
export class DashboardLayoutService {
  private base = '/dashboard-layout';
  constructor(private api: ApiService) {}

  get(): Observable<DashboardLayout> { return this.api.get<DashboardLayout>(this.base); }
  save(widgets: string[]): Observable<DashboardLayout> { return this.api.put<DashboardLayout>(this.base, { widgets }); }
}
