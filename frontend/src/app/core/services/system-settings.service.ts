import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface SystemSettings {
  // Général
  appName: string;
  logoUrl: string | null;
  pdfHeaderColor: string;
  pdfFooterColor: string;
  pdfFooterText: string;
  defaultLanguage: string;
  timezone: string;
  // Sécurité
  jwtValidityMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireDigit: boolean;
  passwordRequireSpecial: boolean;
  passwordExpiryDays: number;
  twoFactorRequiredAdmins: boolean;
  maintenanceMode: boolean;
  // Notifications
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSender: string;
  notifyOnRegistration: boolean;
  notifyOnTaskAssigned: boolean;
  notifyOnDeliverableSubmitted: boolean;
  notifyOnSuspiciousLogin: boolean;
  notifyOnProjectOverdue: boolean;
  // Sauvegarde
  backupRetentionDays: number;
  // Général — uploads
  maxFileUploadMb: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
}

@Injectable({ providedIn: 'root' })
export class SystemSettingsService {
  /** Live application settings — components can subscribe to react to the configured app name. */
  private settingsSubject = new BehaviorSubject<SystemSettings | null>(null);
  public settings$ = this.settingsSubject.asObservable();

  constructor(private api: ApiService) {}

  get current(): SystemSettings | null {
    return this.settingsSubject.value;
  }

  load(): Observable<SystemSettings> {
    return this.api.get<SystemSettings>('/settings').pipe(
      tap(s => this.settingsSubject.next(s))
    );
  }

  /** Public password policy (no auth) — for the registration page's live guidance/validation. */
  getPasswordPolicy(): Observable<PasswordPolicy> {
    return this.api.get<PasswordPolicy>('/settings/password-policy');
  }

  updateGeneral(patch: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.api.put<SystemSettings>('/settings/general', patch).pipe(
      tap(s => this.settingsSubject.next(s))
    );
  }

  updateSecurity(patch: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.api.put<SystemSettings>('/settings/security', patch).pipe(
      tap(s => this.settingsSubject.next(s))
    );
  }

  updateNotifications(patch: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.api.put<SystemSettings>('/settings/notifications', patch).pipe(
      tap(s => this.settingsSubject.next(s))
    );
  }

  updateBackup(patch: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.api.put<SystemSettings>('/settings/backup', patch).pipe(
      tap(s => this.settingsSubject.next(s))
    );
  }
}
