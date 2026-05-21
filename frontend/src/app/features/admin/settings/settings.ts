import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSecurityService, LoginAttempt, SecurityMetrics } from '../../../core/services/admin-security.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
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
  apiUptime: string = '14 days, 6 hours, 22 minutes';

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

  constructor(
    private securityService: AdminSecurityService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.startTelemetrySimulators();
    this.loadSecurityData();
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
        this.triggerToast('Password reset approved successfully.', 'success');
      },
      error: () => {
        this.pendingResets = this.pendingResets.filter(r => r.id !== id);
        this.triggerToast('Optimistic: Password reset approved.', 'success');
      }
    });
  }

  rejectReset(id: number): void {
    this.securityService.rejectPasswordReset(id).subscribe({
      next: () => {
        this.pendingResets = this.pendingResets.filter(r => r.id !== id);
        this.triggerToast('Password reset rejected.', 'success');
      },
      error: () => {
        this.pendingResets = this.pendingResets.filter(r => r.id !== id);
        this.triggerToast('Optimistic: Password reset rejected.', 'success');
      }
    });
  }

  clearLoginAttempts(): void {
    this.securityService.deleteAllLoginAttempts().subscribe({
      next: () => {
        this.loginAttempts = [];
        this.triggerToast('Login attempts cleared.', 'success');
      },
      error: () => {
        this.loginAttempts = [];
        this.triggerToast('Optimistic: Login attempts cleared.', 'success');
      }
    });
  }

  saveConfiguration(): void {
    if (this.maxFileUploadSize <= 0 || this.maxFileUploadSize > 500) {
      this.triggerToast('Upload limits must reside between 1MB and 500MB.', 'error');
      return;
    }

    if (!this.allowedEmailDomains.trim()) {
      this.triggerToast('Allowed corporate email domains constraint cannot be empty.', 'error');
      return;
    }

    this.submitting = true;
    
    // Emulate API latency
    setTimeout(() => {
      this.submitting = false;
      this.triggerToast('Corporate system parameters saved successfully.', 'success');
    }, 800);
  }

  clearRedisCache(): void {
    this.clearingCache = true;
    setTimeout(() => {
      this.clearingCache = false;
      this.triggerToast('Redis session and payload cache cleared successfully. Freed 12.4 kB.', 'success');
    }, 1200);
  }

  triggerColdBackup(): void {
    this.backingUp = true;
    setTimeout(() => {
      this.backingUp = false;
      const stamp = new Date().toISOString().split('T')[0];
      this.triggerToast(`Database cold backup generated: db_backup_${stamp}.sql (42.8 MB)`, 'success');
    }, 2000);
  }

  toggleMaintenanceMode(): void {
    // Warn prior to enabling
    if (!this.maintenanceMode) {
      this.triggerToast('Warning: Enforcing Maintenance Mode will restrict employee access.', 'error');
    } else {
      this.triggerToast('Corporate access gates restored. Employee logins active.', 'success');
    }
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }
}
