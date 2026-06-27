import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Blocking overlay shown when the password-rotation policy requires a change before continuing.
 * Mirrors the 2FA setup gate: it can't be dismissed until the password is changed (or sign out).
 */
@Component({
  selector: 'app-password-gate',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="pg" *ngIf="visible">
      <div class="pg-card">
        <div class="pg-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h2>{{ 'pwgate.title' | translate }}</h2>
        <p class="pg-intro">{{ 'pwgate.intro' | translate }}</p>

        <input class="pg-input" type="password" [placeholder]="'pwgate.current' | translate" [(ngModel)]="oldPassword" autocomplete="current-password" />
        <input class="pg-input" type="password" [placeholder]="'pwgate.new' | translate" [(ngModel)]="newPassword" autocomplete="new-password" />
        <input class="pg-input" type="password" [placeholder]="'pwgate.confirm' | translate" [(ngModel)]="confirm" (keyup.enter)="submit()" autocomplete="new-password" />

        <p class="pg-error" *ngIf="error">{{ error }}</p>

        <div class="pg-actions">
          <button type="button" class="pg-btn-primary" (click)="submit()" [disabled]="busy">{{ 'pwgate.save' | translate }}</button>
          <button type="button" class="pg-btn-ghost" (click)="signOut()">{{ 'pwgate.signOut' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pg { position: fixed; inset: 0; z-index: 5000; display: flex; align-items: center; justify-content: center; background: rgba(15,23,42,.72); backdrop-filter: blur(6px); padding: 24px; }
    .pg-card { width: 100%; max-width: 420px; background: var(--bg-card); border-radius: 18px; padding: 30px 28px; box-shadow: 0 26px 64px rgba(15,23,42,.4); text-align: center; font-family: inherit; }
    .pg-icon { width: 52px; height: 52px; border-radius: 14px; margin: 0 auto 14px; display: grid; place-items: center; background: rgba(217,119,6,.1); color: #d97706; }
    .pg-icon svg { width: 26px; height: 26px; }
    .pg-card h2 { font-size: 19px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px; }
    .pg-intro { font-size: 13px; line-height: 1.55; color: var(--text-muted); margin: 0 0 18px; }
    .pg-input { width: 100%; box-sizing: border-box; height: 44px; padding: 0 14px; margin-bottom: 10px; border: 1.5px solid var(--border); border-radius: 11px; font-size: 14px; color: var(--text-primary); outline: none; }
    .pg-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .pg-error { color: var(--danger-text); font-size: 12.5px; font-weight: 600; margin: 4px 0 0; }
    .pg-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .pg-btn-primary { height: 44px; border: none; border-radius: 11px; background: #2563eb; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .pg-btn-primary:hover:not(:disabled) { background: #1d4ed8; } .pg-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
    .pg-btn-ghost { height: 40px; border: none; background: none; border-radius: 11px; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .pg-btn-ghost:hover { background: var(--bg-subtle); }
  `]
})
export class PasswordGateComponent implements OnInit, OnDestroy {
  visible = false;
  busy = false;
  oldPassword = '';
  newPassword = '';
  confirm = '';
  error = '';
  private sub?: Subscription;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private toast: ToastService,
    private translate: TranslateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.evaluate());
    this.evaluate();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private evaluate(): void {
    const required = this.auth.isPasswordChangeRequired();
    if (required !== this.visible) { this.visible = required; this.cdr.detectChanges(); }
  }

  submit(): void {
    if (this.busy) return;
    if (!this.oldPassword || !this.newPassword) { this.error = this.translate.instant('pwgate.errRequired'); return; }
    if (this.newPassword !== this.confirm) { this.error = this.translate.instant('pwgate.errMismatch'); return; }
    this.busy = true; this.error = '';
    this.userService.changePassword({ currentPassword: this.oldPassword, newPassword: this.newPassword }).subscribe({
      next: (res: any) => {
        this.busy = false;
        if (res && res.success === false) { this.error = res.message || this.translate.instant('pwgate.errFailed'); this.cdr.detectChanges(); return; }
        this.auth.clearPasswordChangeRequired();
        this.visible = false; this.oldPassword = this.newPassword = this.confirm = '';
        this.toast.show(this.translate.instant('pwgate.toastDone'), 'success');
        this.cdr.detectChanges();
      },
      error: (err: any) => { this.busy = false; this.error = err?.error?.message || this.translate.instant('pwgate.errFailed'); this.cdr.detectChanges(); }
    });
  }

  signOut(): void { this.visible = false; this.auth.logout(); this.router.navigate(['/login']); }
}
