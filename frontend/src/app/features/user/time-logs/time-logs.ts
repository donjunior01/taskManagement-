import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeLogService } from '../../../core/services/time-log.service';
import { ToastService } from '../../../core/services/toast.service';

interface Row { taskId: number; name: string; project: string; cells: number[]; logs: any[][]; total: number; }
interface Donut { name: string; value: number; color: string; dash: string; offset: number; }

@Component({
  selector: 'app-user-time-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="tl-wrap">

    <!-- ═══ Page header (preserved) ═══ -->
    <div class="page-head">
      <div>
        <h1>Suivi du Temps</h1>
        <p>Analysez les heures travaillées et suivez votre charge hebdomadaire.</p>
      </div>
      <div class="head-actions">
        <button class="btn-export" (click)="exportCsv()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Exporter CSV</button>
        <button class="btn-log" (click)="openLog()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Enregistrer du temps</button>
      </div>
    </div>

    <!-- ═══ Week bar ═══ -->
    <div class="week-bar anim">
      <button class="nav" (click)="shiftWeek(-1)">‹</button>
      <span class="week-label">{{ weekLabel }}</span>
      <button class="nav" (click)="shiftWeek(1)">›</button>
      <button class="this-week" (click)="goThisWeek()">Cette Semaine</button>
      <span class="cap-badge" [class.over]="weekTotal > capacity">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        {{ weekTotal }}h / {{ capacity }}h
      </span>
    </div>

    <!-- ═══ Timesheet ═══ -->
    <div class="sheet-card anim" style="--d:.06s">
      <table class="sheet">
        <thead>
          <tr><th class="task-col">Tâche</th><th *ngFor="let d of days">{{ d }}</th><th class="total-col">Total</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td class="task-col"><div class="t-name">{{ r.name }}</div><span class="t-proj">{{ r.project }}</span></td>
            <td *ngFor="let h of r.cells; let d = index" class="cell">
              <input type="number" min="0" step="0.5" [ngModel]="r.cells[d]" (ngModelChange)="r.cells[d] = $event" (change)="edit(r, d)"
                     [style.background]="cellBg(r.cells[d])" [style.color]="cellFg(r.cells[d])">
            </td>
            <td class="total-col"><strong>{{ r.total }}h</strong></td>
          </tr>
          <tr *ngIf="rows.length === 0 && !loading"><td [attr.colspan]="9"><div class="empty">Aucune heure enregistrée cette semaine.</div></td></tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="task-col">Total journalier</td>
            <td *ngFor="let t of dailyTotals" class="day-total">{{ t }}h</td>
            <td class="total-col grand">{{ weekTotal }}h</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- ═══ KPI cards ═══ -->
    <div class="kpi-grid">
      <div class="kpi anim" style="--d:.12s">
        <div class="kpi-l">Total cette semaine</div>
        <div class="kpi-v">{{ weekTotal }}h</div>
        <div class="kpi-trend" [class.up]="trendPct >= 0" [class.down]="trendPct < 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline [attr.points]="trendPct >= 0 ? '3 17 9 11 13 15 21 7' : '3 7 9 13 13 9 21 17'"></polyline><polyline [attr.points]="trendPct >= 0 ? '14 7 21 7 21 14' : '14 17 21 17 21 10'"></polyline></svg>
          {{ trendPct >= 0 ? '+' : '' }}{{ trendPct }}% vs semaine dernière
        </div>
      </div>
      <div class="kpi anim" style="--d:.16s">
        <div class="kpi-l">Moyenne par jour</div>
        <div class="kpi-v">{{ avgPerDay }}h</div>
        <div class="kpi-sub">sur 5 jours ouvrés</div>
      </div>
      <div class="kpi anim" style="--d:.2s">
        <div class="kpi-l">Tâche la plus chronophage</div>
        <div class="kpi-task">{{ topTask?.name || '—' }}</div>
        <div class="kpi-chip" *ngIf="topTask"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>{{ topTask.total }}h</div>
      </div>
      <div class="kpi anim" style="--d:.24s">
        <div class="kpi-l">Par projet</div>
        <div class="donut-split">
          <div class="donut-wrap reveal">
            <svg viewBox="0 0 36 36" class="donut">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef2f7" stroke-width="4"></circle>
              <circle *ngFor="let s of donut" cx="18" cy="18" r="15.9155" fill="none" [attr.stroke]="s.color" stroke-width="4" [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset"></circle>
            </svg>
            <div class="donut-center">{{ weekTotal }}h</div>
          </div>
          <ul class="donut-legend">
            <li *ngFor="let s of donut"><span class="d" [style.background]="s.color"></span><span class="nm">{{ s.name }}</span><span class="vl">{{ s.value }}h</span></li>
            <li *ngIf="donut.length === 0" class="empty-li">—</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ Log time modal ═══ -->
  <div class="modal-backdrop" *ngIf="showLogModal" (click)="closeLog()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>Enregistrer du temps</h3><button class="x" (click)="closeLog()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body">
        <div class="fg"><label>Tâche *</label>
          <select [(ngModel)]="logForm.taskId">
            <option [ngValue]="undefined">Sélectionner une tâche</option>
            <option *ngFor="let t of tasks" [ngValue]="t.id">{{ t.name }}<span *ngIf="t.projectName"> — {{ t.projectName }}</span></option>
          </select>
        </div>
        <div class="grid2">
          <div class="fg"><label>Date *</label><input type="date" [(ngModel)]="logForm.date"></div>
          <div class="fg"><label>Heures *</label><input type="number" min="0" step="0.5" [(ngModel)]="logForm.hours" placeholder="ex. 2.5"></div>
        </div>
        <div class="fg"><label>Description</label><textarea rows="3" [(ngModel)]="logForm.description" placeholder="Sur quoi avez-vous travaillé ?"></textarea></div>
      </div>
      <div class="m-foot"><button class="btn-ghost" (click)="closeLog()">Annuler</button><button class="btn-primary" (click)="submitLog()" [disabled]="savingLog">{{ savingLog ? 'Enregistrement…' : 'Enregistrer' }}</button></div>
    </div>
  </div>
  `,
  styles: [`
    .tl-wrap { display: flex; flex-direction: column; gap: 18px; }
    .head-actions { display: inline-flex; gap: 8px; flex-wrap: wrap; }
    .btn-log { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-log svg { width: 15px; height: 15px; } .btn-log:hover { background: #1d4ed8; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 480px; background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 10px; } .m-head h3 { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0; }
    .x { width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; color: #64748b; display: grid; place-items: center; } .x svg { width: 15px; height: 15px; }
    .m-body { padding: 8px 22px; display: flex; flex-direction: column; gap: 14px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fg { display: flex; flex-direction: column; gap: 6px; } .fg label { font-size: 12.5px; font-weight: 700; color: #475569; }
    .fg input, .fg select, .fg textarea { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13.5px; font-family: inherit; color: #1e293b; outline: none; background: #fff; }
    .fg input:focus, .fg select:focus, .fg textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .m-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 22px 20px; }
    .btn-ghost { height: 40px; padding: 0 16px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; color: #475569; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-ghost:hover { background: #f8fafc; }
    .btn-primary { height: 40px; padding: 0 18px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-primary:hover { background: #1d4ed8; } .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    @keyframes tFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes tWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    .anim { animation: tFade .5s ease both; animation-delay: var(--d, 0s); }
    .reveal { animation: tWipe .9s cubic-bezier(.4,0,.2,1) both; }

    .page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .page-head h1 { font-size: 21px; font-weight: 800; color: #1e293b; margin: 0; }
    .page-head p { font-size: 13px; color: #64748b; margin: 4px 0 0; }
    .btn-export { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; font-family: inherit; } .btn-export svg { width: 15px; height: 15px; } .btn-export:hover { background: #f8fafc; }

    .week-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .nav { width: 34px; height: 34px; border: 1px solid #e2e8f0; background: #fff; border-radius: 9px; font-size: 18px; line-height: 1; color: #475569; cursor: pointer; } .nav:hover { background: #f1f5f9; }
    .week-label { font-size: 16px; font-weight: 700; color: #1e293b; }
    .this-week { height: 32px; padding: 0 13px; border: none; background: none; border-radius: 8px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; } .this-week:hover { background: #f1f5f9; }
    .cap-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 9999px; background: rgba(37,99,235,.1); color: #2563eb; font-size: 13px; font-weight: 700; } .cap-badge svg { width: 15px; height: 15px; } .cap-badge.over { background: rgba(220,38,38,.1); color: #dc2626; }

    .sheet-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow-x: auto; }
    .sheet { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 720px; }
    .sheet thead th { background: #f8fafc; padding: 13px 14px; font-size: 12px; font-weight: 600; color: #64748b; text-align: center; }
    .sheet thead th.task-col { text-align: left; }
    .task-col { text-align: left; width: 280px; padding-left: 20px !important; }
    .total-col { text-align: center; width: 80px; }
    .sheet tbody td { padding: 12px 8px; border-top: 1px solid #eef2f7; vertical-align: middle; }
    .sheet tbody td.task-col { padding: 12px 14px 12px 20px; }
    .t-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .t-proj { display: inline-block; margin-top: 5px; font-size: 11px; font-weight: 500; color: #2563eb; background: rgba(37,99,235,.1); padding: 2px 8px; border-radius: 6px; }
    .cell { text-align: center; }
    .cell input { width: 64px; height: 40px; border: none; border-radius: 9px; text-align: center; font-size: 14px; font-weight: 700; outline: none; cursor: text; -moz-appearance: textfield; transition: background .2s ease; }
    .cell input::-webkit-outer-spin-button, .cell input::-webkit-inner-spin-button { opacity: 0; height: 40px; }
    .cell input:hover::-webkit-inner-spin-button { opacity: 1; }
    .cell input:focus { box-shadow: 0 0 0 2px #2563eb; }
    .total-col strong { font-size: 14px; font-weight: 800; color: #1e293b; }
    .sheet tfoot td { padding: 14px 8px; border-top: 2px solid #e2e8f0; font-weight: 700; color: #1e293b; text-align: center; }
    .sheet tfoot td.task-col { text-align: left; font-size: 14px; }
    .day-total { color: #475569; } .total-col.grand { font-size: 15px; font-weight: 800; }
    .empty { padding: 30px; text-align: center; color: #94a3b8; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 1000px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 20px; min-height: 150px; }
    .kpi-l { font-size: 13px; color: #64748b; }
    .kpi-v { font-size: 30px; font-weight: 800; color: #1e293b; margin-top: 8px; line-height: 1; }
    .kpi-trend { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; font-size: 12px; font-weight: 600; } .kpi-trend svg { width: 14px; height: 14px; } .kpi-trend.up { color: #16a34a; } .kpi-trend.down { color: #dc2626; }
    .kpi-sub { font-size: 12px; color: #94a3b8; margin-top: 10px; }
    .kpi-task { font-size: 17px; font-weight: 700; color: #1e293b; margin-top: 10px; }
    .kpi-chip { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; font-size: 12.5px; font-weight: 600; color: #b45309; background: rgba(245,158,11,.14); padding: 4px 10px; border-radius: 8px; } .kpi-chip svg { width: 13px; height: 13px; }
    .donut-split { display: flex; align-items: center; gap: 14px; margin-top: 10px; }
    .donut-wrap { position: relative; width: 84px; height: 84px; flex-shrink: 0; } .donut { width: 100%; transform: rotate(-90deg); }
    .donut-center { position: absolute; inset: 0; display: grid; place-items: center; font-size: 16px; font-weight: 800; color: #1e293b; }
    .donut-legend { flex: 1; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
    .donut-legend li { display: flex; align-items: center; gap: 7px; font-size: 12px; } .donut-legend .d { width: 9px; height: 9px; border-radius: 3px; } .donut-legend .nm { color: #475569; } .donut-legend .vl { margin-left: auto; font-weight: 700; color: #1e293b; } .empty-li { color: #94a3b8; }
  `]
})
export class UserTimeLogsComponent implements OnInit {
  developerId = 0;
  loading = true;
  capacity = 40;

  days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  weekStart: Date = this.mondayOf(new Date());

  tasks: Task[] = [];
  private allLogs: any[] = [];

  rows: Row[] = [];
  dailyTotals = [0, 0, 0, 0, 0, 0, 0];
  weekTotal = 0;
  prevWeekTotal = 0;
  donut: Donut[] = [];
  topTask: Row | null = null;

  private monthsFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  private palette = ['#2563eb', '#0f172a', '#f59e0b', '#22c55e', '#a855f7', '#0891b2'];

  // Log-time modal
  showLogModal = false;
  savingLog = false;
  logForm: { taskId?: number; date: string; hours?: number; description: string } = { taskId: undefined, date: '', hours: undefined, description: '' };

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private timeLogService: TimeLogService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.developerId = this.authService.getCurrentUser()?.id || 0;
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.taskService.getTasksByUser(this.developerId, 0, 100).subscribe({
      next: (r: any) => { this.tasks = r && r.data ? r.data : []; this.fetchLogs(); },
      error: () => { this.tasks = []; this.fetchLogs(); }
    });
  }

  private fetchLogs(): void {
    this.timeLogService.getMyTimeLogs().subscribe({
      next: (r: any) => { this.allLogs = Array.isArray(r) ? r : (r?.data || r?.content || []); this.build(); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.allLogs = []; this.build(); this.loading = false; this.cdr.detectChanges(); }
    });
  }

  // ── Week helpers ──
  private mondayOf(d: Date): Date { const x = new Date(d); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x; }
  private iso(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  private dayDate(i: number): Date { const d = new Date(this.weekStart); d.setDate(d.getDate() + i); return d; }
  shiftWeek(delta: number): void { const d = new Date(this.weekStart); d.setDate(d.getDate() + delta * 7); this.weekStart = d; this.build(); }
  goThisWeek(): void { this.weekStart = this.mondayOf(new Date()); this.build(); }

  get weekLabel(): string {
    const end = this.dayDate(6);
    const sm = this.weekStart.getMonth(), em = end.getMonth();
    if (sm === em) return `Semaine du ${this.weekStart.getDate()}–${end.getDate()} ${this.monthsFr[em]} ${end.getFullYear()}`;
    return `Semaine du ${this.weekStart.getDate()} ${this.monthsFr[sm]} – ${end.getDate()} ${this.monthsFr[em]} ${end.getFullYear()}`;
  }

  // ── Build the grid + KPIs from real logs ──
  private build(): void {
    const weekStrs = Array.from({ length: 7 }, (_, i) => this.iso(this.dayDate(i)));
    const prevStart = new Date(this.weekStart); prevStart.setDate(prevStart.getDate() - 7);
    const prevStrs = Array.from({ length: 7 }, (_, i) => { const d = new Date(prevStart); d.setDate(d.getDate() + i); return this.iso(d); });
    const hoursOf = (l: any) => l.hoursSpent ?? l.hours ?? 0;
    const dateOf = (l: any) => l.logDate || l.date || '';
    const taskById: Record<number, Task> = {}; this.tasks.forEach(t => { if (t.id != null) taskById[t.id] = t; });

    // rows for this week
    const byTask: Record<number, Row> = {};
    this.allLogs.filter(l => weekStrs.includes(dateOf(l))).forEach(l => {
      const tid = l.taskId;
      const t = taskById[tid];
      const row = byTask[tid] = byTask[tid] || {
        taskId: tid, name: l.taskName || t?.name || `Tâche #${tid}`, project: t?.projectName || 'Projet',
        cells: [0, 0, 0, 0, 0, 0, 0], logs: [[], [], [], [], [], [], []], total: 0
      };
      const d = weekStrs.indexOf(dateOf(l));
      if (d >= 0) { row.cells[d] += hoursOf(l); row.logs[d].push(l); row.total += hoursOf(l); }
    });
    this.rows = Object.values(byTask).map(r => ({ ...r, cells: r.cells.map(v => Math.round(v * 10) / 10), total: Math.round(r.total * 10) / 10 }));

    // daily + week totals
    this.dailyTotals = weekStrs.map((_, d) => Math.round(this.rows.reduce((s, r) => s + r.cells[d], 0) * 10) / 10);
    this.weekTotal = Math.round(this.dailyTotals.reduce((s, v) => s + v, 0) * 10) / 10;
    this.prevWeekTotal = Math.round(this.allLogs.filter(l => prevStrs.includes(dateOf(l))).reduce((s, l) => s + hoursOf(l), 0) * 10) / 10;

    // top task
    this.topTask = this.rows.length ? this.rows.reduce((a, b) => (b.total > a.total ? b : a)) : null;

    // donut by project
    const byProj: Record<string, number> = {};
    this.rows.forEach(r => { byProj[r.project] = (byProj[r.project] || 0) + r.total; });
    const total = this.weekTotal || 1;
    let acc = 0;
    this.donut = Object.keys(byProj).filter(k => byProj[k] > 0).map((name, i) => {
      const value = Math.round(byProj[name] * 10) / 10;
      const pct = (value / total) * 100;
      const seg: Donut = { name, value, color: this.palette[i % this.palette.length], dash: `${Math.max(0, pct - 1.5)} ${100 - Math.max(0, pct - 1.5)}`, offset: -acc };
      acc += pct; return seg;
    });
    this.cdr.detectChanges();
  }

  get trendPct(): number {
    if (this.prevWeekTotal <= 0) return this.weekTotal > 0 ? 100 : 0;
    return Math.round((this.weekTotal - this.prevWeekTotal) / this.prevWeekTotal * 100);
  }
  get avgPerDay(): number { return Math.round((this.weekTotal / 5) * 10) / 10; }

  cellBg(h: number): string { if (!h || h <= 0) return '#f8faff'; const a = Math.min(1, 0.22 + (h / 5) * 0.78); return `rgba(37,99,235,${a.toFixed(2)})`; }
  cellFg(h: number): string { if (!h || h <= 0) return '#cbd5e1'; return (0.22 + (h / 5) * 0.78) > 0.55 ? '#fff' : '#1e40af'; }

  // ── Edit a cell → upsert a time log (real backend) ──
  edit(r: Row, d: number): void {
    const v = Math.max(0, +r.cells[d] || 0);
    const dayStr = this.iso(this.dayDate(d));
    const logs = r.logs[d] || [];
    const finish = () => { this.fetchLogs(); this.toast.show('Temps enregistré.', 'success'); };
    if (logs.length === 0) {
      if (v > 0) this.timeLogService.createTimeLog({ taskId: r.taskId, hours: v, date: dayStr, description: '', hoursSpent: v, logDate: dayStr } as any).subscribe({ next: finish, error: () => this.build() });
      else this.build();
    } else {
      const rest = logs.slice(1).reduce((s, l) => s + (l.hoursSpent ?? l.hours ?? 0), 0);
      const first = logs[0];
      const newFirst = Math.max(0, Math.round((v - rest) * 10) / 10);
      this.timeLogService.updateTimeLog(first.id, { ...first, hours: newFirst, hoursSpent: newFirst, date: first.logDate || first.date || dayStr, logDate: first.logDate || first.date || dayStr } as any)
        .subscribe({ next: finish, error: () => this.build() });
    }
  }

  // ── Log time (explicit modal) ──
  openLog(): void {
    this.logForm = { taskId: this.tasks[0]?.id, date: this.iso(new Date()), hours: undefined, description: '' };
    this.showLogModal = true;
  }
  closeLog(): void { this.showLogModal = false; }
  submitLog(): void {
    if (!this.logForm.taskId) { this.toast.show('Veuillez sélectionner une tâche.', 'error'); return; }
    const hours = Number(this.logForm.hours);
    if (!hours || hours <= 0) { this.toast.show('Veuillez saisir un nombre d\'heures valide.', 'error'); return; }
    if (!this.logForm.date) { this.toast.show('Veuillez choisir une date.', 'error'); return; }
    this.savingLog = true;
    const dayStr = this.logForm.date;
    this.timeLogService.createTimeLog({
      taskId: this.logForm.taskId, hours, date: dayStr, description: this.logForm.description || '',
      hoursSpent: hours, logDate: dayStr
    } as any).subscribe({
      next: () => {
        this.savingLog = false;
        this.showLogModal = false;
        // Jump to the week of the logged day so the entry is visible, then refresh.
        this.weekStart = this.mondayOf(new Date(dayStr + 'T00:00:00'));
        this.fetchLogs();
        this.toast.show('Temps enregistré.', 'success');
      },
      error: () => { this.savingLog = false; this.toast.show('Échec de l\'enregistrement du temps.', 'error'); }
    });
  }

  exportCsv(): void {
    this.timeLogService.exportMyTimeLogsCsv().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'suivi-temps.csv'; a.click();
        window.URL.revokeObjectURL(url);
        this.toast.show('Export CSV généré.', 'success');
      },
      error: () => this.toast.show("Échec de l'export.", 'error')
    });
  }
}
