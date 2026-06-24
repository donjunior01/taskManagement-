import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { WebhookService, Webhook } from '../../../core/services/webhook.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-webhooks',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="wh-wrap">
    <div class="wh-bar">
      <div>
        <h2>{{ 'admin.webhooks.title' | translate }}</h2>
        <p class="wh-sub">{{ 'admin.webhooks.subtitle' | translate }}</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">+ {{ 'admin.webhooks.newHook' | translate }}</button>
    </div>

    <div class="wh-grid" *ngIf="!loading">
      <div class="wh-card" *ngFor="let w of hooks" [class.off]="!w.active">
        <div class="wh-card-head">
          <code class="wh-url">{{ w.url }}</code>
          <span class="badge" [class.on]="w.active">{{ (w.active ? 'admin.webhooks.active' : 'admin.webhooks.paused') | translate }}</span>
        </div>
        <div class="wh-events">
          <span class="wh-chip" *ngFor="let e of w.events">{{ e }}</span>
          <span class="wh-chip muted" *ngIf="w.events.length === 0">{{ 'admin.webhooks.noEvents' | translate }}</span>
        </div>
        <div class="wh-meta">
          {{ 'admin.webhooks.lastDelivery' | translate }}:
          <strong [class.ok]="w.lastStatus && w.lastStatus < 400" [class.bad]="w.lastStatus && w.lastStatus >= 400 || w.lastStatus === -1">
            {{ w.lastStatus ? (w.lastStatus === -1 ? ('admin.webhooks.failed' | translate) : w.lastStatus) : ('admin.webhooks.never' | translate) }}
          </strong>
        </div>
        <div class="wh-foot">
          <button class="btn-ghost" (click)="test(w)">{{ 'admin.webhooks.test' | translate }}</button>
          <button class="btn-ghost" (click)="toggle(w)">{{ (w.active ? 'admin.webhooks.pause' : 'admin.webhooks.resume') | translate }}</button>
          <button class="btn-ghost" (click)="openEdit(w)">{{ 'admin.webhooks.edit' | translate }}</button>
          <button class="btn-ghost danger" (click)="remove(w)">{{ 'admin.webhooks.delete' | translate }}</button>
        </div>
      </div>
      <div class="wh-empty" *ngIf="hooks.length === 0">{{ 'admin.webhooks.empty' | translate }}</div>
    </div>
    <div class="wh-loading" *ngIf="loading">{{ 'common.loading' | translate }}</div>
  </div>

  <div class="wh-backdrop" *ngIf="showModal" (click)="close()">
    <div class="wh-modal" (click)="$event.stopPropagation()">
      <h3>{{ (editing ? 'admin.webhooks.editHook' : 'admin.webhooks.newHook') | translate }}</h3>
      <label class="wh-label">{{ 'admin.webhooks.url' | translate }}</label>
      <input class="wh-input" [(ngModel)]="form.url" placeholder="https://example.com/hooks/gpi" />
      <label class="wh-label">{{ 'admin.webhooks.events' | translate }}</label>
      <div class="wh-event-list">
        <label class="wh-event" *ngFor="let e of catalog">
          <input type="checkbox" [checked]="form.events.includes(e)" (change)="toggleEvent(e)" /> <span>{{ e }}</span>
        </label>
      </div>
      <div class="wh-secret" *ngIf="form.secret">
        <span class="wh-label">{{ 'admin.webhooks.secret' | translate }}</span>
        <code>{{ form.secret }}</code>
      </div>
      <div class="wh-foot">
        <button class="btn-ghost" (click)="close()">{{ 'admin.webhooks.cancel' | translate }}</button>
        <button class="btn-primary" (click)="save()" [disabled]="busy || !form.url.trim()">{{ 'admin.webhooks.save' | translate }}</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .wh-wrap { display: flex; flex-direction: column; gap: 18px; }
    .wh-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .wh-bar h2 { font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0; }
    .wh-sub { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }
    .wh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .wh-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .wh-card.off { opacity: .6; }
    .wh-card-head { display: flex; align-items: center; gap: 8px; }
    .wh-url { font-family: monospace; font-size: 12.5px; color: var(--text-primary); flex: 1; word-break: break-all; }
    .badge { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; background: var(--bg-subtle); color: var(--text-muted); white-space: nowrap; }
    .badge.on { background: rgba(22,163,74,.12); color: #16a34a; }
    .wh-events { display: flex; flex-wrap: wrap; gap: 5px; }
    .wh-chip { font-size: 10.5px; font-weight: 600; background: var(--primary-bg); color: var(--primary); padding: 2px 8px; border-radius: 6px; } .wh-chip.muted { background: var(--bg-subtle); color: var(--text-muted); }
    .wh-meta { font-size: 12px; color: var(--text-muted); } .wh-meta .ok { color: #16a34a; } .wh-meta .bad { color: var(--danger); }
    .wh-foot { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
    .wh-empty, .wh-loading { padding: 36px; text-align: center; color: var(--text-muted); }
    .btn-primary { height: 38px; padding: 0 15px; border: none; border-radius: 10px; background: var(--primary); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; } .btn-primary:disabled { opacity: .55; cursor: not-allowed; }
    .btn-ghost { height: 30px; padding: 0 10px; border: none; background: none; border-radius: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-ghost:hover { background: var(--bg-subtle); } .btn-ghost.danger { color: var(--danger); }
    .wh-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .wh-modal { width: 100%; max-width: 520px; max-height: calc(100vh - 48px); overflow-y: auto; background: var(--bg-card); border-radius: 16px; padding: 20px 22px; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .wh-modal h3 { font-size: 16px; font-weight: 700; margin: 0 0 12px; color: var(--text-primary); }
    .wh-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); margin: 10px 0 5px; }
    .wh-input { width: 100%; box-sizing: border-box; height: 40px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13.5px; outline: none; font-family: inherit; }
    .wh-event-list { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; border: 1px solid var(--border-light); border-radius: 10px; padding: 10px; }
    .wh-event { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-primary); }
    .wh-secret { margin-top: 10px; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 10px; padding: 10px; word-break: break-all; }
    .wh-secret code { font-family: monospace; font-size: 12.5px; color: var(--text-primary); }
    .wh-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `]
})
export class AdminWebhooksComponent implements OnInit {
  hooks: Webhook[] = [];
  catalog: string[] = [];
  loading = true;
  showModal = false;
  editing: Webhook | null = null;
  busy = false;
  form: Webhook = { url: '', events: [], active: true };

  constructor(private svc: WebhookService, private toast: ToastService, private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.svc.catalog().subscribe({ next: (c: any) => { this.catalog = Array.isArray(c) ? c : (c?.data || []); this.cdr.detectChanges(); } });
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.svc.list().subscribe({
      next: (r: any) => { this.hooks = Array.isArray(r) ? r : (r?.data || []); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.hooks = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openCreate(): void { this.editing = null; this.form = { url: '', events: [], active: true }; this.showModal = true; }
  openEdit(w: Webhook): void { this.editing = w; this.form = { id: w.id, url: w.url, secret: w.secret, events: [...w.events], active: w.active }; this.showModal = true; }
  close(): void { this.showModal = false; }
  toggleEvent(e: string): void { const i = this.form.events.indexOf(e); if (i >= 0) this.form.events.splice(i, 1); else this.form.events.push(e); }

  save(): void {
    if (!this.form.url.trim() || this.busy) return;
    this.busy = true;
    const done = () => { this.busy = false; this.showModal = false; this.toast.show(this.translate.instant('admin.webhooks.toastSaved'), 'success'); this.load(); };
    const fail = () => { this.busy = false; this.toast.show(this.translate.instant('admin.webhooks.toastFailed'), 'error'); this.cdr.detectChanges(); };
    if (this.editing && this.editing.id) this.svc.update(this.editing.id, this.form).subscribe({ next: done, error: fail });
    else this.svc.create(this.form).subscribe({ next: done, error: fail });
  }

  toggle(w: Webhook): void {
    if (!w.id) return;
    this.svc.update(w.id, { ...w, active: !w.active }).subscribe({ next: () => this.load(), error: () => this.toast.show(this.translate.instant('admin.webhooks.toastFailed'), 'error') });
  }

  test(w: Webhook): void {
    if (!w.id) return;
    this.svc.test(w.id).subscribe({
      next: () => { this.toast.show(this.translate.instant('admin.webhooks.toastTested'), 'success'); setTimeout(() => this.load(), 1500); },
      error: () => this.toast.show(this.translate.instant('admin.webhooks.toastFailed'), 'error')
    });
  }

  remove(w: Webhook): void {
    if (!w.id) return;
    this.svc.delete(w.id).subscribe({
      next: () => { this.toast.show(this.translate.instant('admin.webhooks.toastDeleted'), 'success'); this.load(); },
      error: () => this.toast.show(this.translate.instant('admin.webhooks.toastFailed'), 'error')
    });
  }
}
