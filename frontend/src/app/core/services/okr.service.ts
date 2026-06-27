import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type ObjectiveStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'ACHIEVED';

export interface KeyResult {
  id?: number;
  objectiveId?: number;
  title: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit?: string | null;
}

export interface Objective {
  id?: number;
  title: string;
  description?: string | null;
  period?: string | null;
  ownerId?: number | null;
  ownerName?: string | null;
  status: ObjectiveStatus;
  createdAt?: string;
  keyResults?: KeyResult[];
}

@Injectable({ providedIn: 'root' })
export class OkrService {
  private base = '/okrs';
  constructor(private api: ApiService) {}

  list(): Observable<Objective[]> { return this.api.get<Objective[]>(this.base); }
  createObjective(o: Objective): Observable<any> { return this.api.post<any>(this.base, o); }
  updateObjective(id: number, o: Objective): Observable<any> { return this.api.put<any>(`${this.base}/${id}`, o); }
  deleteObjective(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }
  addKeyResult(objectiveId: number, kr: KeyResult): Observable<any> { return this.api.post<any>(`${this.base}/${objectiveId}/key-results`, kr); }
  updateKeyResult(krId: number, kr: KeyResult): Observable<any> { return this.api.put<any>(`${this.base}/key-results/${krId}`, kr); }
  deleteKeyResult(krId: number): Observable<any> { return this.api.delete<any>(`${this.base}/key-results/${krId}`); }

  /** Key-result progress 0–100 from its start/current/target values. */
  krProgress(kr: KeyResult): number {
    const span = (kr.targetValue ?? 0) - (kr.startValue ?? 0);
    if (!span) return (kr.currentValue ?? 0) >= (kr.targetValue ?? 0) ? 100 : 0;
    const p = ((kr.currentValue ?? 0) - (kr.startValue ?? 0)) / span * 100;
    return Math.max(0, Math.min(100, Math.round(p)));
  }

  /** Objective progress = average of its key results' progress. */
  objectiveProgress(o: Objective): number {
    const krs = o.keyResults || [];
    if (!krs.length) return 0;
    return Math.round(krs.reduce((s, k) => s + this.krProgress(k), 0) / krs.length);
  }
}
