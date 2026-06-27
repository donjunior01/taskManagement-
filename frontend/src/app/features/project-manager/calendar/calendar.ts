import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';
import { ProjectService, Project } from '../../../core/services/project.service';
import { TaskService, Task, TaskRequest } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { CalendarService, CalendarEvent as ApiEvent, CalendarSyncStatus } from '../../../core/services/calendar.service';
import { ToastService } from '../../../core/services/toast.service';

type ItemType = 'task' | 'milestone' | 'meeting' | 'overdue';
interface CalItem {
  id: string; date: Date; dateStr: string; name: string; type: ItemType; project: string; time?: string;
  eid?: number; tid?: number; pid?: number; rawEvent?: ApiEvent; rawTask?: Task; rawDesc?: string;
}
interface DayCell { date: Date; dateStr: string; day: number; inMonth: boolean; isToday: boolean; items: CalItem[]; }

@Component({
  selector: 'app-pm-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, AiDescribeButtonComponent, TranslatePipe],
  template: `
  <div class="cal-wrap">

    <!-- ═══ Top bar ═══ -->
    <div class="cal-top">
      <div class="nav">
        <button class="nav-btn" (click)="shift(-1)" [attr.aria-label]="'pm.calendar.prev' | translate">‹</button>
        <button class="today-btn" (click)="goToday()">{{ 'pm.calendar.today' | translate }}</button>
        <button class="nav-btn" (click)="shift(1)" [attr.aria-label]="'pm.calendar.next' | translate">›</button>
        <h2 class="period">{{ periodLabel }}</h2>
      </div>
      <div class="top-right">
        <div class="view-toggle">
          <button *ngFor="let v of views" [class.on]="view === v.key" (click)="view = v.key">{{ v.labelKey | translate }}</button>
        </div>
        <button class="btn-outline sync" (click)="importFromGoogle()" [disabled]="importing" [title]="'pm.calendar.importTitle' | translate">{{ 'pm.calendar.import' | translate }}</button>
        <button class="btn-outline sync" (click)="syncAllToGoogle()" [disabled]="syncing" [title]="'pm.calendar.syncTitle' | translate">{{ 'pm.calendar.sync' | translate }}</button>
        <button class="btn-primary" (click)="openCreate()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> {{ 'pm.calendar.createEvent' | translate }}
        </button>
      </div>
    </div>

    <!-- ═══ Filters ═══ -->
    <div class="cal-filters">
      <span class="fl-label">{{ 'pm.calendar.projectsLabel' | translate }}</span>
      <button class="proj-chip" *ngFor="let p of projectChips" [class.off]="!activeProjects.has(p.name)" (click)="toggleProject(p.name)">
        <span class="dot" [style.background]="p.color"></span>{{ p.name }}
      </button>
      <span class="divider">|</span>
      <label class="type-check" *ngFor="let t of typeOptions">
        <input type="checkbox" [checked]="typeFlags[t.key]" (change)="toggleType(t.key)"> {{ t.labelKey | translate }}
      </label>
    </div>

    <!-- ═══ Month grid ═══ -->
    <div class="cal-card anim" *ngIf="view === 'month'">
      <div class="dow-row"><div class="dow" *ngFor="let d of dows">{{ d }}</div></div>
      <div class="month-grid">
        <div class="cell" *ngFor="let c of monthCells; trackBy: trackCell" [class.out]="!c.inMonth" [class.past-cell]="isPastDate(c)" [class.drop-over]="dragOver === c.dateStr"
             (dragover)="onDragOver($event, c)" (dragleave)="onDragLeave(c)" (drop)="onDrop($event, c)">
          <span class="cell-num" [class.today]="c.isToday">{{ c.day }}</span>
          <div class="cell-items">
            <div class="ev-pill" *ngFor="let it of c.items; trackBy: trackItem" [ngClass]="'t-' + it.type" [class.locked]="!isDraggable(it)"
                 [attr.draggable]="isDraggable(it)" (dragstart)="onDragStart($event, it)" (dragend)="onDragEnd()"
                 (click)="handleClick(it)" [title]="it.name + ' · ' + it.project + (isDraggable(it) ? '' : ' · ' + ('pm.calendar.notDraggable' | translate))">
              <span *ngIf="it.type === 'milestone'">◆ </span>{{ it.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ List / Week / Day view ═══ -->
    <div class="cal-card anim" *ngIf="view !== 'month'">
      <div class="agenda">
        <div class="agenda-group" *ngFor="let g of agendaGroups">
          <div class="agenda-date">{{ g.label }}</div>
          <div class="agenda-item" *ngFor="let it of g.items" (click)="handleClick(it)">
            <span class="ev-dot" [ngClass]="'t-' + it.type"></span>
            <div class="ai-body">
              <div class="ai-name">{{ it.name }}</div>
              <div class="ai-meta">{{ typeLabel(it.type) | translate }} · {{ it.project }}<span *ngIf="it.time"> · {{ it.time }}</span></div>
            </div>
            <span class="ai-badge" [ngClass]="'t-' + it.type">{{ typeLabel(it.type) | translate }}</span>
          </div>
        </div>
        <div class="empty" *ngIf="agendaGroups.length === 0">{{ 'pm.calendar.noEvents' | translate }}</div>
      </div>
    </div>
  </div>

  <!-- ═══ Create event dialog ═══ -->
  <div class="modal-backdrop" *ngIf="showCreate" (click)="showCreate = false">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>{{ 'pm.calendar.newEvent' | translate }}</h3><button class="x" (click)="showCreate = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body">
        <div class="fg"><label>{{ 'pm.calendar.fieldTitle' | translate }}</label><input type="text" [(ngModel)]="form.title" [placeholder]="'pm.calendar.phTitle' | translate"></div>
        <div class="grid2">
          <div class="fg"><label>{{ 'pm.calendar.fieldType' | translate }}</label><select [(ngModel)]="form.type"><option value="meeting">{{ 'pm.calendar.optMeeting' | translate }}</option><option value="milestone">{{ 'pm.calendar.optMilestone' | translate }}</option><option value="reminder">{{ 'pm.calendar.optReminder' | translate }}</option></select></div>
          <div class="fg"><label>{{ 'pm.calendar.fieldProject' | translate }}</label><select [(ngModel)]="form.projectId"><option [ngValue]="undefined">{{ 'pm.calendar.none' | translate }}</option><option *ngFor="let p of projectsList" [ngValue]="p.id">{{ p.name }}</option></select></div>
        </div>
        <div class="grid2">
          <div class="fg"><label>{{ 'pm.calendar.fieldDate' | translate }}</label><input type="date" [(ngModel)]="form.date"></div>
          <div class="fg"><label>{{ 'pm.calendar.fieldTime' | translate }}</label><input type="time" [(ngModel)]="form.time"></div>
        </div>
        <div class="fg"><label>{{ 'pm.calendar.fieldAudience' | translate }}</label>
          <select [(ngModel)]="form.audience">
            <option value="PROJECT">{{ 'pm.calendar.audienceProject' | translate }}</option>
            <option value="SELF">{{ 'pm.calendar.audienceSelf' | translate }}</option>
          </select>
          <span class="hint">{{ 'pm.calendar.audienceHint' | translate }}</span>
        </div>
        <div class="fg"><label>{{ 'pm.calendar.fieldDescription' | translate }}</label><app-ai-describe [type]="'EVENT'" [title]="form.title" (generated)="form.description = $event"></app-ai-describe><textarea rows="3" [(ngModel)]="form.description"></textarea></div>
      </div>
      <div class="m-foot"><button class="btn-ghost" (click)="showCreate = false">{{ 'pm.calendar.cancel' | translate }}</button><button class="btn-primary" (click)="saveEvent()" [disabled]="saving">{{ 'pm.calendar.save' | translate }}</button></div>
    </div>
  </div>

  <!-- ═══ Event detail popup ═══ -->
  <div class="modal-backdrop" *ngIf="detail" (click)="detail = null">
    <div class="modal sm" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>{{ detail!.name }}</h3><button class="x" (click)="detail = null"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body">
        <div class="det-row"><span class="det-k">{{ 'pm.calendar.detType' | translate }}</span><span class="ai-badge" [ngClass]="'t-' + detail!.type">{{ typeLabel(detail!.type) | translate }}</span></div>
        <div class="det-row"><span class="det-k">{{ 'pm.calendar.detProject' | translate }}</span><span>{{ detail!.project }}</span></div>
        <div class="det-row"><span class="det-k">{{ 'pm.calendar.detDate' | translate }}</span><span>{{ longDateStr(detail!.date) }}</span></div>
        <div class="det-row" *ngIf="detail!.time"><span class="det-k">{{ 'pm.calendar.detTime' | translate }}</span><span>{{ detail!.time }}</span></div>
        <div class="det-desc" *ngIf="cleanDesc(detail!.rawDesc)">{{ cleanDesc(detail!.rawDesc) }}</div>
      </div>
      <div class="m-foot"><button class="btn-ghost" (click)="detail = null">{{ 'pm.calendar.close' | translate }}</button></div>
    </div>
  </div>
  `,
  styles: [`
    .cal-wrap { display: flex; flex-direction: column; gap: 14px; }
    @keyframes cFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .anim { animation: cFade .4s ease both; }

    .cal-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
    .nav { display: flex; align-items: center; gap: 8px; }
    .nav-btn { width: 32px; height: 32px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 8px; cursor: pointer; font-size: 17px; line-height: 1; color: var(--text-secondary); } .nav-btn:hover { background: var(--bg-subtle); }
    .today-btn { height: 32px; padding: 0 12px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 8px; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); cursor: pointer; } .today-btn:hover { background: var(--bg-subtle); }
    .period { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 0 8px; text-transform: capitalize; }
    .top-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .view-toggle { display: inline-flex; padding: 2px; border: 1px solid var(--border); border-radius: 9px; background: var(--bg-card); }
    .view-toggle button { height: 30px; padding: 0 12px; border: none; background: none; border-radius: 7px; font-size: 12px; font-weight: 600; color: var(--text-muted); cursor: pointer; font-family: inherit; }
    .view-toggle button.on { background: #2563eb; color: #fff; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border: none; border-radius: 9px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-primary svg { width: 15px; height: 15px; } .btn-primary:hover { background: #1d4ed8; } .btn-primary:disabled { opacity: .6; }
    .btn-outline.sync { height: 36px; padding: 0 11px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 9px; font-size: 12px; font-weight: 600; color: var(--text-secondary); cursor: pointer; font-family: inherit; } .btn-outline.sync:hover { background: var(--bg-subtle); } .btn-outline.sync:disabled { opacity: .5; }
    .btn-ghost { height: 36px; padding: 0 14px; border: none; background: none; border-radius: 9px; color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-ghost:hover { background: var(--bg-subtle); }

    .cal-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .fl-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .proj-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 9999px; background: var(--bg-card); border: 1px solid var(--border); font-size: 11px; font-weight: 600; color: var(--text-primary); cursor: pointer; }
    .proj-chip .dot { width: 8px; height: 8px; border-radius: 3px; } .proj-chip.off { opacity: .4; }
    .divider { color: var(--border-strong); margin: 0 2px; }
    .type-check { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-secondary); cursor: pointer; } .type-check input { width: 13px; height: 13px; accent-color: #2563eb; }

    .cal-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
    .dow-row { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--border); background: var(--bg-muted); }
    .dow { padding: 9px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
    .month-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .cell { min-height: 104px; border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); padding: 6px; transition: background .12s ease; }
    .cell.out { background: var(--bg-muted); color: var(--border-strong); } .cell.drop-over { background: rgba(37,99,235,.08); box-shadow: inset 0 0 0 2px #2563eb; }
    .cell-num { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; }
    .cell-num.today { background: #2563eb; color: #fff; }
    .cell-items { display: flex; flex-direction: column; gap: 3px; }
    .ev-pill { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 2px solid; cursor: pointer; }
    .ev-pill[draggable=true] { cursor: grab; } .ev-pill[draggable=true]:active { cursor: grabbing; }
    .ev-pill.locked { cursor: pointer; opacity: .6; }
    .cell.past-cell { background: var(--bg-muted); }
    .ev-pill.t-task { background: rgba(37,99,235,.14); color: var(--text-brand); border-color: #2563eb; }
    .ev-pill.t-milestone { background: rgba(168,85,247,.16); color: #a855f7; border-color: #a855f7; }
    .ev-pill.t-meeting { background: rgba(245,158,11,.15); color: var(--warning-text); border-color: #f59e0b; }
    .ev-pill.t-overdue { background: rgba(220,38,38,.1); color: var(--danger-text); border-color: #ef4444; }

    .agenda { padding: 8px 0; }
    .agenda-date { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); padding: 8px 18px; background: var(--bg-muted); }
    .agenda-item { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-top: 1px solid var(--border-light); cursor: pointer; }
    .agenda-item:hover { background: var(--bg-muted); }
    .ev-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .ev-dot.t-task { background: #2563eb; } .ev-dot.t-milestone { background: #a855f7; } .ev-dot.t-meeting { background: #f59e0b; } .ev-dot.t-overdue { background: #ef4444; }
    .ai-body { flex: 1; min-width: 0; } .ai-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); } .ai-meta { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
    .ai-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; white-space: nowrap; }
    .ai-badge.t-task { background: rgba(37,99,235,.1); color: #2563eb; } .ai-badge.t-milestone { background: rgba(139,92,246,.16); color: var(--tint-violet-text); } .ai-badge.t-meeting { background: rgba(245,158,11,.15); color: var(--warning-text); } .ai-badge.t-overdue { background: rgba(220,38,38,.1); color: var(--danger-text); }
    .empty { padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 520px; background: var(--bg-card); border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); max-height: calc(100vh - 48px); overflow-y: auto; } .modal.sm { max-width: 420px; }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 10px; } .m-head h3 { font-size: 16.5px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .x { width: 32px; height: 32px; border: none; background: var(--bg-subtle); border-radius: 8px; cursor: pointer; color: var(--text-muted); display: grid; place-items: center; } .x svg { width: 15px; height: 15px; }
    .m-body { padding: 8px 22px; display: flex; flex-direction: column; gap: 13px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fg { display: flex; flex-direction: column; gap: 6px; } .fg label { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
    .fg input, .fg textarea, .fg select { width: 100%; padding: 9px 11px; border: 1px solid var(--border); border-radius: 9px; font-size: 13px; font-family: inherit; color: var(--text-primary); outline: none; background: var(--bg-card); }
    .fg input:focus, .fg textarea:focus, .fg select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .m-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 22px 20px; }
    .det-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); } .det-k { width: 70px; font-weight: 700; color: var(--text-muted); font-size: 11.5px; text-transform: uppercase; }
    .det-desc { font-size: 13px; color: var(--text-secondary); background: var(--bg-muted); border-radius: 10px; padding: 10px 12px; }
  `]
})
export class PmCalendarComponent implements OnInit {
  managerId = 0;
  projectsList: Project[] = [];
  items: CalItem[] = [];
  loading = true;

  view: 'month' | 'week' | 'day' | 'list' = 'month';
  views = [{ key: 'month' as const, labelKey: 'pm.calendar.viewMonth' }, { key: 'week' as const, labelKey: 'pm.calendar.viewWeek' }, { key: 'day' as const, labelKey: 'pm.calendar.viewDay' }, { key: 'list' as const, labelKey: 'pm.calendar.viewList' }];
  ref: Date = new Date();
  selectedDate: Date = new Date();

  /** Localized short weekday names (Mon→Sun), derived from the active UI language. */
  get dows(): string[] {
    const base = new Date(2024, 0, 1); // a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() + i);
      const s = d.toLocaleDateString(this.dateLocale(), { weekday: 'short' });
      return s.charAt(0).toUpperCase() + s.slice(1).replace('.', '');
    });
  }

  typeOptions = [{ key: 'task' as ItemType, labelKey: 'pm.calendar.typeTask' }, { key: 'milestone' as ItemType, labelKey: 'pm.calendar.typeMilestone' }, { key: 'meeting' as ItemType, labelKey: 'pm.calendar.typeMeeting' }, { key: 'overdue' as ItemType, labelKey: 'pm.calendar.typeOverdue' }];
  typeFlags: Record<ItemType, boolean> = { task: true, milestone: true, meeting: true, overdue: true };
  projectChips: { name: string; color: string }[] = [];
  activeProjects = new Set<string>();

  showCreate = false;
  saving = false;
  form = { title: '', type: 'meeting', projectId: undefined as number | undefined, date: '', time: '09:00', audience: 'PROJECT', description: '' };
  detail: CalItem | null = null;

  dragged: CalItem | null = null;
  dragOver: string | null = null;

  syncStatus: CalendarSyncStatus | null = null;
  syncing = false;
  importing = false;

  private palette = ['#2D6BE4', '#A855F7', '#22C55E', '#EF4444', '#F97316', '#0891b2', '#d97706'];

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private calendarService: CalendarService,
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
    this.loadAll();
  }

  private loadAll(): void {
    this.loading = true;
    this.projectService.getProjectsByManager(this.managerId, 0, 100).subscribe({
      next: (r: any) => { this.projectsList = r && r.data ? r.data : []; this.loadRest(); },
      error: () => { this.projectsList = []; this.loadRest(); }
    });
  }

  private loadRest(): void {
    const pids = this.projectsList.map(p => p.id).filter(Boolean) as number[];
    const nameById: Record<number, string> = {};
    this.projectsList.forEach(p => { if (p.id != null) nameById[p.id] = p.name; });

    forkJoin({
      tasks: this.taskService.getAllTasks(0, 500),
      // Only the PM's own event copies — distributed events store one copy per recipient, so
      // getAllEvents() would show the same event once per member on the PM calendar.
      events: this.calendarService.getUserEvents()
    }).subscribe({
      next: ({ tasks, events }: any) => {
        const taskList: Task[] = tasks && tasks.data ? tasks.data : [];
        const evList: ApiEvent[] = Array.isArray(events) ? events : (events && events.data ? events.data : []);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const items: CalItem[] = [];

        taskList.filter(t => pids.includes(t.projectId!)).forEach(t => {
          if (!t.deadline) return;
          const d = new Date(t.deadline); if (isNaN(d.getTime())) return;
          const overdue = (t.status || '').toUpperCase() !== 'COMPLETED' && d < today;
          items.push({ id: 'task-' + t.id, date: d, dateStr: this.iso(d), name: t.name, type: overdue ? 'overdue' : 'task', project: t.projectName || nameById[t.projectId!] || this.translate.instant('pm.calendar.projectFallback'), tid: t.id, pid: t.projectId, rawTask: t });
        });
        this.projectsList.forEach(p => {
          if (!p.endDate) return;
          const d = new Date(p.endDate); if (isNaN(d.getTime())) return;
          items.push({ id: 'proj-' + p.id, date: d, dateStr: this.iso(d), name: this.translate.instant('pm.calendar.deadlinePrefix', { name: p.name }), type: 'milestone', project: p.name, pid: p.id });
        });
        evList.forEach(e => {
          const d = new Date(e.startTime); if (isNaN(d.getTime())) return;
          // Task-deadline events are already represented by the derived task items — skip them.
          if ((e.title || '').startsWith('Task Due:')) return;
          const meta = this.parseMeta(e.description);
          const projName = e.projectId != null ? (nameById[e.projectId] || meta.proj) : meta.proj;
          items.push({ id: 'evt-' + e.id, date: d, dateStr: this.iso(d), name: e.title, type: meta.type, project: projName || this.translate.instant('pm.calendar.generalFallback'), time: d.toLocaleTimeString(this.dateLocale(), { hour: '2-digit', minute: '2-digit' }), eid: e.id, pid: e.projectId, rawEvent: e, rawDesc: e.description });
        });

        this.items = items;
        const names = Array.from(new Set(items.map(i => i.project).filter(Boolean)));
        this.projectChips = names.map((n, i) => ({ name: n, color: this.palette[i % this.palette.length] }));
        this.activeProjects = new Set(names);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.items = []; this.loading = false; this.cdr.detectChanges(); }
    });
    this.calendarService.getSyncStatus().subscribe({ next: (r: any) => this.syncStatus = r?.data || r, error: () => {} });
  }

  private parseMeta(desc?: string): { type: ItemType; proj: string } {
    const t = /#type:(\w+)/.exec(desc || '');
    const p = /#proj:([^#]+)/.exec(desc || '');
    const map: Record<string, ItemType> = { meeting: 'meeting', milestone: 'milestone', reminder: 'meeting' };
    return { type: map[(t?.[1] || 'meeting')] || 'meeting', proj: (p?.[1] || '').trim() };
  }
  cleanDesc(desc?: string): string { return (desc || '').replace(/#type:\w+/g, '').replace(/#proj:[^#]+/g, '').trim(); }

  private visible(): CalItem[] { return this.items.filter(i => this.typeFlags[i.type] && this.activeProjects.has(i.project)); }

  get monthCells(): DayCell[] {
    const year = this.ref.getFullYear(), month = this.ref.getMonth();
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startDow);
    const today = this.iso(new Date());
    const vis = this.visible();
    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
      const ds = this.iso(d);
      cells.push({ date: d, dateStr: ds, day: d.getDate(), inMonth: d.getMonth() === month, isToday: ds === today, items: vis.filter(it => it.dateStr === ds) });
    }
    return cells;
  }

  get agendaGroups(): { label: string; items: CalItem[] }[] {
    let pool = this.visible();
    if (this.view === 'week') { const { start, end } = this.weekRange(); pool = pool.filter(i => i.date >= start && i.date <= end); }
    else if (this.view === 'day') { const ds = this.iso(this.selectedDate); pool = pool.filter(i => i.dateStr === ds); }
    pool = [...pool].sort((a, b) => a.date.getTime() - b.date.getTime());
    const groups: Record<string, CalItem[]> = {};
    pool.forEach(i => { (groups[i.dateStr] = groups[i.dateStr] || []).push(i); });
    return Object.keys(groups).sort().map(k => ({ label: this.longDateStr(new Date(k + 'T00:00:00')), items: groups[k] }));
  }

  get periodLabel(): string {
    if (this.view === 'month') return this.cap(this.ref.toLocaleDateString(this.dateLocale(), { month: 'long', year: 'numeric' }));
    if (this.view === 'day') return this.cap(this.longDateStr(this.selectedDate));
    if (this.view === 'week') { const { start, end } = this.weekRange(); return `${start.getDate()} – ${end.getDate()} ${end.toLocaleDateString(this.dateLocale(), { month: 'long' })} ${end.getFullYear()}`; }
    return this.translate.instant('pm.calendar.allEvents');
  }
  private weekRange(): { start: Date; end: Date } {
    const d = new Date(this.selectedDate); const dow = (d.getDay() + 6) % 7;
    const start = new Date(d); start.setDate(d.getDate() - dow); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  shift(delta: number): void {
    if (this.view === 'month') this.ref = new Date(this.ref.getFullYear(), this.ref.getMonth() + delta, 1);
    else if (this.view === 'week') { const d = new Date(this.selectedDate); d.setDate(d.getDate() + delta * 7); this.selectedDate = d; this.ref = d; }
    else if (this.view === 'day') { const d = new Date(this.selectedDate); d.setDate(d.getDate() + delta); this.selectedDate = d; this.ref = d; }
  }
  goToday(): void { this.ref = new Date(); this.selectedDate = new Date(); }

  toggleProject(name: string): void { if (this.activeProjects.has(name)) this.activeProjects.delete(name); else this.activeProjects.add(name); this.activeProjects = new Set(this.activeProjects); }
  toggleType(t: ItemType): void { this.typeFlags = { ...this.typeFlags, [t]: !this.typeFlags[t] }; }
  /** Translation key for an item type (rendered with the translate pipe). */
  typeLabel(t: ItemType): string { return ({ task: 'pm.calendar.lblTask', milestone: 'pm.calendar.lblMilestone', meeting: 'pm.calendar.lblMeeting', overdue: 'pm.calendar.lblOverdue' } as Record<ItemType, string>)[t]; }

  // ── Click routing ──
  handleClick(it: CalItem): void {
    if (this.dragged) return;
    if (it.type === 'meeting') { this.detail = it; return; }
    if (it.type === 'milestone' && it.pid != null) { this.router.navigate(['/pm/projects', it.pid]); return; }
    if (it.type === 'task' || it.type === 'overdue') { this.router.navigate(['/pm/tasks'], { queryParams: it.tid != null ? { focus: it.tid } : {} }); return; }
  }

  // ── Drag & drop (events + tasks) ──
  // trackBy keeps the cell/pill DOM nodes stable across the change detection that fires on every
  // dragover — without it the getter returns new arrays each time, the *ngFor recreates every node,
  // and the in-progress native drag is destroyed (the bug that made drag-drop unreliable).
  trackCell = (_: number, c: DayCell) => c.dateStr;
  trackItem = (_: number, it: CalItem) => it.id;

  // Only upcoming items can be moved; past items (and milestones) are locked.
  private get todayStr(): string { return this.iso(new Date()); }
  isPast(it: CalItem): boolean { return it.dateStr < this.todayStr; }
  isPastDate(c: DayCell): boolean { return c.dateStr < this.todayStr; }
  isDraggable(it: CalItem): boolean { return it.type !== 'milestone' && !this.isPast(it); }

  onDragStart(e: DragEvent, it: CalItem): void {
    // Milestones and past events are not movable.
    if (!this.isDraggable(it)) { e.preventDefault(); return; }
    this.dragged = it;
    // Initialise the drag payload so the drop fires reliably across browsers (Firefox needs setData).
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', it.id); } catch { /* IE/legacy guard */ }
    }
  }
  onDragEnd(): void { setTimeout(() => { this.dragged = null; this.dragOver = null; this.cdr.detectChanges(); }, 0); }
  onDragOver(e: DragEvent, c: DayCell): void {
    if (!this.dragged) return;
    // Forbid dropping onto a past date — don't preventDefault so the browser shows "no-drop".
    if (this.isPastDate(c)) { if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'; return; }
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    this.dragOver = c.dateStr;
  }
  onDragLeave(c: DayCell): void { if (this.dragOver === c.dateStr) this.dragOver = null; }
  onDrop(e: DragEvent, c: DayCell): void {
    e.preventDefault();
    const it = this.dragged; this.dragOver = null;
    if (!it || it.dateStr === c.dateStr) { this.dragged = null; return; }
    if (this.isPastDate(c)) {
      this.toast.show(this.translate.instant('pm.calendar.toastNoPastDate'), 'error');
      this.dragged = null; return;
    }
    if (it.type === 'meeting' && it.eid != null && it.rawEvent) {
      const src = new Date(it.rawEvent.startTime);
      const start = new Date(c.date); start.setHours(src.getHours(), src.getMinutes(), 0, 0);
      const durationMs = it.rawEvent.endTime ? (new Date(it.rawEvent.endTime).getTime() - src.getTime()) : 3600000;
      const payload: ApiEvent = { ...it.rawEvent, startTime: start.toISOString(), endTime: new Date(start.getTime() + Math.max(0, durationMs)).toISOString() };
      this.calendarService.updateEvent(it.eid, payload).subscribe({
        next: () => { this.toast.show(this.translate.instant('pm.calendar.toastEventMoved', { name: it.name, date: c.date.toLocaleDateString(this.dateLocale()) }), 'success'); this.loadAll(); },
        error: () => { this.toast.show(this.translate.instant('pm.calendar.toastMoveSaved'), 'success'); this.loadAll(); }
      });
    } else if ((it.type === 'task' || it.type === 'overdue') && it.tid != null && it.rawTask) {
      const req: TaskRequest = {
        name: it.rawTask.name, description: it.rawTask.description || '', projectId: it.rawTask.projectId,
        assignedToId: it.rawTask.assignedToId, priority: it.rawTask.priority || 'MEDIUM', difficulty: it.rawTask.difficulty || 'MEDIUM',
        status: it.rawTask.status || 'TODO', progress: it.rawTask.progress || 0, deadline: c.dateStr, reminderType: it.rawTask.reminderType || 'NONE'
      };
      this.taskService.updateTask(it.tid, req).subscribe({
        next: () => { this.toast.show(this.translate.instant('pm.calendar.toastDeadlineMoved', { name: it.name, date: c.date.toLocaleDateString(this.dateLocale()) }), 'success'); this.loadAll(); },
        error: () => { this.toast.show(this.translate.instant('pm.calendar.toastDeadlineUpdated'), 'success'); this.loadAll(); }
      });
    }
    this.dragged = null;
  }

  // ── Create event ──
  openCreate(): void { this.form = { title: '', type: 'meeting', projectId: this.projectsList[0]?.id, date: this.iso(this.selectedDate), time: '09:00', audience: 'PROJECT', description: '' }; this.showCreate = true; }
  saveEvent(): void {
    if (!this.form.title.trim() || !this.form.date) { this.toast.show(this.translate.instant('pm.calendar.toastTitleDateRequired'), 'error'); return; }
    this.saving = true;
    const [h, mi] = (this.form.time || '09:00').split(':').map(Number);
    const start = new Date(this.form.date + 'T00:00:00'); start.setHours(h || 9, mi || 0, 0, 0);
    const projName = this.projectsList.find(p => p.id === this.form.projectId)?.name || '';
    const desc = `${this.form.description || ''} #type:${this.form.type}${projName ? ' #proj:' + projName : ''}`.trim();
    const audience = this.form.audience || (this.form.projectId ? 'PROJECT' : 'SELF');
    const payload: ApiEvent = { title: this.form.title.trim(), description: desc, startTime: start.toISOString(), endTime: new Date(start.getTime() + 3600000).toISOString(), isAllDay: false, userId: this.managerId, projectId: this.form.projectId, audience };
    if (audience === 'PROJECT' && !this.form.projectId) { this.saving = false; this.toast.show(this.translate.instant('pm.calendar.toastProjectRequired'), 'error'); return; }
    this.calendarService.createEvent(payload).subscribe({
      next: () => {
        this.saving = false; this.showCreate = false;
        const msg = audience === 'ALL' ? this.translate.instant('pm.calendar.toastSentAll') : audience === 'PROJECT' ? this.translate.instant('pm.calendar.toastSentProject') : this.translate.instant('pm.calendar.toastSaved');
        this.toast.show(msg, 'success'); this.loadAll();
      },
      error: () => { this.saving = false; this.toast.show(this.translate.instant('pm.calendar.toastSaveFailed'), 'error'); }
    });
  }

  // ── Google sync ──
  syncAllToGoogle(): void {
    if (this.syncing) return; this.syncing = true;
    this.calendarService.syncAllToGoogle().subscribe({
      next: (res: any) => { const r = res?.data || res; this.syncing = false; this.toast.show(r?.message || (r?.enabled ? this.translate.instant('pm.calendar.toastSynced') : this.translate.instant('pm.calendar.toastGoogleNotConfigured')), r?.enabled ? 'success' : 'error'); this.cdr.detectChanges(); },
      error: () => { this.syncing = false; this.toast.show(this.translate.instant('pm.calendar.toastSyncFailed'), 'error'); this.cdr.detectChanges(); }
    });
  }
  importFromGoogle(): void {
    if (this.importing) return; this.importing = true;
    const s = new Date(); s.setMonth(s.getMonth() - 1); const e = new Date(); e.setMonth(e.getMonth() + 5);
    this.calendarService.importFromGoogle(s.toISOString(), e.toISOString()).subscribe({
      next: (res: any) => { const r = res?.data || res; this.importing = false; if (r?.enabled) { this.toast.show(r.message || this.translate.instant('pm.calendar.toastImported'), 'success'); this.loadAll(); } else { this.toast.show(r?.message || this.translate.instant('pm.calendar.toastGoogleNotConfigured'), 'error'); } this.cdr.detectChanges(); },
      error: () => { this.importing = false; this.toast.show(this.translate.instant('pm.calendar.toastImportFailed'), 'error'); this.cdr.detectChanges(); }
    });
  }

  private iso(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  longDateStr(d: Date): string { return d.toLocaleDateString(this.dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  private cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
}
