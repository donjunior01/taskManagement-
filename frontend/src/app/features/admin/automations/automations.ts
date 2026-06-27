import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AutomationService, AutomationRule } from '../../../core/services/automation.service';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-automations',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="au-wrap">
    <div class="au-bar">
      <div>
        <h2>{{ 'admin.automations.title' | translate }}</h2>
        <p class="au-sub">{{ 'admin.automations.subtitle' | translate }}</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">+ {{ 'admin.automations.newRule' | translate }}</button>
    </div>

    <div class="au-grid" *ngIf="!loading">
      <div class="au-card" *ngFor="let r of rules" [class.off]="!r.enabled">
        <div class="au-card-head">
          <h3>{{ r.name }}</h3>
          <button class="au-switch" [class.on]="r.enabled" (click)="toggle(r)"><span></span></button>
        </div>
        <div class="au-recipe">
          <span class="au-pill when">{{ 'admin.automations.when' | translate }}</span> {{ triggerLabel(r.trigger) }}
          <ng-container *ngIf="r.conditionField"><br><span class="au-pill if">{{ 'admin.automations.if' | translate }}</span> {{ fieldLabel(r.conditionField) }} = <b>{{ r.conditionValue }}</b></ng-container>
          <br><span class="au-pill then">{{ 'admin.automations.then' | translate }}</span> {{ actionLabel(r.actionType) }} → <b>{{ valueLabel(r) }}</b>
        </div>
        <div class="au-foot">
          <span class="au-runs">{{ 'admin.automations.runs' | translate:{ n: r.runCount || 0 } }}</span>
          <button class="btn-ghost" (click)="openEdit(r)">{{ 'admin.automations.edit' | translate }}</button>
          <button class="btn-ghost danger" (click)="remove(r)">{{ 'admin.automations.delete' | translate }}</button>
        </div>
      </div>
      <div class="au-empty" *ngIf="rules.length === 0">{{ 'admin.automations.empty' | translate }}</div>
    </div>
    <div class="au-loading" *ngIf="loading">{{ 'common.loading' | translate }}</div>
  </div>

  <!-- Builder modal -->
  <div class="au-backdrop" *ngIf="showModal" (click)="close()">
    <div class="au-modal" (click)="$event.stopPropagation()">
      <h3>{{ (editing ? 'admin.automations.editRule' : 'admin.automations.newRule') | translate }}</h3>

      <label class="au-label">{{ 'admin.automations.name' | translate }}</label>
      <input class="au-input" [(ngModel)]="form.name" [placeholder]="'admin.automations.namePh' | translate" />

      <label class="au-label"><span class="au-pill when">{{ 'admin.automations.when' | translate }}</span> {{ 'admin.automations.trigger' | translate }}</label>
      <select class="au-input" [(ngModel)]="form.trigger">
        <option *ngFor="let t of triggers" [value]="t">{{ triggerLabel(t) }}</option>
      </select>

      <label class="au-label"><span class="au-pill if">{{ 'admin.automations.if' | translate }}</span> {{ 'admin.automations.conditionOpt' | translate }}</label>
      <div class="au-row">
        <select class="au-input" [(ngModel)]="form.conditionField" (ngModelChange)="form.conditionValue = ''">
          <option [ngValue]="null">{{ 'admin.automations.noCondition' | translate }}</option>
          <option *ngFor="let f of conditionFields" [value]="f">{{ fieldLabel(f) }}</option>
        </select>
        <ng-container *ngIf="form.conditionField">
          <span class="au-eq">=</span>
          <select class="au-input" *ngIf="form.conditionField === 'priority'" [(ngModel)]="form.conditionValue">
            <option *ngFor="let p of PRIORITIES" [value]="p">{{ p }}</option>
          </select>
          <select class="au-input" *ngIf="form.conditionField === 'status'" [(ngModel)]="form.conditionValue">
            <option *ngFor="let s of STATUSES" [value]="s">{{ s }}</option>
          </select>
          <select class="au-input" *ngIf="form.conditionField === 'projectId'" [(ngModel)]="form.conditionValue">
            <option *ngFor="let p of projects" [value]="p.id">{{ p.name }}</option>
          </select>
        </ng-container>
      </div>

      <label class="au-label"><span class="au-pill then">{{ 'admin.automations.then' | translate }}</span> {{ 'admin.automations.action' | translate }}</label>
      <div class="au-row">
        <select class="au-input" [(ngModel)]="form.actionType" (ngModelChange)="form.actionValue = ''">
          <option *ngFor="let a of actions" [value]="a">{{ actionLabel(a) }}</option>
        </select>
        <span class="au-eq">→</span>
        <select class="au-input" *ngIf="form.actionType === 'set_priority'" [(ngModel)]="form.actionValue">
          <option *ngFor="let p of PRIORITIES" [value]="p">{{ p }}</option>
        </select>
        <select class="au-input" *ngIf="form.actionType === 'set_status'" [(ngModel)]="form.actionValue">
          <option *ngFor="let s of STATUSES" [value]="s">{{ s }}</option>
        </select>
        <select class="au-input" *ngIf="form.actionType === 'notify' || form.actionType === 'assign'" [(ngModel)]="form.actionValue">
          <option *ngFor="let u of users" [value]="u.id">{{ u.firstName }} {{ u.lastName }}</option>
        </select>
      </div>

      <div class="au-foot-modal">
        <button class="btn-ghost" (click)="close()">{{ 'admin.automations.cancel' | translate }}</button>
        <button class="btn-primary" (click)="save()" [disabled]="busy || !valid()">{{ 'admin.automations.save' | translate }}</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .au-wrap { display: flex; flex-direction: column; gap: 18px; }
    .au-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .au-bar h2 { font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0; }
    .au-sub { font-size: 13px; color: var(--text-muted, #64748b); margin: 4px 0 0; }
    .au-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
    .au-card { background: var(--bg-card, #fff); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .au-card.off { opacity: .6; }
    .au-card-head { display: flex; align-items: center; gap: 8px; }
    .au-card-head h3 { font-size: 15px; font-weight: 700; margin: 0; flex: 1; color: var(--text-primary, #0f172a); }
    .au-switch { width: 38px; height: 22px; border-radius: 9999px; border: none; background: var(--border-strong); position: relative; cursor: pointer; transition: background .15s; }
    .au-switch.on { background: #16a34a; } .au-switch span { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: var(--bg-card); transition: left .15s; } .au-switch.on span { left: 18px; }
    .au-recipe { font-size: 13px; line-height: 1.9; color: var(--text-secondary, #475569); }
    .au-pill { display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .4px; padding: 2px 7px; border-radius: 6px; margin-right: 5px; }
    .au-pill.when { background: var(--primary-bg); color: #2563eb; } .au-pill.if { background: var(--warning-bg); color: #ca8a04; } .au-pill.then { background: var(--success-bg); color: #16a34a; }
    .au-foot { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
    .au-runs { flex: 1; font-size: 11.5px; color: var(--text-muted, #94a3b8); }
    .au-empty, .au-loading { padding: 36px; text-align: center; color: var(--text-muted, #94a3b8); }
    .btn-primary { height: 38px; padding: 0 15px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; } .btn-primary:disabled { opacity: .55; cursor: not-allowed; }
    .btn-ghost { height: 30px; padding: 0 10px; border: none; background: none; border-radius: 8px; color: var(--text-secondary, #475569); font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-ghost.danger { color: var(--danger-text); } .btn-ghost:hover { background: var(--bg-subtle, #f1f5f9); }
    .au-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .au-modal { width: 100%; max-width: 520px; max-height: calc(100vh - 48px); overflow-y: auto; background: var(--bg-card); border-radius: 16px; padding: 22px; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .au-modal h3 { font-size: 16px; font-weight: 700; margin: 0 0 10px; }
    .au-label { display: block; font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); margin: 12px 0 5px; }
    .au-input { height: 40px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13.5px; outline: none; font-family: inherit; background: var(--bg-card); width: 100%; box-sizing: border-box; }
    .au-row { display: flex; align-items: center; gap: 8px; } .au-row .au-input { flex: 1; }
    .au-eq { font-weight: 800; color: var(--text-muted); }
    .au-foot-modal { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
  `]
})
export class AutomationsComponent implements OnInit {
  rules: AutomationRule[] = [];
  loading = true;
  showModal = false;
  editing: AutomationRule | null = null;
  busy = false;
  form: AutomationRule = this.blank();

  triggers: string[] = ['task.created', 'task.status_changed', 'task.completed'];
  actions: string[] = ['set_priority', 'set_status', 'notify'];
  conditionFields: string[] = ['priority', 'status', 'projectId'];
  readonly PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  readonly STATUSES = ['TODO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];
  projects: any[] = [];
  users: any[] = [];

  constructor(private svc: AutomationService, private projectSvc: ProjectService, private userSvc: UserService,
              private toast: ToastService, private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.svc.meta().subscribe({ next: (m: any) => { const d = m?.data || m; if (d?.triggers) this.triggers = d.triggers; if (d?.actions) this.actions = d.actions; if (d?.conditionFields) this.conditionFields = d.conditionFields; } });
    this.projectSvc.getAllProjects(0, 300).subscribe({ next: (r: any) => { this.projects = r?.data || r?.content || []; this.cdr.detectChanges(); } });
    this.userSvc.getAllUsers(0, 500).subscribe({ next: (r: any) => { this.users = r?.data || r?.content || []; this.cdr.detectChanges(); } });
    this.load();
  }

  private blank(): AutomationRule { return { name: '', enabled: true, trigger: 'task.created', conditionField: null, conditionValue: '', actionType: 'set_priority', actionValue: 'HIGH' }; }

  private load(): void {
    this.loading = true;
    this.svc.list().subscribe({
      next: (r: any) => { this.rules = Array.isArray(r) ? r : (r?.data || []); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.rules = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  triggerLabel(t: string): string { return this.translate.instant('admin.automations.trig.' + t); }
  actionLabel(a: string): string { return this.translate.instant('admin.automations.act.' + a); }
  fieldLabel(f: string): string { return this.translate.instant('admin.automations.fld.' + f); }
  valueLabel(r: AutomationRule): string {
    if (r.actionType === 'notify' || r.actionType === 'assign') { const u = this.users.find(x => String(x.id) === String(r.actionValue)); return u ? `${u.firstName} ${u.lastName}` : ('#' + r.actionValue); }
    return r.actionValue || '';
  }

  openCreate(): void { this.editing = null; this.form = this.blank(); this.showModal = true; }
  openEdit(r: AutomationRule): void { this.editing = r; this.form = { ...r }; this.showModal = true; }
  close(): void { this.showModal = false; }

  valid(): boolean { return !!this.form.name.trim() && !!this.form.trigger && !!this.form.actionType && !!this.form.actionValue && (!this.form.conditionField || !!this.form.conditionValue); }

  save(): void {
    if (!this.valid() || this.busy) return;
    this.busy = true;
    const done = () => { this.busy = false; this.showModal = false; this.toast.show(this.translate.instant('admin.automations.saved'), 'success'); this.load(); };
    const fail = (e: any) => { this.busy = false; this.toast.show(e?.error?.message || this.translate.instant('admin.automations.failed'), 'error'); this.cdr.detectChanges(); };
    if (this.editing && this.editing.id) this.svc.update(this.editing.id, this.form).subscribe({ next: done, error: fail });
    else this.svc.create(this.form).subscribe({ next: done, error: fail });
  }

  toggle(r: AutomationRule): void {
    if (!r.id) return;
    this.svc.toggle(r.id).subscribe({ next: () => { r.enabled = !r.enabled; this.cdr.detectChanges(); }, error: () => this.toast.show(this.translate.instant('admin.automations.failed'), 'error') });
  }
  remove(r: AutomationRule): void {
    if (!r.id) return;
    this.svc.delete(r.id).subscribe({ next: () => { this.toast.show(this.translate.instant('admin.automations.deleted'), 'success'); this.load(); }, error: () => this.toast.show(this.translate.instant('admin.automations.failed'), 'error') });
  }
}
