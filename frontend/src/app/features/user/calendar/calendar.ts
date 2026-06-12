import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { CalendarService, CalendarEvent as ApiEvent } from '../../../core/services/calendar.service';

type ItemType = 'task' | 'meeting' | 'overdue';
interface CalItem {
  id: string; date: Date; dateStr: string; name: string; type: ItemType; project: string; time?: string; desc?: string;
}
interface DayCell { date: Date; dateStr: string; day: number; inMonth: boolean; isToday: boolean; items: CalItem[]; }

@Component({
  selector: 'app-user-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="ucal">

    <!-- ═══ Top bar ═══ -->
    <div class="ucal-top">
      <div class="nav">
        <button class="nav-btn" (click)="shift(-1)" aria-label="Précédent">‹</button>
        <button class="today-btn" (click)="goToday()">Aujourd'hui</button>
        <button class="nav-btn" (click)="shift(1)" aria-label="Suivant">›</button>
        <h2 class="period">{{ periodLabel }}</h2>
      </div>
      <div class="view-toggle">
        <button *ngFor="let v of views" [class.on]="view === v.key" (click)="view = v.key">{{ v.label }}</button>
      </div>
    </div>

    <!-- ═══ Filters ═══ -->
    <div class="ucal-filters">
      <div class="fl">
        <label>Projet</label>
        <select [(ngModel)]="filterProject">
          <option value="">Tous les projets</option>
          <option *ngFor="let p of projectsList" [value]="p">{{ p }}</option>
        </select>
      </div>
      <span class="divider">|</span>
      <label class="type-check"><input type="checkbox" [(ngModel)]="typeFlags.task"> Tâche due</label>
      <label class="type-check"><input type="checkbox" [(ngModel)]="typeFlags.meeting"> Réunion / Événement</label>
      <label class="type-check"><input type="checkbox" [(ngModel)]="typeFlags.overdue"> Délai dépassé</label>
      <button class="reset" (click)="resetFilters()">Réinitialiser</button>
    </div>

    <!-- ═══ Loading ═══ -->
    <div class="ucal-loading" *ngIf="loading"><div class="spin"></div><span>Chargement de l'agenda…</span></div>

    <!-- ═══ Month grid ═══ -->
    <div class="ucal-card" *ngIf="!loading && view === 'month'">
      <div class="dow-row"><div class="dow" *ngFor="let d of dows">{{ d }}</div></div>
      <div class="month-grid">
        <div class="cell" *ngFor="let c of monthCells" [class.out]="!c.inMonth"
             [class.selected]="c.dateStr === selectedStr" [class.today]="c.isToday" (click)="selectedStr = c.dateStr">
          <span class="cell-num" [class.today-num]="c.isToday">{{ c.day }}</span>
          <div class="cell-items">
            <div class="ev-pill" *ngFor="let it of c.items.slice(0, 4)" [ngClass]="'t-' + it.type"
                 [title]="it.name + (it.time ? ' · ' + it.time : '')" (click)="openDetail(it, $event)">
              {{ it.name }}
            </div>
            <span class="more" *ngIf="c.items.length > 4">+{{ c.items.length - 4 }} de plus</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Week grid ═══ -->
    <div class="ucal-card" *ngIf="!loading && view === 'week'">
      <div class="week-grid">
        <div class="wcol" *ngFor="let c of weekCells" [class.today]="c.isToday">
          <div class="wcol-head"><span class="wd">{{ dows[(c.date.getDay() + 6) % 7] }}</span><span class="wn" [class.today-num]="c.isToday">{{ c.day }}</span></div>
          <div class="wcol-body">
            <div class="ev-pill" *ngFor="let it of c.items" [ngClass]="'t-' + it.type" [title]="it.name" (click)="openDetail(it, $event)">
              <span class="pill-time" *ngIf="it.time">{{ it.time }}</span>{{ it.name }}
            </div>
            <div class="wempty" *ngIf="c.items.length === 0">—</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Day / List (agenda) ═══ -->
    <div class="ucal-card" *ngIf="!loading && (view === 'day' || view === 'list')">
      <div class="agenda">
        <div class="agenda-group" *ngFor="let g of agendaGroups">
          <div class="agenda-date">{{ g.label }}</div>
          <div class="agenda-item" *ngFor="let it of g.items" (click)="openDetail(it, $event)">
            <span class="ev-dot" [ngClass]="'t-' + it.type"></span>
            <div class="ai-body"><div class="ai-name">{{ it.name }}</div><div class="ai-meta">{{ typeLabel(it.type) }} · {{ it.project }}<span *ngIf="it.time"> · {{ it.time }}</span></div></div>
            <span class="ai-badge" [ngClass]="'t-' + it.type">{{ typeLabel(it.type) }}</span>
          </div>
        </div>
        <div class="empty" *ngIf="agendaGroups.length === 0">Aucun événement sur cette période.</div>
      </div>
    </div>

    <!-- ═══ Legend ═══ -->
    <div class="ucal-legend" *ngIf="!loading">
      <span class="lg"><i class="dot t-task"></i> Tâche due</span>
      <span class="lg"><i class="dot t-meeting"></i> Réunion / Événement</span>
      <span class="lg"><i class="dot t-overdue"></i> Délai dépassé</span>
    </div>
  </div>

  <!-- ═══ Detail popup ═══ -->
  <div class="modal-backdrop" *ngIf="detail" (click)="detail = null">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>{{ detail!.name }}</h3><button class="x" (click)="detail = null"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body">
        <div class="det-row"><span class="det-k">Type</span><span class="ai-badge" [ngClass]="'t-' + detail!.type">{{ typeLabel(detail!.type) }}</span></div>
        <div class="det-row"><span class="det-k">Projet</span><span>{{ detail!.project }}</span></div>
        <div class="det-row"><span class="det-k">Date</span><span>{{ longDateStr(detail!.date) }}</span></div>
        <div class="det-row" *ngIf="detail!.time"><span class="det-k">Heure</span><span>{{ detail!.time }}</span></div>
        <div class="det-desc" *ngIf="detail!.desc">{{ detail!.desc }}</div>
      </div>
      <div class="m-foot"><button class="btn-ghost" (click)="detail = null">Fermer</button></div>
    </div>
  </div>
  `,
  styles: [`
    .ucal { display: flex; flex-direction: column; gap: 14px; }
    .ucal-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
    .nav { display: flex; align-items: center; gap: 8px; }
    .nav-btn { width: 34px; height: 34px; border: 1px solid #e2e8f0; background: #fff; border-radius: 9px; cursor: pointer; font-size: 18px; line-height: 1; color: #475569; } .nav-btn:hover { background: #f1f5f9; }
    .today-btn { height: 34px; padding: 0 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 9px; font-size: 13px; font-weight: 600; color: #334155; cursor: pointer; } .today-btn:hover { background: #f1f5f9; }
    .period { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 0 10px; text-transform: capitalize; }
    .view-toggle { display: inline-flex; padding: 3px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
    .view-toggle button { height: 32px; padding: 0 16px; border: none; background: none; border-radius: 7px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; }
    .view-toggle button.on { background: #2563eb; color: #fff; }

    .ucal-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    .fl { display: flex; align-items: center; gap: 7px; } .fl label { font-size: 12.5px; font-weight: 600; color: #64748b; }
    .fl select { height: 34px; padding: 0 10px; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 13px; color: #1e293b; background: #fff; font-family: inherit; outline: none; }
    .fl select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .divider { color: #cbd5e1; }
    .type-check { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #475569; cursor: pointer; } .type-check input { width: 14px; height: 14px; accent-color: #2563eb; }
    .reset { margin-left: auto; height: 32px; padding: 0 12px; border: 1px solid #e2e8f0; background: #fff; border-radius: 9px; font-size: 12.5px; font-weight: 600; color: #64748b; cursor: pointer; } .reset:hover { background: #f1f5f9; }

    .ucal-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #64748b; font-size: 13px; }
    .spin { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: sp 0.8s linear infinite; } @keyframes sp { to { transform: rotate(360deg); } }

    .ucal-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
    .dow-row { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid #e2e8f0; }
    .dow { padding: 11px 14px; font-size: 12px; font-weight: 600; color: #94a3b8; text-align: center; }
    .month-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .cell { min-height: 120px; border-bottom: 1px solid #eef2f7; border-right: 1px solid #eef2f7; padding: 8px; cursor: pointer; transition: background .12s ease; }
    .cell:nth-child(7n) { border-right: none; }
    .cell.out { background: #fafbfc; } .cell.out .cell-num { color: #cbd5e1; }
    .cell:hover { background: #f8fafc; }
    .cell.selected { box-shadow: inset 0 0 0 2px #2563eb; background: #eff6ff; }
    .cell-num { display: inline-block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
    .cell-num.today-num { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 5px; background: #2563eb; color: #fff; border-radius: 11px; }
    .cell-items { display: flex; flex-direction: column; gap: 4px; }
    .ev-pill { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 3px solid; cursor: pointer; }
    .ev-pill .pill-time { font-weight: 700; margin-right: 5px; }
    .ev-pill.t-task { background: #eff6ff; color: #1d4ed8; border-color: #3b82f6; }
    .ev-pill.t-meeting { background: #fff7ed; color: #b45309; border-color: #f59e0b; }
    .ev-pill.t-overdue { background: #fef2f2; color: #dc2626; border-color: #ef4444; }
    .more { font-size: 10.5px; color: #94a3b8; font-weight: 600; padding-left: 2px; }

    .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .wcol { border-right: 1px solid #eef2f7; min-height: 320px; } .wcol:last-child { border-right: none; }
    .wcol-head { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 6px; border-bottom: 1px solid #eef2f7; background: #f8fafc; }
    .wcol-head .wd { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
    .wcol-head .wn { font-size: 15px; font-weight: 700; color: #334155; }
    .wcol-head .wn.today-num { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: #2563eb; color: #fff; border-radius: 50%; }
    .wcol-body { display: flex; flex-direction: column; gap: 4px; padding: 8px 6px; }
    .wempty { text-align: center; color: #e2e8f0; font-size: 12px; padding: 6px; }

    .agenda { padding: 6px 0; }
    .agenda-date { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #94a3b8; padding: 9px 18px; background: #f8fafc; }
    .agenda-item { display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-top: 1px solid #eef2f7; cursor: pointer; } .agenda-item:hover { background: #f8fafc; }
    .ev-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .ev-dot.t-task { background: #3b82f6; } .ev-dot.t-meeting { background: #f59e0b; } .ev-dot.t-overdue { background: #ef4444; }
    .ai-body { flex: 1; min-width: 0; } .ai-name { font-size: 13.5px; font-weight: 600; color: #1e293b; } .ai-meta { font-size: 11.5px; color: #64748b; margin-top: 2px; }
    .ai-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; white-space: nowrap; }
    .ai-badge.t-task { background: #eff6ff; color: #1d4ed8; } .ai-badge.t-meeting { background: #fff7ed; color: #b45309; } .ai-badge.t-overdue { background: #fef2f2; color: #dc2626; }
    .empty { padding: 44px; text-align: center; color: #94a3b8; font-size: 13px; }

    .ucal-legend { display: flex; gap: 22px; padding: 4px 2px; }
    .lg { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: #475569; }
    .lg .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.t-task { background: #3b82f6; } .dot.t-meeting { background: #f59e0b; } .dot.t-overdue { background: #ef4444; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 440px; background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 10px; } .m-head h3 { font-size: 16.5px; font-weight: 700; color: #1e293b; margin: 0; }
    .x { width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; color: #64748b; display: grid; place-items: center; } .x svg { width: 15px; height: 15px; }
    .m-body { padding: 8px 22px; display: flex; flex-direction: column; gap: 11px; }
    .det-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #475569; } .det-k { width: 64px; font-weight: 700; color: #94a3b8; font-size: 11.5px; text-transform: uppercase; }
    .det-desc { font-size: 13px; color: #475569; background: #f8fafc; border-radius: 10px; padding: 10px 12px; }
    .m-foot { display: flex; justify-content: flex-end; padding: 12px 22px 20px; }
    .btn-ghost { height: 36px; padding: 0 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 9px; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; } .btn-ghost:hover { background: #f1f5f9; }
  `]
})
export class UserCalendarComponent implements OnInit {
  developerId = 0;
  items: CalItem[] = [];
  loading = true;

  view: 'month' | 'week' | 'day' | 'list' = 'month';
  views = [{ key: 'month' as const, label: 'Mois' }, { key: 'week' as const, label: 'Semaine' }, { key: 'day' as const, label: 'Jour' }, { key: 'list' as const, label: 'Liste' }];
  ref: Date = new Date();
  selectedDate: Date = new Date();
  selectedStr = '';
  dows = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  private monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  // Filters
  filterProject = '';
  typeFlags: Record<ItemType, boolean> = { task: true, meeting: true, overdue: true };
  projectsList: string[] = [];

  detail: CalItem | null = null;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private calendarService: CalendarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.developerId = this.authService.getCurrentUser()?.id || 0;
    this.selectedStr = this.iso(new Date());
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    forkJoin({
      tasks: this.taskService.getTasksByUser(this.developerId, 0, 200),
      events: this.calendarService.getUserEvents()
    }).subscribe({
      next: ({ tasks, events }: any) => this.build(tasks, events),
      error: () => { this.build(null, null); }
    });
  }

  private build(tasksRes: any, eventsRes: any): void {
    const taskList: Task[] = tasksRes && tasksRes.data ? tasksRes.data : (Array.isArray(tasksRes) ? tasksRes : []);
    const evList: ApiEvent[] = Array.isArray(eventsRes) ? eventsRes : (eventsRes?.data || eventsRes?.content || []);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const items: CalItem[] = [];

    // Task deadlines → blue (task due) or red (overdue if past & not completed)
    taskList.filter(t => !!t.deadline).forEach(t => {
      const d = new Date(t.deadline as string); if (isNaN(d.getTime())) return;
      const overdue = (t.status || '').toUpperCase() !== 'COMPLETED' && d < today;
      items.push({
        id: 'task-' + t.id, date: d, dateStr: this.iso(d), name: t.name,
        type: overdue ? 'overdue' : 'task', project: t.projectName || 'Général',
        desc: `Échéance de tâche${t.status ? ' · ' + t.status : ''}`
      });
    });

    // Calendar events → orange (meeting / event)
    evList.forEach(e => {
      const d = new Date(e.startTime); if (isNaN(d.getTime())) return;
      // Task-deadline events ("Task Due: …") are already shown via the derived task items above — skip
      // them here to avoid each assigned task appearing twice on the calendar.
      if ((e.title || '').startsWith('Task Due:')) return;
      items.push({
        id: 'evt-' + (e.id ?? d.getTime()), date: d, dateStr: this.iso(d), name: e.title,
        type: 'meeting', project: 'Général',
        time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        desc: (e.description || '').replace(/#type:\w+/g, '').replace(/#proj:[^#]+/g, '').trim()
      });
    });

    this.items = items;
    this.projectsList = Array.from(new Set(items.map(i => i.project).filter(Boolean)));
    this.loading = false;
    this.cdr.detectChanges();
  }

  private visible(): CalItem[] {
    return this.items.filter(i =>
      this.typeFlags[i.type] && (!this.filterProject || i.project === this.filterProject)
    );
  }

  resetFilters(): void {
    this.filterProject = '';
    this.typeFlags = { task: true, meeting: true, overdue: true };
  }

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

  get weekCells(): DayCell[] {
    const { start } = this.weekRange();
    const today = this.iso(new Date());
    const vis = this.visible();
    const cells: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const ds = this.iso(d);
      cells.push({ date: d, dateStr: ds, day: d.getDate(), inMonth: true, isToday: ds === today, items: vis.filter(it => it.dateStr === ds) });
    }
    return cells;
  }

  get agendaGroups(): { label: string; items: CalItem[] }[] {
    let pool = this.visible();
    if (this.view === 'day') { const ds = this.iso(this.selectedDate); pool = pool.filter(i => i.dateStr === ds); }
    else if (this.view === 'list') { const y = this.ref.getFullYear(), m = this.ref.getMonth(); pool = pool.filter(i => i.date.getFullYear() === y && i.date.getMonth() === m); }
    pool = [...pool].sort((a, b) => a.date.getTime() - b.date.getTime());
    const groups: Record<string, CalItem[]> = {};
    pool.forEach(i => { (groups[i.dateStr] = groups[i.dateStr] || []).push(i); });
    return Object.keys(groups).sort().map(k => ({ label: this.cap(this.longDateStr(new Date(k + 'T00:00:00'))), items: groups[k] }));
  }

  get periodLabel(): string {
    if (this.view === 'month' || this.view === 'list') return `${this.cap(this.monthNames[this.ref.getMonth()])} ${this.ref.getFullYear()}`;
    if (this.view === 'day') return this.cap(this.longDateStr(this.selectedDate));
    const { start, end } = this.weekRange();
    return `${start.getDate()} – ${end.getDate()} ${this.monthNames[end.getMonth()]} ${end.getFullYear()}`;
  }

  private weekRange(): { start: Date; end: Date } {
    const d = new Date(this.selectedDate); const dow = (d.getDay() + 6) % 7;
    const start = new Date(d); start.setDate(d.getDate() - dow); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  shift(delta: number): void {
    if (this.view === 'month' || this.view === 'list') this.ref = new Date(this.ref.getFullYear(), this.ref.getMonth() + delta, 1);
    else if (this.view === 'week') { const d = new Date(this.selectedDate); d.setDate(d.getDate() + delta * 7); this.selectedDate = d; this.ref = d; }
    else { const d = new Date(this.selectedDate); d.setDate(d.getDate() + delta); this.selectedDate = d; this.ref = d; }
  }
  goToday(): void { this.ref = new Date(); this.selectedDate = new Date(); this.selectedStr = this.iso(new Date()); }

  openDetail(it: CalItem, e: Event): void { e.stopPropagation(); this.detail = it; }
  typeLabel(t: ItemType): string { return ({ task: 'Tâche due', meeting: 'Réunion / Événement', overdue: 'Délai dépassé' } as Record<ItemType, string>)[t]; }

  private iso(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  longDateStr(d: Date): string { return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  private cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
}
