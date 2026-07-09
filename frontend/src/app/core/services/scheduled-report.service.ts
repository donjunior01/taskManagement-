import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ScheduledReport {
  id?: number;
  name: string;
  reportType: 'tasks-csv' | 'projects-csv';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recipients: string;          // comma-separated emails
  enabled?: boolean;
  lastRunOn?: string | null;
  createdAt?: string;
}

/** Recurring report exports (admin/PM). Emails a CSV to recipients on a cadence. */
@Injectable({ providedIn: 'root' })
export class ScheduledReportService {
  private base = '/scheduled-reports';
  constructor(private api: ApiService) {}

  list(): Observable<ScheduledReport[]> { return this.api.get<ScheduledReport[]>(this.base); }
  create(r: ScheduledReport): Observable<any> { return this.api.post<any>(this.base, r); }
  update(id: number, r: ScheduledReport): Observable<any> { return this.api.put<any>(`${this.base}/${id}`, r); }
  delete(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }
  sendNow(id: number): Observable<any> { return this.api.post<any>(`${this.base}/${id}/send`, {}); }
}
