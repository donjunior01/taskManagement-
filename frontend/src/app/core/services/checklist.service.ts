import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ChecklistItem {
  id?: number;
  taskId?: number;
  title: string;
  completed: boolean;
  position?: number;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  constructor(private apiService: ApiService) {}

  getItems(taskId: number): Observable<any> {
    return this.apiService.get<any>(`/tasks/${taskId}/checklist`);
  }

  addItem(taskId: number, title: string): Observable<any> {
    return this.apiService.post<any>(`/tasks/${taskId}/checklist`, { title });
  }

  toggle(itemId: number): Observable<any> {
    return this.apiService.patch<any>(`/tasks/checklist/${itemId}/toggle`, {});
  }

  delete(itemId: number): Observable<any> {
    return this.apiService.delete<any>(`/tasks/checklist/${itemId}`);
  }
}
