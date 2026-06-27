import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { WorkflowService, WorkflowStatus, StatusCategory } from '../../../core/services/workflow.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="wf-wrap">
    <div class="wf-bar">
      <div>
        <h2>{{ 'admin.workflows.title' | translate }}</h2>
        <p class="wf-sub">{{ 'admin.workflows.subtitle' | translate }}</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">+ {{ 'admin.workflows.newStatus' | translate }}</button>
    </div>

    <div class="wf-note" *ngIf="!loading && statuses.length === 0">
      <p>{{ 'admin.workflows.empty' | translate }}</p>
    </div>

    <div class="wf-board" *ngIf="!loading && statuses.length > 0">
      <div class="wf-cat" *ngFor="let c of categories">
        <div class="wf-cat-head">{{ ('admin.workflows.cat.' + c) | translate }}</div>
        <div class="wf-col" *ngFor="let s of byCat(c)" [class.off]="!s.active">
          <span class="wf-dot" [style.background]="s.color || defaultColor(c)"></span>
          <span class="wf-name">{{ s.name }}</span>
          <span class="wf-order">#{{ s.displayOrder }}</span>
          <button class="ic" (click)="openEdit(s)" [title]="'admin.workflows.edit' | translate">✎</button>
          <button class="ic danger" (click)="remove(s)" [title]="'admin.workflows.delete' | translate">✕</button>
        </div>
        <div class="wf-cat-empty" *ngIf="byCat(c).length === 0">—</div>
      </div>
    </div>

    <!-- Editor modal -->
    <div class="wf-backdrop" *ngIf="editing" (click)="editing = null">
      <div class="wf-modal" (click)="$event.stopPropagation()">
        <h3>{{ (form.id ? 'admin.workflows.editTitle' : 'admin.workflows.newStatus') | translate }}</h3>

        <label>{{ 'admin.workflows.fName' | translate }}</label>
        <input [(ngModel)]="form.name" [placeholder]="'admin.workflows.fNamePh' | translate" />

        <label>{{ 'admin.workflows.fCategory' | translate }}</label>
        <select [(ngModel)]="form.category">
          <option value="TODO">{{ 'admin.workflows.cat.TODO' | translate }}</option>
          <option value="IN_PROGRESS">{{ 'admin.workflows.cat.IN_PROGRESS' | translate }}</option>
          <option value="DONE">{{ 'admin.workflows.cat.DONE' | translate }}</option>
        </select>
        <small class="wf-hint">{{ 'admin.workflows.fCategoryHint' | translate }}</small>

        <label>{{ 'admin.workflows.fColor' | translate }}</label>
        <div class="wf-colors">
          <button type="button" *ngFor="let c of palette" class="wf-swatch" [style.background]="c"
                  [class.on]="form.color === c" (click)="form.color = c"></button>
        </div>

        <label>{{ 'admin.workflows.fOrder' | translate }}</label>
        <input type="number" [(ngModel)]="form.displayOrder" />

        <label class="wf-check"><input type="checkbox" [(ngModel)]="form.active" /> {{ 'admin.workflows.fActive' | translate }}</label>

        <div class="wf-modal-foot">
          <button class="btn-ghost" (click)="editing = null">{{ 'admin.workflows.cancel' | translate }}</button>
          <button class="btn-primary" (click)="save()" [disabled]="!form.name.trim() || busy">{{ 'admin.workflows.save' | translate }}</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .wf-wrap { padding: 4px 2px 40px; }
    .wf-bar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; gap:16px; flex-wrap:wrap; }
    .wf-bar h2 { margin:0; font-size:20px; font-weight:700; color:var(--text-primary); }
    .wf-sub { margin:4px 0 0; font-size:13px; color:var(--text-muted); max-width:600px; }
    .btn-primary { background:var(--primary); color:#fff; border:none; border-radius:8px; padding:9px 16px; font-weight:600; font-size:13px; cursor:pointer; }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
    .btn-ghost { background:none; border:1px solid var(--border); border-radius:7px; padding:6px 12px; font-size:12.5px; cursor:pointer; color:var(--text-secondary); }
    .wf-note { padding:32px; text-align:center; color:var(--text-muted); border:1px dashed var(--border); border-radius:12px; }
    .wf-board { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    .wf-cat { background:var(--bg-subtle); border:1px solid var(--border); border-radius:12px; padding:12px; }
    .wf-cat-head { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.5px; color:var(--text-muted); margin-bottom:10px; padding:0 2px; }
    .wf-col { display:flex; align-items:center; gap:8px; background:var(--bg-card); border:1px solid var(--border); border-radius:9px; padding:9px 11px; margin-bottom:8px; }
    .wf-col.off { opacity:.5; }
    .wf-dot { width:11px; height:11px; border-radius:50%; flex-shrink:0; }
    .wf-name { flex:1; font-size:13px; font-weight:600; color:var(--text-primary); }
    .wf-order { font-size:11px; color:var(--text-muted); }
    .wf-cat-empty { text-align:center; color:var(--text-muted); font-size:13px; padding:8px; }
    .ic { background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:13px; padding:2px 4px; border-radius:5px; }
    .ic:hover { background:var(--bg-subtle); color:var(--text-primary); }
    .ic.danger:hover { color:#dc2626; }
    .wf-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.5); display:flex; align-items:center; justify-content:center; z-index:2000; padding:24px; }
    .wf-modal { background:var(--bg-card); border-radius:14px; padding:22px 24px; width:100%; max-width:420px; max-height:calc(100vh - 48px); overflow-y:auto; box-shadow:0 20px 50px rgba(0,0,0,.25); }
    .wf-modal h3 { margin:0 0 16px; font-size:17px; font-weight:700; color:var(--text-primary); }
    .wf-modal label { display:block; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.4px; color:var(--text-secondary); margin:12px 0 5px; }
    .wf-modal input, .wf-modal select { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:13.5px; box-sizing:border-box; background:var(--bg-card); color:var(--text-primary); }
    .wf-hint { color:var(--text-muted); font-size:11.5px; }
    .wf-colors { display:flex; gap:8px; flex-wrap:wrap; }
    .wf-swatch { width:26px; height:26px; border-radius:50%; border:2px solid transparent; cursor:pointer; }
    .wf-swatch.on { border-color:var(--text-primary); box-shadow:0 0 0 2px var(--bg-card) inset; }
    .wf-check { display:flex; align-items:center; gap:7px; text-transform:none; letter-spacing:0; font-weight:500; font-size:13px; margin-top:14px; }
    .wf-check input { width:auto; }
    .wf-modal-foot { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }
  `]
})
export class WorkflowsComponent implements OnInit {
  statuses: WorkflowStatus[] = [];
  loading = true;
  busy = false;
  editing: WorkflowStatus | null = null;
  form: WorkflowStatus = this.blank();
  categories: StatusCategory[] = ['TODO', 'IN_PROGRESS', 'DONE'];
  palette = ['#64748b', '#2563eb', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#ca8a04'];

  constructor(private svc: WorkflowService, private toast: ToastService, private t: TranslateService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.listAll().subscribe({
      next: s => { this.statuses = s || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  byCat(c: StatusCategory): WorkflowStatus[] { return this.statuses.filter(s => s.category === c); }
  defaultColor(c: StatusCategory): string { return c === 'DONE' ? '#16a34a' : c === 'IN_PROGRESS' ? '#2563eb' : '#64748b'; }

  blank(): WorkflowStatus {
    return { name: '', category: 'TODO', color: '#64748b', displayOrder: this.statuses.length, active: true };
  }

  openCreate(): void { this.form = this.blank(); this.editing = this.form; }
  openEdit(s: WorkflowStatus): void { this.form = { ...s }; this.editing = this.form; }

  save(): void {
    this.busy = true;
    const done = () => { this.busy = false; this.editing = null; this.load(); };
    const fail = (e: any) => { this.busy = false; this.toast.error(e?.error?.message || this.t.instant('admin.workflows.saveFailed')); };
    const ok = () => { this.toast.success(this.t.instant('admin.workflows.saved')); done(); };
    if (this.form.id) this.svc.update(this.form.id, this.form).subscribe({ next: ok, error: fail });
    else this.svc.create(this.form).subscribe({ next: ok, error: fail });
  }

  remove(s: WorkflowStatus): void {
    this.svc.delete(s.id!).subscribe({ next: () => { this.toast.success(this.t.instant('admin.workflows.deleted')); this.load(); }, error: () => this.toast.error(this.t.instant('admin.workflows.saveFailed')) });
  }
}
