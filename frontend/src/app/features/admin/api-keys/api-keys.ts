import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiKeyService, ApiKey } from '../../../core/services/api-key.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-api-keys',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="ak-wrap">
    <div class="ak-bar">
      <div>
        <h2>{{ 'admin.apiKeys.title' | translate }}</h2>
        <p class="ak-sub">{{ 'admin.apiKeys.subtitle' | translate }}</p>
      </div>
      <button class="btn-primary" (click)="showCreate = true; newName = ''">+ {{ 'admin.apiKeys.newKey' | translate }}</button>
    </div>

    <div class="ak-card" *ngIf="!loading">
      <table class="ak-table">
        <thead><tr>
          <th>{{ 'admin.apiKeys.colName' | translate }}</th><th>{{ 'admin.apiKeys.colKey' | translate }}</th>
          <th>{{ 'admin.apiKeys.colCreatedBy' | translate }}</th><th>{{ 'admin.apiKeys.colLastUsed' | translate }}</th>
          <th>{{ 'admin.apiKeys.colStatus' | translate }}</th><th></th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let k of keys" [class.revoked]="k.revoked">
            <td>{{ k.name }}</td>
            <td><code>{{ k.keyPrefix }}</code></td>
            <td class="muted">{{ k.createdByName || '—' }}</td>
            <td class="muted">{{ k.lastUsedAt ? (k.lastUsedAt | date:'short') : ('admin.apiKeys.never' | translate) }}</td>
            <td><span class="badge" [class.on]="!k.revoked">{{ (k.revoked ? 'admin.apiKeys.revoked' : 'admin.apiKeys.active') | translate }}</span></td>
            <td class="actions"><button class="btn-ghost danger" *ngIf="!k.revoked" (click)="revoke(k)">{{ 'admin.apiKeys.revoke' | translate }}</button></td>
          </tr>
          <tr *ngIf="keys.length === 0"><td colspan="6"><div class="ak-empty">{{ 'admin.apiKeys.empty' | translate }}</div></td></tr>
        </tbody>
      </table>
    </div>
    <div class="ak-loading" *ngIf="loading">{{ 'common.loading' | translate }}</div>
  </div>

  <!-- Create modal -->
  <div class="ak-backdrop" *ngIf="showCreate" (click)="closeCreate()">
    <div class="ak-modal" (click)="$event.stopPropagation()">
      <h3>{{ 'admin.apiKeys.newKey' | translate }}</h3>
      <ng-container *ngIf="!created">
        <label class="ak-label">{{ 'admin.apiKeys.name' | translate }}</label>
        <input class="ak-input" [(ngModel)]="newName" [placeholder]="'admin.apiKeys.namePh' | translate" (keyup.enter)="create()" />
        <div class="ak-foot">
          <button class="btn-ghost" (click)="closeCreate()">{{ 'admin.apiKeys.cancel' | translate }}</button>
          <button class="btn-primary" (click)="create()" [disabled]="busy || !newName.trim()">{{ 'admin.apiKeys.generate' | translate }}</button>
        </div>
      </ng-container>
      <ng-container *ngIf="created">
        <p class="ak-warn">{{ 'admin.apiKeys.copyOnce' | translate }}</p>
        <div class="ak-keybox"><code>{{ created.plaintextKey }}</code></div>
        <div class="ak-foot">
          <button class="btn-ghost" (click)="copyKey()">{{ 'admin.apiKeys.copy' | translate }}</button>
          <button class="btn-primary" (click)="closeCreate()">{{ 'admin.apiKeys.done' | translate }}</button>
        </div>
      </ng-container>
    </div>
  </div>
  `,
  styles: [`
    .ak-wrap { display: flex; flex-direction: column; gap: 18px; }
    .ak-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .ak-bar h2 { font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0; }
    .ak-sub { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }
    .ak-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
    .ak-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .ak-table th { text-align: left; padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); background: var(--bg-subtle); }
    .ak-table td { padding: 11px 14px; border-top: 1px solid var(--border-light); color: var(--text-primary); }
    .ak-table tr.revoked { opacity: .55; }
    .ak-table .muted { color: var(--text-muted); } .ak-table code { font-family: monospace; font-size: 12px; }
    .badge { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; background: var(--bg-subtle); color: var(--text-muted); }
    .badge.on { background: rgba(22,163,74,.12); color: #16a34a; }
    .actions { text-align: right; }
    .ak-empty, .ak-loading { padding: 36px; text-align: center; color: var(--text-muted); }
    .btn-primary { height: 38px; padding: 0 15px; border: none; border-radius: 10px; background: var(--primary); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; } .btn-primary:disabled { opacity: .55; cursor: not-allowed; }
    .btn-ghost { height: 32px; padding: 0 12px; border: none; background: none; border-radius: 8px; color: var(--text-secondary); font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-ghost.danger { color: var(--danger); }
    .ak-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .ak-modal { width: 100%; max-width: 480px; background: var(--bg-card); border-radius: 16px; padding: 20px 22px; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .ak-modal h3 { font-size: 16px; font-weight: 700; margin: 0 0 12px; color: var(--text-primary); }
    .ak-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); }
    .ak-input { width: 100%; box-sizing: border-box; height: 40px; padding: 0 12px; margin-top: 6px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13.5px; outline: none; font-family: inherit; }
    .ak-warn { font-size: 12.5px; color: #d97706; font-weight: 600; margin: 0 0 8px; }
    .ak-keybox { background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 10px; padding: 12px; word-break: break-all; }
    .ak-keybox code { font-family: monospace; font-size: 13px; color: var(--text-primary); }
    .ak-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `]
})
export class AdminApiKeysComponent implements OnInit {
  keys: ApiKey[] = [];
  loading = true;
  showCreate = false;
  busy = false;
  newName = '';
  created: ApiKey | null = null;

  constructor(private svc: ApiKeyService, private toast: ToastService, private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.svc.list().subscribe({
      next: (r: any) => { this.keys = Array.isArray(r) ? r : (r?.data || []); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.keys = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  create(): void {
    if (!this.newName.trim() || this.busy) return;
    this.busy = true;
    this.svc.create(this.newName.trim()).subscribe({
      next: (r: any) => { this.busy = false; this.created = r?.data || r; this.cdr.detectChanges(); this.load(); },
      error: () => { this.busy = false; this.toast.show(this.translate.instant('admin.apiKeys.toastFailed'), 'error'); this.cdr.detectChanges(); }
    });
  }

  copyKey(): void {
    if (this.created?.plaintextKey) {
      navigator.clipboard?.writeText(this.created.plaintextKey);
      this.toast.show(this.translate.instant('admin.apiKeys.copied'), 'success');
    }
  }

  closeCreate(): void { this.showCreate = false; this.created = null; this.newName = ''; }

  revoke(k: ApiKey): void {
    this.svc.revoke(k.id).subscribe({
      next: () => { this.toast.show(this.translate.instant('admin.apiKeys.toastRevoked'), 'success'); this.load(); },
      error: () => this.toast.show(this.translate.instant('admin.apiKeys.toastFailed'), 'error')
    });
  }
}
