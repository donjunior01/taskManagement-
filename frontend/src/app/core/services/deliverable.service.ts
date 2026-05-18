import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Deliverable {
  id?: number;
  title: string;
  description?: string;
  status: string;
  dueDate: string;
  taskId?: number;
  userId?: number;
  fileUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeliverableService {
  private basePath = '/deliverables';

  constructor(private apiService: ApiService) {}

  getAllDeliverables(): Observable<Deliverable[]> {
    return this.apiService.get<Deliverable[]>(this.basePath);
  }

  getDeliverableById(id: number): Observable<Deliverable> {
    return this.apiService.get<Deliverable>(`${this.basePath}/${id}`);
  }

  getDeliverablesByUser(userId: number): Observable<Deliverable[]> {
    return this.apiService.get<Deliverable[]>(`${this.basePath}/user/${userId}`);
  }

  getDeliverablesByTask(taskId: number): Observable<Deliverable[]> {
    return this.apiService.get<Deliverable[]>(`${this.basePath}/task/${taskId}`);
  }

  getDeliverablesByStatus(status: string): Observable<Deliverable[]> {
    return this.apiService.get<Deliverable[]>(`${this.basePath}/status/${status}`);
  }

  getPendingDeliverables(): Observable<Deliverable[]> {
    return this.apiService.get<Deliverable[]>(`${this.basePath}/pending`);
  }

  getMyDeliverables(): Observable<Deliverable[]> {
    return this.apiService.get<Deliverable[]>(`${this.basePath}/my`);
  }

  submitDeliverable(deliverable: Deliverable): Observable<Deliverable> {
    return this.apiService.post<Deliverable>(this.basePath, deliverable);
  }

  reviewDeliverable(id: number, reviewData: any): Observable<Deliverable> {
    return this.apiService.put<Deliverable>(`${this.basePath}/${id}/review`, reviewData);
  }

  deleteDeliverable(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
