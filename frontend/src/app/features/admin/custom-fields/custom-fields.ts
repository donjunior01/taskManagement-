import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CustomFieldService, CustomFieldDefinition, CustomFieldType } from '../../../core/services/custom-field.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-custom-fields',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="cf-wrap">
    <div class="cf-bar">
      <div>
        <h2>{{ 'admin.customFields.title' | translate }}</h2>
        <p class="cf-sub">{{ 'admin.customFields.subtitle' | translate }}</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">+ {{ 'admin.customFields.newField' | translate }}</button>
    </div>

    <div class="cf-empty" *ngIf="!loading && fields.length === 0">
      <p>{{ 'admin.customFields.empty' | translate }}</p>
    </div>

    <table class="cf-table" *ngIf="!loading && fields.length > 0">
      <thead>
        <tr>
          <th>{{ 'admin.customFields.colName' | translate }}</th>
          <th>{{ 'admin.customFields.colType' | translate }}</th>
          <th>{{ 'admin.customFields.colOptions' | translate }}</th>
          <th>{{ 'admin.customFields.colRequired' | translate }}</th>
          <th>{{ 'admin.customFields.colActive' | translate }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let f of fields" [class.off]="!f.active">
          <td class="cf-name">{{ f.name }}</td>
          <td><span class="cf-type">{{ ('admin.customFields.type.' + f.fieldType) | translate }}</span></td>
          <td class="cf-opts">{{ f.fieldType === 'SELECT' ? f.options : '—' }}</td>
          <td>{{ (f.required ? 'admin.customFields.yes' : 'admin.customFields.no') | translate }}</td>
          <td>
            <button class="cf-switch" [class.on]="f.active" (click)="toggleActive(f)"><span></span></button>
          </td>
          <td class="cf-actions">
            <button class="btn-ghost" (click)="openEdit(f)">{{ 'admin.customFields.edit' | translate }}</button>
            <button class="btn-ghost danger" (click)="remove(f)">{{ 'admin.customFields.delete' | translate }}</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Editor modal -->
    <div class="cf-backdrop" *ngIf="editing" (click)="editing = null">
      <div class="cf-modal" (click)="$event.stopPropagation()">
        <h3>{{ (form.id ? 'admin.customFields.editTitle' : 'admin.customFields.newField') | translate }}</h3>

        <label>{{ 'admin.customFields.fName' | translate }}</label>
        <input [(ngModel)]="form.name" [placeholder]="'admin.customFields.fNamePh' | translate" />

        <label>{{ 'admin.customFields.fType' | translate }}</label>
        <select [(ngModel)]="form.fieldType">
          <option *ngFor="let t of types" [value]="t">{{ ('admin.customFields.type.' + t) | translate }}</option>
        </select>

        <ng-container *ngIf="form.fieldType === 'SELECT'">
          <label>{{ 'admin.customFields.fOptions' | translate }}</label>
          <input [(ngModel)]="form.options" [placeholder]="'admin.customFields.fOptionsPh' | translate" />
          <small class="cf-hint">{{ 'admin.customFields.fOptionsHint' | translate }}</small>
        </ng-container>

        <div class="cf-row">
          <label class="cf-check"><input type="checkbox" [(ngModel)]="form.required" /> {{ 'admin.customFields.fRequired' | translate }}</label>
          <label class="cf-check"><input type="checkbox" [(ngModel)]="form.active" /> {{ 'admin.customFields.fActive' | translate }}</label>
        </div>

        <label>{{ 'admin.customFields.fOrder' | translate }}</label>
        <input type="number" [(ngModel)]="form.displayOrder" />

        <div class="cf-modal-foot">
          <button class="btn-ghost" (click)="editing = null">{{ 'admin.customFields.cancel' | translate }}</button>
          <button class="btn-primary" (click)="save()" [disabled]="!form.name.trim() || busy">{{ 'admin.customFields.save' | translate }}</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .cf-wrap { padding: 4px 2px 40px; }
    .cf-bar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; gap:16px; flex-wrap:wrap; }
    .cf-bar h2 { margin:0; font-size:20px; font-weight:700; color:var(--text-primary,#0f172a); }
    .cf-sub { margin:4px 0 0; font-size:13px; color:var(--text-muted,#64748b); max-width:560px; }
    .btn-primary { background:var(--primary,#2563eb); color:#fff; border:none; border-radius:8px; padding:9px 16px; font-weight:600; font-size:13px; cursor:pointer; }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
    .btn-ghost { background:none; border:1px solid var(--border); border-radius:7px; padding:6px 12px; font-size:12.5px; cursor:pointer; color:var(--text-secondary,#475569); }
    .btn-ghost.danger { color:var(--danger-text); border-color:#fecaca; }
    .cf-empty { padding:48px; text-align:center; color:var(--text-muted,#64748b); border:1px dashed var(--border); border-radius:12px; }
    .cf-table { width:100%; border-collapse:collapse; background:var(--bg-card,#fff); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
    .cf-table th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:var(--text-muted,#64748b); padding:12px 16px; border-bottom:1px solid var(--border-light,#f1f5f9); }
    .cf-table td { padding:13px 16px; font-size:13.5px; color:var(--text-primary,#0f172a); border-bottom:1px solid var(--border-light,#f1f5f9); }
    .cf-table tr.off { opacity:.5; }
    .cf-name { font-weight:600; }
    .cf-type { background:var(--primary-bg,#eff6ff); color:var(--primary,#2563eb); padding:3px 9px; border-radius:20px; font-size:11.5px; font-weight:600; }
    .cf-opts { color:var(--text-muted,#64748b); font-size:12.5px; }
    .cf-actions { text-align:right; white-space:nowrap; display:flex; gap:6px; justify-content:flex-end; }
    .cf-switch { width:38px; height:21px; border-radius:20px; background:var(--border-strong); border:none; position:relative; cursor:pointer; transition:background .15s; }
    .cf-switch.on { background:var(--primary,#2563eb); }
    .cf-switch span { position:absolute; top:2px; left:2px; width:17px; height:17px; border-radius:50%; background:var(--bg-card); transition:left .15s; }
    .cf-switch.on span { left:19px; }
    .cf-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.5); display:flex; align-items:center; justify-content:center; z-index:2000; padding:24px; }
    .cf-modal { background:var(--bg-card,#fff); border-radius:14px; padding:22px 24px; width:100%; max-width:440px; max-height:calc(100vh - 48px); overflow-y:auto; box-shadow:0 20px 50px rgba(0,0,0,.25); }
    .cf-modal h3 { margin:0 0 16px; font-size:17px; font-weight:700; }
    .cf-modal label { display:block; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.4px; color:var(--text-secondary,#475569); margin:12px 0 5px; }
    .cf-modal input, .cf-modal select { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:13.5px; box-sizing:border-box; }
    .cf-hint { color:var(--text-muted,#94a3b8); font-size:11.5px; }
    .cf-row { display:flex; gap:20px; margin-top:8px; }
    .cf-check { display:flex; align-items:center; gap:6px; text-transform:none; letter-spacing:0; font-weight:500; font-size:13px; margin:12px 0 0; }
    .cf-check input { width:auto; }
    .cf-modal-foot { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }
  `]
})
export class CustomFieldsComponent implements OnInit {
  fields: CustomFieldDefinition[] = [];
  loading = true;
  busy = false;
  editing: CustomFieldDefinition | null = null;
  form: CustomFieldDefinition = this.blank();
  types: CustomFieldType[] = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX'];

  constructor(private svc: CustomFieldService, private toast: ToastService, private t: TranslateService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.listAll().subscribe({
      next: f => { this.fields = f || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  blank(): CustomFieldDefinition {
    return { name: '', fieldType: 'TEXT', options: '', required: false, displayOrder: this.fields.length, active: true };
  }

  openCreate(): void { this.form = this.blank(); this.editing = this.form; }
  openEdit(f: CustomFieldDefinition): void { this.form = { ...f }; this.editing = this.form; }

  save(): void {
    this.busy = true;
    const done = () => { this.busy = false; this.editing = null; this.load(); };
    const fail = (e: any) => { this.busy = false; this.toast.error(e?.error?.message || this.t.instant('admin.customFields.saveFailed')); };
    const ok = () => { this.toast.success(this.t.instant('admin.customFields.saved')); done(); };
    if (this.form.id) {
      this.svc.update(this.form.id, this.form).subscribe({ next: ok, error: fail });
    } else {
      this.svc.create(this.form).subscribe({ next: ok, error: fail });
    }
  }

  toggleActive(f: CustomFieldDefinition): void {
    this.svc.update(f.id!, { ...f, active: !f.active }).subscribe({ next: () => this.load(), error: () => this.toast.error(this.t.instant('admin.customFields.saveFailed')) });
  }

  remove(f: CustomFieldDefinition): void {
    this.svc.delete(f.id!).subscribe({ next: () => { this.toast.success(this.t.instant('admin.customFields.deleted')); this.load(); }, error: () => this.toast.error(this.t.instant('admin.customFields.saveFailed')) });
  }
}
