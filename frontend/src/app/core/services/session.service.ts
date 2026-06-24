import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface UserSession {
  id: number;
  device: string;
  ipAddress: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private base = '/sessions';

  constructor(private api: ApiService) {}

  /** The current user's active sessions (devices). */
  list(): Observable<any> {
    return this.api.get<any>(this.base);
  }

  /** Revoke one of my own sessions. */
  revoke(id: number): Observable<any> {
    return this.api.delete<any>(`${this.base}/${id}`);
  }

  /** Sign out of every other device but this one. */
  revokeOthers(): Observable<any> {
    return this.api.post<any>(`${this.base}/revoke-others`, {});
  }

  /** Admin-only: force-logout a user (revoke all their sessions). */
  adminRevokeAll(userId: number): Observable<any> {
    return this.api.post<any>(`${this.base}/admin/revoke/${userId}`, {});
  }
}
