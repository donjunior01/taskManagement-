import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type StatusCategory = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface WorkflowStatus {
  id?: number;
  name: string;
  category: StatusCategory;
  color?: string | null;
  displayOrder: number;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private base = '/workflow-statuses';
  constructor(private api: ApiService) {}

  /** Active statuses, ordered — used to render the Kanban columns. */
  listActive(): Observable<WorkflowStatus[]> { return this.api.get<WorkflowStatus[]>(this.base); }
  listAll(): Observable<WorkflowStatus[]> { return this.api.get<WorkflowStatus[]>(`${this.base}/all`); }
  create(s: WorkflowStatus): Observable<any> { return this.api.post<any>(this.base, s); }
  update(id: number, s: WorkflowStatus): Observable<any> { return this.api.put<any>(`${this.base}/${id}`, s); }
  delete(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }
}
