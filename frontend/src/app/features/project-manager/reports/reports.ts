import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProjectService, Project } from '../../../core/services/project.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface MemberRow { name: string; assignees: number; done: number; late: number; hours: number; rate: number; }
interface Donut { name: string; value: number; color: string; dash: string; offset: number; }

@Component({
  selector: 'app-pm-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="rep-wrap">

    <!-- ═══ Toolbar ═══ -->
    <div class="toolbar anim" style="--d:0s">
      <div class="filters">
        <select class="sel w48" [(ngModel)]="projectFilter" (change)="recompute()">
          <option value="">Tous les projets</option>
          <option *ngFor="let p of projectsList" [value]="p.id">{{ p.name }}</option>
        </select>
        <select class="sel w40" [(ngModel)]="periodFilter" (change)="recompute()">
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="all">Toute période</option>
        </select>
      </div>
      <div class="exports">
        <button class="btn-outline" (click)="exportPdf()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Exporter en PDF</button>
        <button class="btn-outline" (click)="exportCsv()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Exporter en CSV</button>
      </div>
    </div>

    <!-- ═══ KPI cards ═══ -->
    <div class="kpi-grid">
      <div class="kpi anim" *ngFor="let k of kpis; let i = index" [style.--d]="(0.05 + i*0.05)+'s'">
        <div class="kpi-l">{{ k.label }}</div>
        <div class="kpi-v" [ngClass]="k.tone">{{ k.value }}</div>
        <div class="kpi-s">{{ k.sub }}</div>
      </div>
    </div>

    <!-- ═══ Charts ═══ -->
    <div class="charts">
      <!-- Burndown -->
      <div class="card anim" style="--d:.2s">
        <h3>Burndown</h3>
        <div class="rc xy">
          <div class="y-axis"><span *ngFor="let t of burnTicks">{{ t }}</span></div>
          <div class="plot" (mousemove)="onMove($event, 'burn', burndown.length)" (mouseleave)="hover = null">
            <div class="gridline" *ngFor="let t of burnTicks" [style.top.%]="(1 - t/burnMax)*100"></div>
            <svg class="line-svg reveal" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline [attr.points]="burnIdeal" fill="none" stroke="#94a3b8" stroke-width="1.4" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"></polyline>
              <polyline class="draw" [attr.points]="burnReal" fill="none" stroke="#2563eb" stroke-width="1.9" vector-effect="non-scaling-stroke" pathLength="1"></polyline>
            </svg>
            <ng-container *ngIf="hover?.chart === 'burn' && burndown[hover!.i]">
              <div class="rcursor" [style.left.%]="hover!.leftPct"></div>
              <div class="rdot" [style.left.%]="hover!.leftPct" [style.top.%]="(1 - burndown[hover!.i].reel/burnMax)*100" style="background:#2563eb"></div>
              <div class="rtip" [style.left.%]="hover!.leftPct" [class.flip]="hover!.leftPct > 60">
                <div class="rtip-t">{{ burndown[hover!.i].label }}</div>
                <div class="rtip-r"><i class="d" style="background:#94a3b8"></i>Idéal<b>{{ burndown[hover!.i].ideal }}</b></div>
                <div class="rtip-r"><i class="d" style="background:#2563eb"></i>Réel<b>{{ burndown[hover!.i].reel }}</b></div>
              </div>
            </ng-container>
          </div>
          <div class="x-axis"><span *ngFor="let t of burnXTicks" [style.left.%]="(t.i/(burndown.length-1))*100">{{ t.label }}</span></div>
        </div>
        <div class="legend"><span class="lg"><i class="d dash" style="background:#94a3b8"></i> Idéal</span><span class="lg"><i class="d" style="background:#2563eb"></i> Réel</span></div>
      </div>

      <!-- Vélocité -->
      <div class="card anim" style="--d:.26s">
        <h3>Vélocité <span class="sub">(tâches / semaine)</span></h3>
        <div class="rc xy">
          <div class="y-axis"><span *ngFor="let t of velTicks">{{ t }}</span></div>
          <div class="plot" (mousemove)="onMove($event, 'vel', velocity.length)" (mouseleave)="hover = null">
            <div class="gridline" *ngFor="let t of velTicks" [style.top.%]="(1 - t/velMax)*100"></div>
            <div class="bars reveal">
              <div class="bar-col" *ngFor="let v of velocity"><div class="bar" [style.height.%]="animated ? (v.done/velMax)*100 : 0"></div></div>
            </div>
            <div class="rtip" *ngIf="hover?.chart === 'vel' && velocity[hover!.i]" [style.left.%]="hover!.leftPct" [class.flip]="hover!.leftPct > 60">
              <div class="rtip-t">{{ velocity[hover!.i].week }}</div>
              <div class="rtip-r"><i class="d" style="background:#2563eb"></i>Terminées<b>{{ velocity[hover!.i].done }}</b></div>
            </div>
          </div>
          <div class="x-axis bars-x"><span *ngFor="let v of velocity">{{ v.week }}</span></div>
        </div>
      </div>

      <!-- Répartition du temps (donut) -->
      <div class="card anim" style="--d:.32s">
        <h3>Répartition des tâches</h3>
        <div class="donut-split">
          <div class="donut-wrap reveal">
            <svg viewBox="0 0 36 36" class="donut">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef2f7" stroke-width="4"></circle>
              <circle class="dseg" *ngFor="let s of donut; let i = index" cx="18" cy="18" r="15.9155" fill="none" [attr.stroke]="s.color" stroke-width="4" [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset" (mouseenter)="donutHover = i" (mouseleave)="donutHover = -1"></circle>
            </svg>
            <div class="donut-center"><span class="dc-num">{{ donutTotal }}</span><span class="dc-lbl">tâches</span></div>
          </div>
          <ul class="donut-legend">
            <li *ngFor="let s of donut; let i = index" [class.on]="donutHover === i"><span class="d" [style.background]="s.color"></span><span class="nm">{{ s.name }}</span><span class="vl">{{ s.value }}</span></li>
            <li *ngIf="donut.length === 0" class="empty-li">Aucune tâche.</li>
          </ul>
        </div>
      </div>

      <!-- Taux de complétion par projet -->
      <div class="card anim" style="--d:.38s">
        <h3>Taux de complétion par projet</h3>
        <div class="rc xy">
          <div class="y-axis"><span *ngFor="let t of pctTicks">{{ t }}</span></div>
          <div class="plot" (mousemove)="onMove($event, 'cmp', completion.length)" (mouseleave)="hover = null">
            <div class="gridline" *ngFor="let t of pctTicks" [style.top.%]="(1 - t/100)*100"></div>
            <div class="gbars reveal">
              <div class="gbar-group" *ngFor="let c of completion">
                <div class="gbar plan" [style.height.%]="animated ? c.planned : 0"></div>
                <div class="gbar real" [style.height.%]="animated ? c.actual : 0"></div>
              </div>
            </div>
            <div class="rtip" *ngIf="hover?.chart === 'cmp' && completion[hover!.i]" [style.left.%]="hover!.leftPct" [class.flip]="hover!.leftPct > 60">
              <div class="rtip-t">{{ completion[hover!.i].name }}</div>
              <div class="rtip-r"><i class="d" style="background:#1e293b"></i>Planifié<b>{{ completion[hover!.i].planned }}%</b></div>
              <div class="rtip-r"><i class="d" style="background:#2563eb"></i>Réel<b>{{ completion[hover!.i].actual }}%</b></div>
            </div>
          </div>
          <div class="x-axis bars-x"><span *ngFor="let c of completion">{{ c.name }}</span></div>
        </div>
        <div class="legend"><span class="lg"><i class="d" style="background:#1e293b"></i> Planifié</span><span class="lg"><i class="d" style="background:#2563eb"></i> Réel</span></div>
      </div>
    </div>

    <!-- ═══ Performance par membre ═══ -->
    <div class="card no-pad anim" style="--d:.44s">
      <div class="card-bar">Performance par membre</div>
      <div class="table-scroll">
        <table class="perf-table">
          <thead><tr><th>Membre</th><th>Assignées</th><th>Terminées</th><th>En retard</th><th>Heures loguées</th><th>Taux</th></tr></thead>
          <tbody>
            <tr *ngFor="let m of members">
              <td class="td-name">{{ m.name }}</td>
              <td>{{ m.assignees }}</td>
              <td class="ok">{{ m.done }}</td>
              <td class="bad">{{ m.late }}</td>
              <td>{{ m.hours }}h</td>
              <td class="rate">{{ m.rate }}%</td>
            </tr>
            <tr *ngIf="members.length === 0"><td colspan="6"><div class="empty">Aucune donnée membre.</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ Jalons ═══ -->
    <div class="card anim" style="--d:.5s">
      <h3>Jalons</h3>
      <ol class="timeline">
        <li class="ti" *ngFor="let j of milestones">
          <span class="dot" [ngClass]="j.cls"></span>
          <div class="ti-line">
            <div><div class="ti-name">{{ j.name }}</div><div class="ti-sub">Prévu : {{ j.planned }} · Réel : {{ j.actual }}</div></div>
            <span class="ti-status" [ngClass]="j.cls">{{ j.statusLabel }}</span>
          </div>
        </li>
        <li *ngIf="milestones.length === 0" class="empty">Aucun jalon.</li>
      </ol>
    </div>
  </div>
  `,
  styles: [`
    .rep-wrap { display: flex; flex-direction: column; gap: 20px; }
    @keyframes rFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes rWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    @keyframes rDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
    .anim { animation: rFade .5s ease both; animation-delay: var(--d, 0s); }
    .reveal { animation: rWipe .9s cubic-bezier(.4,0,.2,1) both; }
    .draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: rDraw 1.1s ease forwards .2s; }

    .toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
    .filters { display: flex; flex-wrap: wrap; gap: 8px; }
    .sel { height: 38px; padding: 0 30px 0 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 12.5px; font-weight: 500; color: #475569; background: #fff; cursor: pointer; outline: none; appearance: none; -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; }
    .sel.w48 { width: 200px; } .sel.w40 { width: 160px; }
    .exports { display: flex; gap: 8px; }
    .btn-outline { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; font-family: inherit; } .btn-outline svg { width: 15px; height: 15px; } .btn-outline:hover { background: #f8fafc; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 16px; }
    .kpi-l { font-size: 12px; color: #64748b; }
    .kpi-v { font-size: 24px; font-weight: 800; margin-top: 4px; line-height: 1; }
    .kpi-v.success { color: #16a34a; } .kpi-v.primary { color: #2563eb; } .kpi-v.navy { color: #1e293b; } .kpi-v.info { color: #0891b2; }
    .kpi-s { font-size: 11px; color: #94a3b8; margin-top: 5px; }

    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    @media (max-width: 1024px) { .charts { grid-template-columns: 1fr; } }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 18px 20px; }
    .card.no-pad { padding: 0; overflow: hidden; }
    .card h3 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 14px; } .card h3 .sub { color: #94a3b8; font-weight: 500; font-size: 11.5px; }
    .card-bar { padding: 13px 20px; border-bottom: 1px solid #eef2f7; background: #f8fafc; font-size: 14px; font-weight: 700; color: #1e293b; }

    /* chart layout */
    .rc.xy { display: grid; grid-template-columns: 30px 1fr; grid-template-rows: 1fr 20px; column-gap: 8px; height: 240px; }
    .y-axis { grid-column: 1; grid-row: 1; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; padding: 1px 0; }
    .y-axis span { font-size: 10px; color: #94a3b8; }
    .plot { grid-column: 2; grid-row: 1; position: relative; }
    .x-axis { grid-column: 2; grid-row: 2; position: relative; }
    .x-axis span { position: absolute; top: 4px; transform: translateX(-50%); font-size: 9.5px; color: #94a3b8; white-space: nowrap; }
    .x-axis.bars-x { display: flex; padding: 0; } .x-axis.bars-x span { position: static; flex: 1; text-align: center; transform: none; overflow: hidden; text-overflow: ellipsis; }
    .gridline { position: absolute; left: 0; right: 0; border-top: 1px dashed #e2e8f0; }
    .line-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .rcursor { position: absolute; top: 0; bottom: 0; width: 1px; background: #94a3b8; opacity: .4; pointer-events: none; }
    .rdot { position: absolute; width: 8px; height: 8px; border-radius: 50%; border: 2px solid #fff; transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 1px 2px rgba(0,0,0,.2); }
    .rtip { position: absolute; z-index: 8; top: 6px; transform: translateX(10px); background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 24px rgba(15,23,42,.16); padding: 8px 11px; min-width: 130px; pointer-events: none; }
    .rtip.flip { transform: translateX(-100%) translateX(-10px); }
    .rtip-t { font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 5px; }
    .rtip-r { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; line-height: 1.7; } .rtip-r b { margin-left: auto; color: #1e293b; padding-left: 10px; } .rtip-r .d { width: 8px; height: 8px; border-radius: 50%; }
    .legend { display: flex; gap: 16px; margin-top: 12px; } .lg { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; } .lg .d { width: 9px; height: 9px; border-radius: 3px; } .lg .d.dash { border-radius: 1px; height: 3px; width: 12px; }

    .bars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 8px; padding: 0 6px; }
    .bar-col { flex: 1; display: flex; align-items: flex-end; justify-content: center; height: 100%; }
    .bar { width: 70%; max-width: 28px; background: #2563eb; border-radius: 4px 4px 0 0; min-height: 1px; transition: height .8s cubic-bezier(.4,0,.2,1); }
    .gbars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 12px; padding: 0 6px; }
    .gbar-group { flex: 1; display: flex; align-items: flex-end; justify-content: center; gap: 4px; height: 100%; }
    .gbar { width: 13px; border-radius: 4px 4px 0 0; min-height: 1px; transition: height .8s cubic-bezier(.4,0,.2,1); }
    .gbar.plan { background: #1e293b; } .gbar.real { background: #2563eb; }

    .donut-split { display: flex; align-items: center; gap: 16px; }
    .donut-wrap { position: relative; width: 46%; max-width: 150px; } .donut { width: 100%; transform: rotate(-90deg); }
    .donut .dseg { cursor: pointer; transition: opacity .15s ease, stroke-width .15s ease; } .donut:hover .dseg { opacity: .4; } .donut .dseg:hover { opacity: 1; stroke-width: 5; }
    .donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; } .dc-num { font-size: 20px; font-weight: 800; color: #1e293b; } .dc-lbl { font-size: 10px; color: #94a3b8; }
    .donut-legend { flex: 1; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
    .donut-legend li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; border-radius: 6px; padding: 2px 4px; } .donut-legend li.on { background: #f8fafc; }
    .donut-legend .d { width: 10px; height: 10px; border-radius: 50%; } .donut-legend .nm { color: #64748b; } .donut-legend .vl { margin-left: auto; font-weight: 700; color: #1e293b; } .empty-li { color: #94a3b8; }

    .table-scroll { overflow-x: auto; }
    .perf-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .perf-table thead { background: #f8fafc; } .perf-table th { text-align: left; padding: 11px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #94a3b8; }
    .perf-table td { padding: 11px 16px; border-top: 1px solid #eef2f7; color: #475569; } .td-name { font-weight: 600; color: #1e293b; } .ok { color: #16a34a; } .bad { color: #dc2626; } .rate { font-weight: 700; color: #1e293b; }
    .empty { padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; }

    .timeline { position: relative; list-style: none; margin: 0; padding: 0 0 0 18px; border-left: 2px solid #e2e8f0; }
    .ti { position: relative; margin-bottom: 16px; } .ti:last-child { margin-bottom: 0; }
    .dot { position: absolute; left: -25px; top: 3px; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 2px #fff; }
    .dot.ok { background: #16a34a; } .dot.bad { background: #dc2626; } .dot.soon { background: #2563eb; }
    .ti-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .ti-name { font-size: 13px; font-weight: 600; color: #1e293b; } .ti-sub { font-size: 11.5px; color: #64748b; margin-top: 2px; }
    .ti-status { font-size: 11.5px; font-weight: 600; } .ti-status.ok { color: #16a34a; } .ti-status.bad { color: #dc2626; } .ti-status.soon { color: #2563eb; }
  `]
})
export class PmReportsComponent implements OnInit {
  managerId = 0;
  projectsList: Project[] = [];
  private tasks: Task[] = [];
  animated = false;

  projectFilter = '';
  periodFilter = 'month';

  kpis: { label: string; value: string; sub: string; tone: string }[] = [];
  burndown: { label: string; ideal: number; reel: number }[] = [];
  burnMax = 1; burnTicks: number[] = []; burnXTicks: { i: number; label: string }[] = []; burnIdeal = ''; burnReal = '';
  velocity: { week: string; done: number }[] = [];
  velMax = 1; velTicks: number[] = [];
  donut: Donut[] = []; donutTotal = 0; donutHover = -1;
  completion: { name: string; planned: number; actual: number }[] = [];
  pctTicks = [100, 75, 50, 25, 0];
  members: MemberRow[] = [];
  milestones: { name: string; planned: string; actual: string; cls: string; statusLabel: string }[] = [];

  hover: { chart: string; i: number; leftPct: number } | null = null;

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.managerId = this.authService.getCurrentUser()?.id || 0;
    this.load();
  }

  private load(): void {
    this.projectService.getProjectsByManager(this.managerId, 0, 100).subscribe({
      next: (r: any) => {
        this.projectsList = r && r.data ? r.data : [];
        this.taskService.getAllTasks(0, 500).subscribe({
          next: (tr: any) => {
            const pids = this.projectsList.map(p => p.id);
            const all: Task[] = tr && tr.data ? tr.data : [];
            this.tasks = pids.length ? all.filter(t => pids.includes(t.projectId)) : all;
            this.recompute();
          },
          error: () => { this.tasks = []; this.recompute(); }
        });
      },
      error: () => { this.projectsList = []; this.recompute(); }
    });
  }

  recompute(): void {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cutoff = this.periodFilter === 'week' ? today.getTime() - 7 * 86400000
      : this.periodFilter === 'month' ? today.getTime() - 30 * 86400000 : 0;

    const inProj = (t: Task) => !this.projectFilter || t.projectId === +this.projectFilter;
    const inPeriod = (t: Task) => { if (!cutoff) return true; const c = t.createdAt || t.updatedAt; return c ? new Date(c).getTime() >= cutoff : true; };
    const ts = this.tasks.filter(t => inProj(t) && inPeriod(t));
    const projs = this.projectsList.filter(p => !this.projectFilter || p.id === +this.projectFilter);

    // KPIs
    const completedProjects = projs.filter(p => (p.status || '').toUpperCase() === 'COMPLETED').length;
    const completedTasks = ts.filter(t => (t.status || '').toUpperCase() === 'COMPLETED');
    const withDeadline = completedTasks.filter(t => t.deadline);
    const onTime = withDeadline.filter(t => { const done = t.updatedAt ? new Date(t.updatedAt) : null; return done && t.deadline && done <= new Date(t.deadline + 'T23:59:59'); }).length;
    const onTimeRate = withDeadline.length ? Math.round(onTime / withDeadline.length * 100) : 0;
    const hours = Math.round(ts.reduce((s, t) => s + (t.totalHoursLogged || 0), 0));
    this.kpis = [
      { label: 'Projets terminés', value: `${completedProjects}`, sub: `${projs.length} projet(s) suivis`, tone: 'success' },
      { label: 'Taux de respect des délais', value: `${onTimeRate}%`, sub: `${onTime}/${withDeadline.length} à temps`, tone: 'primary' },
      { label: 'Heures totales loguées', value: `${hours.toLocaleString('fr-FR')}h`, sub: this.periodLabel(), tone: 'navy' },
      { label: 'Tâches livrées', value: `${completedTasks.length}`, sub: `${ts.length} au total`, tone: 'info' }
    ];

    this.buildBurndown(ts, today);
    this.buildVelocity(ts, today);
    this.buildDonut(ts);
    this.buildCompletion(projs);
    this.buildMembers(ts, today);
    this.buildMilestones(projs, today);

    this.animated = false;
    this.cdr.detectChanges();
    setTimeout(() => { this.animated = true; this.cdr.detectChanges(); }, 60);
  }

  private periodLabel(): string { return this.periodFilter === 'week' ? '7 derniers jours' : this.periodFilter === 'month' ? '30 derniers jours' : 'Toute période'; }

  /** Weekly buckets (last 8 weeks) — remaining open per week (burndown) + completed per week (velocity). */
  private weekBuckets(ts: Task[], today: Date): { label: string; created: number; completed: number }[] {
    const weeks = 8; const out: { label: string; created: number; completed: number }[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date(today); end.setDate(today.getDate() - i * 7);
      const start = new Date(end); start.setDate(end.getDate() - 6);
      const created = ts.filter(t => { const c = t.createdAt ? new Date(t.createdAt) : null; return c && c >= start && c <= end; }).length;
      const completed = ts.filter(t => (t.status || '').toUpperCase() === 'COMPLETED' && t.updatedAt && new Date(t.updatedAt) >= start && new Date(t.updatedAt) <= end).length;
      out.push({ label: `S${this.isoWeek(end)}`, created, completed });
    }
    return out;
  }
  private isoWeek(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7; date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    return 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  }

  private buildBurndown(ts: Task[], today: Date): void {
    const buckets = this.weekBuckets(ts, today);
    const totalOpen = ts.filter(t => (t.status || '').toUpperCase() !== 'COMPLETED').length || ts.length;
    let remaining = totalOpen + buckets.reduce((s, b) => s + b.completed, 0);
    this.burndown = buckets.map((b, i) => {
      remaining = Math.max(0, remaining - b.completed);
      const ideal = Math.round((totalOpen + buckets.reduce((s, x) => s + x.completed, 0)) * (1 - (i + 1) / buckets.length));
      return { label: b.label, ideal: Math.max(0, ideal), reel: remaining };
    });
    this.burnMax = Math.max(4, ...this.burndown.map(d => Math.max(d.ideal, d.reel)));
    this.burnTicks = this.ticks(this.burnMax);
    this.burnXTicks = this.burndown.map((d, i) => ({ i, label: d.label })).filter((_, i) => i % 2 === 0);
    this.burnIdeal = this.line(this.burndown.map(d => d.ideal), this.burnMax);
    this.burnReal = this.line(this.burndown.map(d => d.reel), this.burnMax);
  }

  private buildVelocity(ts: Task[], today: Date): void {
    this.velocity = this.weekBuckets(ts, today).map(b => ({ week: b.label, done: b.completed }));
    this.velMax = Math.max(4, ...this.velocity.map(v => v.done));
    this.velTicks = this.ticks(this.velMax);
  }

  private buildDonut(ts: Task[]): void {
    const groups = [
      { name: 'À faire', keys: ['TODO', 'PLANNED'], color: '#1e293b' },
      { name: 'En cours', keys: ['IN_PROGRESS'], color: '#2563eb' },
      { name: 'Terminé', keys: ['COMPLETED'], color: '#22c55e' },
      { name: 'En pause', keys: ['ON_HOLD'], color: '#f97316' },
      { name: 'En retard', keys: ['OVERDUE'], color: '#a855f7' }
    ];
    const counts = groups.map(g => ({ ...g, value: ts.filter(t => g.keys.includes((t.status || '').toUpperCase())).length }));
    this.donutTotal = counts.reduce((s, c) => s + c.value, 0);
    const total = this.donutTotal || 1;
    let acc = 0;
    this.donut = counts.filter(c => c.value > 0).map(c => {
      const pct = (c.value / total) * 100;
      const seg: Donut = { name: c.name, value: c.value, color: c.color, dash: `${Math.max(0, pct - 1.2)} ${100 - Math.max(0, pct - 1.2)}`, offset: -acc };
      acc += pct; return seg;
    });
  }

  private buildCompletion(projs: Project[]): void {
    this.completion = projs.slice(0, 6).map(p => ({ name: (p.name || '').split(' ').slice(0, 2).join(' '), planned: 100, actual: p.progress || 0 }));
  }

  private buildMembers(ts: Task[], today: Date): void {
    const map: Record<string, MemberRow> = {};
    ts.forEach(t => {
      const name = t.assignedToName || null; if (!name) return;
      const r = map[name] = map[name] || { name, assignees: 0, done: 0, late: 0, hours: 0, rate: 0 };
      r.assignees++;
      const st = (t.status || '').toUpperCase();
      if (st === 'COMPLETED') r.done++;
      else if (t.deadline && new Date(t.deadline) < today) r.late++;
      r.hours += t.totalHoursLogged || 0;
    });
    this.members = Object.values(map).map(r => ({ ...r, hours: Math.round(r.hours), rate: r.assignees ? Math.round(r.done / r.assignees * 100) : 0 }))
      .sort((a, b) => b.assignees - a.assignees);
  }

  private buildMilestones(projs: Project[], today: Date): void {
    this.milestones = projs.filter(p => p.endDate).slice(0, 6).map(p => {
      const end = new Date(p.endDate!);
      const completed = (p.status || '').toUpperCase() === 'COMPLETED';
      const overdue = !completed && end < today;
      const cls = completed ? 'ok' : overdue ? 'bad' : 'soon';
      return { name: p.name, planned: end.toLocaleDateString('fr-FR'), actual: completed ? end.toLocaleDateString('fr-FR') : '—', cls, statusLabel: completed ? 'Atteint' : overdue ? 'Manqué' : 'À venir' };
    });
  }

  // ── chart helpers ──
  private ticks(max: number): number[] { const m = Math.ceil(max / 4) * 4; return [m, Math.round(m * .75), Math.round(m * .5), Math.round(m * .25), 0]; }
  private line(vals: number[], max: number): string {
    const n = vals.length; if (n < 2) return '';
    return vals.map((v, i) => `${((i / (n - 1)) * 100).toFixed(2)} ${(100 - (v / max) * 100).toFixed(2)}`).join(' ');
  }
  onMove(e: MouseEvent, chart: string, n: number): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!rect.width || n < 1) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const i = n > 1 ? Math.round(ratio * (n - 1)) : 0;
    this.hover = { chart, i, leftPct: n > 1 ? (i / (n - 1)) * 100 : 50 };
  }

  // ── exports ──
  exportCsv(): void {
    const rows = [['Membre', 'Assignées', 'Terminées', 'En retard', 'Heures', 'Taux']];
    this.members.forEach(m => rows.push([m.name, `${m.assignees}`, `${m.done}`, `${m.late}`, `${m.hours}`, `${m.rate}%`]));
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'rapport-performance.csv'; a.click(); URL.revokeObjectURL(url);
    this.toast.show('Export CSV généré.', 'success');
  }
  exportPdf(): void {
    const esc = (s: any) => (s ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const rows = this.members.map(m => `<tr><td>${esc(m.name)}</td><td>${m.assignees}</td><td>${m.done}</td><td>${m.late}</td><td>${m.hours}h</td><td>${m.rate}%</td></tr>`).join('');
    const kpi = this.kpis.map(k => `<div style="display:inline-block;margin-right:18px"><b>${k.label} :</b> ${esc(k.value)}</div>`).join('');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport</title><style>body{font-family:Inter,Arial,sans-serif;color:#1e293b;padding:24px}h1{font-size:18px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}th{background:#f1f5f9;text-align:left;padding:8px;font-size:10px;text-transform:uppercase;color:#64748b}td{padding:8px;border-top:1px solid #e2e8f0}@media print{@page{margin:14mm}}</style></head><body><h1>Rapport — Performance de l'équipe</h1><p style="font-size:12px;color:#64748b">${kpi}</p><table><thead><tr><th>Membre</th><th>Assignées</th><th>Terminées</th><th>En retard</th><th>Heures</th><th>Taux</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print()}<\/script></body></html>`;
    const w = window.open('', '_blank'); if (!w) { this.toast.show('Autorisez les pop-ups pour le PDF.', 'error'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    this.toast.show('Aperçu PDF ouvert.', 'success');
  }
}
