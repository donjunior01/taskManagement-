import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import QRCode from 'qrcode';
import { TwoFactorService } from '../../../core/services/twofa.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Self-service two-factor (TOTP) manager usable by any role. Shows current status and runs the
 * enable (setup → scan QR → verify) or disable (verify current code) flow. Reused in the header
 * "Two-factor authentication" modal so every user — not just admins — can turn 2FA on/off.
 */
@Component({
  selector: 'app-twofa-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="tfm">
      <div class="tfm-status" [class.on]="enabled">
        <span class="tfm-dot"></span>
        <span>{{ (enabled ? 'twofa.statusOn' : 'twofa.statusOff') | translate }}</span>
      </div>

      <!-- DISABLED: offer to enable -->
      <ng-container *ngIf="!enabled">
        <button *ngIf="!setup" class="tfm-btn-primary" (click)="startSetup()" [disabled]="busy">
          {{ 'twofa.enable' | translate }}
        </button>

        <div class="tfm-setup" *ngIf="setup">
          <p class="tfm-hint">{{ 'twofa.scanHint' | translate }}</p>
          <div class="tfm-qr-wrap">
            <img *ngIf="qrDataUrl" [src]="qrDataUrl" class="tfm-qr" alt="QR" />
            <div class="tfm-secret-col">
              <span class="tfm-label">{{ 'twofa.secretLabel' | translate }}</span>
              <code class="tfm-secret">{{ setup.secret }}</code>
            </div>
          </div>
          <label class="tfm-label" for="tfmEnableCode">{{ 'twofa.codeLabel' | translate }}</label>
          <div class="tfm-row">
            <input id="tfmEnableCode" type="text" inputmode="numeric" maxlength="6" placeholder="000000"
                   [(ngModel)]="code" (keyup.enter)="confirmEnable()" autocomplete="one-time-code" />
            <button class="tfm-btn-primary" (click)="confirmEnable()" [disabled]="busy || code.trim().length < 6">
              {{ 'twofa.verify' | translate }}
            </button>
            <button class="tfm-btn-ghost" (click)="cancel()">{{ 'twofa.cancel' | translate }}</button>
          </div>
          <p class="tfm-error" *ngIf="error">{{ error }}</p>
        </div>
      </ng-container>

      <!-- Recovery codes (shown once, after enable or regenerate) -->
      <div class="tfm-codes" *ngIf="recoveryCodes.length">
        <p class="tfm-hint"><strong>{{ 'twofa.codesTitle' | translate }}</strong> — {{ 'twofa.codesHint' | translate }}</p>
        <div class="tfm-codes-grid">
          <code *ngFor="let rc of recoveryCodes">{{ rc }}</code>
        </div>
        <div class="tfm-row">
          <button class="tfm-btn-ghost" (click)="copyCodes()">{{ 'twofa.copyCodes' | translate }}</button>
          <button class="tfm-btn-ghost" (click)="downloadCodes()">{{ 'twofa.downloadCodes' | translate }}</button>
          <button class="tfm-btn-primary" (click)="dismissCodes()">{{ 'twofa.codesSaved' | translate }}</button>
        </div>
      </div>

      <!-- ENABLED: offer to disable / regenerate codes -->
      <div class="tfm-setup" *ngIf="enabled && !recoveryCodes.length">
        <p class="tfm-hint">{{ 'twofa.disableHint' | translate }}</p>
        <label class="tfm-label" for="tfmDisableCode">{{ 'twofa.codeLabel' | translate }}</label>
        <div class="tfm-row">
          <input id="tfmDisableCode" type="text" inputmode="numeric" maxlength="6" placeholder="000000"
                 [(ngModel)]="code" (keyup.enter)="confirmDisable()" autocomplete="one-time-code" />
          <button class="tfm-btn-danger" (click)="confirmDisable()" [disabled]="busy || code.trim().length < 6">
            {{ 'twofa.disable' | translate }}
          </button>
          <button class="tfm-btn-ghost" *ngIf="!regenerating" (click)="startRegenerate()">{{ 'twofa.regenerate' | translate }}</button>
          <button class="tfm-btn-primary" *ngIf="regenerating" (click)="confirmRegenerate()" [disabled]="busy || code.trim().length < 6">{{ 'twofa.regenerateConfirm' | translate }}</button>
        </div>
        <p class="tfm-error" *ngIf="error">{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .tfm { display: flex; flex-direction: column; gap: 14px; }
    .tfm-status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #64748b; }
    .tfm-status .tfm-dot { width: 9px; height: 9px; border-radius: 50%; background: #cbd5e1; }
    .tfm-status.on { color: #16a34a; } .tfm-status.on .tfm-dot { background: #16a34a; }
    .tfm-hint { font-size: 12.5px; line-height: 1.5; color: #64748b; margin: 0; }
    .tfm-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #94a3b8; margin: 0 0 5px; }
    .tfm-setup { display: flex; flex-direction: column; gap: 10px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
    .tfm-qr-wrap { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .tfm-qr { width: 152px; height: 152px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px; background: #fff; }
    .tfm-secret-col { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
    .tfm-secret { font-family: monospace; font-size: 13px; letter-spacing: 1.4px; color: #1e293b; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; word-break: break-all; }
    .tfm-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .tfm-row input { height: 40px; width: 130px; padding: 0 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 16px; font-weight: 700; letter-spacing: 4px; text-align: center; color: #1e293b; outline: none; }
    .tfm-row input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .tfm-btn-primary, .tfm-btn-danger, .tfm-btn-ghost { height: 40px; padding: 0 16px; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .tfm-btn-primary { background: #2563eb; color: #fff; } .tfm-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
    .tfm-btn-danger { background: #dc2626; color: #fff; } .tfm-btn-danger:hover:not(:disabled) { background: #b91c1c; }
    .tfm-btn-ghost { background: none; color: #64748b; } .tfm-btn-ghost:hover { background: #f1f5f9; }
    .tfm-btn-primary:disabled, .tfm-btn-danger:disabled { opacity: .55; cursor: not-allowed; }
    .tfm-error { color: #dc2626; font-size: 12.5px; font-weight: 600; margin: 2px 0 0; }
    .tfm-codes { display: flex; flex-direction: column; gap: 10px; padding: 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; }
    .tfm-codes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .tfm-codes-grid code { font-family: monospace; font-size: 13.5px; letter-spacing: 1px; color: #1e293b; background: #fff; border: 1px solid #fde68a; border-radius: 7px; padding: 6px 8px; text-align: center; }
  `]
})
export class TwofaManagerComponent implements OnInit {
  enabled = false;
  busy = false;
  code = '';
  error = '';
  setup: { secret: string; otpauthUri: string } | null = null;
  qrDataUrl = '';
  recoveryCodes: string[] = [];
  regenerating = false;

  constructor(
    private twofa: TwoFactorService,
    private toast: ToastService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.twofa.status().subscribe({
      next: (res: any) => { this.enabled = !!(res?.data?.enabled ?? res?.enabled); this.cdr.detectChanges(); },
      error: () => { this.enabled = false; }
    });
  }

  startSetup(): void {
    this.busy = true; this.error = ''; this.qrDataUrl = '';
    this.twofa.setup().subscribe({
      next: (res: any) => {
        this.setup = res?.data || res;
        this.code = '';
        this.busy = false;
        if (this.setup?.otpauthUri) {
          QRCode.toDataURL(this.setup.otpauthUri, { width: 200, margin: 1 })
            .then(url => { this.qrDataUrl = url; this.cdr.detectChanges(); })
            .catch(() => {});
        }
        this.cdr.detectChanges();
      },
      error: () => { this.busy = false; this.error = this.translate.instant('twofa.toastError'); this.cdr.detectChanges(); }
    });
  }

  confirmEnable(): void {
    const c = this.code.trim();
    if (c.length < 6 || this.busy) return;
    this.busy = true; this.error = '';
    this.twofa.enable(c).subscribe({
      next: (res: any) => {
        this.enabled = true; this.setup = null; this.qrDataUrl = ''; this.code = ''; this.busy = false;
        this.recoveryCodes = (res?.data?.recoveryCodes || res?.recoveryCodes || []);
        this.toast.show(this.translate.instant('twofa.toastEnabled'), 'success');
        this.cdr.detectChanges();
      },
      error: (err: any) => { this.busy = false; this.error = err?.error?.message || this.translate.instant('twofa.toastInvalid'); this.cdr.detectChanges(); }
    });
  }

  startRegenerate(): void { this.regenerating = true; this.code = ''; this.error = ''; }

  confirmRegenerate(): void {
    const c = this.code.trim();
    if (c.length < 6 || this.busy) return;
    this.busy = true; this.error = '';
    this.twofa.regenerateRecoveryCodes(c).subscribe({
      next: (res: any) => {
        this.busy = false; this.regenerating = false; this.code = '';
        this.recoveryCodes = (res?.data?.recoveryCodes || res?.recoveryCodes || []);
        this.cdr.detectChanges();
      },
      error: (err: any) => { this.busy = false; this.error = err?.error?.message || this.translate.instant('twofa.toastInvalid'); this.cdr.detectChanges(); }
    });
  }

  copyCodes(): void {
    try { navigator.clipboard.writeText(this.recoveryCodes.join('\n')); this.toast.show(this.translate.instant('twofa.codesCopied'), 'success'); } catch { /* ignore */ }
  }

  downloadCodes(): void {
    const blob = new Blob([this.recoveryCodes.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'recovery-codes.txt'; a.click();
    URL.revokeObjectURL(url);
  }

  dismissCodes(): void { this.recoveryCodes = []; }

  confirmDisable(): void {
    const c = this.code.trim();
    if (c.length < 6 || this.busy) return;
    this.busy = true; this.error = '';
    this.twofa.disable(c).subscribe({
      next: () => {
        this.enabled = false; this.code = ''; this.busy = false;
        this.toast.show(this.translate.instant('twofa.toastDisabled'), 'success');
        this.cdr.detectChanges();
      },
      error: (err: any) => { this.busy = false; this.error = err?.error?.message || this.translate.instant('twofa.toastInvalid'); this.cdr.detectChanges(); }
    });
  }

  cancel(): void { this.setup = null; this.qrDataUrl = ''; this.code = ''; this.error = ''; }
}
