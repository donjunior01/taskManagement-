import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SessionService, UserSession } from '../../../core/services/session.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Lists the signed-in user's active devices/sessions and lets them revoke any of them or sign out
 * of everywhere else. Backed by the revocable-JWT session registry; reused in the header modal.
 */
@Component({
  selector: 'app-sessions-manager',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="sm">
      <div class="sm-head">
        <p class="sm-intro">{{ 'sessions.intro' | translate }}</p>
        <button class="sm-others" (click)="signOutOthers()" [disabled]="busy || sessions.length < 2">
          {{ 'sessions.signOutOthers' | translate }}
        </button>
      </div>

      <div class="sm-empty" *ngIf="!loading && sessions.length === 0">{{ 'sessions.none' | translate }}</div>
      <div class="sm-loading" *ngIf="loading">{{ 'common.loading' | translate }}</div>

      <ul class="sm-list" *ngIf="!loading">
        <li class="sm-item" *ngFor="let s of sessions" [class.current]="s.current">
          <div class="sm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div class="sm-info">
            <div class="sm-device">{{ friendly(s.device) }}<span class="sm-badge" *ngIf="s.current">{{ 'sessions.thisDevice' | translate }}</span></div>
            <div class="sm-meta">{{ s.ipAddress || '—' }} · {{ 'sessions.lastSeen' | translate }} {{ fmt(s.lastSeenAt) }}</div>
          </div>
          <button class="sm-revoke" *ngIf="!s.current" (click)="revoke(s)" [disabled]="busy">{{ 'sessions.revoke' | translate }}</button>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .sm { display: flex; flex-direction: column; gap: 12px; }
    .sm-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .sm-intro { font-size: 12.5px; color: var(--text-muted); margin: 0; flex: 1; min-width: 180px; }
    .sm-others { height: 34px; padding: 0 12px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 9px; font-size: 12.5px; font-weight: 600; color: var(--danger-text); cursor: pointer; font-family: inherit; }
    .sm-others:hover:not(:disabled) { background: rgba(220,38,38,.06); } .sm-others:disabled { opacity: .5; cursor: not-allowed; }
    .sm-empty, .sm-loading { font-size: 13px; color: var(--text-muted); padding: 14px 0; text-align: center; }
    .sm-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto; }
    .sm-item { display: flex; align-items: center; gap: 12px; padding: 11px 13px; border: 1px solid var(--border); border-radius: 11px; background: var(--bg-card); }
    .sm-item.current { border-color: #2563eb; background: rgba(37,99,235,.04); }
    .sm-icon { width: 36px; height: 36px; border-radius: 9px; background: var(--bg-subtle); color: var(--text-secondary); display: grid; place-items: center; flex-shrink: 0; }
    .sm-icon svg { width: 18px; height: 18px; }
    .sm-info { flex: 1; min-width: 0; }
    .sm-device { font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .sm-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; color: #2563eb; background: rgba(37,99,235,.1); padding: 2px 7px; border-radius: 9999px; }
    .sm-meta { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; overflow-wrap: anywhere; }
    .sm-revoke { height: 32px; padding: 0 12px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--danger-text); cursor: pointer; font-family: inherit; flex-shrink: 0; }
    .sm-revoke:hover:not(:disabled) { background: rgba(220,38,38,.06); } .sm-revoke:disabled { opacity: .5; cursor: not-allowed; }
  `]
})
export class SessionsManagerComponent implements OnInit {
  sessions: UserSession[] = [];
  loading = true;
  busy = false;

  constructor(
    private sessionService: SessionService,
    private toast: ToastService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.sessionService.list().subscribe({
      next: (res: any) => { this.sessions = res?.data || res || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.sessions = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  revoke(s: UserSession): void {
    if (this.busy) return;
    this.busy = true;
    this.sessionService.revoke(s.id).subscribe({
      next: () => { this.busy = false; this.toast.show(this.translate.instant('sessions.toastRevoked'), 'success'); this.load(); },
      error: () => { this.busy = false; this.toast.show(this.translate.instant('sessions.toastFailed'), 'error'); }
    });
  }

  signOutOthers(): void {
    if (this.busy) return;
    this.busy = true;
    this.sessionService.revokeOthers().subscribe({
      next: () => { this.busy = false; this.toast.show(this.translate.instant('sessions.toastOthersRevoked'), 'success'); this.load(); },
      error: () => { this.busy = false; this.toast.show(this.translate.instant('sessions.toastFailed'), 'error'); }
    });
  }

  /** Best-effort friendly name from the User-Agent string. */
  friendly(ua: string | null): string {
    if (!ua) return this.translate.instant('sessions.unknownDevice');
    const os = /Windows/i.test(ua) ? 'Windows' : /Mac OS|Macintosh/i.test(ua) ? 'macOS' : /Android/i.test(ua) ? 'Android'
      : /iPhone|iPad|iOS/i.test(ua) ? 'iOS' : /Linux/i.test(ua) ? 'Linux' : '';
    const br = /Edg\//i.test(ua) ? 'Edge' : /OPR\/|Opera/i.test(ua) ? 'Opera' : /Chrome\//i.test(ua) ? 'Chrome'
      : /Firefox\//i.test(ua) ? 'Firefox' : /Safari\//i.test(ua) ? 'Safari' : '';
    const label = [br, os].filter(Boolean).join(' · ');
    return label || ua.slice(0, 40);
  }

  fmt(iso: string): string {
    if (!iso) return '—';
    const locale = this.translate.currentLang() === 'en' ? 'en-GB' : 'fr-FR';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
