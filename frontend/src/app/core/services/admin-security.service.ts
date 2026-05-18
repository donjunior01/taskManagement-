import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface LoginAttempt {
  id: number;
  username: string;
  ipAddress: string;
  success: boolean;
  attemptedAt: string;
}

export interface SecurityMetrics {
  totalAttempts: number;
  failedAttempts: number;
  blockedIps: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminSecurityService {
  constructor(private apiService: ApiService) {}

  getLoginAttempts(): Observable<LoginAttempt[]> {
    return this.apiService.get<LoginAttempt[]>('/admin/security/login-attempts');
  }

  getSecurityMetrics(): Observable<SecurityMetrics> {
    return this.apiService.get<SecurityMetrics>('/admin/security/metrics');
  }

  deleteAllLoginAttempts(): Observable<void> {
    return this.apiService.delete<void>('/admin/security/login-attempts/all');
  }

  getPendingPasswordResets(): Observable<any[]> {
    return this.apiService.get<any[]>('/auth/password-reset/pending');
  }

  approvePasswordReset(requestId: number): Observable<void> {
    return this.apiService.post<void>(`/auth/password-reset/${requestId}/approve`, {});
  }

  rejectPasswordReset(requestId: number): Observable<void> {
    return this.apiService.post<void>(`/auth/password-reset/${requestId}/reject`, {});
  }
}
