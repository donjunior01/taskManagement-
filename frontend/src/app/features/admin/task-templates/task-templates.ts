import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TaskTemplateService, TaskTemplate } from '../../../core/services/task-template.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-task-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="tt-wrap">
    <div class="tt-bar">
      <div>
        <h2>{{ 'admin.templates.title' | translate }}</h2>
        <p class="tt-sub">{{ 'admin.templates.subtitle' | translate }}</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">+ {{ 'admin.templates.newTemplate' | translate }}</button>
    </div>

    <div class="tt-empty" *ngIf="!loading && templates.length === 0">
      <p>{{ 'admin.templates.empty' | translate }}</p>
    </div>

    <div class="tt-grid" *ngIf="!loading && templates.length > 0">
      <div class="tt-card" *ngFor="let t of templates" [class.off]="!t.active">
        <div class="tt-card-head">
          <h3>{{ t.name }}</h3>
          <span class="tt-prio" [attr.data-p]="t.priority">{{ ('pm.tasks.prio' + cap(t.priority)) | translate }}</span>
        </div>
        <p class="tt-task" *ngIf="t.taskName">{{ t.taskName }}</p>
        <p class="tt-desc" *ngIf="t.description">{{ t.description }}</p>
        <div class="tt-meta">
          <span *ngIf="t.defaultDeadlineDays != null">{{ 'admin.templates.dueInDays' | translate:{ n: t.defaultDeadlineDays } }}</span>
          <span class="tt-off" *ngIf="!t.active">{{ 'admin.templates.disabled' | translate }}</span>
        </div>
        <div class="tt-foot">
          <button class="btn-ghost" (click)="openEdit(t)">{{ 'admin.templates.edit' | translate }}</button>
          <button class="btn-ghost danger" (click)="remove(t)">{{ 'admin.templates.delete' | translate }}</button>
        </div>
      </div>
    </div>

    <!-- Editor modal -->
    <div class="tt-backdrop" *ngIf="editing" (click)="editing = null">
      <div class="tt-modal" (click)="$event.stopPropagation()">
        <h3>{{ (form.id ? 'admin.templates.editTitle' : 'admin.templates.newTemplate') | translate }}</h3>

        <label>{{ 'admin.templates.fName' | translate }}</label>
        <input [(ngModel)]="form.name" [placeholder]="'admin.templates.fNamePh' | translate" />

        <label>{{ 'admin.templates.fTaskName' | translate }}</label>
        <input [(ngModel)]="form.taskName" [placeholder]="'admin.templates.fTaskNamePh' | translate" />

        <label>{{ 'admin.templates.fDescription' | translate }}</label>
        <textarea rows="3" [(ngModel)]="form.description" [placeholder]="'admin.templates.fDescriptionPh' | translate"></textarea>

        <div class="tt-row">
          <div class="tt-col">
            <label>{{ 'admin.templates.fPriority' | translate }}</label>
            <select [(ngModel)]="form.priority">
              <option value="LOW">{{ 'pm.tasks.prioLow' | translate }}</option>
              <option value="MEDIUM">{{ 'pm.tasks.prioMedium' | translate }}</option>
              <option value="HIGH">{{ 'pm.tasks.prioHigh' | translate }}</option>
              <option value="CRITICAL">{{ 'pm.tasks.prioCritical' | translate }}</option>
            </select>
          </div>
          <div class="tt-col">
            <label>{{ 'admin.templates.fDifficulty' | translate }}</label>
            <select [(ngModel)]="form.difficulty">
              <option value="EASY">{{ 'pm.tasks.diffEasy' | translate }}</option>
              <option value="MEDIUM">{{ 'pm.tasks.diffMedium' | translate }}</option>
              <option value="DIFFICULT">{{ 'pm.tasks.diffDifficult' | translate }}</option>
              <option value="HARD">{{ 'pm.tasks.diffHard' | translate }}</option>
            </select>
          </div>
        </div>

        <label>{{ 'admin.templates.fDeadlineDays' | translate }}</label>
        <input type="number" min="0" [(ngModel)]="form.defaultDeadlineDays" [placeholder]="'admin.templates.fDeadlineDaysPh' | translate" />
        <small class="tt-hint">{{ 'admin.templates.fDeadlineHint' | translate }}</small>

        <label class="tt-check"><input type="checkbox" [(ngModel)]="form.active" /> {{ 'admin.templates.fActive' | translate }}</label>

        <div class="tt-modal-foot">
          <button class="btn-ghost" (click)="editing = null">{{ 'admin.templates.cancel' | translate }}</button>
          <button class="btn-primary" (click)="save()" [disabled]="!form.name.trim() || busy">{{ 'admin.templates.save' | translate }}</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .tt-wrap { padding: 4px 2px 40px; }
    .tt-bar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; gap:16px; flex-wrap:wrap; }
    .tt-bar h2 { margin:0; font-size:20px; font-weight:700; color:var(--text-primary); }
    .tt-sub { margin:4px 0 0; font-size:13px; color:var(--text-muted); max-width:560px; }
    .btn-primary { background:var(--primary); color:#fff; border:none; border-radius:8px; padding:9px 16px; font-weight:600; font-size:13px; cursor:pointer; }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
    .btn-ghost { background:none; border:1px solid var(--border); border-radius:7px; padding:6px 12px; font-size:12.5px; cursor:pointer; color:var(--text-secondary); }
    .btn-ghost.danger { color:#dc2626; border-color:#fecaca; }
    .tt-empty { padding:48px; text-align:center; color:var(--text-muted); border:1px dashed var(--border); border-radius:12px; }
    .tt-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
    .tt-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:8px; }
    .tt-card.off { opacity:.55; }
    .tt-card-head { display:flex; justify-content:space-between; align-items:center; gap:10px; }
    .tt-card-head h3 { margin:0; font-size:15px; font-weight:700; color:var(--text-primary); }
    .tt-prio { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; padding:3px 8px; border-radius:20px; background:var(--bg-subtle); color:var(--text-secondary); }
    .tt-prio[data-p="HIGH"], .tt-prio[data-p="CRITICAL"] { background:var(--danger-bg); color:var(--danger-text); }
    .tt-prio[data-p="LOW"] { background:var(--success-bg); color:var(--success-text); }
    .tt-task { margin:0; font-size:13px; font-weight:600; color:var(--text-secondary); }
    .tt-desc { margin:0; font-size:12.5px; color:var(--text-muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .tt-meta { display:flex; gap:10px; font-size:11.5px; color:var(--text-muted); }
    .tt-off { color:#dc2626; font-weight:600; }
    .tt-foot { display:flex; gap:6px; justify-content:flex-end; margin-top:4px; border-top:1px solid var(--border-light); padding-top:10px; }
    .tt-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.5); display:flex; align-items:center; justify-content:center; z-index:2000; padding:24px; }
    .tt-modal { background:var(--bg-card); border-radius:14px; padding:22px 24px; width:100%; max-width:480px; max-height:calc(100vh - 48px); overflow-y:auto; box-shadow:0 20px 50px rgba(0,0,0,.25); }
    .tt-modal h3 { margin:0 0 16px; font-size:17px; font-weight:700; color:var(--text-primary); }
    .tt-modal label { display:block; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.4px; color:var(--text-secondary); margin:12px 0 5px; }
    .tt-modal input, .tt-modal select, .tt-modal textarea { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:13.5px; box-sizing:border-box; font-family:inherit; background:var(--bg-card); color:var(--text-primary); }
    .tt-hint { color:var(--text-muted); font-size:11.5px; }
    .tt-row { display:flex; gap:14px; }
    .tt-col { flex:1; }
    .tt-check { display:flex; align-items:center; gap:7px; text-transform:none; letter-spacing:0; font-weight:500; font-size:13px; margin-top:14px; }
    .tt-check input { width:auto; }
    .tt-modal-foot { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }
  `]
})
export class TaskTemplatesComponent implements OnInit {
  templates: TaskTemplate[] = [];
  loading = true;
  busy = false;
  editing: TaskTemplate | null = null;
  form: TaskTemplate = this.blank();

  constructor(private svc: TaskTemplateService, private toast: ToastService, private t: TranslateService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.listAll().subscribe({
      next: t => { this.templates = t || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  blank(): TaskTemplate {
    return { name: '', taskName: '', description: '', priority: 'MEDIUM', difficulty: 'MEDIUM', defaultDeadlineDays: null, active: true };
  }
  cap(s: string): string { return s ? s.charAt(0) + s.slice(1).toLowerCase() : ''; }

  openCreate(): void { this.form = this.blank(); this.editing = this.form; }
  openEdit(t: TaskTemplate): void { this.form = { ...t }; this.editing = this.form; }

  save(): void {
    this.busy = true;
    const done = () => { this.busy = false; this.editing = null; this.load(); };
    const fail = (e: any) => { this.busy = false; this.toast.error(e?.error?.message || this.t.instant('admin.templates.saveFailed')); };
    const ok = () => { this.toast.success(this.t.instant('admin.templates.saved')); done(); };
    if (this.form.id) this.svc.update(this.form.id, this.form).subscribe({ next: ok, error: fail });
    else this.svc.create(this.form).subscribe({ next: ok, error: fail });
  }

  remove(t: TaskTemplate): void {
    this.svc.delete(t.id!).subscribe({ next: () => { this.toast.success(this.t.instant('admin.templates.deleted')); this.load(); }, error: () => this.toast.error(this.t.instant('admin.templates.saveFailed')) });
  }
}
