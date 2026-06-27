import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Invitation {
  id?: number;
  email: string;
  role: string;
  invitedByName?: string;
  createdAt?: string;
  expiresAt?: string;
  accepted?: boolean;
  acceptUrl?: string;
  organizationName?: string;
  valid?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InvitationService {
  constructor(private api: ApiService) {}

  // --- Admin (requires user.manage) ---
  list(): Observable<Invitation[]> { return this.api.get<Invitation[]>('/invitations'); }
  create(email: string, role: string): Observable<any> { return this.api.post<any>('/invitations', { email, role }); }
  revoke(id: number): Observable<any> { return this.api.delete<any>(`/invitations/${id}`); }

  // --- Public (invitee, no auth) ---
  lookup(token: string): Observable<any> { return this.api.get<any>(`/auth/invite/${token}`); }
  accept(payload: { token: string; username: string; firstName: string; lastName: string; password: string }): Observable<any> {
    return this.api.post<any>('/auth/invite/accept', payload);
  }
}
