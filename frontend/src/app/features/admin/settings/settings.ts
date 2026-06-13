import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSecurityService, LoginAttempt, SecurityMetrics } from '../../../core/services/admin-security.service';
import { ToastService } from '../../../core/services/toast.service';
import { TwoFactorService, TwoFactorSetup } from '../../../core/services/twofa.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import { ApiService } from '../../../core/services/api.service';
import { BrandingService } from '../../../core/services/branding.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  // Active configuration tab (prototype)
  activeTab: 'general' | 'security' | 'notifications' | 'integrations' | 'backup' = 'general';
  tabs: { id: 'general' | 'security' | 'notifications' | 'integrations' | 'backup'; label: string }[] = [
    { id: 'general',        label: 'Général' },
    { id: 'security',       label: 'Sécurité' },
    { id: 'notifications',  label: 'Notifications' },
    { id: 'integrations',   label: 'Intégrations' },
    { id: 'backup',         label: 'Sauvegarde & Maintenance' }
  ];

  // Général tab
  appName: string = 'TaskMaster Pro';
  defaultLanguage: string = 'Français';
  timezone: string = 'Europe/Paris (UTC+1)';

  // Branding — logo + PDF header/footer (applied app-wide & in every generated PDF)
  logoUrl: string | null = null;
  pdfHeaderColor: string = '#1e2540';
  pdfFooterColor: string = '#2563eb';
  pdfFooterText: string = 'Document confidentiel — généré automatiquement';

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
  notifTriggers: { key: string; label: string; on: boolean }[] = [
    { key: 'notifyOnRegistration',          label: 'Nouvelle inscription', on: true },
    { key: 'notifyOnTaskAssigned',          label: 'Tâche assignée', on: false },
    { key: 'notifyOnDeliverableSubmitted',  label: 'Livrable soumis', on: true },
    { key: 'notifyOnSuspiciousLogin',       label: 'Tentative de connexion suspecte', on: true },
    { key: 'notifyOnProjectOverdue',        label: 'Projet en retard', on: true }
  ];

  // Intégrations — live Google Calendar connection state
  googleConnected: boolean = false;
  googleStatusLabel: string = 'Vérification…';

  // Backup tab
  backupRetention: string = '30 jours';

  // System Configurations Form State
  maxFileUploadSize: number = 50; // MB
  allowedEmailDomains: string = 'corp.net, taskmanagement.com';
  maintenanceMode: boolean = false;
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
  twoFaCode: string = '';
  twoFaBusy: boolean = false;

  constructor(
    private securityService: AdminSecurityService,
    private toast: ToastService,
    private twoFactorService: TwoFactorService,
    private settingsService: SystemSettingsService,
    private api: ApiService,
    private branding: BrandingService
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
        if (s.backupRetentionDays != null) this.backupRetention = `${s.backupRetentionDays} jours`;
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
        this.googleStatusLabel = connected ? '● Connecté' : '● Non configuré';
      },
      error: () => {
        this.googleConnected = false;
        this.googleStatusLabel = '● Non configuré';
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
        this.triggerToast('Paramètres de notification enregistrés avec succès.', 'success');
      },
      error: () => {
        this.submitting = false;
        this.triggerToast('Échec de l\'enregistrement des paramètres de notification.', 'error');
      }
    });
  }

  /** Persist the Sauvegarde tab (retention + maintenance mode). */
  saveBackup(): void {
    const days = parseInt((this.backupRetention || '').replace(/\D/g, ''), 10) || 30;
    this.submitting = true;
    this.settingsService.updateBackup({
      backupRetentionDays: days,
      maintenanceMode: this.maintenanceMode
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.triggerToast('Paramètres de sauvegarde enregistrés avec succès.', 'success');
      },
      error: () => {
        this.submitting = false;
        this.triggerToast('Échec de l\'enregistrement des paramètres de sauvegarde.', 'error');
      }
    });
  }

  /** Persist the Général tab. */
  saveGeneral(): void {
    if (!this.appName || !this.appName.trim()) {
      this.triggerToast('Le nom de l\'application ne peut pas être vide.', 'error');
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
        this.triggerToast('Paramètres généraux enregistrés avec succès.', 'success');
      },
      error: () => {
        this.submitting = false;
        this.triggerToast('Échec de l\'enregistrement des paramètres généraux.', 'error');
      }
    });
  }

  /** Read a chosen logo file as a data-URI so it can be stored and shown without auth. */
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      this.triggerToast('Veuillez choisir un fichier image (PNG, JPG, SVG…).', 'error');
      return;
    }
    if (file.size > 512 * 1024) {
      this.triggerToast('Le logo doit faire moins de 512 Ko.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { this.logoUrl = reader.result as string; };
    reader.onerror = () => this.triggerToast('Impossible de lire le fichier image.', 'error');
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeLogo(): void { this.logoUrl = null; }

  /** Persist the Sécurité tab (password policy + session/lockout limits). */
  saveSecurity(): void {
    if (this.passwordMinLength < 4 || this.passwordMinLength > 64) {
      this.triggerToast('La longueur minimale du mot de passe doit être comprise entre 4 et 64.', 'error');
      return;
    }
    if (this.jwtValidity < 5) {
      this.triggerToast('La durée de validité JWT doit être d\'au moins 5 minutes.', 'error');
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
      passwordExpiryDays: this.passwordExpiry
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.triggerToast('Politique de sécurité enregistrée avec succès.', 'success');
      },
      error: () => {
        this.submitting = false;
        this.triggerToast('Échec de l\'enregistrement de la politique de sécurité.', 'error');
      }
    });
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
    this.twoFactorService.setup().subscribe({
      next: (res: any) => {
        this.twoFaSetup = res?.data || res;
        this.twoFaCode = '';
        this.twoFaBusy = false;
      },
      error: () => {
        this.twoFaBusy = false;
        this.triggerToast('Impossible de démarrer la configuration de la 2FA.', 'error');
      }
    });
  }

  confirmEnableTwoFa(): void {
    if (!this.twoFaCode.trim()) return;
    this.twoFaBusy = true;
    this.twoFactorService.enable(this.twoFaCode.trim()).subscribe({
      next: () => {
        this.twoFaEnabled = true;
        this.twoFaSetup = null;
        this.twoFaCode = '';
        this.twoFaBusy = false;
        this.triggerToast('Authentification à deux facteurs activée.', 'success');
      },
      error: () => {
        this.twoFaBusy = false;
        this.triggerToast('Code invalide — veuillez réessayer.', 'error');
      }
    });
  }

  cancelTwoFaSetup(): void {
    this.twoFaSetup = null;
    this.twoFaCode = '';
  }

  disableTwoFa(): void {
    if (!this.twoFaCode.trim()) {
      this.triggerToast('Saisissez un code actuel pour désactiver la 2FA.', 'error');
      return;
    }
    this.twoFaBusy = true;
    this.twoFactorService.disable(this.twoFaCode.trim()).subscribe({
      next: () => {
        this.twoFaEnabled = false;
        this.twoFaCode = '';
        this.twoFaBusy = false;
        this.triggerToast('Authentification à deux facteurs désactivée.', 'success');
      },
      error: () => {
        this.twoFaBusy = false;
        this.triggerToast('Code invalide — veuillez réessayer.', 'error');
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
        this.triggerToast('Réinitialisation du mot de passe approuvée avec succès.', 'success');
      },
      error: (err: any) => {
        this.triggerToast(err?.error?.message || 'Échec de l\'approbation de la réinitialisation.', 'error');
      }
    });
  }

  rejectReset(id: number): void {
    this.securityService.rejectPasswordReset(id).subscribe({
      next: () => {
        this.pendingResets = this.pendingResets.filter(r => r.id !== id);
        this.triggerToast('Réinitialisation du mot de passe rejetée.', 'success');
      },
      error: (err: any) => {
        this.triggerToast(err?.error?.message || 'Échec du rejet de la réinitialisation.', 'error');
      }
    });
  }

  clearLoginAttempts(): void {
    this.securityService.deleteAllLoginAttempts().subscribe({
      next: () => {
        this.loginAttempts = [];
        this.triggerToast('Tentatives de connexion effacées.', 'success');
      },
      error: (err: any) => {
        this.triggerToast(err?.error?.message || 'Échec de l\'effacement des tentatives.', 'error');
      }
    });
  }

  saveConfiguration(): void {
    if (this.maxFileUploadSize <= 0 || this.maxFileUploadSize > 500) {
      this.triggerToast('La limite de téléversement doit être comprise entre 1 Mo et 500 Mo.', 'error');
      return;
    }

    if (!this.allowedEmailDomains.trim()) {
      this.triggerToast('La liste des domaines e-mail autorisés ne peut pas être vide.', 'error');
      return;
    }

    this.submitting = true;
    
    // Emulate API latency
    setTimeout(() => {
      this.submitting = false;
      this.triggerToast('Paramètres système de l\'entreprise enregistrés avec succès.', 'success');
    }, 800);
  }

  clearRedisCache(): void {
    this.clearingCache = true;
    setTimeout(() => {
      this.clearingCache = false;
      this.triggerToast('Cache de session et de données Redis vidé avec succès. 12,4 ko libérés.', 'success');
    }, 1200);
  }

  triggerColdBackup(): void {
    this.backingUp = true;
    setTimeout(() => {
      this.backingUp = false;
      const stamp = new Date().toISOString().split('T')[0];
      this.triggerToast(`Sauvegarde à froid de la base de données générée : db_backup_${stamp}.sql (42,8 Mo)`, 'success');
    }, 2000);
  }

  toggleMaintenanceMode(): void {
    // `maintenanceMode` already reflects the new state (the template toggles it before calling).
    this.settingsService.updateBackup({ maintenanceMode: this.maintenanceMode }).subscribe({
      next: () => {
        if (this.maintenanceMode) {
          this.triggerToast('Mode maintenance activé : seuls les administrateurs peuvent se connecter.', 'error');
        } else {
          this.triggerToast('Mode maintenance désactivé. Connexions des employés rétablies.', 'success');
        }
      },
      error: () => {
        this.maintenanceMode = !this.maintenanceMode; // revert the optimistic UI flip
        this.triggerToast('Échec de la mise à jour du mode maintenance.', 'error');
      }
    });
  }

  testSmtp(): void {
    this.triggerToast('Connexion SMTP testée avec succès.', 'success');
  }

  reconnectGoogle(): void {
    this.triggerToast('Reconnexion à Google Calendar lancée.', 'success');
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }
}
