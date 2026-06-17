import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TaskService, Task } from '../../../core/services/task.service';
import { DeliverableService, Deliverable } from '../../../core/services/deliverable.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { FileService } from '../../../core/services/file.service';
import { ToastService } from '../../../core/services/toast.service';

interface DelRow extends Deliverable { projectName: string; }
interface PreviewState { name: string; kind: 'image' | 'pdf' | 'other'; url: SafeResourceUrl; rawUrl: string; loading: boolean; }

@Component({
  selector: 'app-user-deliverables',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="dv-wrap">

    <!-- ═══ Page header ═══ -->
    <div class="page-head">
      <h1>{{ 'deliverables.title' | translate }}</h1>
      <p>{{ 'deliverables.subtitle' | translate }}</p>
    </div>

    <!-- ═══ KPI cards ═══ -->
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-icon" style="background:rgba(99,102,241,.1);color:#6366f1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
        <div class="kpi-info"><h3>{{ stats.total }}</h3><p>{{ 'deliverables.assignedTasks' | translate }}</p></div>
      </div>
      <div class="kpi">
        <div class="kpi-icon" style="background:rgba(16,185,129,.1);color:#10b981"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
        <div class="kpi-info"><h3>{{ stats.approved }}</h3><p>{{ 'deliverables.approvedSubmissions' | translate }}</p></div>
      </div>
      <div class="kpi">
        <div class="kpi-icon" style="background:rgba(245,158,11,.12);color:#f59e0b"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
        <div class="kpi-info"><h3>{{ stats.pending }}</h3><p>{{ 'deliverables.pendingValidation' | translate }}</p></div>
      </div>
      <div class="kpi">
        <div class="kpi-icon" style="background:rgba(239,68,68,.1);color:#ef4444"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div>
        <div class="kpi-info"><h3>{{ stats.rejected }}</h3><p>{{ 'deliverables.revisionsRequested' | translate }}</p></div>
      </div>
    </div>

    <!-- ═══ Tabs + submit ═══ -->
    <div class="bar">
      <div class="tabs">
        <button class="tab" [class.on]="tab === 'all'" (click)="tab = 'all'">{{ 'deliverables.tabAll' | translate }}</button>
        <button class="tab" [class.on]="tab === 'PENDING'" (click)="tab = 'PENDING'">{{ 'deliverables.tabPending' | translate }}</button>
        <button class="tab" [class.on]="tab === 'APPROVED'" (click)="tab = 'APPROVED'">{{ 'deliverables.tabApproved' | translate }}</button>
        <button class="tab" [class.on]="tab === 'REJECTED'" (click)="tab = 'REJECTED'">{{ 'deliverables.tabRejected' | translate }}</button>
      </div>
      <button class="btn-submit" (click)="openModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>{{ 'deliverables.submitBtn' | translate }}</button>
    </div>

    <!-- ═══ Table ═══ -->
    <div class="table-card">
      <table class="dv-table">
        <thead><tr><th>{{ 'deliverables.fileName' | translate }}</th><th>{{ 'common.project' | translate }}</th><th>{{ 'deliverables.associatedTask' | translate }}</th><th>{{ 'common.date' | translate }}</th><th>{{ 'common.status' | translate }}</th><th class="right">{{ 'common.actions' | translate }}</th></tr></thead>
        <tbody>
          <tr *ngFor="let d of filtered" [class.rejected]="d.status === 'REJECTED'">
            <td>
              <div class="file">
                <svg class="fico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                <div>
                  <div class="fname">{{ d.fileName }}</div>
                  <div class="rejected-actions" *ngIf="d.status === 'REJECTED'">
                    <a class="feedback-link" (click)="feedback = d">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>{{ 'deliverables.viewFeedback' | translate }}</a>
                    <a class="resubmit-link" (click)="resubmit(d)" [title]="'deliverables.attrResubmit' | translate">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>{{ 'deliverables.resubmit' | translate }}</a>
                  </div>
                </div>
              </div>
            </td>
            <td class="link-text">{{ d.projectName }}</td>
            <td class="link-text">{{ d.taskName || '—' }}</td>
            <td class="muted">{{ d.createdAt ? (d.createdAt | date:'yyyy-MM-dd') : '—' }}</td>
            <td><span class="badge" [ngClass]="stInfo(d.status).cls">{{ stInfo(d.status).label }}</span></td>
            <td class="right">
              <div class="actions">
                <button class="ic" [title]="'deliverables.attrPreview' | translate" (click)="preview(d)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                <button class="ic" title="Télécharger" (click)="download(d)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
              </div>
            </td>
          </tr>
          <tr *ngIf="!loading && filtered.length === 0"><td colspan="6"><div class="empty">{{ 'deliverables.noDeliverables' | translate }}</div></td></tr>
          <tr *ngIf="loading"><td colspan="6"><div class="empty">{{ 'common.loading' | translate }}</div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══ Submit modal ═══ -->
  <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>{{ 'deliverables.submitTitle' | translate }}</h3><button class="x" (click)="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body">
        <div class="fg"><label>{{ 'common.project' | translate }}</label>
          <select [(ngModel)]="form.projectId" (change)="form.taskId = undefined">
            <option [ngValue]="undefined">{{ 'common.selectProject' | translate }}</option>
            <option *ngFor="let p of projectsList" [ngValue]="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="fg"><label>{{ 'common.task' | translate }}</label>
          <select [(ngModel)]="form.taskId">
            <option [ngValue]="undefined">{{ 'common.selectTask' | translate }}</option>
            <option *ngFor="let t of modalTasks" [ngValue]="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="fg"><label>{{ 'common.file' | translate }}</label>
          <div class="dropzone" [class.drag]="dragging" (click)="fileInput.click()" (dragover)="onDragOver($event)" (dragleave)="dragging=false" (drop)="onDrop($event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <div class="dz-main">{{ selectedFile ? selectedFile.name : 'Glissez votre fichier ici ou cliquez pour parcourir' }}</div>
            <div class="dz-sub">{{ 'deliverables.fileHint' | translate }}</div>
          </div>
          <input type="file" #fileInput hidden (change)="onFileInput($event)" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif">
        </div>
        <div class="fg"><label>{{ 'common.notes' | translate }}</label><textarea rows="3" [(ngModel)]="form.notes" [placeholder]="'deliverables.attrDescribeChanges' | translate"></textarea></div>
      </div>
      <div class="m-foot"><button class="btn-ghost" (click)="closeModal()">{{ 'common.cancel' | translate }}</button><button class="btn-primary" (click)="submit()" [disabled]="submitting">{{ 'common.submit' | translate }}</button></div>
    </div>
  </div>

  <!-- ═══ Feedback popup ═══ -->
  <div class="modal-backdrop" *ngIf="feedback" (click)="feedback = null">
    <div class="modal sm" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>Retour sur « {{ feedback!.fileName }} »</h3><button class="x" (click)="feedback = null"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body"><p class="fb-text">{{ feedback!.comments || 'Aucun commentaire fourni par le chef de projet.' }}</p></div>
      <div class="m-foot"><button class="btn-primary" (click)="feedback = null">{{ 'common.close' | translate }}</button></div>
    </div>
  </div>

  <!-- ═══ Aperçu (preview) modal ═══ -->
  <div class="modal-backdrop" *ngIf="previewState" (click)="closePreview()">
    <div class="modal preview-modal" (click)="$event.stopPropagation()">
      <div class="m-head">
        <h3>{{ previewState!.name }}</h3>
        <button class="x" (click)="closePreview()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
      <div class="preview-body">
        <div class="preview-loading" *ngIf="previewState!.loading"><div class="spin"></div><span>{{ 'deliverables.loadingPreview' | translate }}</span></div>
        <ng-container *ngIf="!previewState!.loading">
          <img *ngIf="previewState!.kind === 'image'" [src]="previewState!.url" alt="aperçu" class="preview-img">
          <iframe *ngIf="previewState!.kind === 'pdf'" [src]="previewState!.url" class="preview-frame" title="aperçu"></iframe>
          <div class="preview-other" *ngIf="previewState!.kind === 'other'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <p>{{ 'deliverables.cannotPreview' | translate }}</p>
          </div>
        </ng-container>
      </div>
      <div class="m-foot"><button class="btn-ghost" (click)="closePreview()">{{ 'common.close' | translate }}</button><button class="btn-primary" (click)="downloadFromPreview()">{{ 'common.download' | translate }}</button></div>
    </div>
  </div>
  `,
  styles: [`
    .dv-wrap { display: flex; flex-direction: column; gap: 18px; }
    .page-head h1 { font-size: 21px; font-weight: 800; color: #1e293b; margin: 0; }
    .page-head p { font-size: 13px; color: #64748b; margin: 4px 0 0; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 16px 18px; }
    .kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; } .kpi-icon svg { width: 20px; height: 20px; }
    .kpi-info h3 { font-size: 24px; font-weight: 800; color: #1e293b; margin: 0; line-height: 1; } .kpi-info p { font-size: 12px; color: #64748b; margin: 5px 0 0; }

    .bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .tabs { display: inline-flex; gap: 8px; flex-wrap: wrap; }
    .tab { height: 34px; padding: 0 16px; border: 1px solid #e2e8f0; background: #fff; border-radius: 9999px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; }
    .tab.on { background: #2563eb; color: #fff; border-color: #2563eb; }
    .btn-submit { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-submit svg { width: 16px; height: 16px; } .btn-submit:hover { background: #1d4ed8; }

    .table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
    .dv-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .dv-table thead { background: #f8fafc; } .dv-table th { text-align: left; padding: 13px 20px; font-size: 12px; font-weight: 600; color: #64748b; } .dv-table th.right, .dv-table td.right { text-align: right; }
    .dv-table td { padding: 14px 20px; border-top: 1px solid #eef2f7; color: #475569; vertical-align: middle; }
    .dv-table tbody tr:hover { background: #f8fafc; }
    .dv-table tbody tr.rejected { background: rgba(239,68,68,.05); } .dv-table tbody tr.rejected:hover { background: rgba(239,68,68,.08); }
    .file { display: flex; align-items: flex-start; gap: 11px; }
    .fico { width: 18px; height: 18px; color: #2563eb; flex-shrink: 0; margin-top: 1px; }
    .fname { font-weight: 700; color: #1e293b; }
    .rejected-actions { display: flex; align-items: center; gap: 12px; margin-top: 3px; }
    .feedback-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #dc2626; cursor: pointer; } .feedback-link svg { width: 13px; height: 13px; } .feedback-link:hover { text-decoration: underline; }
    .resubmit-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #2563eb; cursor: pointer; } .resubmit-link svg { width: 13px; height: 13px; } .resubmit-link:hover { text-decoration: underline; }
    .link-text { color: #2563eb; } .muted { color: #94a3b8; }
    .badge { font-size: 11.5px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; white-space: nowrap; }
    .badge.s-ok { background: rgba(16,185,129,.12); color: #059669; } .badge.s-pending { background: rgba(245,158,11,.14); color: #b45309; } .badge.s-ko { background: rgba(239,68,68,.1); color: #dc2626; }
    .actions { display: inline-flex; gap: 6px; }
    .ic { width: 32px; height: 32px; border: none; background: none; border-radius: 8px; color: #475569; cursor: pointer; display: inline-grid; place-items: center; } .ic svg { width: 17px; height: 17px; } .ic:hover { background: #eef2f7; color: #1e293b; }
    .empty { padding: 36px; text-align: center; color: #94a3b8; font-size: 13px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(3px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 520px; background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); max-height: calc(100vh - 48px); overflow-y: auto; } .modal.sm { max-width: 420px; }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 12px; } .m-head h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
    .x { width: 32px; height: 32px; border: none; background: none; border-radius: 8px; cursor: pointer; color: #64748b; display: grid; place-items: center; } .x svg { width: 17px; height: 17px; } .x:hover { background: #f1f5f9; }
    .m-body { padding: 6px 24px; display: flex; flex-direction: column; gap: 16px; }
    .fg { display: flex; flex-direction: column; gap: 7px; } .fg label { font-size: 13px; font-weight: 700; color: #1e293b; }
    .fg select, .fg textarea { width: 100%; padding: 11px 13px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13.5px; font-family: inherit; color: #1e293b; outline: none; background: #fff; }
    .fg select:focus, .fg textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .dropzone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 30px 16px; border: 2px dashed #cbd5e1; border-radius: 12px; cursor: pointer; text-align: center; transition: all .15s ease; }
    .dropzone:hover, .dropzone.drag { border-color: #2563eb; background: rgba(37,99,235,.04); }
    .dropzone svg { width: 30px; height: 30px; color: #2563eb; }
    .dz-main { font-size: 13.5px; font-weight: 600; color: #1e293b; } .dz-sub { font-size: 12px; color: #94a3b8; }
    .m-foot { display: flex; justify-content: flex-end; align-items: center; gap: 12px; padding: 16px 24px 22px; }
    .btn-ghost { border: none; background: none; color: #475569; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; padding: 8px; } .btn-ghost:hover { color: #1e293b; }
    .btn-primary { height: 42px; padding: 0 22px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-primary:hover { background: #1d4ed8; } .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .fb-text { font-size: 13.5px; color: #475569; line-height: 1.55; margin: 0; }

    /* Preview modal */
    .preview-modal { max-width: 860px; width: 100%; display: flex; flex-direction: column; max-height: calc(100vh - 48px); }
    .preview-body { flex: 1; min-height: 320px; max-height: 70vh; overflow: auto; background: #0f172a; display: flex; align-items: center; justify-content: center; }
    .preview-img { max-width: 100%; max-height: 70vh; display: block; }
    .preview-frame { width: 100%; height: 70vh; border: none; background: #fff; }
    .preview-other { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #cbd5e1; padding: 60px 20px; text-align: center; } .preview-other svg { width: 54px; height: 54px; opacity: .6; } .preview-other p { font-size: 13.5px; margin: 0; }
    .preview-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #cbd5e1; padding: 60px; font-size: 13px; }
    .preview-loading .spin { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,.2); border-top-color: #fff; border-radius: 50%; animation: dvspin .8s linear infinite; } @keyframes dvspin { to { transform: rotate(360deg); } }
  `]
})
export class UserDeliverablesComponent implements OnInit {
  userId = 0;
  tasksList: Task[] = [];
  projectsList: Project[] = [];
  rows: DelRow[] = [];
  loading = true;
  submitting = false;

  tab: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'all';
  stats = { total: 0, approved: 0, pending: 0, rejected: 0 };

  showModal = false;
  feedback: DelRow | null = null;
  previewState: PreviewState | null = null;
  dragging = false;
  selectedFile: File | null = null;
  form: { projectId?: number; taskId?: number; notes: string } = { projectId: undefined, taskId: undefined, notes: '' };

  private taskById: Record<number, Task> = {};

  constructor(
    private taskService: TaskService,
    private deliverableService: DeliverableService,
    private authService: AuthService,
    private projectService: ProjectService,
    private fileService: FileService,
    private toast: ToastService,
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUser()?.id || 0;
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.projectService.getAllProjects(0, 100).subscribe({ next: (r: any) => { this.projectsList = r && r.data ? r.data : []; }, error: () => {} });
    this.taskService.getTasksByUser(this.userId, 0, 100).subscribe({
      next: (r: any) => {
        this.tasksList = r && r.data ? r.data : [];
        this.taskById = {};
        this.tasksList.forEach(t => { if (t.id != null) this.taskById[t.id] = t; });
        this.loadSubmissions();
      },
      error: () => { this.tasksList = []; this.loadSubmissions(); }
    });
  }

  private loadSubmissions(): void {
    this.deliverableService.getMyDeliverables().subscribe({
      next: (list: any) => {
        const arr = Array.isArray(list) ? list : (list && list.data ? list.data : []);
        this.rows = (arr || []).map((d: Deliverable) => ({
          ...d,
          projectName: (d.taskId != null && this.taskById[d.taskId]) ? (this.taskById[d.taskId].projectName || '—') : '—'
        }));
        this.computeStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.rows = []; this.computeStats(); this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private computeStats(): void {
    this.stats = {
      total: this.tasksList.length,
      approved: this.rows.filter(r => r.status === 'APPROVED').length,
      pending: this.rows.filter(r => r.status === 'PENDING').length,
      rejected: this.rows.filter(r => r.status === 'REJECTED').length
    };
  }

  get filtered(): DelRow[] { return this.tab === 'all' ? this.rows : this.rows.filter(r => r.status === this.tab); }
  get modalTasks(): Task[] { return this.tasksList.filter(t => !this.form.projectId || t.projectId === this.form.projectId); }

  stInfo(s?: string): { label: string; cls: string } {
    const up = (s || '').toUpperCase();
    if (up === 'APPROVED') return { label: 'Approuvé', cls: 's-ok' };
    if (up === 'REJECTED') return { label: 'Rejeté', cls: 's-ko' };
    return { label: 'En Attente', cls: 's-pending' };
  }

  // ── Modal ──
  openModal(): void { this.form = { projectId: undefined, taskId: undefined, notes: '' }; this.selectedFile = null; this.showModal = true; }
  /**
   * "Resubmit after modification": there is no in-place replace — a corrected deliverable is a
   * NEW submission for the SAME task. This pre-fills the submit modal with that task so the user
   * just attaches the corrected file; the rejected one stays as history.
   */
  resubmit(d: DelRow): void {
    const task = d.taskId != null ? this.taskById[d.taskId] : undefined;
    this.form = { projectId: task?.projectId, taskId: d.taskId, notes: '' };
    this.selectedFile = null;
    this.showModal = true;
  }
  closeModal(): void { this.showModal = false; this.selectedFile = null; }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.dragging = true; }
  onDrop(e: DragEvent): void { e.preventDefault(); this.dragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.selectedFile = f; }
  onFileInput(e: any): void { const f = e.target.files?.[0]; if (f) this.selectedFile = f; }

  submit(): void {
    if (!this.form.taskId) { this.toast.show(this.translate.instant('toast.selectTask'), 'error'); return; }
    if (!this.selectedFile) { this.toast.show(this.translate.instant('toast.attachFile'), 'error'); return; }
    this.submitting = true;
    const file = this.selectedFile;
    // Upload first, then record the deliverable with the real stored URL. No optimistic/local fallback:
    // a deliverable is only created when the file genuinely lands on the server.
    this.fileService.uploadFile(file).subscribe({
      next: (res: any) => {
        const url = res?.data?.fileUrl ?? res?.fileUrl;
        if (!url) { this.submitting = false; this.toast.show(this.translate.instant('toast.uploadNoUrl'), 'error'); return; }
        this.deliverableService.submitDeliverable({ taskId: this.form.taskId!, fileName: file.name, fileUrl: url }).subscribe({
          next: () => { this.submitting = false; this.showModal = false; this.toast.show(this.translate.instant('toast.deliverableSubmitted'), 'success'); this.load(); },
          error: () => { this.submitting = false; this.toast.show(this.translate.instant('toast.deliverableSaveFailed'), 'error'); }
        });
      },
      error: (err: any) => {
        this.submitting = false;
        this.toast.show(err?.error?.message || this.translate.instant('toast.fileTypeNotAllowed'), 'error');
      }
    });
  }

  // ── Row actions ──
  /** In-app preview: fetch the file (auth-protected) and render images/PDFs inline; others offer a download. */
  preview(d: DelRow): void {
    if (!d.fileUrl) { this.toast.show(this.translate.instant('toast.noPreview'), 'error'); return; }
    const ext = (d.fileName || d.fileUrl).split('.').pop()?.toLowerCase() || '';
    const kind: PreviewState['kind'] = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext) ? 'image'
      : ext === 'pdf' ? 'pdf' : 'other';
    this.previewState = { name: d.fileName, kind, url: '' as any, rawUrl: d.fileUrl, loading: true };
    this.fileService.fetchBlob(d.fileUrl).subscribe({
      next: (blob: Blob) => {
        const objUrl = window.URL.createObjectURL(blob);
        if (this.previewState) {
          this.previewState.url = this.sanitizer.bypassSecurityTrustResourceUrl(objUrl);
          this.previewState.loading = false;
        }
        this.cdr.detectChanges();
      },
      error: () => { this.previewState = null; this.toast.show(this.translate.instant('toast.previewLoadFailed'), 'error'); this.cdr.detectChanges(); }
    });
  }
  closePreview(): void { this.previewState = null; }
  downloadFromPreview(): void {
    if (this.previewState) this.download({ fileUrl: this.previewState.rawUrl, fileName: this.previewState.name } as DelRow);
  }
  download(d: DelRow): void {
    if (!d.fileUrl) { this.toast.show(this.translate.instant('toast.noFileToDownload'), 'error'); return; }
    this.fileService.downloadFile(d.fileUrl, d.fileName).subscribe({
      next: () => this.toast.show(this.translate.instant('toast.downloadStarted'), 'success'),
      error: () => this.toast.show(this.translate.instant('toast.downloadFailed'), 'error')
    });
  }
}
