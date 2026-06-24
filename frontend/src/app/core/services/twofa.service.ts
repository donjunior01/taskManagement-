import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface TwoFactorSetup {
  secret: string;
  otpauthUri: string;
}

@Injectable({
  providedIn: 'root'
})
export class TwoFactorService {
  private base = '/2fa';

  constructor(private apiService: ApiService) {}

  status(): Observable<any> {
    return this.apiService.get<any>(`${this.base}/status`);
  }

  setup(): Observable<any> {
    return this.apiService.post<any>(`${this.base}/setup`, {});
  }

  enable(code: string): Observable<any> {
    return this.apiService.post<any>(`${this.base}/enable`, { code });
  }

  disable(code: string): Observable<any> {
    return this.apiService.post<any>(`${this.base}/disable`, { code });
  }

  /** Admin-only: clear another user's 2FA so they can re-enrol (account recovery). */
  adminReset(userId: number): Observable<any> {
    return this.apiService.post<any>(`${this.base}/admin/reset/${userId}`, {});
  }

  /** Regenerate one-time recovery codes (requires a current code). */
  regenerateRecoveryCodes(code: string): Observable<any> {
    return this.apiService.post<any>(`${this.base}/recovery-codes/regenerate`, { code });
  }
}
