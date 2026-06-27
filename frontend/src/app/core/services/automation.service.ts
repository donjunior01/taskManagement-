import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AutomationRule {
  id?: number;
  name: string;
  enabled: boolean;
  trigger: string;
  conditionField?: string | null;
  conditionValue?: string | null;
  actionType: string;
  actionValue?: string | null;
  runCount?: number;
  lastRunAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AutomationService {
  private base = '/automations';
  constructor(private api: ApiService) {}

  meta(): Observable<any> { return this.api.get<any>(`${this.base}/meta`); }
  list(): Observable<AutomationRule[]> { return this.api.get<AutomationRule[]>(this.base); }
  create(r: AutomationRule): Observable<any> { return this.api.post<any>(this.base, r); }
  update(id: number, r: AutomationRule): Observable<any> { return this.api.put<any>(`${this.base}/${id}`, r); }
  toggle(id: number): Observable<any> { return this.api.post<any>(`${this.base}/${id}/toggle`, {}); }
  delete(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }
}
