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
    // Large page so the security journal + 90-day heatmap have enough history.
    return this.apiService.get<LoginAttempt[]>('/admin/security/login-attempts?page=0&size=1000');
  }

  getSecurityMetrics(): Observable<SecurityMetrics> {
    return this.apiService.get<SecurityMetrics>('/admin/security/metrics');
  }

  /** Suspicious IPs aggregated server-side from failed login attempts. */
  getSuspiciousIps(): Observable<any[]> {
    return this.apiService.get<any[]>('/admin/security/suspicious-ips');
  }

  deleteAllLoginAttempts(): Observable<void> {
    return this.apiService.delete<void>('/admin/security/login-attempts/all');
  }

  /** Admin IP blocking — blocked IPs are refused at login. */
  getBlockedIps(): Observable<any[]> {
    return this.apiService.get<any[]>('/admin/security/blocked-ips');
  }

  blockIp(ipAddress: string, reason?: string): Observable<any> {
    return this.apiService.post<any>('/admin/security/blocked-ips/block', { ipAddress, reason });
  }

  unblockIp(ipAddress: string): Observable<any> {
    return this.apiService.post<any>('/admin/security/blocked-ips/unblock', { ipAddress });
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
