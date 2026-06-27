import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InvitationService } from '../../../core/services/invitation.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Public page reached from an invite link (/accept-invite?token=...). Shows which organization the
 * invite is for, then collects the new user's details and creates their account in that tenant.
 */
@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
  <div class="ai-wrap">
    <div class="ai-card">
      <div class="ai-loading" *ngIf="loading">{{ 'common.loading' | translate }}</div>

      <ng-container *ngIf="!loading && !invite?.valid">
        <h2>{{ 'invite.invalidTitle' | translate }}</h2>
        <p class="ai-muted">{{ 'invite.invalidBody' | translate }}</p>
        <a routerLink="/login" class="ai-btn">{{ 'invite.toLogin' | translate }}</a>
      </ng-container>

      <ng-container *ngIf="!loading && invite?.valid">
        <h2>{{ 'invite.title' | translate }}</h2>
        <p class="ai-sub">{{ 'invite.subtitle' | translate:{ org: invite.organizationName } }}</p>
        <p class="ai-email">{{ invite.email }}</p>

        <form (ngSubmit)="submit()" #f="ngForm" class="ai-form">
          <label>{{ 'auth.firstName' | translate }}</label>
          <input [(ngModel)]="form.firstName" name="firstName" required />
          <label>{{ 'auth.lastName' | translate }}</label>
          <input [(ngModel)]="form.lastName" name="lastName" required />
          <label>{{ 'auth.username' | translate }}</label>
          <input [(ngModel)]="form.username" name="username" required />
          <label>{{ 'auth.password' | translate }}</label>
          <input type="password" [(ngModel)]="form.password" name="password" required />
          <p class="ai-error" *ngIf="error">{{ error }}</p>
          <button type="submit" class="ai-btn" [disabled]="submitting || f.invalid">
            {{ (submitting ? 'invite.creating' : 'invite.createAccount') | translate }}
          </button>
        </form>
      </ng-container>
    </div>
  </div>
  `,
  styles: [`
    .ai-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-subtle); padding: 24px; }
    .ai-card { width: 100%; max-width: 420px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; box-shadow: 0 18px 40px rgba(15,23,42,.08); }
    .ai-card h2 { font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px; }
    .ai-sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 4px; }
    .ai-email { font-size: 13px; font-weight: 700; color: #2563eb; margin: 0 0 18px; }
    .ai-muted { font-size: 13px; color: var(--text-muted); margin: 0 0 18px; }
    .ai-loading { text-align: center; color: var(--text-muted); padding: 20px; }
    .ai-form { display: flex; flex-direction: column; gap: 6px; }
    .ai-form label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); margin-top: 8px; }
    .ai-form input { height: 42px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 14px; outline: none; }
    .ai-form input:focus { border-color: #2563eb; }
    .ai-error { color: var(--danger-text); font-size: 12.5px; font-weight: 600; margin: 6px 0 0; }
    .ai-btn { display: inline-block; text-align: center; margin-top: 16px; height: 44px; line-height: 44px; padding: 0 18px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; }
    .ai-btn:disabled { opacity: .6; cursor: not-allowed; }
  `]
})
export class AcceptInviteComponent implements OnInit {
  loading = true;
  submitting = false;
  error = '';
  invite: any = null;
  token = '';
  form = { firstName: '', lastName: '', username: '', password: '' };

  constructor(private route: ActivatedRoute, private router: Router,
              private invitations: InvitationService, private toast: ToastService,
              private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) { this.loading = false; return; }
    this.invitations.lookup(this.token).subscribe({
      next: (r: any) => { this.invite = r?.data || r; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  submit(): void {
    if (this.submitting) return;
    this.submitting = true;
    this.error = '';
    this.invitations.accept({ token: this.token, ...this.form }).subscribe({
      next: () => {
        this.toast.show(this.translate.instant('invite.created'), 'success');
        this.router.navigate(['/login'], { queryParams: { registered: 'invited' } });
      },
      error: (err: any) => {
        this.submitting = false;
        this.error = err?.error?.message || this.translate.instant('invite.failed');
        this.cdr.detectChanges();
      }
    });
  }
}
