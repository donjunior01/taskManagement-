import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, Subscription } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { DeliverableService, Deliverable } from '../../../core/services/deliverable.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { BadgeCountsService } from '../../../core/services/badge-counts.service';
import { FileService } from '../../../core/services/file.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

interface DelRow extends Deliverable {
  projectName: string;
}

@Component({
  selector: 'app-pm-deliverables',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, HasPermissionDirective],
  template: `
  <div class="dl-wrap">

    <!-- ═══ Tabs ═══ -->
    <div class="tabs">
      <button class="tab" [class.on]="tab === 'all'" (click)="tab = 'all'">{{ 'pm.deliverables.tabAll' | translate }} <span class="cnt">{{ counts.all }}</span></button>
      <button class="tab" [class.on]="tab === 'PENDING'" (click)="tab = 'PENDING'">{{ 'pm.deliverables.tabPending' | translate }} <span class="cnt warn">{{ counts.pending }}</span></button>
      <button class="tab" [class.on]="tab === 'APPROVED'" (click)="tab = 'APPROVED'">{{ 'pm.deliverables.tabApproved' | translate }} <span class="cnt ok">{{ counts.approved }}</span></button>
      <button class="tab" [class.on]="tab === 'REJECTED'" (click)="tab = 'REJECTED'">{{ 'pm.deliverables.tabRejected' | translate }} <span class="cnt ko">{{ counts.rejected }}</span></button>
    </div>

    <!-- ═══ Filters ═══ -->
    <div class="filters">
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" [placeholder]="'pm.deliverables.searchPlaceholder' | translate" [(ngModel)]="searchTerm" />
      </div>
      <select class="sel" [(ngModel)]="projectFilter">
        <option value="">{{ 'pm.deliverables.allProjects' | translate }}</option>
        <option *ngFor="let p of projectsList" [value]="p.id">{{ p.name }}</option>
      </select>
      <select class="sel" [(ngModel)]="submitterFilter">
        <option value="">{{ 'pm.deliverables.submitterAll' | translate }}</option>
        <option *ngFor="let s of submitterOptions" [value]="s">{{ s }}</option>
      </select>
      <select class="sel" [(ngModel)]="dateFilter">
        <option value="all">{{ 'pm.deliverables.allDates' | translate }}</option>
        <option value="today">{{ 'pm.deliverables.dateToday' | translate }}</option>
        <option value="7">{{ 'pm.deliverables.date7' | translate }}</option>
        <option value="30">{{ 'pm.deliverables.date30' | translate }}</option>
      </select>
    </div>

    <!-- ═══ Table ═══ -->
    <div class="list-card">
      <div class="table-scroll">
        <table class="dl-table">
          <thead>
            <tr><th>{{ 'pm.deliverables.colFile' | translate }}</th><th>{{ 'pm.deliverables.colProject' | translate }}</th><th>{{ 'pm.deliverables.colTask' | translate }}</th><th>{{ 'pm.deliverables.colSubmitter' | translate }}</th><th>{{ 'pm.deliverables.colDate' | translate }}</th><th>{{ 'pm.deliverables.colStatus' | translate }}</th><th class="right">{{ 'pm.deliverables.colActions' | translate }}</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of filtered" [class.pending]="d.status === 'PENDING'">
              <td>
                <div class="file">
                  <svg class="fico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  <span class="fname">{{ d.fileName }}</span>
                </div>
              </td>
              <td class="muted">{{ d.projectName }}</td>
              <td class="muted">{{ d.taskName || '—' }}</td>
              <td>
                <div class="submitter">
                  <span class="avatar" [style.background]="avatarColor(d.submittedByName)">{{ initials(d.submittedByName) }}</span>
                  <span class="sname">{{ d.submittedByName || '—' }}</span>
                </div>
              </td>
              <td class="muted">{{ d.createdAt ? (d.createdAt | date:'dd/MM/yyyy') : '—' }}</td>
              <td><span class="badge" [ngClass]="statusInfo(d.status).cls">{{ statusInfo(d.status).labelKey | translate }}</span></td>
              <td class="right">
                <div class="row-actions">
                  <ng-container *appHasPermission="'deliverable.review'">
                    <button class="btn-sm ok" *ngIf="d.status !== 'APPROVED'" (click)="approve(d)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {{ 'pm.deliverables.approve' | translate }}</button>
                    <button class="btn-sm ko" *ngIf="d.status !== 'REJECTED'" (click)="openReject(d)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> {{ 'pm.deliverables.reject' | translate }}</button>
                  </ng-container>
                  <button class="icon-btn" [title]="'pm.deliverables.preview' | translate" (click)="openPreview(d)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                  <button class="icon-btn" [title]="'pm.deliverables.download' | translate" (click)="download(d)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!loading && filtered.length === 0"><td colspan="7"><div class="empty">{{ 'pm.deliverables.emptyDeliverables' | translate }}</div></td></tr>
            <tr *ngIf="loading"><td colspan="7"><div class="empty">{{ 'pm.deliverables.loading' | translate }}</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ═══ Reject dialog ═══ -->
  <div class="modal-backdrop" *ngIf="showReject" (click)="showReject = false">
    <div class="modal sm" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>{{ 'pm.deliverables.rejectTitle' | translate:{ file: rejectTarget?.fileName } }}</h3><button class="x" (click)="showReject = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body">
        <div class="fg"><label>{{ 'pm.deliverables.rejectReason' | translate }}</label><textarea rows="5" [(ngModel)]="rejectReason" [placeholder]="'pm.deliverables.phRejectReason' | translate"></textarea></div>
      </div>
      <div class="m-foot"><button class="btn-ghost" (click)="showReject = false">{{ 'pm.deliverables.cancel' | translate }}</button><button class="btn-danger" (click)="confirmReject()" [disabled]="submitting || !rejectReason.trim()">{{ 'pm.deliverables.sendFeedback' | translate }}</button></div>
    </div>
  </div>

  <!-- ═══ Preview sheet (right drawer) ═══ -->
  <div class="sheet-backdrop" *ngIf="showPreview" (click)="showPreview = false">
    <div class="sheet" (click)="$event.stopPropagation()">
      <div class="sh-head">
        <h3>{{ preview?.fileName }}</h3>
        <button class="x" (click)="showPreview = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
      <div class="sh-sub">{{ preview?.taskName || ('pm.deliverables.deliverableFallback' | translate) }} • {{ 'pm.deliverables.submittedOn' | translate:{ date: (preview?.createdAt ? (preview!.createdAt | date:'dd/MM/yyyy') : '—') } }}</div>
      <div class="sh-preview">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        <span>{{ 'pm.deliverables.filePreview' | translate }}</span>
        <a class="dl-link" *ngIf="preview?.fileUrl" (click)="download(preview!)">{{ 'pm.deliverables.openDownload' | translate }}</a>
      </div>
      <div class="sh-submitter">
        <span class="avatar" [style.background]="avatarColor(preview?.submittedByName)">{{ initials(preview?.submittedByName) }}</span>
        <span>{{ preview?.submittedByName || '—' }}</span>
        <span class="badge" [ngClass]="statusInfo(preview?.status).cls">{{ statusInfo(preview?.status).labelKey | translate }}</span>
      </div>
      <div class="sh-comments" *ngIf="preview?.comments"><strong>{{ 'pm.deliverables.feedbackLabel' | translate }}</strong> {{ preview?.comments }}</div>
      <div class="sh-foot">
        <button class="btn-success" *ngIf="preview?.status !== 'APPROVED'" (click)="approve(preview!); showPreview = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> {{ 'pm.deliverables.approve' | translate }}</button>
        <button class="btn-outline-danger" *ngIf="preview?.status !== 'REJECTED'" (click)="openReject(preview!); showPreview = false">{{ 'pm.deliverables.rejectWithFeedback' | translate }}</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .dl-wrap { display: flex; flex-direction: column; gap: 16px; }

    /* Tabs */
    .tabs { display: inline-flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 3px; align-self: flex-start; flex-wrap: wrap; }
    .tab { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 13px; border: none; background: none; border-radius: 8px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; }
    .tab.on { background: #fff; color: #1e293b; box-shadow: 0 1px 2px rgba(15,23,42,.1); }
    .cnt { font-size: 10.5px; font-weight: 700; padding: 1px 6px; border-radius: 9999px; background: #e2e8f0; color: #64748b; }
    .cnt.warn { background: rgba(217,119,6,.15); color: #d97706; } .cnt.ok { background: rgba(22,163,74,.12); color: #16a34a; } .cnt.ko { background: rgba(220,38,38,.1); color: #dc2626; }

    /* Filters (all on one row, wrap as needed) */
    .filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .search { position: relative; flex: 1 1 220px; max-width: 360px; }
    .search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #94a3b8; }
    .search input { width: 100%; height: 38px; padding: 0 12px 0 34px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #1e293b; outline: none; background: #fff; }
    .search input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .sel { height: 38px; padding: 0 30px 0 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 12.5px; font-weight: 500; color: #475569; background: #fff; cursor: pointer; outline: none; appearance: none; -webkit-appearance: none; width: 160px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; }

    /* Table */
    .list-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
    .table-scroll { overflow-x: auto; }
    .dl-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .dl-table thead { background: #f8fafc; }
    .dl-table th { text-align: left; padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #94a3b8; white-space: nowrap; }
    .dl-table th.right, .dl-table td.right { text-align: right; }
    .dl-table td { padding: 11px 14px; border-top: 1px solid #eef2f7; color: #475569; vertical-align: middle; }
    .dl-table tbody tr:hover { background: #f8fafc; }
    .dl-table tbody tr.pending { border-left: 4px solid #f59e0b; }
    .file { display: flex; align-items: center; gap: 8px; } .fico { width: 16px; height: 16px; color: #2563eb; flex-shrink: 0; } .fname { font-weight: 600; color: #1e293b; }
    .muted { color: #64748b; }
    .submitter { display: flex; align-items: center; gap: 7px; }
    .avatar { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .sname { font-size: 12px; white-space: nowrap; }
    .badge { font-size: 10.5px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; white-space: nowrap; }
    .badge.st-warn { background: rgba(217,119,6,.15); color: #d97706; } .badge.st-ok { background: rgba(22,163,74,.12); color: #16a34a; } .badge.st-ko { background: rgba(220,38,38,.1); color: #dc2626; }
    .row-actions { display: inline-flex; align-items: center; gap: 6px; }
    .btn-sm { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; color: #fff; } .btn-sm svg { width: 13px; height: 13px; }
    .btn-sm.ok { background: #16a34a; } .btn-sm.ok:hover { background: #15803d; }
    .btn-sm.ko { background: #fff; color: #dc2626; border: 1px solid rgba(220,38,38,.35); } .btn-sm.ko:hover { background: rgba(220,38,38,.08); }
    .icon-btn { width: 30px; height: 30px; border: none; background: none; border-radius: 8px; color: #64748b; cursor: pointer; display: inline-grid; place-items: center; } .icon-btn svg { width: 15px; height: 15px; } .icon-btn:hover { background: #eef2f7; color: #1e293b; }
    .empty { padding: 34px; text-align: center; color: #94a3b8; font-size: 13px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 480px; background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); } .modal.sm { max-width: 440px; }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 10px; } .m-head h3 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
    .x { width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; color: #64748b; display: grid; place-items: center; } .x svg { width: 15px; height: 15px; }
    .m-body { padding: 8px 22px; } .fg { display: flex; flex-direction: column; gap: 6px; } .fg label { font-size: 12px; font-weight: 700; color: #475569; }
    .fg textarea { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-family: inherit; color: #1e293b; outline: none; resize: vertical; } .fg textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .m-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 22px 20px; }
    .btn-ghost { height: 38px; padding: 0 14px; border: none; background: none; border-radius: 10px; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-ghost:hover { background: #f1f5f9; }
    .btn-danger { height: 38px; padding: 0 15px; border: none; border-radius: 10px; background: #dc2626; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-danger:disabled { opacity: .55; cursor: not-allowed; }

    /* Sheet */
    .sheet-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; justify-content: flex-end; }
    .sheet { width: 100%; max-width: 480px; height: 100%; background: #fff; box-shadow: -8px 0 30px rgba(15,23,42,.2); padding: 22px; overflow-y: auto; animation: slideIn .25s ease; display: flex; flex-direction: column; gap: 12px; }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .sh-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; } .sh-head h3 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; word-break: break-word; }
    .sh-sub { font-size: 12px; color: #64748b; margin-top: -6px; }
    .sh-preview { display: grid; place-items: center; gap: 8px; height: 220px; border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; color: #94a3b8; font-size: 13px; } .sh-preview svg { width: 40px; height: 40px; color: rgba(37,99,235,.5); } .dl-link { color: #2563eb; font-weight: 600; cursor: pointer; font-size: 12.5px; }
    .sh-submitter { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; } .sh-submitter .badge { margin-left: auto; }
    .sh-comments { font-size: 12.5px; color: #475569; background: #f8fafc; border-radius: 10px; padding: 10px 12px; }
    .sh-foot { display: flex; gap: 8px; margin-top: auto; padding-top: 12px; }
    .btn-success { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 40px; border: none; border-radius: 10px; background: #16a34a; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-success svg { width: 15px; height: 15px; } .btn-success:hover { background: #15803d; }
    .btn-outline-danger { flex: 1; height: 40px; border: 1px solid rgba(220,38,38,.4); background: #fff; border-radius: 10px; color: #dc2626; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-outline-danger:hover { background: rgba(220,38,38,.06); }
  `]
})
export class PmDeliverablesComponent implements OnInit, OnDestroy {
  managerId = 0;
  projectsList: { id?: number; name: string }[] = [];
  allRows: DelRow[] = [];
  submitterOptions: string[] = [];
  loading = true;

  tab: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'all';
  searchTerm = '';
  projectFilter = '';
  submitterFilter = '';
  dateFilter = 'all';

  showReject = false;
  rejectTarget: DelRow | null = null;
  rejectReason = '';
  showPreview = false;
  preview: DelRow | null = null;
  submitting = false;

  private taskMap: Record<number, { projectId?: number; projectName: string }> = {};
  private subs: Subscription[] = [];

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private deliverableService: DeliverableService,
    private authService: AuthService,
    private toast: ToastService,
    private badges: BadgeCountsService,
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.managerId = this.authService.getCurrentUser()?.id || 0;
    this.load();

    // Listen to changes in deliverables count. If a new one arrives, reload the list.
    this.subs.push(this.badges.deliverables$.subscribe(count => {
      const currentPending = this.allRows.filter(d => d.status === 'PENDING').length;
      if (count > currentPending && !this.loading) {
        this.load();
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private load(): void {
    this.loading = true;
    this.projectService.getProjectsByManager(this.managerId, 0, 100).subscribe({
      next: (r: any) => { this.projectsList = r && r.data ? r.data : []; this.loadRest(); },
      error: () => { this.projectsList = []; this.loadRest(); }
    });
  }

  private loadRest(): void {
    const pids = this.projectsList.map(p => p.id).filter(Boolean) as number[];
    forkJoin({
      tasks: this.taskService.getAllTasks(0, 500),
      dels: this.deliverableService.getAllDeliverables()
    }).subscribe({
      next: ({ tasks, dels }: any) => {
        const taskList: Task[] = tasks && tasks.data ? tasks.data : [];
        this.taskMap = {};
        taskList.forEach(t => { if (t.id != null) this.taskMap[t.id] = { projectId: t.projectId, projectName: t.projectName || this.projName(t.projectId) }; });
        const list: Deliverable[] = Array.isArray(dels) ? dels : (dels && dels.data ? dels.data : []);
        // Scope to the manager's projects when the deliverable's task is known.
        this.allRows = list
          .map(d => ({ ...d, projectName: (d.taskId != null && this.taskMap[d.taskId]) ? this.taskMap[d.taskId].projectName : '—' } as DelRow))
          // Strictly scope to this PM's own projects: only deliverables whose task belongs to one
          // of their projects (never show all, never include deliverables with an unknown project).
          .filter(d => {
            const info = d.taskId != null ? this.taskMap[d.taskId] : null;
            return !!info && info.projectId != null && pids.includes(info.projectId);
          });
        this.submitterOptions = Array.from(new Set(this.allRows.map(d => d.submittedByName).filter(Boolean) as string[])).sort();
        this.loading = false;
        this.badges.setDeliverables(this.counts.pending);
        this.cdr.detectChanges();
      },
      error: () => { this.allRows = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private projName(id?: number): string { return this.projectsList.find(p => p.id === id)?.name || '—'; }

  get counts() {
    return {
      all: this.allRows.length,
      pending: this.allRows.filter(d => d.status === 'PENDING').length,
      approved: this.allRows.filter(d => d.status === 'APPROVED').length,
      rejected: this.allRows.filter(d => d.status === 'REJECTED').length
    };
  }

  get filtered(): DelRow[] {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let r = [...this.allRows];
    if (this.tab !== 'all') r = r.filter(d => d.status === this.tab);
    if (this.searchTerm.trim()) {
      const t = this.searchTerm.toLowerCase().trim();
      r = r.filter(d => (d.fileName || '').toLowerCase().includes(t) || (d.taskName || '').toLowerCase().includes(t));
    }
    if (this.projectFilter) r = r.filter(d => d.taskId != null && this.taskMap[d.taskId]?.projectId === +this.projectFilter);
    if (this.submitterFilter) r = r.filter(d => d.submittedByName === this.submitterFilter);
    if (this.dateFilter !== 'all') {
      const cutoff = this.dateFilter === 'today' ? today.getTime() : today.getTime() - (+this.dateFilter) * 86400000;
      r = r.filter(d => { const ts = d.createdAt ? new Date(d.createdAt).getTime() : 0; return ts >= cutoff; });
    }
    return r;
  }

  statusInfo(s?: string): { labelKey: string; cls: string } {
    const up = (s || '').toUpperCase();
    if (up === 'APPROVED') return { labelKey: 'pm.deliverables.stApproved', cls: 'st-ok' };
    if (up === 'REJECTED') return { labelKey: 'pm.deliverables.stRejected', cls: 'st-ko' };
    return { labelKey: 'pm.deliverables.stPending', cls: 'st-warn' };
  }

  approve(d: Deliverable): void {
    if (!d.id) return;
    this.deliverableService.reviewDeliverable(d.id, { status: 'APPROVED', comments: this.translate.instant('pm.deliverables.approveComment') }).subscribe({
      next: () => { this.toast.show(this.translate.instant('pm.deliverables.toastApproved', { file: d.fileName }), 'success'); this.load(); },
      error: () => { this.toast.show(this.translate.instant('pm.deliverables.toastApproveFailed'), 'error'); }
    });
  }

  openReject(d: Deliverable): void { this.rejectTarget = d as DelRow; this.rejectReason = ''; this.showReject = true; }
  confirmReject(): void {
    if (!this.rejectTarget?.id || !this.rejectReason.trim()) return;
    this.submitting = true;
    const id = this.rejectTarget.id;
    this.deliverableService.reviewDeliverable(id, { status: 'REJECTED', comments: this.rejectReason.trim() }).subscribe({
      next: () => { this.submitting = false; this.showReject = false; this.toast.show(this.translate.instant('pm.deliverables.toastRejected'), 'success'); this.load(); },
      error: () => { this.submitting = false; this.toast.show(this.translate.instant('pm.deliverables.toastRejectFailed'), 'error'); }
    });
  }

  openPreview(d: DelRow): void { this.preview = d; this.showPreview = true; }
  download(d: Deliverable): void {
    if (!d.fileUrl) { this.toast.show(this.translate.instant('pm.deliverables.toastNoFile'), 'error'); return; }
    this.fileService.downloadFile(d.fileUrl, d.fileName).subscribe({
      next: () => this.toast.show(this.translate.instant('pm.deliverables.toastDownloadStarted'), 'success'),
      error: () => this.toast.show(this.translate.instant('pm.deliverables.toastDownloadFailed'), 'error')
    });
  }

  initials(name?: string): string {
    if (!name) return 'U';
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || 'U';
  }
  avatarColor(name?: string): string {
    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
    const n = name || '?'; let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }
}
