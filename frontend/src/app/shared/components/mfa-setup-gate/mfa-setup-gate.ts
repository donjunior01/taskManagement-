import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import QRCode from 'qrcode';
import { AuthService } from '../../../core/services/auth.service';
import { TwoFactorService } from '../../../core/services/twofa.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Full-screen blocking overlay shown when policy forces the signed-in account to enrol in 2FA
 * (admin "Require 2FA for admins"). It runs the setup → verify flow and can't be dismissed until
 * enrolment succeeds — the only escape is to sign out.
 */
@Component({
  selector: 'app-mfa-setup-gate',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="mfa-gate" *ngIf="visible">
      <div class="mfa-card">
        <div class="mfa-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h2>{{ (recoveryCodes.length ? 'twofa.codesTitle' : 'mfa.title') | translate }}</h2>

        <!-- Enrolment step -->
        <ng-container *ngIf="!recoveryCodes.length">
          <p class="mfa-intro">{{ 'mfa.intro' | translate }}</p>

          <div class="mfa-qr-wrap" *ngIf="qrDataUrl">
            <img [src]="qrDataUrl" class="mfa-qr" alt="QR" />
            <span class="mfa-or">{{ 'mfa.orEnterKey' | translate }}</span>
          </div>

          <div class="mfa-secret-block" *ngIf="setup">
            <span class="mfa-field-label">{{ 'mfa.secretLabel' | translate }}</span>
            <div class="mfa-secret-row">
              <code class="mfa-secret">{{ setup.secret }}</code>
              <button type="button" class="mfa-copy" (click)="copySecret()">{{ 'mfa.copy' | translate }}</button>
            </div>
          </div>

          <label class="mfa-field-label" for="mfaCode">{{ 'mfa.codeLabel' | translate }}</label>
          <input id="mfaCode" class="mfa-code" type="text" inputmode="numeric" maxlength="6"
                 placeholder="000000" [(ngModel)]="code" (keyup.enter)="verify()" autocomplete="one-time-code" />

          <p class="mfa-error" *ngIf="error">{{ error }}</p>

          <div class="mfa-actions">
            <button type="button" class="mfa-btn-primary" (click)="verify()" [disabled]="busy || code.trim().length < 6">
              {{ 'mfa.verify' | translate }}
            </button>
            <button type="button" class="mfa-btn-ghost" (click)="signOut()">{{ 'mfa.signOut' | translate }}</button>
          </div>
        </ng-container>

        <!-- Recovery codes step (one-time) -->
        <ng-container *ngIf="recoveryCodes.length">
          <p class="mfa-intro">{{ 'twofa.codesHint' | translate }}</p>
          <div class="mfa-codes-grid">
            <code *ngFor="let rc of recoveryCodes">{{ rc }}</code>
          </div>
          <div class="mfa-actions">
            <button type="button" class="mfa-btn-primary" (click)="finishCodes()">{{ 'twofa.codesSaved' | translate }}</button>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .mfa-gate { position: fixed; inset: 0; z-index: 5000; display: flex; align-items: center; justify-content: center;
      background: rgba(15, 23, 42, .72); backdrop-filter: blur(6px); padding: 24px; }
    .mfa-card { width: 100%; max-width: 440px; background: #fff; border-radius: 18px; padding: 30px 28px;
      box-shadow: 0 26px 64px rgba(15, 23, 42, .4); text-align: center; font-family: inherit; }
    .mfa-icon { width: 52px; height: 52px; border-radius: 14px; margin: 0 auto 14px; display: grid; place-items: center;
      background: rgba(37, 99, 235, .1); color: #2563eb; }
    .mfa-icon svg { width: 26px; height: 26px; }
    .mfa-card h2 { font-size: 19px; font-weight: 800; color: #1e293b; margin: 0 0 8px; }
    .mfa-intro { font-size: 13px; line-height: 1.55; color: #64748b; margin: 0 0 18px; }
    .mfa-qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px; }
    .mfa-qr { width: 188px; height: 188px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; background: #fff; }
    .mfa-or { font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; color: #94a3b8; }
    .mfa-codes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin: 6px 0 4px; }
    .mfa-codes-grid code { font-family: monospace; font-size: 13.5px; letter-spacing: 1px; color: #1e293b; background: #fffbeb; border: 1px solid #fde68a; border-radius: 7px; padding: 7px 8px; text-align: center; }
    .mfa-field-label { display: block; text-align: left; font-size: 11.5px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .4px; color: #94a3b8; margin: 0 0 6px; }
    .mfa-secret-block { margin-bottom: 16px; }
    .mfa-secret-row { display: flex; gap: 8px; align-items: stretch; }
    .mfa-secret { flex: 1; padding: 10px 12px; background: #f1f5f9; border-radius: 10px; font-family: monospace;
      font-size: 13.5px; letter-spacing: 1.5px; color: #1e293b; word-break: break-all; text-align: left; }
    .mfa-copy { padding: 0 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; font-size: 12.5px;
      font-weight: 600; color: #475569; cursor: pointer; font-family: inherit; }
    .mfa-copy:hover { background: #f8fafc; }
    .mfa-code { width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 11px; font-size: 20px;
      font-weight: 700; letter-spacing: 6px; text-align: center; color: #1e293b; outline: none; box-sizing: border-box; }
    .mfa-code:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, .12); }
    .mfa-error { color: #dc2626; font-size: 12.5px; font-weight: 600; margin: 10px 0 0; }
    .mfa-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }
    .mfa-btn-primary { height: 44px; border: none; border-radius: 11px; background: #2563eb; color: #fff; font-size: 14px;
      font-weight: 700; cursor: pointer; font-family: inherit; }
    .mfa-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
    .mfa-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
    .mfa-btn-ghost { height: 40px; border: none; background: none; border-radius: 11px; color: #64748b; font-size: 13px;
      font-weight: 600; cursor: pointer; font-family: inherit; }
    .mfa-btn-ghost:hover { background: #f1f5f9; }
  `]
})
export class MfaSetupGateComponent implements OnInit, OnDestroy {
  visible = false;
  busy = false;
  code = '';
  error = '';
  setup: { secret: string; otpauthUri: string } | null = null;
  qrDataUrl = '';
  recoveryCodes: string[] = [];

  private sub?: Subscription;

  constructor(
    private auth: AuthService,
    private twofa: TwoFactorService,
    private toast: ToastService,
    private translate: TranslateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Re-evaluate after every navigation (covers fresh login) and once now (covers a page reload).
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.evaluate());
    this.evaluate();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private evaluate(): void {
    if (this.auth.isMfaSetupRequired()) {
      if (!this.visible) { this.visible = true; this.beginSetup(); }
    } else if (this.visible) {
      this.visible = false;
      this.cdr.detectChanges();
    }
  }

  private beginSetup(): void {
    this.busy = true; this.error = '';
    this.twofa.setup().subscribe({
      next: (res: any) => {
        this.setup = res?.data || res;
        this.busy = false;
        if (this.setup?.otpauthUri) {
          QRCode.toDataURL(this.setup.otpauthUri, { width: 200, margin: 1 })
            .then(url => { this.qrDataUrl = url; this.cdr.detectChanges(); })
            .catch(() => {});
        }
        this.cdr.detectChanges();
      },
      error: () => { this.busy = false; this.error = this.translate.instant('mfa.toastInvalid'); this.cdr.detectChanges(); }
    });
  }

  verify(): void {
    const c = this.code.trim();
    if (c.length < 6 || this.busy) return;
    this.busy = true; this.error = '';
    this.twofa.enable(c).subscribe({
      next: (res: any) => {
        // Policy satisfied. Keep the overlay up to show the one-time recovery codes until acknowledged.
        this.auth.clearMfaSetupRequired();
        this.busy = false; this.code = ''; this.setup = null; this.qrDataUrl = '';
        this.recoveryCodes = (res?.data?.recoveryCodes || res?.recoveryCodes || []);
        if (!this.recoveryCodes.length) this.visible = false;
        this.toast.show(this.translate.instant('mfa.toastEnabled'), 'success');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.busy = false;
        this.error = err?.error?.message || this.translate.instant('mfa.toastInvalid');
        this.cdr.detectChanges();
      }
    });
  }

  copySecret(): void {
    if (this.setup?.secret) {
      try { navigator.clipboard.writeText(this.setup.secret); } catch { /* ignore */ }
    }
  }

  /** Acknowledge the recovery codes and dismiss the gate. */
  finishCodes(): void { this.recoveryCodes = []; this.visible = false; }

  signOut(): void {
    this.visible = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
