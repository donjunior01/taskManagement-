import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';

export interface ActivityLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  userId: number;
  timestamp: string;
  details?: string;
  user?: any; // Add specific user type if available
}

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private basePath = '/activity-logs';

  constructor(private apiService: ApiService) {}

  getAllActivityLogs(): Observable<ActivityLog[]> {
    return this.apiService.get<ActivityLog[]>(this.basePath);
  }

  getActivityLogsByUser(userId: number): Observable<ActivityLog[]> {
    return this.apiService.get<ActivityLog[]>(`${this.basePath}/user/${userId}`);
  }

  getActivityLogsByType(activityType: string): Observable<ActivityLog[]> {
    return this.apiService.get<ActivityLog[]>(`${this.basePath}/type/${activityType}`);
  }

  getActivityLogsByEntity(entityType: string, entityId: number): Observable<ActivityLog[]> {
    return this.apiService.get<ActivityLog[]>(`${this.basePath}/entity/${entityType}/${entityId}`);
  }

  getActivityLogsByDateRange(startDate: string, endDate: string): Observable<ActivityLog[]> {
    let params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.apiService.get<ActivityLog[]>(`${this.basePath}/date-range`, params);
  }
}
