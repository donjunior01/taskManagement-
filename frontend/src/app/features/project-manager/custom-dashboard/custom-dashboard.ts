import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { DashboardLayoutService } from '../../../core/services/dashboard-layout.service';
import { ToastService } from '../../../core/services/toast.service';

interface Widget { key: string; fmt: 'int' | 'pct' | 'days'; tone: string; }

@Component({
  selector: 'app-custom-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
  <div class="cd-wrap">
    <div class="cd-bar">
      <div>
        <h2>{{ 'pm.customDash.title' | translate }}</h2>
        <p class="cd-sub">{{ 'pm.customDash.subtitle' | translate }}</p>
      </div>
      <div class="cd-actions">
        <button *ngIf="!editing" class="btn-ghost" (click)="startEdit()">{{ 'pm.customDash.customize' | translate }}</button>
        <ng-container *ngIf="editing">
          <button class="btn-ghost" (click)="cancel()">{{ 'pm.customDash.cancel' | translate }}</button>
          <button class="btn-primary" (click)="save()" [disabled]="busy">{{ 'pm.customDash.save' | translate }}</button>
        </ng-container>
      </div>
    </div>

    <!-- View mode: selected KPI tiles -->
    <div class="cd-grid" *ngIf="!editing && !loading">
      <div class="cd-tile" [ngClass]="w.tone" *ngFor="let w of selectedWidgets()">
        <div class="cd-val">{{ formatValue(w) }}</div>
        <div class="cd-lbl">{{ ('pm.customDash.w.' + w.key) | translate }}</div>
      </div>
      <div class="cd-empty" *ngIf="selected.length === 0">{{ 'pm.customDash.empty' | translate }}</div>
    </div>

    <!-- Edit mode: pick & reorder -->
    <div class="cd-edit" *ngIf="editing">
      <p class="cd-hint">{{ 'pm.customDash.editHint' | translate }}</p>
      <div class="cd-row" *ngFor="let w of catalog">
        <label class="cd-check">
          <input type="checkbox" [checked]="isSelected(w.key)" (change)="toggle(w.key)" />
          {{ ('pm.customDash.w.' + w.key) | translate }}
        </label>
        <div class="cd-move" *ngIf="isSelected(w.key)">
          <button class="cd-mv" (click)="move(w.key, -1)" [disabled]="orderIndex(w.key) === 0">↑</button>
          <button class="cd-mv" (click)="move(w.key, 1)" [disabled]="orderIndex(w.key) === selected.length - 1">↓</button>
          <span class="cd-pos">{{ orderIndex(w.key) + 1 }}</span>
        </div>
      </div>
    </div>

    <div class="cd-loading" *ngIf="loading">{{ 'common.loading' | translate }}</div>
  </div>
  `,
  styles: [`
    .cd-wrap { padding: 24px; }
    .cd-bar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 18px; }
    .cd-bar h2 { font-size: 20px; font-weight: 700; margin: 0; }
    .cd-sub { color: var(--text-muted, #64748b); font-size: 13px; margin: 4px 0 0; }
    .cd-actions { display: flex; gap: 8px; }
    .cd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
    .cd-tile { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px; }
    .cd-tile.success { border-left: 4px solid #16a34a; }
    .cd-tile.danger  { border-left: 4px solid #dc2626; }
    .cd-tile.primary { border-left: 4px solid #2563eb; }
    .cd-tile.navy    { border-left: 4px solid #1e293b; }
    .cd-val { font-size: 30px; font-weight: 800; color: var(--text, #0f172a); line-height: 1.1; }
    .cd-lbl { margin-top: 6px; font-size: 12.5px; color: var(--text-muted, #64748b); font-weight: 600; }
    .cd-empty { color: var(--text-muted, #64748b); padding: 24px; }
    .cd-edit { max-width: 520px; }
    .cd-hint { color: var(--text-muted, #64748b); font-size: 13px; margin: 0 0 12px; }
    .cd-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; background: var(--bg-card); }
    .cd-check { display: flex; align-items: center; gap: 10px; font-size: 13.5px; }
    .cd-move { display: flex; align-items: center; gap: 6px; }
    .cd-mv { width: 28px; height: 28px; border: 1px solid var(--border); background: transparent; border-radius: 8px; cursor: pointer; color: var(--text); }
    .cd-mv:disabled { opacity: .35; cursor: not-allowed; }
    .cd-pos { font-size: 12px; color: var(--text-muted, #64748b); width: 18px; text-align: center; }
    .btn-primary { background: var(--primary, #2563eb); color: #fff; border: none; padding: 9px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: transparent; border: 1px solid var(--border); padding: 8px 14px; border-radius: 9px; cursor: pointer; font-size: 13px; color: var(--text); }
  `]
})
export class CustomDashboardComponent implements OnInit {
  readonly catalog: Widget[] = [
    { key: 'totalProjects',        fmt: 'int',  tone: 'navy' },
    { key: 'totalTasks',           fmt: 'int',  tone: '' },
    { key: 'completedTasks',       fmt: 'int',  tone: 'success' },
    { key: 'openTasks',            fmt: 'int',  tone: '' },
    { key: 'overdueTasks',         fmt: 'int',  tone: 'danger' },
    { key: 'inProgressTasks',      fmt: 'int',  tone: '' },
    { key: 'todoTasks',            fmt: 'int',  tone: '' },
    { key: 'onHoldTasks',          fmt: 'int',  tone: '' },
    { key: 'onTimeCompletionRate', fmt: 'pct',  tone: 'primary' },
    { key: 'avgCompletionDays',    fmt: 'days', tone: '' },
    { key: 'velocityLast4Weeks',   fmt: 'int',  tone: 'navy' }
  ];
  private readonly DEFAULT = ['completedTasks', 'onTimeCompletionRate', 'overdueTasks', 'velocityLast4Weeks', 'totalProjects', 'openTasks'];

  data: any = {};
  selected: string[] = [];
  private savedSelection: string[] = [];
  loading = true;
  editing = false;
  busy = false;

  constructor(private analytics: AnalyticsService, private layoutSvc: DashboardLayoutService,
              private toast: ToastService, private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.analytics.getManagerAnalytics().subscribe({
      next: (r: any) => { this.data = r?.data || r || {}; this.loadLayout(); },
      error: () => { this.data = {}; this.loadLayout(); }
    });
  }

  private loadLayout(): void {
    this.layoutSvc.get().subscribe({
      next: (r: any) => { this.applyLayout(r?.widgets); this.finish(); },
      error: () => { this.applyLayout(null); this.finish(); }
    });
  }

  private applyLayout(widgets: string[] | null | undefined): void {
    const valid = new Set(this.catalog.map(w => w.key));
    const chosen = (widgets && widgets.length ? widgets : this.DEFAULT).filter(k => valid.has(k));
    this.selected = chosen.length ? chosen : [...this.DEFAULT];
    this.savedSelection = [...this.selected];
  }

  private finish(): void { this.loading = false; this.cdr.detectChanges(); }

  selectedWidgets(): Widget[] {
    return this.selected.map(k => this.catalog.find(w => w.key === k)).filter((w): w is Widget => !!w);
  }

  formatValue(w: Widget): string {
    const v = this.data[w.key] ?? 0;
    if (w.fmt === 'pct') return `${Math.round(v)}%`;
    if (w.fmt === 'days') return `${Math.round(v * 10) / 10}`;
    return `${Math.round(v)}`;
  }

  isSelected(key: string): boolean { return this.selected.includes(key); }
  orderIndex(key: string): number { return this.selected.indexOf(key); }

  toggle(key: string): void {
    if (this.isSelected(key)) this.selected = this.selected.filter(k => k !== key);
    else this.selected = [...this.selected, key];
  }

  move(key: string, dir: -1 | 1): void {
    const i = this.selected.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= this.selected.length) return;
    const next = [...this.selected];
    [next[i], next[j]] = [next[j], next[i]];
    this.selected = next;
  }

  startEdit(): void { this.editing = true; }
  cancel(): void { this.selected = [...this.savedSelection]; this.editing = false; }

  save(): void {
    this.busy = true;
    this.layoutSvc.save(this.selected).subscribe({
      next: () => { this.busy = false; this.editing = false; this.savedSelection = [...this.selected];
        this.toast.show(this.translate.instant('pm.customDash.saved'), 'success'); this.cdr.detectChanges(); },
      error: () => { this.busy = false; this.toast.show(this.translate.instant('pm.customDash.saveFailed'), 'error'); this.cdr.detectChanges(); }
    });
  }
}
