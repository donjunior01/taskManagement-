import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Notification {
  id: number;
  title?: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  userId: number;
  referenceId?: number;
  referenceType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private basePath = '/notifications';

  constructor(private apiService: ApiService) {}

  getNotifications(): Observable<Notification[]> {
    return this.apiService.get<Notification[]>(this.basePath);
  }

  getUnreadNotifications(): Observable<Notification[]> {
    return this.apiService.get<Notification[]>(`${this.basePath}/unread`);
  }

  getUnreadCount(): Observable<number> {
    return this.apiService.get<number>(`${this.basePath}/count`);
  }

  markAsRead(id: number): Observable<void> {
    return this.apiService.post<void>(`${this.basePath}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.apiService.post<void>(`${this.basePath}/read-all`, {});
  }

  deleteNotification(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
