import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface NotificationPreference {
  id?: number;
  userId?: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  taskUpdates: boolean;
  mentions: boolean;
  systemAlerts: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationPreferencesService {
  private basePath = '/notification-preferences';

  constructor(private apiService: ApiService) {}

  getAllPreferences(): Observable<NotificationPreference[]> {
    return this.apiService.get<NotificationPreference[]>(this.basePath);
  }

  getMyPreferences(): Observable<NotificationPreference> {
    return this.apiService.get<NotificationPreference>(`${this.basePath}/my-preferences`);
  }

  getUserPreferences(userId: number): Observable<NotificationPreference> {
    return this.apiService.get<NotificationPreference>(`${this.basePath}/user/${userId}`);
  }

  createPreferences(prefs: NotificationPreference): Observable<NotificationPreference> {
    return this.apiService.post<NotificationPreference>(this.basePath, prefs);
  }

  updateMyPreferences(prefs: NotificationPreference): Observable<NotificationPreference> {
    return this.apiService.put<NotificationPreference>(`${this.basePath}/my-preferences`, prefs);
  }

  updateUserPreferences(userId: number, prefs: NotificationPreference): Observable<NotificationPreference> {
    return this.apiService.put<NotificationPreference>(`${this.basePath}/user/${userId}`, prefs);
  }

  deleteMyPreferences(): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/my-preferences`);
  }
}
