import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface TaskTemplate {
  id?: number;
  name: string;
  taskName?: string | null;
  description?: string | null;
  priority: string;
  difficulty: string;
  defaultDeadlineDays?: number | null;
  customFields?: { [key: string]: string };
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaskTemplateService {
  private base = '/task-templates';
  constructor(private api: ApiService) {}

  /** Active templates, for the "create from template" flow. */
  listActive(): Observable<TaskTemplate[]> { return this.api.get<TaskTemplate[]>(this.base); }
  /** All templates including disabled, for the management page. */
  listAll(): Observable<TaskTemplate[]> { return this.api.get<TaskTemplate[]>(`${this.base}/all`); }
  create(t: TaskTemplate): Observable<any> { return this.api.post<any>(this.base, t); }
  update(id: number, t: TaskTemplate): Observable<any> { return this.api.put<any>(`${this.base}/${id}`, t); }
  delete(id: number): Observable<any> { return this.api.delete<any>(`${this.base}/${id}`); }
}
