import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TaskService, Task, TaskRequest } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { DeliverableService } from '../../../core/services/deliverable.service';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { FileService } from '../../../core/services/file.service';
import { MessageService, Message } from '../../../core/services/message.service';
import { TimeLogService } from '../../../core/services/time-log.service';
import { AiAssistantService } from '../../../core/services/ai-assistant.service';
import { ToastService } from '../../../core/services/toast.service';

interface DrawerComment { sender: string; message: string; time: string; mine: boolean; }
interface DrawerFile { name: string; url?: string; status?: string; }
interface TimeEntry { date: string; hours: number; desc: string; }

@Component({
  selector: 'app-user-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="mt-wrap">

    <!-- ═══ Page header ═══ -->
    <div class="page-head">
      <h1>{{ 'mytasks.title' | translate }}</h1>
      <p>{{ 'mytasks.subtitle' | translate }}</p>
    </div>

    <!-- ═══ Toolbar ═══ -->
    <div class="toolbar">
      <div class="tabs">
        <button class="tab" *ngFor="let tb of statusTabs" [class.on]="tab === tb.key" (click)="tab = tb.key">{{ tb.label | translate }}</button>
      </div>
      <div class="tb-right">
        <select class="sel" [(ngModel)]="projectFilter">
          <option value="">{{ 'common.allProjects' | translate }}</option>
          <option *ngFor="let p of projectOptions" [value]="p">{{ p }}</option>
        </select>
        <select class="sel" [(ngModel)]="priorityFilter">
          <option value="">{{ 'common.priority' | translate }}</option>
          <option value="LOW">{{ 'common.priorityLow' | translate }}</option><option value="MEDIUM">{{ 'common.priorityMedium' | translate }}</option><option value="HIGH">{{ 'common.priorityHigh' | translate }}</option><option value="CRITICAL">{{ 'common.priorityCritical' | translate }}</option>
        </select>
        <div class="view-toggle">
          <button [class.on]="view === 'list'" (click)="view = 'list'" [title]="'common.list' | translate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></button>
          <button [class.on]="view === 'board'" (click)="view = 'board'" [title]="'common.board' | translate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></button>
        </div>
      </div>
    </div>

    <!-- ═══ Kanban board ═══ -->
    <div class="board" *ngIf="view === 'board'">
      <div class="col" *ngFor="let c of visibleColumns; trackBy: trackByColKey">
        <div class="col-head"><span class="col-title">{{ c.label }}</span><span class="col-count">{{ c.tasks.length }}</span></div>
        <div class="col-list">
          <div class="card anim" *ngFor="let t of c.tasks; let i = index; trackBy: trackByTaskId" [style.--d]="(i*0.03)+'s'" (click)="open(t)" [attr.data-task-id]="t.id">
            <div class="c-title">{{ t.name }}</div>
            <span class="proj-badge" *ngIf="t.projectName">{{ t.projectName }}</span>
            <div class="c-prio"><span class="pri" [ngClass]="prio(t.priority).cls"><i class="dot"></i>{{ prio(t.priority).label | translate }}</span><span class="c-date" *ngIf="t.deadline"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>{{ t.deadline | date:'dd-MM' }}</span></div>
            <div class="c-bar"><div class="c-fill" [style.width.%]="t.progress || 0"></div></div>
            <div class="c-foot">
              <span class="avatar">{{ initials(t.assignedToName || developerName) }}</span>
              <span class="c-comments"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>{{ t.commentCount || 0 }}</span>
            </div>
          </div>
          <div class="col-empty" *ngIf="c.tasks.length === 0">—</div>
        </div>
      </div>
    </div>

    <!-- ═══ List view ═══ -->
    <div class="list-card" *ngIf="view === 'list'">
      <table class="mt-table">
        <thead><tr><th>{{ 'common.task' | translate }}</th><th>{{ 'common.project' | translate }}</th><th>{{ 'common.priority' | translate }}</th><th>{{ 'common.status' | translate }}</th><th>{{ 'common.deadline' | translate }}</th><th>{{ 'common.progress' | translate }}</th></tr></thead>
        <tbody>
          <tr *ngFor="let t of filteredTasks; trackBy: trackByTaskId" (click)="open(t)">
            <td class="td-name">{{ t.name }}</td>
            <td class="muted">{{ t.projectName || '—' }}</td>
            <td><span class="pri" [ngClass]="prio(t.priority).cls"><i class="dot"></i>{{ prio(t.priority).label | translate }}</span></td>
            <td><span class="st" [ngClass]="stInfo(t.status).cls">{{ stInfo(t.status).label | translate }}</span></td>
            <td class="muted">{{ t.deadline ? (t.deadline | date:'dd/MM/yyyy') : '—' }}</td>
            <td><div class="lbar"><div class="lfill" [style.width.%]="t.progress || 0"></div></div></td>
          </tr>
          <tr *ngIf="filteredTasks.length === 0"><td colspan="6"><div class="col-empty">{{ 'mytasks.noTasks' | translate }}</div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══ Slide drawer ═══ -->
  <div class="drawer-backdrop" [class.show]="!!selected" (click)="close()"></div>
  <aside class="drawer" [class.open]="!!selected">
    <ng-container *ngIf="selected as t">
      <div class="dr-head">
        <input class="dr-title-input" *ngIf="editTitle" [(ngModel)]="t.name" (keyup.enter)="saveTitle(t)" (blur)="saveTitle(t)">
        <h2 class="dr-title" *ngIf="!editTitle">{{ t.name }}</h2>
        <div class="dr-head-actions">
          <button class="ic" (click)="editTitle = !editTitle" [title]="'common.edit' | translate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg></button>
          <button class="ic" (click)="close()" [title]="'common.close' | translate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>

      <div class="dr-body">
        <div class="grid2">
          <div class="fg"><label>Statut</label>
            <select [(ngModel)]="t.status" (change)="updateStatus(t)"><option value="TODO">{{ 'common.statusTodo' | translate }}</option><option value="IN_PROGRESS">{{ 'common.statusInProgress' | translate }}</option><option value="ON_HOLD">{{ 'common.statusOnHold' | translate }}</option><option value="COMPLETED">{{ 'common.statusDone' | translate }}</option></select>
          </div>
          <div class="fg"><label>Priorité</label>
            <select [(ngModel)]="t.priority" (change)="updatePriority(t)"><option value="LOW">{{ 'common.priorityLow' | translate }}</option><option value="MEDIUM">{{ 'common.priorityMedium' | translate }}</option><option value="HIGH">{{ 'common.priorityHigh' | translate }}</option><option value="CRITICAL">{{ 'common.priorityCritical' | translate }}</option></select>
          </div>
        </div>

        <div class="info-row">
          <span><strong>{{ 'mytasks.projectLabel' | translate }}</strong> {{ t.projectName || '—' }}</span>
          <span><strong>{{ 'mytasks.assignedTo' | translate }}</strong> {{ t.assignedToName || developerName }}</span>
        </div>

        <div class="fg">
          <div class="lbl-row"><label>{{ 'common.description' | translate }}</label><button class="ai-btn" (click)="askAi(t)" [disabled]="aiLoading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"></path></svg>{{ (aiLoading ? 'mytasks.aiAnalyzing' : 'mytasks.aiAdvice') | translate }}</button></div>
          <textarea rows="3" [(ngModel)]="t.description" (blur)="saveDescription(t)" [placeholder]="'mytasks.describePlaceholder' | translate"></textarea>
          <div class="ai-box" *ngIf="aiGuidance">{{ aiGuidance }}</div>
        </div>

        <div class="fg">
          <div class="lbl-row"><label>{{ 'common.progress' | translate }}</label><span class="prog-pct">{{ t.progress || 0 }}%</span></div>
          <input type="range" min="0" max="100" step="5" [(ngModel)]="t.progress" (change)="updateProgress(t)">
        </div>

        <!-- Tabs -->
        <div class="dr-tabs">
          <button [class.on]="drawerTab === 'comments'" (click)="drawerTab = 'comments'">{{ 'mytasks.tabComments' | translate }}</button>
          <button [class.on]="drawerTab === 'files'" (click)="drawerTab = 'files'">{{ 'mytasks.tabFiles' | translate }}</button>
          <button [class.on]="drawerTab === 'time'" (click)="drawerTab = 'time'">{{ 'mytasks.tabTime' | translate }}</button>
        </div>

        <!-- Commentaires -->
        <div class="tab-pane" *ngIf="drawerTab === 'comments'">
          <div class="comment" *ngFor="let cm of comments">
            <span class="c-avatar">{{ initials(cm.sender) }}</span>
            <div class="c-bubble"><div class="c-meta"><span class="c-name">{{ cm.sender }}</span><span class="c-time">{{ cm.time }}</span></div><p>{{ cm.message }}</p></div>
          </div>
          <div class="empty-sm" *ngIf="comments.length === 0">{{ 'mytasks.noComments' | translate }}</div>
          <div class="comment-add">
            <input type="text" [placeholder]="'mytasks.commentPlaceholder' | translate" [(ngModel)]="newComment" (keyup.enter)="sendComment(t)">
            <button class="send" (click)="sendComment(t)" [disabled]="!newComment.trim()">{{ 'common.send' | translate }}</button>
          </div>
        </div>

        <!-- Fichiers -->
        <div class="tab-pane" *ngIf="drawerTab === 'files'">
          <div class="file-row" *ngFor="let f of files">
            <span class="f-left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>{{ f.name }}</span>
            <a class="f-dl" (click)="downloadFile(f)">{{ 'common.download' | translate }}</a>
          </div>
          <div class="empty-sm" *ngIf="files.length === 0">{{ 'mytasks.noFiles' | translate }}</div>
          <button class="add-file" (click)="fileInput.click()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> {{ 'mytasks.addFile' | translate }}</button>
          <input type="file" #fileInput hidden (change)="onFile($event, t)" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif">
        </div>

        <!-- Temps -->
        <div class="tab-pane" *ngIf="drawerTab === 'time'">
          <div class="time-total" *ngIf="timeEntries.length"><span>{{ 'mytasks.totalLogged' | translate }}</span><strong>{{ totalHours }}h</strong></div>
          <div class="time-row" *ngFor="let e of timeEntries">
            <div class="t-left"><span class="t-date">{{ e.date | date:'dd/MM/yyyy' }}</span><span class="t-desc" *ngIf="e.desc">{{ e.desc }}</span></div>
            <strong>{{ e.hours }}h</strong>
          </div>
          <div class="empty-sm" *ngIf="timeEntries.length === 0">{{ 'mytasks.noTime' | translate }}</div>
        </div>
      </div>

      <div class="dr-foot">
        <button class="done-btn" (click)="markDone(t)" [disabled]="t.status === 'COMPLETED'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="9 12 11.5 14.5 16 9.5"></polyline></svg> {{ 'mytasks.markDone' | translate }}</button>
      </div>
    </ng-container>
  </aside>
  `,
  styles: [`
    .mt-wrap { display: flex; flex-direction: column; gap: 16px; }
    .page-head h1 { font-size: 21px; font-weight: 800; color: var(--text-primary); margin: 0; }
    .page-head p { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }
    @keyframes mFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .anim { animation: mFade .35s ease both; animation-delay: var(--d, 0s); }

    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .tabs { display: inline-flex; gap: 6px; flex-wrap: wrap; }
    .tab { height: 32px; padding: 0 15px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 9999px; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; font-family: inherit; }
    .tab.on { background: #2563eb; color: #fff; border-color: #2563eb; }
    .tb-right { display: flex; align-items: center; gap: 8px; }
    .sel { height: 38px; padding: 0 30px 0 12px; border: 1px solid var(--border); border-radius: 10px; font-size: 12.5px; font-weight: 500; color: var(--text-secondary); background: var(--bg-card); cursor: pointer; outline: none; appearance: none; -webkit-appearance: none; max-width: 160px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; }
    .view-toggle { display: inline-flex; padding: 2px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-card); }
    .view-toggle button { width: 36px; height: 32px; border: none; background: none; border-radius: 8px; color: var(--text-muted); cursor: pointer; display: grid; place-items: center; } .view-toggle button svg { width: 16px; height: 16px; } .view-toggle button.on { background: #2563eb; color: #fff; }

    .board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; align-items: start; }
    @media (max-width: 1100px) { .board { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 620px) { .board { grid-template-columns: 1fr; } }
    .col { background: var(--bg-subtle); border-radius: 14px; padding: 12px; }
    .col-head { display: flex; align-items: center; justify-content: space-between; padding: 2px 4px 10px; }
    .col-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted); }
    .col-count { font-size: 12px; font-weight: 700; color: var(--text-muted); }
    .col-list { display: flex; flex-direction: column; gap: 10px; min-height: 30px; }
    .col-empty { text-align: center; color: var(--border-strong); font-size: 13px; padding: 10px; }
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; cursor: pointer; transition: box-shadow .15s ease, transform .15s ease; }
    .card:hover { box-shadow: 0 8px 20px rgba(15,23,42,.1); transform: translateY(-1px); }
    .c-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .proj-badge { display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 500; color: #2563eb; background: rgba(37,99,235,.1); padding: 2px 8px; border-radius: 6px; }
    .c-prio { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
    .pri { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 9999px; }
    .pri .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .pri.p-low { background: rgba(22,163,74,.12); color: #16a34a; } .pri.p-med { background: rgba(217,119,6,.14); color: #d97706; } .pri.p-high { background: rgba(220,38,38,.1); color: var(--danger-text); } .pri.p-crit { background: rgba(127,29,29,.12); color: var(--danger-text); }
    .c-date { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: var(--text-muted); } .c-date svg { width: 13px; height: 13px; }
    .c-bar { height: 5px; border-radius: 9999px; background: var(--bg-subtle); overflow: hidden; margin-top: 12px; } .c-fill { height: 100%; background: #2563eb; border-radius: 9999px; }
    .c-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
    .avatar { width: 28px; height: 28px; border-radius: 50%; background: #2563eb; color: #fff; font-size: 10px; font-weight: 700; display: grid; place-items: center; }
    .c-comments { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-muted); } .c-comments svg { width: 14px; height: 14px; }

    .list-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .mt-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .mt-table thead { background: var(--bg-muted); } .mt-table th { text-align: left; padding: 11px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
    .mt-table td { padding: 12px 16px; border-top: 1px solid var(--bg-subtle); color: var(--text-secondary); } .mt-table tbody tr { cursor: pointer; } .mt-table tbody tr:hover { background: var(--bg-muted); }
    .td-name { font-weight: 600; color: var(--text-primary); } .muted { color: var(--text-muted); }
    .st { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; } .st.s-todo { background: var(--bg-subtle); color: var(--text-muted); } .st.s-prog { background: rgba(37,99,235,.1); color: #2563eb; } .st.s-rev { background: rgba(217,119,6,.14); color: #d97706; } .st.s-done { background: rgba(22,163,74,.12); color: #16a34a; }
    .lbar { width: 90px; height: 6px; border-radius: 9999px; background: var(--bg-subtle); overflow: hidden; } .lfill { height: 100%; background: #2563eb; }

    /* Drawer */
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.45); opacity: 0; pointer-events: none; transition: opacity .3s ease; z-index: 1900; }
    .drawer-backdrop.show { opacity: 1; pointer-events: auto; }
    .drawer { position: fixed; top: 0; right: 0; height: 100vh; width: 480px; max-width: 100vw; background: var(--bg-card); box-shadow: -10px 0 40px rgba(15,23,42,.2); transform: translateX(100%); transition: transform .32s cubic-bezier(.4,0,.2,1); z-index: 2000; display: flex; flex-direction: column; }
    .drawer.open { transform: translateX(0); }
    .dr-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 18px 22px; border-bottom: 1px solid var(--bg-subtle); }
    .dr-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .dr-title-input { font-size: 18px; font-weight: 700; color: var(--text-primary); border: 1px solid var(--border); border-radius: 8px; padding: 4px 8px; width: 100%; outline: none; }
    .dr-head-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .ic { width: 32px; height: 32px; border: none; background: var(--bg-subtle); border-radius: 8px; color: var(--text-muted); cursor: pointer; display: grid; place-items: center; } .ic svg { width: 16px; height: 16px; } .ic:hover { background: var(--border); }
    .dr-body { flex: 1; overflow-y: auto; padding: 18px 22px; display: flex; flex-direction: column; gap: 16px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fg { display: flex; flex-direction: column; gap: 6px; } .fg label { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
    .lbl-row { display: flex; align-items: center; justify-content: space-between; }
    .fg select, .fg textarea, .fg input[type=text] { width: 100%; padding: 9px 11px; border: 1px solid var(--border); border-radius: 10px; font-size: 13px; font-family: inherit; color: var(--text-primary); outline: none; background: var(--bg-card); }
    .fg select:focus, .fg textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .info-row { display: flex; flex-wrap: wrap; gap: 6px 18px; justify-content: space-between; background: var(--bg-muted); border-radius: 10px; padding: 10px 12px; font-size: 12.5px; color: var(--text-secondary); } .info-row strong { color: var(--text-primary); }
    .ai-btn { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px; border: 1px solid #c7d2fe; background: var(--primary-bg); border-radius: 8px; font-size: 11.5px; font-weight: 600; color: #4f46e5; cursor: pointer; font-family: inherit; } .ai-btn svg { width: 13px; height: 13px; } .ai-btn:disabled { opacity: .6; }
    .ai-box { margin-top: 8px; background: var(--primary-bg); border: 1px solid #c7d2fe; border-radius: 10px; padding: 10px 12px; font-size: 12.5px; color: #3730a3; line-height: 1.5; white-space: pre-wrap; }
    .prog-pct { font-size: 13px; font-weight: 700; color: #2563eb; }
    input[type=range] { width: 100%; accent-color: #2563eb; }

    .dr-tabs { display: inline-flex; gap: 4px; background: var(--bg-subtle); border-radius: 10px; padding: 3px; }
    .dr-tabs button { flex: 1; height: 32px; border: none; background: none; border-radius: 8px; font-size: 12.5px; font-weight: 600; color: var(--text-muted); cursor: pointer; font-family: inherit; }
    .dr-tabs button.on { background: var(--bg-card); color: var(--text-primary); box-shadow: 0 1px 2px rgba(15,23,42,.1); }
    .tab-pane { display: flex; flex-direction: column; gap: 10px; }

    .comment { display: flex; gap: 10px; }
    .c-avatar { width: 30px; height: 30px; border-radius: 50%; background: #7c3aed; color: #fff; font-size: 10px; font-weight: 700; display: grid; place-items: center; flex-shrink: 0; }
    .c-bubble { flex: 1; background: var(--bg-muted); border-radius: 10px; padding: 8px 11px; }
    .c-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; } .c-name { font-size: 12.5px; font-weight: 700; color: var(--text-primary); } .c-time { font-size: 10.5px; color: var(--text-muted); }
    .c-bubble p { margin: 3px 0 0; font-size: 13px; color: var(--text-secondary); }
    .comment-add { display: flex; gap: 8px; margin-top: 4px; }
    .comment-add input { flex: 1; height: 38px; padding: 0 12px; border: 1px solid var(--border); border-radius: 10px; font-size: 13px; outline: none; } .comment-add input:focus { border-color: #2563eb; }
    .send { height: 38px; padding: 0 16px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; } .send:disabled { opacity: .5; cursor: not-allowed; }
    .empty-sm { font-size: 12.5px; color: var(--text-muted); padding: 6px 0; }

    .file-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid var(--border); border-radius: 10px; padding: 11px 13px; }
    .f-left { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); } .f-left svg { width: 16px; height: 16px; color: var(--text-muted); }
    .f-dl { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); cursor: pointer; } .f-dl:hover { color: #2563eb; }
    .add-file { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 42px; border: 1px dashed var(--border-strong); background: var(--bg-card); border-radius: 10px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; font-family: inherit; } .add-file svg { width: 16px; height: 16px; } .add-file:hover { background: var(--bg-muted); border-color: var(--text-muted); }

    .time-total { display: flex; align-items: center; justify-content: space-between; background: rgba(37,99,235,.08); border-radius: 10px; padding: 12px 14px; font-size: 13px; font-weight: 600; color: #2563eb; } .time-total strong { font-size: 15px; }
    .time-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--bg-muted); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: var(--text-secondary); } .time-row strong { color: var(--text-primary); }
    .t-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; } .t-date { font-weight: 600; color: var(--text-primary); } .t-desc { font-size: 11.5px; color: var(--text-muted); }

    .dr-foot { padding: 16px 22px; border-top: 1px solid var(--bg-subtle); }
    .done-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 46px; border: none; border-radius: 12px; background: #16a34a; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; } .done-btn svg { width: 18px; height: 18px; } .done-btn:hover:not(:disabled) { background: #15803d; } .done-btn:disabled { opacity: .55; cursor: not-allowed; }
  `]
})
export class UserMyTasksComponent implements OnInit {
  developerId = 0;
  developerName = 'Collaborateur';
  myTasks: Task[] = [];
  loading = true;

  view: 'board' | 'list' = 'board';
  tab: 'all' | 'TODO' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' = 'all';
  statusTabs = [
    { key: 'all' as const, label: 'common.all' }, { key: 'TODO' as const, label: 'common.statusTodo' },
    { key: 'IN_PROGRESS' as const, label: 'common.statusInProgress' }, { key: 'ON_HOLD' as const, label: 'common.statusOnHold' },
    { key: 'COMPLETED' as const, label: 'common.statusDone' }
  ];
  projectFilter = '';
  priorityFilter = '';

  // Drawer state
  selected: Task | null = null;
  editTitle = false;
  drawerTab: 'comments' | 'files' | 'time' = 'comments';
  comments: DrawerComment[] = [];
  files: DrawerFile[] = [];
  timeEntries: TimeEntry[] = [];
  totalHours = 0;
  newComment = '';
  aiGuidance = '';
  aiLoading = false;

  private deepLinkTaskId: number | null = null;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private deliverableService: DeliverableService,
    private commentService: CommentService,
    private fileService: FileService,
    private messageService: MessageService,
    private timeLogService: TimeLogService,
    private aiService: AiAssistantService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) { this.developerId = user.id; this.developerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Collaborateur'; }
    this.route.queryParams.subscribe(p => { this.deepLinkTaskId = p['taskId'] ? Number(p['taskId']) : null; });
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.taskService.getTasksByUser(this.developerId, 0, 100).subscribe({
      next: (r: any) => { this.myTasks = r && r.data ? r.data : []; this.loading = false; this.cdr.detectChanges(); this.applyDeepLink(); },
      error: () => { this.myTasks = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private applyDeepLink(): void {
    if (!this.deepLinkTaskId) return;
    const t = this.myTasks.find(x => x.id === this.deepLinkTaskId);
    if (t) this.open(t);
  }

  private norm(s?: string): string { const u = (s || '').toUpperCase(); return u === 'PLANNED' ? 'TODO' : u === 'OVERDUE' ? 'IN_PROGRESS' : u; }

  // trackBy keeps the DOM stable across change detection (the columns/tasks come from getters that
  // return new array/object references each cycle). Without these, every click/keystroke tears down
  // and rebuilds the cards, replaying the fade-in animation — the "continuous blinking" effect.
  trackByTaskId(_index: number, t: Task): number | string { return t?.id ?? _index; }
  trackByColKey(_index: number, c: { key: string }): string { return c.key; }

  get filteredTasks(): Task[] {
    return this.myTasks.filter(t => {
      if (this.tab !== 'all' && this.norm(t.status) !== this.tab) return false;
      if (this.projectFilter && t.projectName !== this.projectFilter) return false;
      if (this.priorityFilter && (t.priority || '') !== this.priorityFilter) return false;
      return true;
    });
  }

  get projectOptions(): string[] { return Array.from(new Set(this.myTasks.map(t => t.projectName).filter(Boolean) as string[])); }

  get visibleColumns() {
    const cols = [
      { key: 'TODO', label: 'À faire' }, { key: 'IN_PROGRESS', label: 'En cours' },
      { key: 'ON_HOLD', label: 'En révision' }, { key: 'COMPLETED', label: 'Terminé' }
    ];
    const shown = this.tab === 'all' ? cols : cols.filter(c => c.key === this.tab);
    return shown.map(c => ({ ...c, tasks: this.filteredTasks.filter(t => this.norm(t.status) === c.key) }));
  }

  // ── Drawer ──
  open(t: Task): void {
    this.selected = t;
    this.editTitle = false;
    this.drawerTab = 'comments';
    this.aiGuidance = '';
    this.newComment = '';
    this.loadComments(t);
    this.loadFiles(t);
    this.loadTime(t);
    this.cdr.detectChanges();
  }
  close(): void { this.selected = null; this.cdr.detectChanges(); }

  private loadComments(t: Task): void {
    this.comments = [];
    if (!t.id) return;
    this.commentService.getCommentsByTask(t.id).subscribe({
      next: (r: any) => {
        const list = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        this.comments = (list || []).map((c: any) => ({
          sender: c.user ? `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || c.user.username : (c.userName || 'Utilisateur'),
          message: c.content, time: this.timeAgo(c.createdAt), mine: c.userId === this.developerId
        }));
        this.cdr.detectChanges();
      },
      error: () => { this.comments = []; }
    });
  }

  private loadFiles(t: Task): void {
    this.files = [];
    if (!t.id) return;
    this.deliverableService.getDeliverablesByTask(t.id).subscribe({
      next: (list: any) => {
        const arr = Array.isArray(list) ? list : (list && list.data ? list.data : []);
        this.files = (arr || []).map((d: any) => ({ name: d.fileName, url: d.fileUrl, status: d.status }));
        this.cdr.detectChanges();
      },
      error: () => { this.files = []; }
    });
  }

  private loadTime(t: Task): void {
    this.timeEntries = [];
    this.totalHours = 0;
    if (!t.id) return;
    this.timeLogService.getTimeLogsByTask(t.id).subscribe({
      next: (r: any) => {
        const logs = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        this.timeEntries = (logs || [])
          .map((l: any) => ({
            date: String(l.logDate ?? l.date ?? '').slice(0, 10),
            hours: Number(l.hoursSpent ?? l.hours ?? 0),
            desc: l.description ?? l.notes ?? ''
          }))
          .filter((e: TimeEntry) => !!e.date)
          .sort((a: TimeEntry, b: TimeEntry) => (a.date < b.date ? 1 : -1));
        this.totalHours = Math.round(this.timeEntries.reduce((s, e) => s + e.hours, 0) * 10) / 10;
        this.cdr.detectChanges();
      },
      error: () => { this.timeEntries = []; this.totalHours = 0; }
    });
  }

  // ── Updates (wired to backend) ──
  private req(t: Task): TaskRequest {
    return { name: t.name, description: t.description || '', projectId: t.projectId, assignedToId: t.assignedToId, priority: t.priority || 'MEDIUM', difficulty: t.difficulty || 'MEDIUM', status: t.status || 'TODO', progress: t.progress || 0, deadline: t.deadline || '', reminderType: t.reminderType || 'NONE' };
  }
  updateStatus(t: Task): void {
    if (!t.id) return;
    const prog = (t.status || '').toUpperCase() === 'COMPLETED' ? 100 : (t.progress || 0);
    t.progress = prog;
    this.taskService.updateTaskProgress(t.id, prog, t.status!).subscribe({ next: () => this.toast.show(this.translate.instant('toast.statusUpdated'), 'success'), error: () => {} });
  }
  updatePriority(t: Task): void {
    if (!t.id) return;
    this.taskService.updateTask(t.id, this.req(t)).subscribe({ next: () => this.toast.show(this.translate.instant('toast.priorityUpdated'), 'success'), error: () => {} });
  }
  updateProgress(t: Task): void {
    if (!t.id) return;
    const status = (t.progress || 0) >= 100 ? 'COMPLETED' : (this.norm(t.status) === 'COMPLETED' ? 'IN_PROGRESS' : t.status!);
    t.status = status;
    this.taskService.updateTaskProgress(t.id, t.progress || 0, status).subscribe({ error: () => {} });
  }
  saveDescription(t: Task): void {
    if (!t.id) return;
    this.taskService.updateTask(t.id, this.req(t)).subscribe({ error: () => {} });
  }
  saveTitle(t: Task): void {
    this.editTitle = false;
    if (!t.id || !t.name.trim()) return;
    this.taskService.updateTask(t.id, this.req(t)).subscribe({ next: () => this.toast.show(this.translate.instant('toast.taskUpdated'), 'success'), error: () => {} });
  }
  markDone(t: Task): void {
    if (!t.id) return;
    t.status = 'COMPLETED'; t.progress = 100;
    this.taskService.updateTaskProgress(t.id, 100, 'COMPLETED').subscribe({ next: () => this.toast.show(this.translate.instant('toast.taskCompleted'), 'success'), error: () => {} });
  }

  // ── Comments ──
  sendComment(t: Task): void {
    const text = this.newComment.trim();
    if (!text || !t.id) return;
    const optimistic: DrawerComment = { sender: this.developerName, message: text, time: this.translate.instant('relTime.justNow'), mine: true };
    this.comments.push(optimistic);
    t.commentCount = (t.commentCount || 0) + 1;
    this.newComment = '';
    this.commentService.createComment({ content: text, userId: this.developerId, taskId: t.id }).subscribe({
      next: () => {
        if (t.projectId) {
          const m: Message = { senderId: this.developerId, projectId: t.projectId, content: `[Tâche : ${t.name}] ${text}` };
          this.messageService.sendMessage(m).subscribe({ error: () => {} });
        }
      },
      error: () => {
        // Roll back the optimistic comment — it was not persisted.
        this.comments = this.comments.filter(c => c !== optimistic);
        t.commentCount = Math.max(0, (t.commentCount || 1) - 1);
        this.toast.show(this.translate.instant('toast.commentFailed'), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── Files ──
  onFile(e: any, t: Task): void {
    const file: File = e.target.files?.[0];
    if (!file || !t.id) return;
    const submit = (url: string) => {
      this.deliverableService.submitDeliverable({ taskId: t.id!, fileName: file.name, fileUrl: url }).subscribe({
        next: () => { this.toast.show(this.translate.instant('toast.fileSent', { name: file.name }), 'success'); this.loadFiles(t); },
        error: () => { this.toast.show(this.translate.instant('toast.deliverableSendFailed'), 'error'); }
      });
    };
    // Upload returns { success, message, data: { fileName, fileUrl } } — unwrap .data.
    this.fileService.uploadFile(file).subscribe({
      next: (res: any) => {
        const url = res?.data?.fileUrl ?? res?.fileUrl;
        if (!url) { this.toast.show(this.translate.instant('toast.uploadNoUrl'), 'error'); return; }
        submit(url);
      },
      error: (err: any) => this.toast.show(err?.error?.message || this.translate.instant('toast.fileTypeNotAllowed'), 'error')
    });
  }
  downloadFile(f: DrawerFile): void {
    if (!f.url) { this.toast.show(this.translate.instant('toast.noFileToDownload'), 'error'); return; }
    this.fileService.downloadFile(f.url, f.name).subscribe({
      next: () => this.toast.show(this.translate.instant('toast.downloadStarted'), 'success'),
      error: () => this.toast.show(this.translate.instant('toast.downloadFailed'), 'error')
    });
  }

  // ── AI (kept) ──
  askAi(t: Task): void {
    if (!t.id || this.aiLoading) return;
    this.aiLoading = true; this.aiGuidance = '';
    this.aiService.getTaskGuidance(t.id).subscribe({
      next: (res: any) => { this.aiGuidance = res?.reply || 'Aucun conseil disponible.'; this.aiLoading = false; this.cdr.detectChanges(); },
      error: () => { this.aiLoading = false; this.toast.show(this.translate.instant('toast.aiTipsFailed'), 'error'); this.cdr.detectChanges(); }
    });
  }

  // ── Helpers ──
  prio(p?: string): { label: string; cls: string } {
    const map: Record<string, { label: string; cls: string }> = {
      LOW: { label: 'common.priorityLow', cls: 'p-low' }, MEDIUM: { label: 'common.priorityMedium', cls: 'p-med' },
      HIGH: { label: 'common.priorityHigh', cls: 'p-high' }, CRITICAL: { label: 'common.priorityCritical', cls: 'p-crit' }
    };
    return map[(p || '').toUpperCase()] || { label: 'common.priorityMedium', cls: 'p-med' };
  }
  stInfo(s?: string): { label: string; cls: string } {
    const map: Record<string, { label: string; cls: string }> = {
      TODO: { label: 'common.statusTodo', cls: 's-todo' }, IN_PROGRESS: { label: 'common.statusInProgress', cls: 's-prog' },
      ON_HOLD: { label: 'common.statusOnHold', cls: 's-rev' }, COMPLETED: { label: 'common.statusDone', cls: 's-done' }
    };
    return map[this.norm(s)] || { label: 'common.statusTodo', cls: 's-todo' };
  }
  initials(name?: string): string {
    if (!name) return 'U';
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || 'U';
  }
  timeAgo(at?: string): string {
    if (!at) return '';
    const diff = Date.now() - new Date(at).getTime();
    if (isNaN(diff)) return '';
    const m = Math.floor(diff / 60000);
    if (m < 1) return this.translate.instant('relTime.justNow');
    if (m < 60) return this.translate.instant('relTime.minAgo', { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return this.translate.instant('relTime.hAgo', { n: h });
    return this.translate.instant('relTime.dAgo', { n: Math.floor(h / 24) });
  }
}
