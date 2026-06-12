import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../core/services/analytics.service';

interface Kpi { label: string; value: string; tone: string; }
interface LoadPoint { minute: string; cpu: number; memory: number; requests: number; avgMs: number; }
interface SlowEp { endpoint: string; avgMs: number; maxMs: number; count: number; }
interface RecentErr { status: number; endpoint: string; at: string; }

@Component({
  selector: 'app-admin-performance',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="perf-wrap">

    <!-- KPI tiles -->
    <div class="kpi-row">
      <div class="kpi-tile anim" *ngFor="let k of kpis; let i = index" [style.--d]="(i*0.05)+'s'">
        <div class="kpi-val" [ngClass]="'t-' + k.tone">{{ k.value }}</div>
        <div class="kpi-lbl">{{ k.label }}</div>
      </div>
    </div>

    <!-- Server load chart -->
    <div class="page-card anim" style="--d:.1s">
      <div class="page-card-header">
        <div>
          <h3 class="card-title">Charge serveur — temps réel</h3>
          <span class="card-sub">60 dernières minutes</span>
        </div>
        <span class="badge" [ngClass]="health.cls">● {{ health.label }}</span>
      </div>
      <div class="chart-body">
        <div class="rc xy">
          <div class="y-axis"><span *ngFor="let t of pctTicks">{{ t }}</span></div>
          <div class="plot" (mousemove)="onMove($event, serverLoad.length)" (mouseleave)="hoverI = -1">
            <div class="gridline" *ngFor="let t of pctTicks" [style.top.%]="(1 - t/100)*100"></div>
            <svg class="line-svg reveal" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--primary)" stop-opacity="0.40"></stop><stop offset="100%" stop-color="var(--primary)" stop-opacity="0"></stop></linearGradient>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity="0.32"></stop><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"></stop></linearGradient>
              </defs>
              <path [attr.d]="memArea" fill="url(#memGrad)"></path>
              <path [attr.d]="cpuArea" fill="url(#cpuGrad)"></path>
              <polyline class="draw" [attr.points]="memLine" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" pathLength="1"></polyline>
              <polyline class="draw" [attr.points]="cpuLine" fill="none" stroke="var(--primary)" stroke-width="1.6" vector-effect="non-scaling-stroke" pathLength="1"></polyline>
            </svg>
            <ng-container *ngIf="hoverI >= 0 && serverLoad[hoverI]">
              <div class="rcursor" [style.left.%]="leftPct"></div>
              <div class="rdot" [style.left.%]="leftPct" [style.top.%]="(1 - serverLoad[hoverI].cpu/100)*100" style="background:var(--primary)"></div>
              <div class="rdot" [style.left.%]="leftPct" [style.top.%]="(1 - serverLoad[hoverI].memory/100)*100" style="background:var(--accent)"></div>
              <div class="rtip" [style.left.%]="leftPct" [class.flip]="leftPct > 65">
                <div class="rtip-t">{{ serverLoad[hoverI].minute }}</div>
                <div class="rtip-r"><i class="d" style="background:var(--primary)"></i>CPU<b>{{ serverLoad[hoverI].cpu }}%</b></div>
                <div class="rtip-r"><i class="d" style="background:var(--accent)"></i>Mémoire<b>{{ serverLoad[hoverI].memory }}%</b></div>
                <div class="rtip-r"><i class="d" style="background:var(--text-muted)"></i>Requêtes<b>{{ serverLoad[hoverI].requests }}</b></div>
                <div class="rtip-r"><i class="d" style="background:var(--success)"></i>Latence<b>{{ serverLoad[hoverI].avgMs }} ms</b></div>
              </div>
            </ng-container>
          </div>
          <div class="x-axis"><span *ngFor="let t of xTicks" [style.left.%]="(t.i/(serverLoad.length-1))*100">{{ t.label }}</span></div>
        </div>
        <div class="chart-legend">
          <span class="lg"><i class="dot brand"></i> CPU %</span>
          <span class="lg"><i class="dot purple"></i> Mémoire %</span>
        </div>
      </div>
    </div>

    <!-- Two lists -->
    <div class="perf-cols">
      <div class="page-card anim" style="--d:.16s">
        <div class="page-card-header"><h3 class="card-title">Top endpoints les plus lents</h3></div>
        <ul class="ep-list">
          <li *ngFor="let s of slowest">
            <span class="ep-path">{{ s.endpoint }}</span>
            <span class="badge" [ngClass]="latencyTone(s.avgMs)">{{ s.avgMs }} ms</span>
          </li>
          <li *ngIf="slowest.length === 0"><span class="empty">Aucune requête enregistrée pour l'instant.</span></li>
        </ul>
      </div>

      <div class="page-card anim" style="--d:.22s">
        <div class="page-card-header"><h3 class="card-title">Erreurs récentes (5xx)</h3></div>
        <ul class="ep-list">
          <li *ngFor="let e of recentErrors">
            <div class="err-left">
              <span class="badge badge-danger">{{ e.status }}</span>
              <span class="ep-path">{{ e.endpoint }}</span>
            </div>
            <span class="ep-time">{{ timeAgo(e.at) }}</span>
          </li>
          <li *ngIf="recentErrors.length === 0"><span class="empty">Aucune erreur serveur récente. 🎉</span></li>
        </ul>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .perf-wrap { display: flex; flex-direction: column; gap: 18px; }
    @keyframes pFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    @keyframes pDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
    .anim { animation: pFade .5s ease both; animation-delay: var(--d, 0s); }
    .reveal { animation: pWipe .9s cubic-bezier(.4,0,.2,1) both; }
    .draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: pDraw 1.1s ease forwards .2s; }

    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 760px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    .kpi-tile { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); padding: 18px; }
    .kpi-val { font-size: 24px; font-weight: 800; letter-spacing: -.5px; line-height: 1; }
    .kpi-val.t-success { color: var(--success); } .kpi-val.t-brand { color: var(--primary); }
    .kpi-val.t-warning { color: var(--warning); } .kpi-val.t-danger { color: var(--danger); } .kpi-val.t-purple { color: var(--accent); }
    .kpi-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted); margin-top: 8px; }

    .page-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); overflow: hidden; }
    .page-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--border-light); }
    .card-title { font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .card-sub { display: block; font-size: 11.5px; color: var(--text-muted); margin-top: 3px; }
    .chart-body { padding: 18px 20px 14px; }

    .badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: var(--radius-full); white-space: nowrap; }
    .badge-success { background: var(--success-bg); color: var(--success-text); }
    .badge-warning { background: var(--warning-bg); color: var(--warning-text); }
    .badge-danger { background: var(--danger-bg); color: var(--danger-text); }

    /* chart layout (shared with Reports) */
    .rc.xy { display: grid; grid-template-columns: 38px 1fr; grid-template-rows: 1fr 20px; column-gap: 8px; height: 280px; }
    .y-axis { grid-column: 1; grid-row: 1; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; padding: 1px 0;
      span { font-size: 10px; color: var(--text-muted); } }
    .plot { grid-column: 2; grid-row: 1; position: relative; }
    .x-axis { grid-column: 2; grid-row: 2; position: relative;
      span { position: absolute; top: 4px; transform: translateX(-50%); font-size: 9.5px; color: var(--text-muted); white-space: nowrap; } }
    .gridline { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--border); transform: translateY(-.5px); }
    .line-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .rcursor { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--text-muted); opacity: .4; transform: translateX(-.5px); pointer-events: none; }
    .rdot { position: absolute; width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--bg-card); transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 1px 2px rgba(0,0,0,.2); }
    .rtip { position: absolute; z-index: 8; top: 8px; transform: translateX(10px); background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 8px 11px; min-width: 150px; pointer-events: none;
      .rtip-t { font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 5px; }
      .rtip-r { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); line-height: 1.7; b { margin-left: auto; color: var(--text-primary); padding-left: 10px; } }
      .d { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; } }
    .rtip.flip { transform: translateX(-100%) translateX(-10px); }

    .chart-legend { display: flex; gap: 18px; margin-top: 12px; }
    .lg { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
    .dot { width: 9px; height: 9px; border-radius: 3px; display: inline-block; }
    .dot.brand { background: var(--primary); } .dot.purple { background: var(--accent); }

    .perf-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    @media (max-width: 980px) { .perf-cols { grid-template-columns: 1fr; } }
    .ep-list { list-style: none; margin: 0; padding: 0; }
    .ep-list li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 20px; border-top: 1px solid var(--border-light); }
    .ep-list li:first-child { border-top: none; }
    .err-left { display: flex; align-items: center; gap: 12px; }
    .ep-path { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: var(--text-primary); }
    .ep-time { font-size: 11.5px; color: var(--text-muted); }
    .empty { font-size: 12.5px; color: var(--text-muted); }
  `]
})
export class AdminPerformanceComponent implements OnInit, OnDestroy {
  kpis: Kpi[] = [
    { label: 'Temps de réponse API', value: '—', tone: 'success' },
    { label: 'Requêtes / min', value: '—', tone: 'brand' },
    { label: "Taux d'erreur (5xx)", value: '—', tone: 'warning' },
    { label: 'Mémoire (heap)', value: '—', tone: 'purple' }
  ];
  health = { label: 'Sain', cls: 'badge-success' };

  serverLoad: LoadPoint[] = [];
  slowest: SlowEp[] = [];
  recentErrors: RecentErr[] = [];

  pctTicks = [100, 75, 50, 25, 0];
  xTicks: { i: number; label: string }[] = [];
  cpuLine = ''; memLine = ''; cpuArea = ''; memArea = '';
  hoverI = -1; leftPct = 0;

  private timer: any;

  constructor(private analytics: AnalyticsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    // Live refresh every 15s so the page reflects real-time traffic.
    this.timer = setInterval(() => this.load(), 15000);
  }

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  private load(): void {
    this.analytics.getPerformance().subscribe({
      next: (r: any) => {
        const d = r && r.data ? r.data : r;
        if (!d) return;
        this.serverLoad = (d.serverLoad || []).map((p: any) => ({ minute: p.minute, cpu: p.cpu || 0, memory: p.memory || 0, requests: p.requests || 0, avgMs: p.avgMs || 0 }));
        this.slowest = (d.slowest || []).map((s: any) => ({ endpoint: s.endpoint, avgMs: s.avgMs || 0, maxMs: s.maxMs || 0, count: s.count || 0 }));
        this.recentErrors = (d.recentErrors || []).map((e: any) => ({ status: e.status, endpoint: e.endpoint, at: e.at }));

        this.kpis[0].value = `${Math.round(d.avgResponseMs || 0)} ms`;
        this.kpis[1].value = `${Number(d.requestsPerMin || 0).toLocaleString('fr-FR')}`;
        const err = Number(d.errorRate || 0);
        this.kpis[2].value = `${err.toFixed(2).replace('.', ',')} %`;
        this.kpis[2].tone = err > 1 ? 'danger' : 'warning';
        this.kpis[3].value = `${Math.round(d.memoryUsedPct || 0)} %`;

        const mem = Number(d.memoryUsedPct || 0);
        this.health = err > 1 || mem > 90 ? { label: 'Dégradé', cls: 'badge-warning' }
          : { label: 'Sain', cls: 'badge-success' };

        this.computeGeometry();
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private computeGeometry(): void {
    const n = this.serverLoad.length || 1;
    this.xTicks = this.serverLoad.map((p, i) => ({ i, label: p.minute })).filter(t => t.i % 10 === 0);
    const pts = (key: 'cpu' | 'memory') => this.serverLoad.map((p, i) => `${((i / (n - 1)) * 100).toFixed(2)} ${(100 - (p[key] / 100) * 100).toFixed(2)}`).join(' ');
    this.cpuLine = pts('cpu');
    this.memLine = pts('memory');
    this.cpuArea = `M 0 100 L ${this.cpuLine} L 100 100 Z`;
    this.memArea = `M 0 100 L ${this.memLine} L 100 100 Z`;
  }

  onMove(e: MouseEvent, n: number): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!rect.width || n < 2) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const i = Math.round(ratio * (n - 1));
    this.hoverI = i;
    this.leftPct = (i / (n - 1)) * 100;
  }

  latencyTone(ms: number): string { return ms > 500 ? 'badge-danger' : ms > 200 ? 'badge-warning' : 'badge-success'; }

  timeAgo(at: string): string {
    if (!at) return '';
    const diff = Date.now() - new Date(at).getTime();
    if (isNaN(diff)) return '';
    const min = Math.floor(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h} h`;
    return `il y a ${Math.floor(h / 24)} j`;
  }
}
