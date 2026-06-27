import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OkrService, Objective, KeyResult, ObjectiveStatus } from '../../core/services/okr.service';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-okr',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="okr">
    <div class="okr-bar">
      <div>
        <h2>{{ 'okr.title' | translate }}</h2>
        <p class="okr-sub">{{ 'okr.subtitle' | translate }}</p>
      </div>
      <button *ngIf="canManage" class="btn-primary" (click)="openObjective(null)">+ {{ 'okr.newObjective' | translate }}</button>
    </div>

    <div class="okr-empty" *ngIf="!loading && objectives.length === 0">
      <div class="okr-empty-ic">🎯</div>
      <p>{{ 'okr.empty' | translate }}</p>
    </div>

    <div class="okr-list" *ngIf="!loading">
      <div class="obj-card" *ngFor="let o of objectives">
        <div class="obj-head">
          <span class="obj-status" [ngClass]="'st-' + o.status">{{ ('okr.status.' + o.status) | translate }}</span>
          <span class="obj-period" *ngIf="o.period">{{ o.period }}</span>
          <div class="obj-prog-num">{{ svc.objectiveProgress(o) }}%</div>
        </div>
        <h3 class="obj-title">{{ o.title }}</h3>
        <p class="obj-desc" *ngIf="o.description">{{ o.description }}</p>
        <div class="obj-meta">
          <span *ngIf="o.ownerName">👤 {{ o.ownerName }}</span>
        </div>
        <div class="obj-bar"><div class="obj-bar-fill" [style.width.%]="svc.objectiveProgress(o)"></div></div>

        <div class="kr-list">
          <div class="kr" *ngFor="let kr of o.keyResults">
            <div class="kr-top">
              <span class="kr-title">{{ kr.title }}</span>
              <span class="kr-val">
                <ng-container *ngIf="canManage; else roVal">
                  <input type="number" class="kr-cur" [(ngModel)]="kr.currentValue" (blur)="checkIn(kr)" (keyup.enter)="checkIn(kr)" />
                </ng-container>
                <ng-template #roVal>{{ kr.currentValue }}</ng-template>
                / {{ kr.targetValue }}{{ kr.unit ? ' ' + kr.unit : '' }}
              </span>
            </div>
            <div class="kr-row">
              <div class="kr-bar"><div class="kr-bar-fill" [style.width.%]="svc.krProgress(kr)"></div></div>
              <span class="kr-pct">{{ svc.krProgress(kr) }}%</span>
              <button *ngIf="canManage" class="ic" (click)="openKr(o, kr)" [title]="'okr.editKr' | translate">✎</button>
              <button *ngIf="canManage" class="ic danger" (click)="removeKr(kr)" [title]="'okr.delete' | translate">✕</button>
            </div>
          </div>
          <div class="kr-empty" *ngIf="!o.keyResults?.length">{{ 'okr.noKrs' | translate }}</div>
        </div>

        <div class="obj-foot" *ngIf="canManage">
          <button class="btn-ghost" (click)="openKr(o, null)">+ {{ 'okr.addKr' | translate }}</button>
          <button class="btn-ghost" (click)="openObjective(o)">{{ 'okr.edit' | translate }}</button>
          <button class="btn-ghost danger" (click)="removeObjective(o)">{{ 'okr.delete' | translate }}</button>
        </div>
      </div>
    </div>

    <!-- Objective modal -->
    <div class="okr-backdrop" *ngIf="objModal" (click)="objModal = false">
      <div class="okr-modal" (click)="$event.stopPropagation()">
        <h3>{{ (objForm.id ? 'okr.editObjective' : 'okr.newObjective') | translate }}</h3>
        <label>{{ 'okr.fTitle' | translate }}</label>
        <input [(ngModel)]="objForm.title" [placeholder]="'okr.fTitlePh' | translate" />
        <label>{{ 'okr.fDescription' | translate }}</label>
        <textarea rows="2" [(ngModel)]="objForm.description"></textarea>
        <div class="okr-row">
          <div class="okr-col">
            <label>{{ 'okr.fPeriod' | translate }}</label>
            <input [(ngModel)]="objForm.period" [placeholder]="'okr.fPeriodPh' | translate" />
          </div>
          <div class="okr-col">
            <label>{{ 'okr.fStatus' | translate }}</label>
            <select [(ngModel)]="objForm.status">
              <option *ngFor="let s of statuses" [value]="s">{{ ('okr.status.' + s) | translate }}</option>
            </select>
          </div>
        </div>
        <label>{{ 'okr.fOwner' | translate }}</label>
        <input [(ngModel)]="objForm.ownerName" [placeholder]="'okr.fOwnerPh' | translate" />
        <div class="okr-modal-foot">
          <button class="btn-ghost" (click)="objModal = false">{{ 'okr.cancel' | translate }}</button>
          <button class="btn-primary" (click)="saveObjective()" [disabled]="!objForm.title.trim() || busy">{{ 'okr.save' | translate }}</button>
        </div>
      </div>
    </div>

    <!-- Key-result modal -->
    <div class="okr-backdrop" *ngIf="krModal" (click)="krModal = false">
      <div class="okr-modal" (click)="$event.stopPropagation()">
        <h3>{{ (krForm.id ? 'okr.editKr' : 'okr.addKr') | translate }}</h3>
        <label>{{ 'okr.krTitle' | translate }}</label>
        <input [(ngModel)]="krForm.title" [placeholder]="'okr.krTitlePh' | translate" />
        <div class="okr-row">
          <div class="okr-col"><label>{{ 'okr.krStart' | translate }}</label><input type="number" [(ngModel)]="krForm.startValue" /></div>
          <div class="okr-col"><label>{{ 'okr.krCurrent' | translate }}</label><input type="number" [(ngModel)]="krForm.currentValue" /></div>
          <div class="okr-col"><label>{{ 'okr.krTarget' | translate }}</label><input type="number" [(ngModel)]="krForm.targetValue" /></div>
          <div class="okr-col"><label>{{ 'okr.krUnit' | translate }}</label><input [(ngModel)]="krForm.unit" placeholder="%, $, users" /></div>
        </div>
        <div class="okr-modal-foot">
          <button class="btn-ghost" (click)="krModal = false">{{ 'okr.cancel' | translate }}</button>
          <button class="btn-primary" (click)="saveKr()" [disabled]="!krForm.title.trim() || busy">{{ 'okr.save' | translate }}</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .okr { padding: 4px 2px 40px; }
    .okr-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; gap: 16px; flex-wrap: wrap; }
    .okr-bar h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text-primary); }
    .okr-sub { margin: 4px 0 0; font-size: 13px; color: var(--text-muted); max-width: 600px; }
    .btn-primary { background: var(--primary); color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-weight: 600; font-size: 13px; cursor: pointer; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); border-radius: 7px; padding: 6px 12px; font-size: 12.5px; cursor: pointer; color: var(--text-secondary); }
    .btn-ghost.danger { color: #dc2626; border-color: #fecaca; }
    .okr-empty { text-align: center; color: var(--text-muted); padding: 50px; }
    .okr-empty-ic { font-size: 42px; margin-bottom: 8px; }
    .okr-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 18px; }
    .obj-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px; }
    .obj-head { display: flex; align-items: center; gap: 10px; }
    .obj-status { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; padding: 3px 9px; border-radius: 20px; }
    .obj-status.st-ON_TRACK { background: var(--success-bg); color: var(--success-text); }
    .obj-status.st-AT_RISK { background: var(--warning-bg); color: var(--warning-text); }
    .obj-status.st-OFF_TRACK { background: var(--danger-bg); color: var(--danger-text); }
    .obj-status.st-ACHIEVED { background: var(--primary-bg); color: var(--primary); }
    .obj-period { font-size: 11.5px; color: var(--text-muted); }
    .obj-prog-num { margin-left: auto; font-size: 19px; font-weight: 800; color: var(--text-primary); }
    .obj-title { margin: 10px 0 4px; font-size: 16.5px; font-weight: 700; color: var(--text-primary); }
    .obj-desc { margin: 0 0 8px; font-size: 13px; color: var(--text-muted); }
    .obj-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
    .obj-bar { height: 7px; background: var(--bg-subtle); border-radius: 20px; overflow: hidden; margin-bottom: 14px; }
    .obj-bar-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light, #3b82f6)); border-radius: 20px; transition: width .3s; }
    .kr-list { display: flex; flex-direction: column; gap: 11px; }
    .kr { background: var(--bg-muted); border: 1px solid var(--border-light); border-radius: 9px; padding: 10px 12px; }
    .kr-top { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 7px; }
    .kr-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .kr-val { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
    .kr-cur { width: 60px; padding: 3px 6px; border: 1px solid var(--border); border-radius: 6px; font-size: 12px; text-align: right; background: var(--bg-card); color: var(--text-primary); }
    .kr-row { display: flex; align-items: center; gap: 8px; }
    .kr-bar { flex: 1; height: 6px; background: var(--bg-subtle); border-radius: 20px; overflow: hidden; }
    .kr-bar-fill { height: 100%; background: var(--success); border-radius: 20px; transition: width .3s; }
    .kr-pct { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); min-width: 32px; text-align: right; }
    .kr-empty { font-size: 12.5px; color: var(--text-muted); }
    .ic { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 12px; padding: 2px 4px; border-radius: 5px; }
    .ic:hover { background: var(--bg-subtle); color: var(--text-primary); }
    .ic.danger:hover { color: #dc2626; }
    .obj-foot { display: flex; gap: 7px; margin-top: 14px; border-top: 1px solid var(--border-light); padding-top: 12px; flex-wrap: wrap; }
    .okr-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 24px; }
    .okr-modal { background: var(--bg-card); border-radius: 14px; padding: 22px 24px; width: 100%; max-width: 480px; max-height: calc(100vh - 48px); overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,.25); }
    .okr-modal h3 { margin: 0 0 14px; font-size: 17px; font-weight: 700; color: var(--text-primary); }
    .okr-modal label { display: block; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; color: var(--text-secondary); margin: 12px 0 5px; }
    .okr-modal input, .okr-modal select, .okr-modal textarea { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 13.5px; box-sizing: border-box; font-family: inherit; background: var(--bg-card); color: var(--text-primary); }
    .okr-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .okr-col { flex: 1; min-width: 90px; }
    .okr-modal-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  `]
})
export class OkrComponent implements OnInit {
  objectives: Objective[] = [];
  loading = true;
  busy = false;
  canManage = false;
  statuses: ObjectiveStatus[] = ['ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'ACHIEVED'];

  objModal = false;
  objForm: Objective = this.blankObj();
  krModal = false;
  krForm: KeyResult = this.blankKr();
  krParentId: number | null = null;

  constructor(
    public svc: OkrService,
    private perm: PermissionService,
    private auth: AuthService,
    private toast: ToastService,
    private t: TranslateService
  ) {}

  ngOnInit(): void {
    this.canManage = this.perm.has('okr.manage');
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.list().subscribe({
      next: o => { this.objectives = o || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  blankObj(): Objective { return { title: '', description: '', period: '', status: 'ON_TRACK', ownerName: '' }; }
  blankKr(): KeyResult { return { title: '', startValue: 0, currentValue: 0, targetValue: 100, unit: '' }; }

  // ── Objectives ──
  openObjective(o: Objective | null): void {
    if (o) this.objForm = { ...o };
    else {
      this.objForm = this.blankObj();
      const u = this.auth.getCurrentUser();
      if (u) this.objForm.ownerName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '';
    }
    this.objModal = true;
  }
  saveObjective(): void {
    this.busy = true;
    const done = () => { this.busy = false; this.objModal = false; this.load(); };
    const fail = (e: any) => { this.busy = false; this.toast.error(e?.error?.message || this.t.instant('okr.saveFailed')); };
    const ok = () => { this.toast.success(this.t.instant('okr.saved')); done(); };
    if (this.objForm.id) this.svc.updateObjective(this.objForm.id, this.objForm).subscribe({ next: ok, error: fail });
    else this.svc.createObjective(this.objForm).subscribe({ next: ok, error: fail });
  }
  removeObjective(o: Objective): void {
    if (!o.id) return;
    this.svc.deleteObjective(o.id).subscribe({ next: () => { this.toast.success(this.t.instant('okr.deleted')); this.load(); }, error: () => this.toast.error(this.t.instant('okr.saveFailed')) });
  }

  // ── Key results ──
  openKr(o: Objective, kr: KeyResult | null): void {
    this.krParentId = o.id!;
    this.krForm = kr ? { ...kr } : this.blankKr();
    this.krModal = true;
  }
  saveKr(): void {
    this.busy = true;
    const done = () => { this.busy = false; this.krModal = false; this.load(); };
    const fail = (e: any) => { this.busy = false; this.toast.error(e?.error?.message || this.t.instant('okr.saveFailed')); };
    const ok = () => { this.toast.success(this.t.instant('okr.saved')); done(); };
    if (this.krForm.id) this.svc.updateKeyResult(this.krForm.id, this.krForm).subscribe({ next: ok, error: fail });
    else this.svc.addKeyResult(this.krParentId!, this.krForm).subscribe({ next: ok, error: fail });
  }
  removeKr(kr: KeyResult): void {
    if (!kr.id) return;
    this.svc.deleteKeyResult(kr.id).subscribe({ next: () => { this.toast.success(this.t.instant('okr.deleted')); this.load(); }, error: () => this.toast.error(this.t.instant('okr.saveFailed')) });
  }

  /** Inline check-in: persist a key result's new current value. */
  checkIn(kr: KeyResult): void {
    if (!kr.id) return;
    this.svc.updateKeyResult(kr.id, kr).subscribe({
      next: () => {},
      error: () => { this.toast.error(this.t.instant('okr.saveFailed')); this.load(); }
    });
  }
}
