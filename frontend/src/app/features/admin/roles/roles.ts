import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RoleService, AppRole, PermissionItem } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="rl-wrap">
    <div class="rl-bar">
      <div>
        <h2>{{ 'admin.roles.title' | translate }}</h2>
        <p class="rl-sub">{{ 'admin.roles.subtitle' | translate }}</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">+ {{ 'admin.roles.newRole' | translate }}</button>
    </div>

    <div class="rl-grid" *ngIf="!loading">
      <div class="rl-card" [class.rl-card-system]="r.system" *ngFor="let r of roles">
        <div class="rl-card-head">
          <h3>{{ displayName(r) }}</h3>
          <span class="rl-badge" *ngIf="r.system">{{ 'admin.roles.builtIn' | translate }}</span>
        </div>
        <p class="rl-desc">{{ r.description || ('admin.roles.noDescription' | translate) }}</p>
        <div class="rl-perm-count">{{ 'admin.roles.permCount' | translate:{ n: r.permissions.length } }}</div>
        <div class="rl-card-foot">
          <button class="btn-ghost" (click)="openView(r)">{{ (r.system ? 'admin.roles.view' : 'admin.roles.edit') | translate }}</button>
          <button class="btn-ghost danger" *ngIf="!r.system" (click)="remove(r)">{{ 'admin.roles.delete' | translate }}</button>
        </div>
      </div>
      <div class="rl-empty" *ngIf="roles.length === 0">{{ 'admin.roles.empty' | translate }}</div>
    </div>
    <div class="rl-loading" *ngIf="loading">{{ 'common.loading' | translate }}</div>
  </div>

  <!-- Create / edit modal -->
  <div class="rl-backdrop" *ngIf="showModal" (click)="close()">
    <div class="rl-modal" (click)="$event.stopPropagation()">
      <div class="rl-modal-head">
        <h3>{{ readonly ? form.name : ((editing ? 'admin.roles.editRole' : 'admin.roles.newRole') | translate) }}</h3>
        <button class="rl-x" (click)="close()">✕</button>
      </div>
      <div class="rl-modal-body">
        <p class="rl-readonly-note" *ngIf="readonly">{{ 'admin.roles.builtInNote' | translate }}</p>
        <ng-container *ngIf="!readonly">
          <label class="rl-label">{{ 'admin.roles.name' | translate }}</label>
          <input class="rl-input" [(ngModel)]="form.name" [placeholder]="'admin.roles.namePh' | translate" />
          <label class="rl-label">{{ 'admin.roles.description' | translate }}</label>
          <input class="rl-input" [(ngModel)]="form.description" />
        </ng-container>

        <label class="rl-label">{{ 'admin.roles.permissions' | translate }}</label>
        <div class="rl-perm-group" *ngFor="let g of groups">
          <div class="rl-perm-group-name">{{ g }}</div>
          <label class="rl-perm" *ngFor="let p of permsByGroup[g]" [class.rl-perm-off]="readonly && !form.permissions.includes(p.key)">
            <input type="checkbox" [checked]="form.permissions.includes(p.key)" [disabled]="readonly" (change)="toggle(p.key)" />
            <span>{{ p.key }}</span>
          </label>
        </div>
      </div>
      <div class="rl-modal-foot">
        <button class="btn-ghost" (click)="close()">{{ (readonly ? 'admin.roles.close' : 'admin.roles.cancel') | translate }}</button>
        <button class="btn-primary" *ngIf="!readonly" (click)="save()" [disabled]="busy || !form.name.trim()">{{ 'admin.roles.save' | translate }}</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .rl-wrap { display: flex; flex-direction: column; gap: 18px; }
    .rl-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .rl-bar h2 { font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0; }
    .rl-sub { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }
    .rl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .rl-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .rl-card-head { display: flex; align-items: center; gap: 8px; }
    .rl-card-head h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; flex: 1; }
    .rl-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; background: var(--bg-subtle); color: var(--text-muted); padding: 2px 8px; border-radius: 9999px; }
    .rl-desc { font-size: 12.5px; color: var(--text-muted); margin: 0; min-height: 18px; }
    .rl-perm-count { font-size: 12px; font-weight: 600; color: var(--primary); }
    .rl-card-foot { display: flex; gap: 6px; margin-top: 4px; }
    .rl-empty, .rl-loading { padding: 40px; text-align: center; color: var(--text-muted); }
    .btn-primary { height: 38px; padding: 0 15px; border: none; border-radius: 10px; background: var(--primary); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .btn-primary:disabled { opacity: .55; cursor: not-allowed; }
    .btn-ghost { height: 32px; padding: 0 12px; border: none; background: none; border-radius: 8px; color: var(--text-secondary); font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-ghost:hover { background: var(--bg-subtle); } .btn-ghost.danger { color: var(--danger); }
    .rl-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .rl-modal { width: 100%; max-width: 560px; max-height: calc(100vh - 48px); overflow-y: auto; background: var(--bg-card); border-radius: 16px; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .rl-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 12px; }
    .rl-modal-head h3 { font-size: 16px; font-weight: 700; margin: 0; color: var(--text-primary); }
    .rl-x { width: 30px; height: 30px; border: none; background: var(--bg-subtle); border-radius: 8px; cursor: pointer; color: var(--text-muted); }
    .rl-modal-body { padding: 4px 20px 12px; display: flex; flex-direction: column; gap: 8px; }
    .rl-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); margin-top: 8px; }
    .rl-input { height: 40px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13.5px; color: var(--text-primary); background: var(--bg-card); outline: none; font-family: inherit; }
    .rl-input:focus { border-color: var(--primary); }
    .rl-perm-group { border: 1px solid var(--border-light); border-radius: 10px; padding: 10px; margin-bottom: 6px; }
    .rl-perm-group-name { font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 6px; }
    .rl-perm { display: inline-flex; align-items: center; gap: 6px; width: 50%; font-size: 12.5px; color: var(--text-primary); margin-bottom: 4px; }
    .rl-perm-off { opacity: .4; }
    .rl-modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px 18px; }
    .rl-card-system { background: var(--bg-subtle); }
    .rl-readonly-note { font-size: 12.5px; color: var(--text-muted); margin: 0 0 6px; }
  `]
})
export class AdminRolesComponent implements OnInit {
  roles: AppRole[] = [];
  catalogItems: PermissionItem[] = [];
  groups: string[] = [];
  permsByGroup: Record<string, PermissionItem[]> = {};
  loading = true;
  showModal = false;
  editing: AppRole | null = null;
  busy = false;
  readonly = false;
  form: AppRole = { name: '', description: '', permissions: [] };

  constructor(private roleService: RoleService, private toast: ToastService, private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  /** Built-in roles show a translated label; custom roles use their stored name. */
  displayName(r: AppRole): string {
    return r.baseRole ? this.translate.instant('admin.roles.base.' + r.baseRole) : r.name;
  }

  ngOnInit(): void {
    this.roleService.catalog().subscribe({
      next: (c: any) => {
        this.catalogItems = Array.isArray(c) ? c : (c?.data || []);
        this.groups = Array.from(new Set(this.catalogItems.map(p => p.group)));
        this.groups.forEach(g => this.permsByGroup[g] = this.catalogItems.filter(p => p.group === g));
        this.cdr.detectChanges();
      }
    });
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.roleService.list().subscribe({
      next: (r: any) => { this.roles = Array.isArray(r) ? r : (r?.data || []); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.roles = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openCreate(): void { this.editing = null; this.readonly = false; this.form = { name: '', description: '', permissions: [] }; this.showModal = true; }
  /** Built-in roles open read-only; custom roles open editable. */
  openView(r: AppRole): void {
    this.editing = r;
    this.readonly = !!r.system;
    this.form = { id: r.id, name: this.displayName(r), description: r.description, permissions: [...r.permissions], baseRole: r.baseRole };
    this.showModal = true;
  }
  close(): void { this.showModal = false; this.readonly = false; }

  toggle(key: string): void {
    const i = this.form.permissions.indexOf(key);
    if (i >= 0) this.form.permissions.splice(i, 1); else this.form.permissions.push(key);
  }

  save(): void {
    if (!this.form.name.trim() || this.busy) return;
    this.busy = true;
    const done = () => { this.busy = false; this.showModal = false; this.toast.show(this.translate.instant('admin.roles.toastSaved'), 'success'); this.load(); };
    const fail = () => { this.busy = false; this.toast.show(this.translate.instant('admin.roles.toastFailed'), 'error'); this.cdr.detectChanges(); };
    if (this.editing && this.editing.id) {
      this.roleService.update(this.editing.id, this.form).subscribe({ next: done, error: fail });
    } else {
      this.roleService.create(this.form).subscribe({ next: done, error: fail });
    }
  }

  remove(r: AppRole): void {
    if (!r.id) return;
    this.roleService.delete(r.id).subscribe({
      next: () => { this.toast.show(this.translate.instant('admin.roles.toastDeleted'), 'success'); this.load(); },
      error: (err: any) => this.toast.show(err?.error?.message || this.translate.instant('admin.roles.toastFailed'), 'error')
    });
  }
}
