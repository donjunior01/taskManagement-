import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminSecurityService, LoginAttempt, SecurityMetrics } from '../../../core/services/admin-security.service';
import { ToastService } from '../../../core/services/toast.service';
import { TwoFactorService, TwoFactorSetup } from '../../../core/services/twofa.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import { ApiService } from '../../../core/services/api.service';
import { BrandingService } from '../../../core/services/branding.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  // Active configuration tab (prototype)
  activeTab: 'general' | 'security' | 'notifications' | 'integrations' | 'backup' = 'general';
  tabs: { id: 'general' | 'security' | 'notifications' | 'integrations' | 'backup'; labelKey: string }[] = [
    { id: 'general',        labelKey: 'admin.settings.tabGeneral' },
    { id: 'security',       labelKey: 'admin.settings.tabSecurity' },
    { id: 'notifications',  labelKey: 'admin.settings.tabNotifications' },
    { id: 'integrations',   labelKey: 'admin.settings.tabIntegrations' },
    { id: 'backup',         labelKey: 'admin.settings.tabBackup' }
  ];

  // Général tab
  appName: string = 'TaskMaster Pro';
  defaultLanguage: string = 'Français';
  timezone: string = 'Europe/Paris (UTC+1)';

  // Branding — logo + PDF header/footer (applied app-wide & in every generated PDF)
  logoUrl: string | null = null;
  pdfHeaderColor: string = '#1e2540';
  pdfFooterColor: string = '#2563eb';
  pdfFooterText: string = '';

  // Sécurité tab (cosmetic policy fields)
  jwtValidity: number = 60;
  maxAttempts: number = 5;
  lockoutDuration: number = 15;
  passwordMinLength: number = 12;
  passwordExpiry: number = 90;
  pwUpper: boolean = true;
  pwDigit: boolean = true;
  pwSpecial: boolean = true;

  // Notifications tab (SMTP + triggers)
  smtp = { host: 'smtp.gpi.app', port: 587, username: 'noreply@gpi.app', password: '••••••••••••', sender: 'TaskMaster Pro <noreply@gpi.app>' };
  notifTriggers: { key: string; labelKey: string; on: boolean }[] = [
    { key: 'notifyOnRegistration',          labelKey: 'admin.settings.trigRegistration', on: true },
    { key: 'notifyOnTaskAssigned',          labelKey: 'admin.settings.trigTaskAssigned', on: false },
    { key: 'notifyOnDeliverableSubmitted',  labelKey: 'admin.settings.trigDeliverable', on: true },
    { key: 'notifyOnSuspiciousLogin',       labelKey: 'admin.settings.trigSuspicious', on: true },
    { key: 'notifyOnProjectOverdue',        labelKey: 'admin.settings.trigOverdue', on: true }
  ];

  // Intégrations — live Google Calendar connection state
  googleConnected: boolean = false;
  googleStatusKey: string = 'admin.settings.googleChecking';

  // Backup tab
  backupRetentionDays: number = 30;

  // System Configurations Form State
  maxFileUploadSize: number = 50; // MB
  allowedEmailDomains: string = 'corp.net, taskmanagement.com';
  maintenanceMode: boolean = false;
  // Registration access control
  registrationEnabled: boolean = true;
  allowedDomains: string[] = [];
  newDomain: string = '';
  requireTwoFaAdmins: boolean = false;   // policy: force 2FA enrolment on admin accounts
  requireTwoFaAll: boolean = false;      // policy: force 2FA enrolment on every account
  mfaRequirement: boolean = false;
  emailNotificationOnCreate: boolean = true;
  emailNotificationOnDelete: boolean = true;
  idleTimeoutMinutes: number = 30;

  // Server Uptime Vitals
  cpuUtilization: number = 18;
  ramUtilization: number = 42;
  databaseLatency: number = 7;
  redisLatency: number = 1.8;
  activeSessionsCount: number = 34;
  apiUptime: string = '14 jours, 6 heures, 22 minutes';

  // Security & Metrics State
  loginAttempts: LoginAttempt[] = [];
  securityMetrics: SecurityMetrics | null = null;
  pendingResets: any[] = [];
  loadingSecurity: boolean = false;
  
  // Real-time update timers
  private telemetryIntervalId: any;

  // Actions states
  submitting: boolean = false;
  backingUp: boolean = false;
  clearingCache: boolean = false;

  // Two-factor authentication (real)
  twoFaEnabled: boolean = false;
  twoFaSetup: TwoFactorSetup | null = null;
  twoFaQr: string = '';
  twoFaRecoveryCodes: string[] = [];
  twoFaCode: string = '';
  twoFaBusy: boolean = false;

  constructor(
    private securityService: AdminSecurityService,
    private toast: ToastService,
    private twoFactorService: TwoFactorService,
    private settingsService: SystemSettingsService,
    private api: ApiService,
    private branding: BrandingService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startTelemetrySimulators();
    this.loadSecurityData();
    this.loadTwoFaStatus();
    this.loadSystemSettings();
    this.loadGoogleStatus();
  }

  /** Load the persisted General + Security configuration from the backend. */
  loadSystemSettings(): void {
    this.settingsService.load().subscribe({
      next: (s) => {
        // Général
        this.appName = s.appName ?? this.appName;
        this.defaultLanguage = s.defaultLanguage ?? this.defaultLanguage;
        this.timezone = s.timezone ?? this.timezone;
        this.maxFileUploadSize = s.maxFileUploadMb ?? this.maxFileUploadSize;
        // Branding
        this.logoUrl = s.logoUrl ?? null;
        this.pdfHeaderColor = s.pdfHeaderColor ?? this.pdfHeaderColor;
        this.pdfFooterColor = s.pdfFooterColor ?? this.pdfFooterColor;
        this.pdfFooterText = s.pdfFooterText ?? this.pdfFooterText;
        // Sécurité
        this.jwtValidity = s.jwtValidityMinutes ?? this.jwtValidity;
        this.maxAttempts = s.maxLoginAttempts ?? this.maxAttempts;
        this.lockoutDuration = s.lockoutDurationMinutes ?? this.lockoutDuration;
        this.passwordMinLength = s.passwordMinLength ?? this.passwordMinLength;
        this.pwUpper = s.passwordRequireUppercase ?? this.pwUpper;
        this.pwDigit = s.passwordRequireDigit ?? this.pwDigit;
        this.pwSpecial = s.passwordRequireSpecial ?? this.pwSpecial;
        this.passwordExpiry = s.passwordExpiryDays ?? this.passwordExpiry;
        this.maintenanceMode = s.maintenanceMode ?? this.maintenanceMode;
        this.requireTwoFaAdmins = s.twoFactorRequiredAdmins ?? this.requireTwoFaAdmins;
        this.requireTwoFaAll = s.twoFactorRequiredAll ?? this.requireTwoFaAll;
        this.registrationEnabled = s.registrationEnabled ?? this.registrationEnabled;
        this.allowedDomains = (s.allowedEmailDomains || '').split(',').map(d => d.trim().replace(/^@/, '').toLowerCase()).filter(Boolean);
        // Notifications (SMTP + triggers)
        this.smtp.host = s.smtpHost ?? this.smtp.host;
        this.smtp.port = s.smtpPort ?? this.smtp.port;
        this.smtp.username = s.smtpUsername ?? this.smtp.username;
        this.smtp.password = s.smtpPassword ?? this.smtp.password;
        this.smtp.sender = s.smtpSender ?? this.smtp.sender;
        const sAny = s as any;
        this.notifTriggers.forEach(t => {
          if (typeof sAny[t.key] === 'boolean') t.on = sAny[t.key];
        });
        // Sauvegarde
        if (s.backupRetentionDays != null) this.backupRetentionDays = s.backupRetentionDays;
      },
      error: () => { /* keep defaults; backend may be momentarily offline */ }
    });
  }

  /** Live Google Calendar connection state for the Intégrations tab. */
  loadGoogleStatus(): void {
    this.api.get<any>('/calendar/google/status').subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const connected = !!(data?.connected ?? data?.configured ?? data?.enabled);
        this.googleConnected = connected;
        this.googleStatusKey = connected ? 'admin.settings.googleConnected' : 'admin.settings.googleNotConfigured';
      },
      error: () => {
        this.googleConnected = false;
        this.googleStatusKey = 'admin.settings.googleNotConfigured';
      }
    });
  }

  /** Persist the Notifications tab (SMTP + triggers). */
  saveNotifications(): void {
    this.submitting = true;
    const patch: any = {
      smtpHost: this.smtp.host,
      smtpPort: this.smtp.port,
      smtpUsername: this.smtp.username,
      smtpSender: this.smtp.sender
    };
    // Only send the password if the admin actually typed a new one (not the masked bullets).
    if (this.smtp.password && !this.smtp.password.includes('•')) {
      patch.smtpPassword = this.smtp.password;
    }
    this.notifTriggers.forEach(t => { patch[t.key] = t.on; });
    this.settingsService.updateNotifications(patch).subscribe({
      next: () => {
        this.submitting = false;
        this.triggerToast(this.translate.instant('admin.settings.toastNotifSaved'), 'success');
      },
      error: () => {
        this.submitting = false;
        this.triggerToast(this.translate.instant('admin.settings.toastNotifFailed'), 'error');
      }
    });
  }

  /** Persist the Sauvegarde tab (retention + maintenance mode). */
  saveBackup(): void {
    const days = this.backupRetentionDays || 30;
    this.submitting = true;
    this.settingsService.updateBackup({
      backupRetentionDays: days,
      maintenanceMode: this.maintenanceMode
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.triggerToast(this.translate.instant('admin.settings.toastBackupSaved'), 'success');
      },
      error: () => {
        this.submitting = false;
        this.triggerToast(this.translate.instant('admin.settings.toastBackupFailed'), 'error');
      }
    });
  }

  /** Persist the Général tab. */
  saveGeneral(): void {
    if (!this.appName || !this.appName.trim()) {
      this.triggerToast(this.translate.instant('admin.settings.toastAppNameEmpty'), 'error');
      return;
    }
    this.submitting = true;
    this.settingsService.updateGeneral({
      appName: this.appName.trim(),
      defaultLanguage: this.defaultLanguage,
      timezone: this.timezone,
      maxFileUploadMb: this.maxFileUploadSize,
      // empty string clears the logo on the backend; null is treated as "unchanged"
      logoUrl: this.logoUrl ?? '',
      pdfHeaderColor: this.pdfHeaderColor,
      pdfFooterColor: this.pdfFooterColor,
      pdfFooterText: this.pdfFooterText
    }).subscribe({
      next: (s) => {
        this.submitting = false;
        // Reflect the new identity everywhere live (sidebar, login, register, PDFs).
        this.branding.apply(s);
        this.triggerToast(this.translate.instant('admin.settings.toastGeneralSaved'), 'success');
      },
      error: () => {
        this.submitting = false;
        this.triggerToast(this.translate.instant('admin.settings.toastGeneralFailed'), 'error');
      }
    });
  }

  /** Read a chosen logo file as a data-URI so it can be stored and shown without auth. */
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      this.triggerToast(this.translate.instant('admin.settings.toastImageOnly'), 'error');
      return;
    }
    if (file.size > 512 * 1024) {
      this.triggerToast(this.translate.instant('admin.settings.toastLogoTooBig'), 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { this.logoUrl = reader.result as string; };
    reader.onerror = () => this.triggerToast(this.translate.instant('admin.settings.toastLogoReadFail'), 'error');
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeLogo(): void { this.logoUrl = null; }

  /** Persist the Sécurité tab (password policy + session/lockout limits). */
  saveSecurity(): void {
    if (this.passwordMinLength < 4 || this.passwordMinLength > 64) {
      this.triggerToast(this.translate.instant('admin.settings.toastPwdLenRange'), 'error');
      return;
    }
    if (this.jwtValidity < 5) {
      this.triggerToast(this.translate.instant('admin.settings.toastJwtMin'), 'error');
      return;
    }
    this.submitting = true;
    this.settingsService.updateSecurity({
      jwtValidityMinutes: this.jwtValidity,
      maxLoginAttempts: this.maxAttempts,
      lockoutDurationMinutes: this.lockoutDuration,
      passwordMinLength: this.passwordMinLength,
      passwordRequireUppercase: this.pwUpper,
      passwordRequireDigit: this.pwDigit,
      passwordRequireSpecial: this.pwSpecial,
      passwordExpiryDays: this.passwordExpiry,
      twoFactorRequiredAdmins: this.requireTwoFaAdmins,
      twoFactorRequiredAll: this.requireTwoFaAll,
      registrationEnabled: this.registrationEnabled,
      allowedEmailDomains: this.allowedDomains.join(',')
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.triggerToast(this.translate.instant('admin.settings.toastSecuritySaved'), 'success');
      },
      error: () => {
        this.submitting = false;
        this.triggerToast(this.translate.instant('admin.settings.toastSecurityFailed'), 'error');
      }
    });
  }

  /** Add an allowed email domain (normalised, de-duplicated). Save the Security tab to persist. */
  addDomain(): void {
    const d = (this.newDomain || '').trim().toLowerCase().replace(/^@/, '').replace(/\s/g, '');
    if (!d) return;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
      this.triggerToast(this.translate.instant('admin.settings.toastDomainInvalid'), 'error');
      return;
    }
    if (!this.allowedDomains.includes(d)) this.allowedDomains.push(d);
    this.newDomain = '';
  }
  removeDomain(d: string): void {
    this.allowedDomains = this.allowedDomains.filter(x => x !== d);
  }

  // ── Two-factor authentication ────────────────────────────────────────────
  loadTwoFaStatus(): void {
    this.twoFactorService.status().subscribe({
      next: (res: any) => { this.twoFaEnabled = !!(res?.data?.enabled ?? res?.enabled); },
      error: () => { this.twoFaEnabled = false; }
    });
  }

  startTwoFaSetup(): void {
    this.twoFaBusy = true;
    this.twoFaQr = '';
    this.twoFactorService.setup().subscribe({
      next: (res: any) => {
        this.twoFaSetup = res?.data || res;
        this.twoFaCode = '';
        this.twoFaBusy = false;
        if (this.twoFaSetup?.otpauthUri) {
          QRCode.toDataURL(this.twoFaSetup.otpauthUri, { width: 200, margin: 1 })
            .then(url => { this.twoFaQr = url; this.cdr.detectChanges(); })
            .catch(() => {});
        }
      },
      error: () => {
        this.twoFaBusy = false;
        this.triggerToast(this.translate.instant('admin.settings.toastTwoFaStartFail'), 'error');
      }
    });
  }

  confirmEnableTwoFa(): void {
    if (!this.twoFaCode.trim()) return;
    this.twoFaBusy = true;
    this.twoFactorService.enable(this.twoFaCode.trim()).subscribe({
      next: (res: any) => {
        this.twoFaEnabled = true;
        this.twoFaSetup = null;
        this.twoFaQr = '';
        this.twoFaCode = '';
        this.twoFaBusy = false;
        this.twoFaRecoveryCodes = (res?.data?.recoveryCodes || res?.recoveryCodes || []);
        this.triggerToast(this.translate.instant('admin.settings.toastTwoFaEnabled'), 'success');
      },
      error: () => {
        this.twoFaBusy = false;
        this.triggerToast(this.translate.instant('admin.settings.toastTwoFaInvalidCode'), 'error');
      }
    });
  }

  cancelTwoFaSetup(): void {
    this.twoFaSetup = null;
    this.twoFaQr = '';
    this.twoFaCode = '';
  }

  disableTwoFa(): void {
    if (!this.twoFaCode.trim()) {
      this.triggerToast(this.translate.instant('admin.settings.toastTwoFaNeedCode'), 'error');
      return;
    }
    this.twoFaBusy = true;
    this.twoFactorService.disable(this.twoFaCode.trim()).subscribe({
      next: () => {
        this.twoFaEnabled = false;
        this.twoFaCode = '';
        this.twoFaBusy = false;
        this.triggerToast(this.translate.instant('admin.settings.toastTwoFaDisabled'), 'success');
      },
      error: () => {
        this.twoFaBusy = false;
        this.triggerToast(this.translate.instant('admin.settings.toastTwoFaInvalidCode'), 'error');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.telemetryIntervalId) {
      clearInterval(this.telemetryIntervalId);
    }
  }

  private startTelemetrySimulators(): void {
    // Randomize server load metrics slightly every 3.5 seconds to feel live and organic
    this.telemetryIntervalId = setInterval(() => {
      this.cpuUtilization = Math.max(8, Math.min(92, Math.round(this.cpuUtilization + (Math.random() * 8 - 4))));
      this.ramUtilization = Math.max(38, Math.min(84, Math.round(this.ramUtilization + (Math.random() * 4 - 2))));
      this.databaseLatency = Math.max(4, Math.min(28, Number((this.databaseLatency + (Math.random() * 2 - 1)).toFixed(1))));
      this.redisLatency = Math.max(0.8, Math.min(5.2, Number((this.redisLatency + (Math.random() * 0.4 - 0.2)).toFixed(2))));
      this.activeSessionsCount = Math.max(10, Math.round(this.activeSessionsCount + (Math.random() * 4 - 2)));
    }, 3500);
  }

  loadSecurityData(): void {
    this.loadingSecurity = true;

    // Load Metrics
    this.securityService.getSecurityMetrics().subscribe({
      next: (metrics) => this.securityMetrics = metrics,
      error: () => {
        console.warn("API Security metrics offline");
        this.securityMetrics = { totalAttempts: 1542, failedAttempts: 23, blockedIps: 3 };
      }
    });

    // Load Login Attempts
    this.securityService.getLoginAttempts().subscribe({
      next: (attempts) => this.loginAttempts = attempts,
      error: () => {
        this.loginAttempts = [
          { id: 1, username: 'admin', ipAddress: '192.168.1.1', success: true, attemptedAt: new Date().toISOString() },
          { id: 2, username: 'unknown', ipAddress: '10.0.0.5', success: false, attemptedAt: new Date().toISOString() }
        ];
      }
    });

    // Load Pending Password Resets
    this.securityService.getPendingPasswordResets().subscribe({
      next: (resets) => this.pendingResets = resets,
      error: () => {
        this.pendingResets = [
          { id: 101, username: 'jane.smith', requestedAt: new Date().toISOString(), status: 'PENDING' }
        ];
        this.loadingSecurity = false;
      }
    });
  }

  approveReset(id: number): void {
    this.securityService.approvePasswordReset(id).subscribe({
      next: () => {
        this.pendingResets = this.pendingResets.filter(r => r.id !== id);
        this.triggerToast(this.translate.instant('admin.settings.toastResetApproved'), 'success');
      },
      error: (err: any) => {
        this.triggerToast(err?.error?.message || this.translate.instant('admin.settings.toastResetApproveFail'), 'error');
      }
    });
  }

  rejectReset(id: number): void {
    this.securityService.rejectPasswordReset(id).subscribe({
      next: () => {
        this.pendingResets = this.pendingResets.filter(r => r.id !== id);
        this.triggerToast(this.translate.instant('admin.settings.toastResetRejected'), 'success');
      },
      error: (err: any) => {
        this.triggerToast(err?.error?.message || this.translate.instant('admin.settings.toastResetRejectFail'), 'error');
      }
    });
  }

  clearLoginAttempts(): void {
    this.securityService.deleteAllLoginAttempts().subscribe({
      next: () => {
        this.loginAttempts = [];
        this.triggerToast(this.translate.instant('admin.settings.toastAttemptsCleared'), 'success');
      },
      error: (err: any) => {
        this.triggerToast(err?.error?.message || this.translate.instant('admin.settings.toastAttemptsClearFail'), 'error');
      }
    });
  }

  saveConfiguration(): void {
    if (this.maxFileUploadSize <= 0 || this.maxFileUploadSize > 500) {
      this.triggerToast(this.translate.instant('admin.settings.toastUploadRange'), 'error');
      return;
    }

    if (!this.allowedEmailDomains.trim()) {
      this.triggerToast(this.translate.instant('admin.settings.toastDomainsEmpty'), 'error');
      return;
    }

    this.submitting = true;
    
    // Emulate API latency
    setTimeout(() => {
      this.submitting = false;
      this.triggerToast(this.translate.instant('admin.settings.toastConfigSaved'), 'success');
    }, 800);
  }

  clearRedisCache(): void {
    this.clearingCache = true;
    setTimeout(() => {
      this.clearingCache = false;
      this.triggerToast(this.translate.instant('admin.settings.toastCacheCleared'), 'success');
    }, 1200);
  }

  triggerColdBackup(): void {
    this.backingUp = true;
    setTimeout(() => {
      this.backingUp = false;
      const stamp = new Date().toISOString().split('T')[0];
      this.triggerToast(this.translate.instant('admin.settings.toastBackupGenerated', { stamp }), 'success');
    }, 2000);
  }

  toggleMaintenanceMode(): void {
    // `maintenanceMode` already reflects the new state (the template toggles it before calling).
    this.settingsService.updateBackup({ maintenanceMode: this.maintenanceMode }).subscribe({
      next: () => {
        if (this.maintenanceMode) {
          this.triggerToast(this.translate.instant('admin.settings.toastMaintOn'), 'error');
        } else {
          this.triggerToast(this.translate.instant('admin.settings.toastMaintOff'), 'success');
        }
      },
      error: () => {
        this.maintenanceMode = !this.maintenanceMode; // revert the optimistic UI flip
        this.triggerToast(this.translate.instant('admin.settings.toastMaintFail'), 'error');
      }
    });
  }

  testEmailBusy = false;
  /** Send a real test email through the configured provider (Brevo/SMTP) and report the outcome. */
  testSmtp(): void {
    this.testEmailBusy = true;
    this.settingsService.sendTestEmail().subscribe({
      next: (r: any) => {
        this.testEmailBusy = false;
        this.triggerToast(r?.message || this.translate.instant('admin.settings.toastTestEmailSent'), 'success');
      },
      error: (e: any) => {
        this.testEmailBusy = false;
        this.triggerToast(e?.error?.message || this.translate.instant('admin.settings.toastTestEmailFailed'), 'error');
      }
    });
  }

  reconnectGoogle(): void {
    this.triggerToast(this.translate.instant('admin.settings.toastGoogleReconnect'), 'success');
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }
}
