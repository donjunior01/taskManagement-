import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ToastService } from '../../../core/services/toast.service';

interface Donut { name: string; value: number; color: string; dash: string; offset: number; }

@Component({
  selector: 'app-pm-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="an-wrap">

    <!-- ═══ KPI cards ═══ -->
    <div class="kpi-grid">
      <div class="kpi anim" *ngFor="let k of kpis; let i = index" [style.--d]="(i*0.05)+'s'">
        <div class="kpi-l">{{ k.label }}</div>
        <div class="kpi-v" [ngClass]="k.tone">{{ k.value }}</div>
        <div class="kpi-s">{{ k.sub }}</div>
      </div>
    </div>

    <div class="charts">
      <!-- Tendance hebdomadaire -->
      <div class="card anim" style="--d:.2s">
        <h3>Tendance hebdomadaire <span class="sub">(8 semaines)</span></h3>
        <div class="rc xy">
          <div class="y-axis"><span *ngFor="let t of trendTicks">{{ t }}</span></div>
          <div class="plot" (mousemove)="onMove($event, 'trend', trend.length)" (mouseleave)="hover = null">
            <div class="gridline" *ngFor="let t of trendTicks" [style.top.%]="(1 - t/trendMax)*100"></div>
            <div class="gbars reveal">
              <div class="gbar-group" *ngFor="let p of trend">
                <div class="gbar created" [style.height.%]="animated ? (p.created/trendMax)*100 : 0"></div>
                <div class="gbar done" [style.height.%]="animated ? (p.completed/trendMax)*100 : 0"></div>
              </div>
            </div>
            <div class="rtip" *ngIf="hover?.chart === 'trend' && trend[hover!.i]" [style.left.%]="hover!.leftPct" [class.flip]="hover!.leftPct > 60">
              <div class="rtip-t">{{ trend[hover!.i].label }}</div>
              <div class="rtip-r"><i class="d" style="background:#94a3b8"></i>Créées<b>{{ trend[hover!.i].created }}</b></div>
              <div class="rtip-r"><i class="d" style="background:#2563eb"></i>Terminées<b>{{ trend[hover!.i].completed }}</b></div>
            </div>
          </div>
          <div class="x-axis bars-x"><span *ngFor="let p of trend">{{ p.label }}</span></div>
        </div>
        <div class="legend"><span class="lg"><i class="d" style="background:#94a3b8"></i> Créées</span><span class="lg"><i class="d" style="background:#2563eb"></i> Terminées</span></div>
      </div>

      <!-- Répartition des tâches -->
      <div class="card anim" style="--d:.26s">
        <h3>Répartition des tâches</h3>
        <div class="donut-split">
          <div class="donut-wrap reveal">
            <svg viewBox="0 0 36 36" class="donut">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef2f7" stroke-width="4"></circle>
              <circle class="dseg" *ngFor="let s of donut; let i = index" cx="18" cy="18" r="15.9155" fill="none" [attr.stroke]="s.color" stroke-width="4" [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset" (mouseenter)="donutHover = i" (mouseleave)="donutHover = -1"></circle>
            </svg>
            <div class="donut-center"><span class="dc-num">{{ totalTasks }}</span><span class="dc-lbl">tâches</span></div>
          </div>
          <ul class="donut-legend">
            <li *ngFor="let s of donut; let i = index" [class.on]="donutHover === i"><span class="d" [style.background]="s.color"></span><span class="nm">{{ s.name }}</span><span class="vl">{{ s.value }}</span></li>
            <li *ngIf="donut.length === 0" class="empty-li">Aucune tâche.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Charge par membre -->
    <div class="card anim" style="--d:.32s">
      <h3>Charge par membre</h3>
      <div class="work reveal">
        <div class="work-row" *ngFor="let m of workload; let i = index" (mouseenter)="whover = i" (mouseleave)="whover = -1">
          <span class="w-name" [title]="m.name">{{ m.name }}</span>
          <div class="w-track">
            <div class="w-bar open" [style.width.%]="animated ? (m.open/workMax)*100 : 0"></div>
            <div class="w-bar done" [style.width.%]="animated ? (m.done/workMax)*100 : 0"></div>
          </div>
          <span class="w-total">{{ m.open + m.done }}</span>
          <div class="w-tip" *ngIf="whover === i">
            <div class="rtip-t">{{ m.name }}</div>
            <div class="rtip-r"><i class="d" style="background:#f97316"></i>En cours<b>{{ m.open }}</b></div>
            <div class="rtip-r"><i class="d" style="background:#2563eb"></i>Terminées<b>{{ m.done }}</b></div>
          </div>
        </div>
        <div class="empty" *ngIf="workload.length === 0">Aucune donnée d'équipe.</div>
      </div>
      <div class="legend"><span class="lg"><i class="d" style="background:#f97316"></i> En cours</span><span class="lg"><i class="d" style="background:#2563eb"></i> Terminées</span></div>
    </div>
  </div>
  `,
  styles: [`
    .an-wrap { display: flex; flex-direction: column; gap: 20px; }
    @keyframes aFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes aWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    .anim { animation: aFade .5s ease both; animation-delay: var(--d, 0s); }
    .reveal { animation: aWipe .9s cubic-bezier(.4,0,.2,1) both; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 16px; }
    .kpi-l { font-size: 12px; color: #64748b; }
    .kpi-v { font-size: 24px; font-weight: 800; margin-top: 4px; line-height: 1; }
    .kpi-v.success { color: #16a34a; } .kpi-v.primary { color: #2563eb; } .kpi-v.navy { color: #1e293b; } .kpi-v.danger { color: #dc2626; }
    .kpi-s { font-size: 11px; color: #94a3b8; margin-top: 5px; }

    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    @media (max-width: 1024px) { .charts { grid-template-columns: 1fr; } }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 18px 20px; }
    .card h3 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 14px; } .card h3 .sub { color: #94a3b8; font-weight: 500; font-size: 11.5px; }

    .rc.xy { display: grid; grid-template-columns: 30px 1fr; grid-template-rows: 1fr 20px; column-gap: 8px; height: 240px; }
    .y-axis { grid-column: 1; grid-row: 1; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; } .y-axis span { font-size: 10px; color: #94a3b8; }
    .plot { grid-column: 2; grid-row: 1; position: relative; }
    .x-axis { grid-column: 2; grid-row: 2; position: relative; } .x-axis.bars-x { display: flex; } .x-axis.bars-x span { flex: 1; text-align: center; font-size: 9.5px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .gridline { position: absolute; left: 0; right: 0; border-top: 1px dashed #e2e8f0; }
    .gbars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 10px; padding: 0 6px; }
    .gbar-group { flex: 1; display: flex; align-items: flex-end; justify-content: center; gap: 4px; height: 100%; }
    .gbar { width: 13px; border-radius: 4px 4px 0 0; min-height: 1px; transition: height .8s cubic-bezier(.4,0,.2,1); }
    .gbar.created { background: #94a3b8; } .gbar.done { background: #2563eb; }
    .rtip { position: absolute; z-index: 8; top: 6px; transform: translateX(10px); background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 24px rgba(15,23,42,.16); padding: 8px 11px; min-width: 130px; pointer-events: none; }
    .rtip.flip { transform: translateX(-100%) translateX(-10px); }
    .rtip-t { font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 5px; }
    .rtip-r { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; line-height: 1.7; } .rtip-r b { margin-left: auto; color: #1e293b; padding-left: 10px; } .rtip-r .d { width: 8px; height: 8px; border-radius: 50%; }
    .legend { display: flex; gap: 16px; margin-top: 12px; } .lg { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; } .lg .d { width: 9px; height: 9px; border-radius: 3px; }

    .donut-split { display: flex; align-items: center; gap: 16px; }
    .donut-wrap { position: relative; width: 46%; max-width: 150px; } .donut { width: 100%; transform: rotate(-90deg); }
    .donut .dseg { cursor: pointer; transition: opacity .15s ease, stroke-width .15s ease; } .donut:hover .dseg { opacity: .4; } .donut .dseg:hover { opacity: 1; stroke-width: 5; }
    .donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; } .dc-num { font-size: 20px; font-weight: 800; color: #1e293b; } .dc-lbl { font-size: 10px; color: #94a3b8; }
    .donut-legend { flex: 1; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
    .donut-legend li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; border-radius: 6px; padding: 2px 4px; } .donut-legend li.on { background: #f8fafc; }
    .donut-legend .d { width: 10px; height: 10px; border-radius: 50%; } .donut-legend .nm { color: #64748b; } .donut-legend .vl { margin-left: auto; font-weight: 700; color: #1e293b; } .empty-li { color: #94a3b8; }

    .work { display: flex; flex-direction: column; gap: 12px; min-height: 80px; }
    .work-row { position: relative; display: grid; grid-template-columns: 110px 1fr 34px; align-items: center; gap: 10px; padding: 2px 4px; border-radius: 8px; }
    .work-row:hover { background: #f8fafc; }
    .w-name { font-size: 12px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .w-track { display: flex; flex-direction: column; gap: 3px; }
    .w-bar { height: 10px; border-radius: 0 4px 4px 0; min-width: 2px; transition: width .8s cubic-bezier(.4,0,.2,1); } .w-bar.open { background: #f97316; } .w-bar.done { background: #2563eb; }
    .w-total { font-size: 11px; font-weight: 700; color: #475569; text-align: right; }
    .w-tip { position: absolute; z-index: 20; right: 4px; bottom: calc(100% + 6px); min-width: 150px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 24px rgba(15,23,42,.16); padding: 9px 11px; pointer-events: none; }
    .empty { padding: 20px; text-align: center; color: #94a3b8; font-size: 12.5px; }
  `]
})
export class PmAnalyticsComponent implements OnInit {
  loading = true;
  animated = false;
  hover: { chart: string; i: number; leftPct: number } | null = null;
  donutHover = -1;
  whover = -1;

  kpis: { label: string; value: string; sub: string; tone: string }[] = [];
  trend: { label: string; created: number; completed: number }[] = [];
  trendMax = 1; trendTicks: number[] = [];
  workload: { name: string; open: number; done: number }[] = [];
  workMax = 1;
  donut: Donut[] = []; totalTasks = 0;

  constructor(private analyticsService: AnalyticsService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.analyticsService.getManagerAnalytics().subscribe({
      next: (r: any) => { this.apply(r?.data || r || {}); this.loading = false; this.reveal(); },
      error: () => { this.loading = false; this.toast.show('Impossible de charger les analyses.', 'error'); this.cdr.detectChanges(); }
    });
  }

  private reveal(): void {
    this.animated = false; this.cdr.detectChanges();
    setTimeout(() => { this.animated = true; this.cdr.detectChanges(); }, 70);
  }

  private apply(a: any): void {
    this.kpis = [
      { label: 'Tâches terminées', value: `${a.completedTasks ?? 0}`, sub: `${a.totalTasks ?? 0} au total`, tone: 'success' },
      { label: 'Taux à temps', value: `${Math.round(a.onTimeCompletionRate ?? 0)}%`, sub: 'des tâches avec échéance', tone: 'primary' },
      { label: 'Tâches en retard', value: `${a.overdueTasks ?? 0}`, sub: `${a.openTasks ?? 0} ouvertes`, tone: 'danger' },
      { label: 'Vélocité (4 sem.)', value: `${a.velocityLast4Weeks ?? 0}`, sub: `délai moyen ${a.avgCompletionDays ?? 0} j`, tone: 'navy' }
    ];

    this.trend = (a.weeklyTrend || []).map((p: any) => ({ label: p.label, created: p.created || 0, completed: p.completed || 0 }));
    this.trendMax = Math.max(4, ...this.trend.map(p => Math.max(p.created, p.completed)));
    this.trendMax = Math.ceil(this.trendMax / 4) * 4;
    this.trendTicks = [this.trendMax, Math.round(this.trendMax * .75), Math.round(this.trendMax * .5), Math.round(this.trendMax * .25), 0];

    this.workload = (a.workloadByMember || []).map((m: any) => ({ name: m.memberName, open: m.openTasks || 0, done: m.completedTasks || 0 }))
      .sort((x: any, y: any) => (y.open + y.done) - (x.open + x.done)).slice(0, 8);
    this.workMax = Math.max(1, ...this.workload.map(m => m.open + m.done));

    const groups = [
      { name: 'À faire', value: a.todoTasks ?? 0, color: '#1e293b' },
      { name: 'En cours', value: a.inProgressTasks ?? 0, color: '#2563eb' },
      { name: 'Terminé', value: a.completedTasks ?? 0, color: '#22c55e' },
      { name: 'En pause', value: a.onHoldTasks ?? 0, color: '#f97316' },
      { name: 'En retard', value: a.overdueTasks ?? 0, color: '#a855f7' }
    ];
    this.totalTasks = groups.reduce((s, g) => s + g.value, 0);
    const total = this.totalTasks || 1; let acc = 0;
    this.donut = groups.filter(g => g.value > 0).map(g => {
      const pct = (g.value / total) * 100;
      const seg: Donut = { name: g.name, value: g.value, color: g.color, dash: `${Math.max(0, pct - 1.2)} ${100 - Math.max(0, pct - 1.2)}`, offset: -acc };
      acc += pct; return seg;
    });
  }

  onMove(e: MouseEvent, chart: string, n: number): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!rect.width || n < 1) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const i = n > 1 ? Math.round(ratio * (n - 1)) : 0;
    this.hover = { chart, i, leftPct: n > 1 ? (i / (n - 1)) * 100 : 50 };
  }
}
