import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ScheduledReportService, ScheduledReport } from '../../../core/services/scheduled-report.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-scheduled-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="sr-wrap">
    <div class="sr-bar">
      <div>
        <h2>{{ 'admin.scheduledReports.title' | translate }}</h2>
        <p class="sr-sub">{{ 'admin.scheduledReports.subtitle' | translate }}</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">+ {{ 'admin.scheduledReports.new' | translate }}</button>
    </div>

    <div class="sr-list" *ngIf="!loading">
      <div class="sr-card" *ngFor="let r of reports">
        <div class="sr-main">
          <div class="sr-name">
            {{ r.name }}
            <span class="sr-badge" [class.off]="!r.enabled">{{ (r.enabled ? 'admin.scheduledReports.on' : 'admin.scheduledReports.off') | translate }}</span>
          </div>
          <div class="sr-meta">
            {{ typeLabel(r.reportType) }} · {{ freqLabel(r.frequency) }} · {{ r.recipients }}
          </div>
          <div class="sr-run">
            {{ 'admin.scheduledReports.lastRun' | translate }}:
            {{ r.lastRunOn ? r.lastRunOn : ('admin.scheduledReports.never' | translate) }}
          </div>
        </div>
        <div class="sr-actions">
          <button class="btn-ghost" (click)="sendNow(r)">{{ 'admin.scheduledReports.sendNow' | translate }}</button>
          <button class="btn-ghost" (click)="openEdit(r)">{{ 'admin.scheduledReports.edit' | translate }}</button>
          <button class="btn-ghost danger" (click)="remove(r)">{{ 'admin.scheduledReports.delete' | translate }}</button>
        </div>
      </div>
      <div class="sr-empty" *ngIf="reports.length === 0">{{ 'admin.scheduledReports.empty' | translate }}</div>
    </div>
    <div class="sr-loading" *ngIf="loading">{{ 'common.loading' | translate }}</div>
  </div>

  <div class="sr-backdrop" *ngIf="showModal" (click)="close()">
    <div class="sr-modal" (click)="$event.stopPropagation()">
      <h3>{{ (editing ? 'admin.scheduledReports.editTitle' : 'admin.scheduledReports.new') | translate }}</h3>

      <label class="sr-label">{{ 'admin.scheduledReports.name' | translate }}</label>
      <input class="sr-input" [(ngModel)]="form.name" [placeholder]="'admin.scheduledReports.namePh' | translate" />

      <label class="sr-label">{{ 'admin.scheduledReports.typeName' | translate }}</label>
      <select class="sr-input" [(ngModel)]="form.reportType">
        <option *ngFor="let t of reportTypes" [value]="t">{{ typeLabel(t) }}</option>
      </select>

      <label class="sr-label">{{ 'admin.scheduledReports.frequency' | translate }}</label>
      <select class="sr-input" [(ngModel)]="form.frequency">
        <option *ngFor="let f of frequencies" [value]="f">{{ freqLabel(f) }}</option>
      </select>

      <label class="sr-label">{{ 'admin.scheduledReports.recipients' | translate }}</label>
      <input class="sr-input" [(ngModel)]="form.recipients" [placeholder]="'admin.scheduledReports.recipientsPh' | translate" />

      <label class="sr-check"><input type="checkbox" [(ngModel)]="form.enabled" /> {{ 'admin.scheduledReports.enabledLabel' | translate }}</label>

      <div class="sr-foot">
        <button class="btn-ghost" (click)="close()">{{ 'admin.scheduledReports.cancel' | translate }}</button>
        <button class="btn-primary" (click)="save()" [disabled]="busy || !valid()">{{ 'admin.scheduledReports.save' | translate }}</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .sr-wrap { padding: 24px; }
    .sr-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 16px; }
    .sr-bar h2 { font-size: 20px; font-weight: 700; margin: 0; }
    .sr-sub { color: var(--text-muted, #64748b); font-size: 13px; margin: 4px 0 0; }
    .sr-list { display: flex; flex-direction: column; gap: 10px; }
    .sr-card { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; }
    .sr-name { font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .sr-badge { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #dcfce7; color: #166534; }
    .sr-badge.off { background: #f1f5f9; color: #64748b; }
    .sr-meta { color: var(--text-muted, #64748b); font-size: 12.5px; margin-top: 4px; }
    .sr-run { color: var(--text-muted, #94a3b8); font-size: 11.5px; margin-top: 2px; }
    .sr-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .sr-empty, .sr-loading { color: var(--text-muted, #64748b); padding: 24px; text-align: center; }
    .btn-primary { background: var(--primary, #2563eb); color: #fff; border: none; padding: 9px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: transparent; border: 1px solid var(--border); padding: 7px 12px; border-radius: 9px; cursor: pointer; font-size: 12.5px; color: var(--text); }
    .btn-ghost.danger { color: #dc2626; border-color: #fecaca; }
    .sr-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .sr-modal { width: 100%; max-width: 460px; max-height: calc(100vh - 48px); overflow-y: auto; background: var(--bg-card); border-radius: 16px; padding: 22px; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .sr-modal h3 { font-size: 16px; font-weight: 700; margin: 0 0 12px; }
    .sr-label { display: block; font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); margin: 12px 0 5px; }
    .sr-input { height: 40px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13.5px; outline: none; font-family: inherit; background: var(--bg-card); color: var(--text); width: 100%; box-sizing: border-box; }
    .sr-check { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: 13px; }
    .sr-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  `]
})
export class ScheduledReportsComponent implements OnInit {
  reports: ScheduledReport[] = [];
  loading = false;
  showModal = false;
  busy = false;
  editing: ScheduledReport | null = null;
  form: ScheduledReport = this.blank();

  readonly reportTypes: ScheduledReport['reportType'][] = ['tasks-csv', 'projects-csv'];
  readonly frequencies: ScheduledReport['frequency'][] = ['DAILY', 'WEEKLY', 'MONTHLY'];

  constructor(private svc: ScheduledReportService, private toast: ToastService,
              private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  private blank(): ScheduledReport {
    return { name: '', reportType: 'tasks-csv', frequency: 'WEEKLY', recipients: '', enabled: true };
  }

  private load(): void {
    this.loading = true;
    this.svc.list().subscribe({
      next: (r: any) => { this.reports = Array.isArray(r) ? r : (r?.data || []); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.reports = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  typeLabel(t: string): string { return this.translate.instant('admin.scheduledReports.type.' + t); }
  freqLabel(f: string): string { return this.translate.instant('admin.scheduledReports.freq.' + f); }

  openCreate(): void { this.editing = null; this.form = this.blank(); this.showModal = true; }
  openEdit(r: ScheduledReport): void { this.editing = r; this.form = { ...r }; this.showModal = true; }
  close(): void { this.showModal = false; }

  valid(): boolean {
    return !!this.form.name.trim() && !!this.form.reportType && !!this.form.frequency && !!this.form.recipients.trim();
  }

  save(): void {
    if (!this.valid() || this.busy) return;
    this.busy = true;
    const done = () => { this.busy = false; this.showModal = false; this.toast.show(this.translate.instant('admin.scheduledReports.saved'), 'success'); this.load(); };
    const fail = (e: any) => { this.busy = false; this.toast.show(e?.error?.message || this.translate.instant('admin.scheduledReports.failed'), 'error'); this.cdr.detectChanges(); };
    if (this.editing && this.editing.id) this.svc.update(this.editing.id, this.form).subscribe({ next: done, error: fail });
    else this.svc.create(this.form).subscribe({ next: done, error: fail });
  }

  sendNow(r: ScheduledReport): void {
    if (!r.id) return;
    this.svc.sendNow(r.id).subscribe({
      next: () => { this.toast.show(this.translate.instant('admin.scheduledReports.sent'), 'success'); this.load(); },
      error: (e: any) => this.toast.show(e?.error?.message || this.translate.instant('admin.scheduledReports.failed'), 'error')
    });
  }

  remove(r: ScheduledReport): void {
    if (!r.id) return;
    this.svc.delete(r.id).subscribe({
      next: () => { this.toast.show(this.translate.instant('admin.scheduledReports.deleted'), 'success'); this.load(); },
      error: () => this.toast.show(this.translate.instant('admin.scheduledReports.failed'), 'error')
    });
  }
}
