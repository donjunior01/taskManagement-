import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { TaskService, Task, TaskRequest } from '../../../core/services/task.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pm-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AiDescribeButtonComponent, TranslatePipe, HasPermissionDirective],
  template: `
  <div class="tk-wrap">

    <!-- ═══ Toolbar ═══ -->
    <div class="toolbar">
      <div class="filters">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" [placeholder]="'pm.tasks.searchPlaceholder' | translate" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" />
        </div>
        <select class="sel" [(ngModel)]="projectFilter" (change)="applyFilters()">
          <option value="">{{ 'pm.tasks.allProjects' | translate }}</option>
          <option *ngFor="let p of projectsList" [value]="p.id">{{ p.name }}</option>
        </select>
        <select class="sel" [(ngModel)]="assigneeFilter" (change)="applyFilters()">
          <option value="">{{ 'pm.tasks.allAssignees' | translate }}</option>
          <option *ngFor="let d of developersList" [value]="d.id">{{ d.firstName }} {{ d.lastName }}</option>
        </select>
        <select class="sel" [(ngModel)]="priorityFilter" (change)="applyFilters()">
          <option value="">{{ 'pm.tasks.allPriorities' | translate }}</option>
          <option value="LOW">{{ 'pm.tasks.prioLow' | translate }}</option><option value="MEDIUM">{{ 'pm.tasks.prioMedium' | translate }}</option><option value="HIGH">{{ 'pm.tasks.prioHigh' | translate }}</option><option value="CRITICAL">{{ 'pm.tasks.prioCritical' | translate }}</option>
        </select>
        <select class="sel" [(ngModel)]="statusFilter" (change)="applyFilters()">
          <option value="">{{ 'pm.tasks.allStatuses' | translate }}</option>
          <option value="TODO">{{ 'pm.tasks.stTodo' | translate }}</option><option value="IN_PROGRESS">{{ 'pm.tasks.stInProgress' | translate }}</option><option value="ON_HOLD">{{ 'pm.tasks.stOnHold' | translate }}</option><option value="COMPLETED">{{ 'pm.tasks.stCompleted' | translate }}</option>
        </select>
      </div>

      <div class="toolbar-right">
        <div class="view-toggle">
          <button [class.on]="view === 'list'" (click)="view = 'list'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> {{ 'pm.tasks.viewList' | translate }}
          </button>
          <button [class.on]="view === 'kanban'" (click)="view = 'kanban'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18"></rect><rect x="14" y="3" width="7" height="11"></rect></svg> {{ 'pm.tasks.viewKanban' | translate }}
          </button>
          <button [class.on]="view === 'cal'" (click)="view = 'cal'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> {{ 'pm.tasks.viewCal' | translate }}
          </button>
        </div>
        <button *appHasPermission="'task.create'" class="btn-primary" (click)="openCreate()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> {{ 'pm.tasks.newTask' | translate }}
        </button>
      </div>
    </div>

    <!-- ═══ Bulk action bar ═══ -->
    <div class="bulk-bar" *ngIf="selected.length > 0">
      <span class="bulk-count">{{ 'pm.tasks.selectedCount' | translate:{ count: selected.length } }}</span>
      <div class="bulk-actions">
        <button class="btn-outline" (click)="bulkPanel = bulkPanel === 'assignee' ? '' : 'assignee'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg> {{ 'pm.tasks.assignTo' | translate }}
        </button>
        <button class="btn-outline" (click)="bulkPanel = bulkPanel === 'status' ? '' : 'status'">{{ 'pm.tasks.changeStatus' | translate }}</button>
        <button class="btn-outline" (click)="bulkPanel = bulkPanel === 'priority' ? '' : 'priority'">{{ 'pm.tasks.changePriority' | translate }}</button>
        <button *appHasPermission="'task.delete'" class="btn-outline danger" (click)="bulkDelete()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> {{ 'pm.tasks.delete' | translate }}
        </button>
      </div>
      <div class="bulk-panel" *ngIf="bulkPanel">
        <select class="sel" [(ngModel)]="bulkValue">
          <ng-container *ngIf="bulkPanel === 'assignee'"><option value="">{{ 'pm.tasks.chooseMember' | translate }}</option><option *ngFor="let d of developersList" [value]="d.id">{{ d.firstName }} {{ d.lastName }}</option></ng-container>
          <ng-container *ngIf="bulkPanel === 'status'"><option value="">{{ 'pm.tasks.chooseStatus' | translate }}</option><option value="TODO">{{ 'pm.tasks.stTodo' | translate }}</option><option value="IN_PROGRESS">{{ 'pm.tasks.stInProgress' | translate }}</option><option value="ON_HOLD">{{ 'pm.tasks.stOnHold' | translate }}</option><option value="COMPLETED">{{ 'pm.tasks.stCompleted' | translate }}</option></ng-container>
          <ng-container *ngIf="bulkPanel === 'priority'"><option value="">{{ 'pm.tasks.choosePriority' | translate }}</option><option value="LOW">{{ 'pm.tasks.prioLow' | translate }}</option><option value="MEDIUM">{{ 'pm.tasks.prioMedium' | translate }}</option><option value="HIGH">{{ 'pm.tasks.prioHigh' | translate }}</option><option value="CRITICAL">{{ 'pm.tasks.prioCritical' | translate }}</option></ng-container>
        </select>
        <button class="btn-primary sm" (click)="applyBulk()" [disabled]="!bulkValue">{{ 'pm.tasks.apply' | translate }}</button>
      </div>
    </div>

    <!-- ═══ List view (table) ═══ -->
    <div class="list-card anim" *ngIf="view === 'list'">
      <div class="table-scroll">
        <table class="tk-table">
          <thead>
            <tr>
              <th class="cb"><input type="checkbox" [checked]="allSelected()" (change)="toggleAll($event)"></th>
              <th>{{ 'pm.tasks.colTitle' | translate }}</th><th>{{ 'pm.tasks.colProject' | translate }}</th><th>{{ 'pm.tasks.colAssignee' | translate }}</th><th>{{ 'pm.tasks.colPriority' | translate }}</th><th>{{ 'pm.tasks.colStatus' | translate }}</th><th>{{ 'pm.tasks.colDeadline' | translate }}</th><th>{{ 'pm.tasks.colProgress' | translate }}</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of filtered" class="tk-row" [class.overdue]="isOverdue(t)">
              <td class="cb"><input type="checkbox" [checked]="selected.includes(t.id!)" (change)="toggleSelect(t.id!)"></td>
              <td class="title">{{ t.name }}</td>
              <td><span class="proj-badge">{{ t.projectName || projectName(t.projectId) }}</span></td>
              <td>
                <div class="assignee">
                  <span class="avatar" [style.background]="avatarColor(t.assignedToName)">{{ initials(t.assignedToName) }}</span>
                  <span class="aname">{{ t.assignedToName || '—' }}</span>
                </div>
              </td>
              <td><span class="badge" [ngClass]="priorityInfo(t.priority).cls">{{ priorityInfo(t.priority).labelKey | translate }}</span></td>
              <td><span class="badge" [ngClass]="statusInfo(t).cls">{{ statusInfo(t).labelKey | translate }}</span></td>
              <td class="due" [class.late]="isOverdue(t)">
                <svg *ngIf="isOverdue(t)" class="warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                {{ t.deadline ? (t.deadline | date:'dd/MM/yyyy') : '—' }}
              </td>
              <td>
                <div class="prog"><div class="bar"><div class="bar-fill" [style.width.%]="animated ? (t.progress || 0) : 0"></div></div><span>{{ t.progress || 0 }}%</span></div>
              </td>
              <td class="actions">
                <button *appHasPermission="'task.edit'" class="icon-btn" [title]="'pm.tasks.edit' | translate" (click)="openEdit(t)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg></button>
                <button class="icon-btn" [title]="'pm.tasks.assign' | translate" (click)="openAssign(t)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg></button>
                <button *appHasPermission="'task.delete'" class="icon-btn danger" [title]="'pm.tasks.delete' | translate" (click)="deleteTask(t)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0"><td colspan="9"><div class="empty">{{ 'pm.tasks.emptyTasks' | translate }}</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ Kanban view ═══ -->
    <div class="kanban anim" *ngIf="view === 'kanban'">
      <div class="kan-col" *ngFor="let col of kanbanColumns">
        <div class="kan-head"><span class="badge" [ngClass]="col.cls">{{ col.labelKey | translate }}</span><span class="kan-count">{{ col.tasks.length }}</span></div>
        <div class="kan-list">
          <div class="kan-card" *ngFor="let t of col.tasks" (click)="openEdit(t)">
            <div class="kc-title">{{ t.name }}</div>
            <div class="kc-meta"><span class="proj-badge">{{ t.projectName || projectName(t.projectId) }}</span><span class="badge sm" [ngClass]="priorityInfo(t.priority).cls">{{ priorityInfo(t.priority).labelKey | translate }}</span></div>
            <div class="kc-foot"><span class="avatar sm" [style.background]="avatarColor(t.assignedToName)">{{ initials(t.assignedToName) }}</span><span class="due" [class.late]="isOverdue(t)">{{ t.deadline ? (t.deadline | date:'dd/MM') : '—' }}</span></div>
          </div>
          <div class="kan-empty" *ngIf="col.tasks.length === 0">—</div>
        </div>
      </div>
    </div>

    <!-- ═══ Calendar view ═══ -->
    <div class="cal-card anim" *ngIf="view === 'cal'">
      <div class="cal-head">
        <button class="nav" (click)="calShift(-1)" [attr.aria-label]="'pm.tasks.prevMonth' | translate">‹</button>
        <h3>{{ calLabel }}</h3>
        <button class="nav" (click)="calShift(1)" [attr.aria-label]="'pm.tasks.nextMonth' | translate">›</button>
        <span class="cal-legend">{{ 'pm.tasks.calLegend' | translate:{ count: projectsList.length } }}</span>
      </div>
      <div class="cal-grid">
        <div class="cal-dow" *ngFor="let d of dows">{{ d | translate }}</div>
        <div class="cal-cell" *ngFor="let c of calWeeks" [class.out]="!c.inMonth" [class.today]="c.isToday">
          <span class="cal-num">{{ c.day }}</span>
          <div class="cal-items">
            <span class="cal-pill" *ngFor="let p of c.items" [ngClass]="projStatusCls(p)" [title]="'pm.tasks.dueTooltip' | translate:{ name: p.name }" (click)="openProject(p)">{{ p.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ Create / Edit modal ═══ -->
  <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="m-head">
        <h3>{{ (modalMode === 'create' ? 'pm.tasks.titleCreate' : 'pm.tasks.titleEdit') | translate }}</h3>
        <button class="x" (click)="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
      <div class="m-body">
        <div class="fg"><label>{{ 'pm.tasks.fieldTitle' | translate }}</label><input type="text" [(ngModel)]="form.name" [placeholder]="'pm.tasks.phTitle' | translate"></div>
        <div class="fg"><label>{{ 'pm.tasks.fieldDescription' | translate }}</label><app-ai-describe [type]="'TASK'" [title]="form.name" (generated)="form.description = $event"></app-ai-describe><textarea rows="2" [(ngModel)]="form.description"></textarea></div>
        <div class="grid2">
          <div class="fg"><label>{{ 'pm.tasks.fieldProject' | translate }}</label><select [(ngModel)]="form.projectId"><option [ngValue]="undefined">{{ 'pm.tasks.selectPlaceholder' | translate }}</option><option *ngFor="let p of projectsList" [ngValue]="p.id">{{ p.name }}</option></select></div>
          <div class="fg"><label>{{ 'pm.tasks.fieldAssignee' | translate }}</label><select [(ngModel)]="form.assignedToId"><option [ngValue]="undefined">{{ 'pm.tasks.selectPlaceholder' | translate }}</option><option *ngFor="let d of developersList" [ngValue]="d.id">{{ d.firstName }} {{ d.lastName }}</option></select></div>
        </div>
        <div class="grid2">
          <div class="fg"><label>{{ 'pm.tasks.fieldPriority' | translate }}</label><select [(ngModel)]="form.priority"><option value="LOW">{{ 'pm.tasks.prioLow' | translate }}</option><option value="MEDIUM">{{ 'pm.tasks.prioMedium' | translate }}</option><option value="HIGH">{{ 'pm.tasks.prioHigh' | translate }}</option><option value="CRITICAL">{{ 'pm.tasks.prioCritical' | translate }}</option></select></div>
          <div class="fg"><label>{{ 'pm.tasks.fieldDifficulty' | translate }}</label><select [(ngModel)]="form.difficulty"><option value="EASY">{{ 'pm.tasks.diffEasy' | translate }}</option><option value="MEDIUM">{{ 'pm.tasks.diffMedium' | translate }}</option><option value="DIFFICULT">{{ 'pm.tasks.diffDifficult' | translate }}</option><option value="HARD">{{ 'pm.tasks.diffHard' | translate }}</option></select></div>
        </div>
        <div class="grid2">
          <div class="fg"><label>{{ 'pm.tasks.fieldStatus' | translate }}</label><select [(ngModel)]="form.status"><option value="TODO">{{ 'pm.tasks.stTodo' | translate }}</option><option value="IN_PROGRESS">{{ 'pm.tasks.stInProgress' | translate }}</option><option value="ON_HOLD">{{ 'pm.tasks.stOnHold' | translate }}</option><option value="COMPLETED">{{ 'pm.tasks.stCompleted' | translate }}</option></select></div>
          <div class="fg"><label>{{ 'pm.tasks.fieldDeadline' | translate }}</label><input type="date" [(ngModel)]="form.deadline"></div>
        </div>
        <div class="fg"><label>{{ 'pm.tasks.fieldProgress' | translate:{ value: (form.progress || 0) } }}</label><input type="range" min="0" max="100" step="5" [(ngModel)]="form.progress"></div>
      </div>
      <div class="m-foot">
        <button class="btn-ghost" (click)="closeModal()">{{ 'pm.tasks.cancel' | translate }}</button>
        <button class="btn-primary" (click)="submitTask()" [disabled]="submitting">{{ (modalMode === 'create' ? 'pm.tasks.createTask' : 'pm.tasks.save') | translate }}</button>
      </div>
    </div>
  </div>

  <!-- ═══ Assign modal ═══ -->
  <div class="modal-backdrop" *ngIf="showAssign" (click)="closeAssign()">
    <div class="modal sm" (click)="$event.stopPropagation()">
      <div class="m-head">
        <h3>{{ 'pm.tasks.assignTaskTitle' | translate }}</h3>
        <button class="x" (click)="closeAssign()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
      <div class="m-body">
        <p class="assign-task">{{ 'pm.tasks.taskLabel' | translate }} <strong>{{ assignTaskName }}</strong></p>
        <div class="member-list">
          <button class="member" *ngFor="let d of developersList" [class.on]="assignUserId === d.id" (click)="assignUserId = d.id">
            <span class="avatar" [style.background]="avatarColor(d.firstName + ' ' + d.lastName)">{{ initials(d.firstName + ' ' + d.lastName) }}</span>
            <span class="m-name">{{ d.firstName }} {{ d.lastName }}</span>
            <svg class="check" *ngIf="assignUserId === d.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
          <div class="empty" *ngIf="developersList.length === 0">{{ 'pm.tasks.noCollaborators' | translate }}</div>
        </div>
      </div>
      <div class="m-foot">
        <button class="btn-ghost" (click)="closeAssign()">{{ 'pm.tasks.cancel' | translate }}</button>
        <button class="btn-primary" (click)="confirmAssign()" [disabled]="!assignUserId || submitting">{{ 'pm.tasks.assign' | translate }}</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .tk-wrap { display: flex; flex-direction: column; gap: 16px; }
    @keyframes tFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .anim { animation: tFade .4s ease both; }

    .toolbar { display: flex; flex-direction: row; align-items: center; gap: 12px; flex-wrap: wrap; }
    .search { position: relative; flex: 0 1 240px; min-width: 150px; }
    .search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #94a3b8; }
    .search input { width: 100%; height: 38px; padding: 0 12px 0 34px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #1e293b; outline: none; background: #fff; }
    .search input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    /* All filters (search + 4 selects) on a single row */
    .filters { display: flex; flex-wrap: nowrap; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; overflow-x: auto; padding-bottom: 2px; }
    .sel { height: 38px; padding: 0 30px 0 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 12.5px; font-weight: 500; color: #475569; background: #fff; cursor: pointer; outline: none; appearance: none; -webkit-appearance: none; max-width: 170px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; }
    .toolbar-right { display: flex; align-items: center; gap: 10px; }
    @media (min-width: 1024px) { .toolbar-right { margin-left: auto; } }
    .view-toggle { display: inline-flex; padding: 2px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
    .view-toggle button { display: inline-flex; align-items: center; gap: 5px; height: 32px; padding: 0 11px; border: none; background: none; border-radius: 8px; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; }
    .view-toggle button svg { width: 13px; height: 13px; } .view-toggle button.on { background: #2563eb; color: #fff; }

    .btn-primary { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 15px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-primary.sm { height: 32px; padding: 0 12px; font-size: 12px; } .btn-primary svg { width: 15px; height: 15px; } .btn-primary:hover { background: #1d4ed8; } .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-ghost { height: 38px; padding: 0 14px; border: none; background: none; border-radius: 10px; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-ghost:hover { background: #f1f5f9; }
    .btn-outline { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 11px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; color: #475569; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-outline svg { width: 13px; height: 13px; } .btn-outline:hover { background: #f8fafc; } .btn-outline.danger { color: #dc2626; border-color: rgba(220,38,38,.3); }

    /* Bulk bar */
    .bulk-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: rgba(37,99,235,.07); border: 1px solid rgba(37,99,235,.25); border-radius: 12px; padding: 10px 14px; }
    .bulk-count { font-size: 13px; font-weight: 700; color: #1e293b; }
    .bulk-actions { margin-left: auto; display: flex; flex-wrap: wrap; gap: 8px; }
    .bulk-panel { width: 100%; display: flex; gap: 8px; align-items: center; }

    /* Table */
    .list-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
    /* Fixed layout so all columns always fit the card at any width/zoom — columns shrink and
       long text truncates/wraps instead of forcing a horizontal scrollbar. */
    .table-scroll { overflow-x: hidden; }
    .tk-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
    .tk-table thead { background: #f8fafc; }
    .tk-table th { text-align: left; padding: 11px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tk-table td { padding: 11px 12px; border-top: 1px solid #eef2f7; color: #475569; vertical-align: middle; overflow: hidden; }
    .tk-table th.cb, .tk-table td.cb { width: 40px; text-align: center; }
    /* Proportional column widths (checkbox + actions are fixed px, the rest share the remainder). */
    .tk-table th:nth-child(2), .tk-table td:nth-child(2) { width: 22%; }   /* Title */
    .tk-table th:nth-child(3), .tk-table td:nth-child(3) { width: 13%; }   /* Project */
    .tk-table th:nth-child(4), .tk-table td:nth-child(4) { width: 15%; }   /* Assignee */
    .tk-table th:nth-child(5), .tk-table td:nth-child(5) { width: 9%; }    /* Priority */
    .tk-table th:nth-child(6), .tk-table td:nth-child(6) { width: 11%; }   /* Status */
    .tk-table th:nth-child(7), .tk-table td:nth-child(7) { width: 11%; }   /* Deadline */
    .tk-table th:nth-child(8), .tk-table td:nth-child(8) { width: 12%; }   /* Progress */
    .tk-table th:nth-child(9), .tk-table td:nth-child(9) { width: 86px; }  /* Actions */
    /* Title wraps (keeps all its text); Project/Assignee truncate with an ellipsis. */
    .tk-table td.title { white-space: normal; overflow-wrap: anywhere; }
    /* Hide the least-critical columns first on tight widths so the rest stay readable (no scroll). */
    @media (max-width: 980px) { .tk-table th:nth-child(8), .tk-table td:nth-child(8) { display: none; } }
    @media (max-width: 760px) { .tk-table th:nth-child(7), .tk-table td:nth-child(7) { display: none; } }
    .tk-table input[type=checkbox] { width: 15px; height: 15px; accent-color: #2563eb; cursor: pointer; }
    .tk-row:hover { background: #f8fafc; }
    .tk-row.overdue { background: rgba(220,38,38,.05); }
    .tk-row.overdue:hover { background: rgba(220,38,38,.09); }
    .title { font-weight: 600; color: #1e293b; }
    .proj-badge { display: inline-block; max-width: 100%; font-size: 11px; font-weight: 500; color: #2563eb; background: rgba(37,99,235,.1); padding: 2px 8px; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
    .assignee { display: flex; align-items: center; gap: 7px; min-width: 0; }
    .avatar { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .avatar.sm { width: 22px; height: 22px; font-size: 9px; }
    .aname { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badge { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; white-space: nowrap; }
    .badge.sm { font-size: 9.5px; padding: 2px 7px; }
    .st-muted { background: #eef2f7; color: #64748b; } .st-blue { background: rgba(37,99,235,.1); color: #2563eb; }
    .st-amber { background: rgba(217,119,6,.14); color: #d97706; } .st-green { background: rgba(22,163,74,.12); color: #16a34a; } .st-red { background: rgba(220,38,38,.1); color: #dc2626; }
    .pr-slate { background: #eef2f7; color: #64748b; } .pr-blue { background: rgba(37,99,235,.1); color: #2563eb; } .pr-amber { background: rgba(217,119,6,.14); color: #d97706; } .pr-red { background: rgba(220,38,38,.1); color: #dc2626; }
    .due { font-size: 12px; color: #64748b; white-space: nowrap; } .due.late { color: #dc2626; font-weight: 600; } .due .warn { width: 13px; height: 13px; vertical-align: -2px; margin-right: 2px; }
    .prog { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .bar { flex: 1 1 auto; min-width: 32px; max-width: 80px; height: 6px; border-radius: 9999px; background: #eef2f7; overflow: hidden; } .bar-fill { height: 100%; background: linear-gradient(90deg,#2563eb,#1e3a8a); border-radius: 9999px; transition: width .8s cubic-bezier(.4,0,.2,1); }
    .prog span { flex-shrink: 0; }
    .actions { white-space: nowrap; opacity: 0; transition: opacity .15s ease; } .tk-row:hover .actions { opacity: 1; }
    .icon-btn { width: 28px; height: 28px; border: none; background: none; border-radius: 7px; color: #64748b; cursor: pointer; display: inline-grid; place-items: center; } .icon-btn svg { width: 14px; height: 14px; } .icon-btn:hover { background: #eef2f7; color: #1e293b; } .icon-btn.danger:hover { background: rgba(220,38,38,.1); color: #dc2626; }
    .empty { padding: 32px; text-align: center; color: #94a3b8; font-size: 13px; }

    /* Kanban */
    .kanban { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    @media (max-width: 600px) { .kanban { grid-template-columns: 1fr; } }
    .kan-col { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; min-width: 0; }
    .kc-title { overflow-wrap: anywhere; }
    .kan-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .kan-count { font-size: 12px; font-weight: 700; color: #94a3b8; }
    .kan-list { display: flex; flex-direction: column; gap: 8px; min-height: 40px; }
    .kan-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 11px; cursor: pointer; transition: box-shadow .15s ease; }
    .kan-card:hover { box-shadow: 0 4px 12px rgba(15,23,42,.1); }
    .kc-title { font-size: 13px; font-weight: 600; color: #1e293b; }
    .kc-meta { display: flex; align-items: center; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
    .kc-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
    .kan-empty { text-align: center; color: #cbd5e1; font-size: 12px; padding: 8px; }
    .cal-empty { padding: 40px; text-align: center; color: #64748b; font-size: 13.5px; } .cal-empty a { color: #2563eb; font-weight: 600; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 560px; background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); max-height: calc(100vh - 48px); overflow-y: auto; }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 10px; }
    .m-head h3 { font-size: 16.5px; font-weight: 700; color: #1e293b; margin: 0; }
    .x { width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; color: #64748b; display: grid; place-items: center; } .x svg { width: 15px; height: 15px; }
    .m-body { padding: 8px 22px; display: flex; flex-direction: column; gap: 13px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fg { display: flex; flex-direction: column; gap: 6px; }
    .fg label { font-size: 12px; font-weight: 700; color: #475569; }
    .fg input, .fg textarea, .fg select { width: 100%; padding: 9px 11px; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 13px; font-family: inherit; color: #1e293b; outline: none; background: #fff; }
    .fg input[type=range] { padding: 0; }
    .fg input:focus, .fg textarea:focus, .fg select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .m-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 22px 20px; }
    .modal.sm { max-width: 440px; }

    /* Keep selects compact so the filters fit one row */
    .filters .sel { flex: 0 0 auto; width: 140px; }

    /* Assign modal */
    .assign-task { font-size: 13px; color: #475569; margin: 0 0 4px; }
    .member-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
    .member { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 11px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; cursor: pointer; font-family: inherit; text-align: left; transition: all .15s ease; }
    .member:hover { background: #f8fafc; }
    .member.on { border-color: #2563eb; background: rgba(37,99,235,.06); }
    .member .m-name { font-size: 13px; font-weight: 600; color: #1e293b; flex: 1; }
    .member .check { width: 16px; height: 16px; color: #2563eb; }

    /* Calendar */
    .cal-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 16px; }
    .cal-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .cal-head h3 { font-size: 15px; font-weight: 700; color: #1e293b; margin: 0; text-transform: capitalize; min-width: 150px; text-align: center; }
    .cal-head .nav { width: 32px; height: 32px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; font-size: 17px; line-height: 1; color: #475569; }
    .cal-head .nav:hover { background: #f1f5f9; }
    .cal-legend { margin-left: auto; font-size: 12px; color: #94a3b8; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .cal-dow { text-align: center; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; padding-bottom: 4px; }
    .cal-cell { min-height: 86px; border: 1px solid #eef2f7; border-radius: 8px; padding: 5px; background: #fff; display: flex; flex-direction: column; gap: 3px; }
    .cal-cell.out { background: #f8fafc; opacity: .55; }
    .cal-cell.today { border-color: #2563eb; box-shadow: inset 0 0 0 1px rgba(37,99,235,.35); }
    .cal-num { font-size: 11px; font-weight: 600; color: #64748b; }
    .cal-items { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
    .cal-pill { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 5px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `]
})
export class PmTasksComponent implements OnInit {
  managerId = 0;
  projectsList: Project[] = [];
  developersList: User[] = [];
  allTasks: Task[] = [];
  filtered: Task[] = [];
  loading = true;
  animated = false;

  view: 'list' | 'kanban' | 'cal' = 'list';
  searchTerm = '';
  projectFilter = '';
  assigneeFilter = '';
  priorityFilter = '';
  statusFilter = '';

  selected: number[] = [];
  bulkPanel: '' | 'assignee' | 'status' | 'priority' = '';
  bulkValue = '';

  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  submitting = false;
  selectedTaskId: number | null = null;
  form: TaskRequest = this.blankForm();

  // Quick-assign modal
  showAssign = false;
  assignTaskId: number | null = null;
  assignTaskName = '';
  assignUserId: number | undefined = undefined;

  // Calendar
  calRef: Date = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
  dows = ['pm.tasks.dowMon', 'pm.tasks.dowTue', 'pm.tasks.dowWed', 'pm.tasks.dowThu', 'pm.tasks.dowFri', 'pm.tasks.dowSat', 'pm.tasks.dowSun'];

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private translate: TranslateService
  ) {}

  /** Date-format locale follows the active UI language. */
  private dateLocale(): string {
    return this.translate.currentLang() === 'en' ? 'en-GB' : 'fr-FR';
  }

  ngOnInit(): void {
    this.managerId = this.authService.getCurrentUser()?.id || 0;
    this.loadInitial();
    setTimeout(() => { this.animated = true; this.cdr.detectChanges(); }, 90);
  }

  private blankForm(): TaskRequest {
    return { name: '', description: '', projectId: undefined, assignedToId: undefined, priority: 'MEDIUM', difficulty: 'MEDIUM', status: 'TODO', progress: 0, deadline: '', reminderType: 'NONE' };
  }

  private loadInitial(): void {
    this.projectService.getProjectsByManager(this.managerId, 0, 100).subscribe({
      next: (r: any) => { this.projectsList = r && r.data ? r.data : []; this.loadDevelopers(); },
      error: () => { this.projectsList = []; this.loadDevelopers(); }
    });
  }
  private loadDevelopers(): void {
    this.userService.getUsersByRole('USER', 0, 100).subscribe({
      next: (r: any) => { this.developersList = r && r.data ? r.data : []; this.loadTasks(); },
      error: () => { this.developersList = []; this.loadTasks(); }
    });
  }
  loadTasks(): void {
    this.loading = true;
    this.taskService.getAllTasks(0, 300).subscribe({
      next: (r: any) => {
        const all: Task[] = r && r.data ? r.data : [];
        const ids = this.projectsList.map(p => p.id);
        // Strictly scope to this PM's own projects — no project means no tasks (never fall back to all).
        this.allTasks = all.filter(t => ids.includes(t.projectId));
        this.applyFilters(); this.loading = false; this.cdr.detectChanges();
      },
      error: () => { this.allTasks = []; this.applyFilters(); this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilters(): void {
    let r = [...this.allTasks];
    if (this.searchTerm.trim()) {
      const t = this.searchTerm.toLowerCase().trim();
      r = r.filter(x => x.name.toLowerCase().includes(t) || (x.description || '').toLowerCase().includes(t));
    }
    if (this.projectFilter) r = r.filter(x => x.projectId === +this.projectFilter);
    if (this.assigneeFilter) r = r.filter(x => x.assignedToId === +this.assigneeFilter);
    if (this.priorityFilter) r = r.filter(x => (x.priority || '') === this.priorityFilter);
    if (this.statusFilter) r = r.filter(x => this.normStatus(x.status) === this.statusFilter);
    this.filtered = r;
    this.selected = this.selected.filter(id => r.some(x => x.id === id));
  }

  private normStatus(s?: string): string {
    const up = (s || '').toUpperCase();
    return up === 'PLANNED' ? 'TODO' : up;
  }

  get kanbanColumns() {
    const cols = [
      { key: 'TODO', labelKey: 'pm.tasks.stTodo', cls: 'st-muted' },
      { key: 'IN_PROGRESS', labelKey: 'pm.tasks.stInProgress', cls: 'st-blue' },
      { key: 'ON_HOLD', labelKey: 'pm.tasks.stOnHold', cls: 'st-amber' },
      { key: 'COMPLETED', labelKey: 'pm.tasks.stCompleted', cls: 'st-green' }
    ];
    return cols.map(c => ({ ...c, tasks: this.filtered.filter(t => this.normStatus(t.status) === c.key) }));
  }

  // ─── Selection ───
  toggleSelect(id: number): void {
    this.selected = this.selected.includes(id) ? this.selected.filter(x => x !== id) : [...this.selected, id];
  }
  allSelected(): boolean { return this.filtered.length > 0 && this.filtered.every(t => this.selected.includes(t.id!)); }
  toggleAll(e: Event): void {
    this.selected = (e.target as HTMLInputElement).checked ? this.filtered.map(t => t.id!) : [];
  }

  // ─── Bulk actions ───
  applyBulk(): void {
    if (!this.bulkValue || this.selected.length === 0) return;
    const tasks = this.allTasks.filter(t => this.selected.includes(t.id!));
    const ops = tasks.map(t => {
      if (this.bulkPanel === 'status') {
        const prog = this.bulkValue === 'COMPLETED' ? 100 : (t.progress || 0);
        return this.taskService.updateTaskProgress(t.id!, prog, this.bulkValue);
      }
      const req = this.toReq(t);
      if (this.bulkPanel === 'assignee') req.assignedToId = +this.bulkValue;
      if (this.bulkPanel === 'priority') req.priority = this.bulkValue;
      return this.taskService.updateTask(t.id!, req);
    });
    forkJoin(ops).subscribe({
      next: () => this.afterBulk(),
      error: () => { this.toast.show(this.translate.instant('pm.tasks.toastBulkUpdateFailed'), 'error'); this.loadTasks(); }
    });
  }
  private afterBulk(): void {
    this.toast.show(this.translate.instant('pm.tasks.toastBulkUpdated'), 'success');
    this.bulkPanel = ''; this.bulkValue = ''; this.selected = [];
    this.loadTasks();
  }
  bulkDelete(): void {
    if (this.selected.length === 0) return;
    const count = this.selected.length;
    const ops = this.selected.map(id => this.taskService.deleteTask(id));
    forkJoin(ops).subscribe({
      next: () => { this.toast.show(this.translate.instant('pm.tasks.toastDeletedCount', { count }), 'success'); this.selected = []; this.loadTasks(); },
      error: () => { this.toast.show(this.translate.instant('pm.tasks.toastDeleteFailed'), 'error'); this.loadTasks(); }
    });
  }

  // ─── Quick assign ───
  openAssign(t: Task): void {
    this.assignTaskId = t.id || null;
    this.assignTaskName = t.name;
    this.assignUserId = t.assignedToId;
    this.showAssign = true;
  }
  closeAssign(): void { this.showAssign = false; this.assignTaskId = null; }
  confirmAssign(): void {
    if (!this.assignTaskId || !this.assignUserId) return;
    const task = this.allTasks.find(t => t.id === this.assignTaskId);
    if (!task) { this.closeAssign(); return; }
    const req = this.toReq(task);
    req.assignedToId = this.assignUserId;
    this.submitting = true;
    this.taskService.updateTask(this.assignTaskId, req).subscribe({
      next: () => { this.submitting = false; this.showAssign = false; this.toast.show(this.translate.instant('pm.tasks.toastAssigned'), 'success'); this.loadTasks(); },
      error: () => { this.submitting = false; this.toast.show(this.translate.instant('pm.tasks.toastAssignFailed'), 'error'); }
    });
  }

  // ─── Calendar ───
  get calLabel(): string {
    const s = this.calRef.toLocaleDateString(this.dateLocale(), { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  calShift(delta: number): void {
    this.calRef = new Date(this.calRef.getFullYear(), this.calRef.getMonth() + delta, 1);
  }
  get calWeeks(): { day: number; inMonth: boolean; isToday: boolean; items: Project[] }[] {
    const year = this.calRef.getFullYear(), month = this.calRef.getMonth();
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday = 0
    const gridStart = new Date(year, month, 1 - startDow);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); d.setHours(0, 0, 0, 0);
      const items = this.projectsList.filter(p => p.endDate && sameDay(new Date(p.endDate), d));
      cells.push({ day: d.getDate(), inMonth: d.getMonth() === month, isToday: d.getTime() === today.getTime(), items });
    }
    return cells;
  }
  projStatusCls(p: Project): string {
    const s = (p.status || '').toUpperCase();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (s !== 'COMPLETED' && p.endDate && new Date(p.endDate) < today) return 'st-red';
    if (s === 'COMPLETED') return 'st-green';
    if (s === 'ON_HOLD') return 'st-amber';
    if (s === 'IN_PROGRESS' || s === 'ACTIVE') return 'st-blue';
    return 'st-muted';
  }
  openProject(p: Project): void { if (p.id) this.router.navigate(['/pm/projects', p.id]); }

  // ─── Create / Edit ───
  openCreate(): void {
    this.modalMode = 'create';
    this.selectedTaskId = null;
    this.form = this.blankForm();
    this.form.projectId = this.projectsList[0]?.id;
    this.form.assignedToId = this.developersList[0]?.id;
    this.showModal = true;
  }
  openEdit(t: Task): void {
    this.modalMode = 'edit';
    this.selectedTaskId = t.id || null;
    this.form = this.toReq(t);
    this.showModal = true;
  }
  closeModal(): void { this.showModal = false; }

  private toReq(t: Task): TaskRequest {
    return {
      name: t.name, description: t.description || '', projectId: t.projectId, assignedToId: t.assignedToId,
      priority: t.priority || 'MEDIUM', difficulty: t.difficulty || 'MEDIUM', status: t.status || 'TODO',
      progress: t.progress || 0, deadline: t.deadline || '', reminderType: t.reminderType || 'NONE'
    };
  }

  submitTask(): void {
    if (!this.form.name?.trim() || !this.form.projectId || !this.form.assignedToId || !this.form.deadline) {
      this.toast.show(this.translate.instant('pm.tasks.toastRequiredFields'), 'error');
      return;
    }
    this.submitting = true;
    const obs = this.modalMode === 'create'
      ? this.taskService.createTask(this.form)
      : this.taskService.updateTask(this.selectedTaskId!, this.form);
    obs.subscribe({
      next: (t: any) => {
        this.submitting = false; this.showModal = false;
        this.toast.show(this.modalMode === 'create' ? this.translate.instant('pm.tasks.toastCreated', { name: t?.name || this.form.name }) : this.translate.instant('pm.tasks.toastUpdated'), 'success');
        this.loadTasks();
      },
      error: () => { this.submitting = false; this.toast.show(this.translate.instant('pm.tasks.toastSaveFailed'), 'error'); }
    });
  }

  deleteTask(t: Task): void {
    if (!t.id) return;
    this.taskService.deleteTask(t.id).subscribe({
      next: () => { this.toast.show(this.translate.instant('pm.tasks.toastDeleted'), 'success'); this.loadTasks(); },
      error: () => { this.toast.show(this.translate.instant('pm.tasks.toastTaskDeleteFailed'), 'error'); }
    });
  }

  // ─── Helpers ───
  isOverdue(t: Task): boolean {
    if (!t.deadline || this.normStatus(t.status) === 'COMPLETED') return false;
    const d = new Date(t.deadline); const today = new Date(); today.setHours(0, 0, 0, 0);
    return d < today;
  }
  projectName(id?: number): string { return this.projectsList.find(p => p.id === id)?.name || '—'; }
  statusInfo(t: Task): { labelKey: string; cls: string } {
    if (this.isOverdue(t)) return { labelKey: 'pm.tasks.stOverdue', cls: 'st-red' };
    const map: Record<string, { labelKey: string; cls: string }> = {
      TODO: { labelKey: 'pm.tasks.stTodo', cls: 'st-muted' },
      IN_PROGRESS: { labelKey: 'pm.tasks.stInProgress', cls: 'st-blue' },
      ON_HOLD: { labelKey: 'pm.tasks.stOnHold', cls: 'st-amber' },
      COMPLETED: { labelKey: 'pm.tasks.stCompleted', cls: 'st-green' },
      OVERDUE: { labelKey: 'pm.tasks.stOverdue', cls: 'st-red' }
    };
    return map[this.normStatus(t.status)] || { labelKey: 'pm.tasks.stTodo', cls: 'st-muted' };
  }
  priorityInfo(p?: string): { labelKey: string; cls: string } {
    const map: Record<string, { labelKey: string; cls: string }> = {
      LOW: { labelKey: 'pm.tasks.prioLow', cls: 'pr-slate' },
      MEDIUM: { labelKey: 'pm.tasks.prioMedium', cls: 'pr-blue' },
      HIGH: { labelKey: 'pm.tasks.prioHigh', cls: 'pr-amber' },
      CRITICAL: { labelKey: 'pm.tasks.prioCritical', cls: 'pr-red' }
    };
    return map[(p || '').toUpperCase()] || { labelKey: 'pm.tasks.prioMedium', cls: 'pr-blue' };
  }
  initials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || 'U';
  }
  avatarColor(name?: string): string {
    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
    const n = name || '?'; let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }
}
