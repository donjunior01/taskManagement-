import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Deliverable {
  id?: number;
  taskId?: number;
  taskName?: string;
  submittedById?: number;
  submittedByName?: string;
  fileName: string;
  fileUrl?: string;
  status: string;
  comments?: string;
  reviewedById?: number;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliverableSubmitRequest {
  taskId: number;
  fileName: string;
  fileUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeliverableService {
  private basePath = '/deliverables';

  constructor(private apiService: ApiService) {}

  getAllDeliverables(): Observable<Deliverable[]> {
    return this.apiService.get<any>(this.basePath).pipe(
      map(r => r && r.data ? r.data : [])
    );
  }

  getDeliverableById(id: number): Observable<Deliverable> {
    return this.apiService.get<any>(`${this.basePath}/${id}`).pipe(
      map(r => r && r.data ? r.data : r)
    );
  }

  getDeliverablesByUser(userId: number): Observable<Deliverable[]> {
    return this.apiService.get<any>(`${this.basePath}/user/${userId}`).pipe(
      map(r => r && r.data ? r.data : [])
    );
  }

  getDeliverablesByTask(taskId: number): Observable<Deliverable[]> {
    return this.apiService.get<any>(`${this.basePath}/task/${taskId}`).pipe(
      map(r => r && r.data ? r.data : [])
    );
  }

  getDeliverablesByStatus(status: string): Observable<Deliverable[]> {
    return this.apiService.get<any>(`${this.basePath}/status/${status}`).pipe(
      map(r => r && r.data ? r.data : [])
    );
  }

  getPendingDeliverables(): Observable<Deliverable[]> {
    return this.apiService.get<any>(`${this.basePath}/pending`).pipe(
      map(r => r && r.data ? r.data : [])
    );
  }

  getMyDeliverables(): Observable<Deliverable[]> {
    return this.apiService.get<any>(`${this.basePath}/my`).pipe(
      map(r => r && r.data ? r.data : [])
    );
  }

  submitDeliverable(request: DeliverableSubmitRequest): Observable<Deliverable> {
    return this.apiService.post<any>(this.basePath, request).pipe(
      map(r => r && r.data ? r.data : r)
    );
  }

  reviewDeliverable(id: number, reviewData: { status: string; comments?: string }): Observable<Deliverable> {
    return this.apiService.put<any>(`${this.basePath}/${id}/review`, reviewData).pipe(
      map(r => r && r.data ? r.data : r)
    );
  }

  deleteDeliverable(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
