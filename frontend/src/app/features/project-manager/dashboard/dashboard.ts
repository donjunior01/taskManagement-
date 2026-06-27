import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DashboardService, ManagerDashboardStats } from '../../../core/services/dashboard.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { DeliverableService } from '../../../core/services/deliverable.service';
import { AuthService } from '../../../core/services/auth.service';
import { BadgeCountsService } from '../../../core/services/badge-counts.service';
import { OkrService, Objective } from '../../../core/services/okr.service';

interface HealthProject { id?: number; name: string; statusKey: string; due: string; progress: number; health: { labelKey: string; cls: string }; }
interface TeamLoad { name: string; fullName: string; assignees: number; completed: number; assignPct: number; donePct: number; level: string; }
interface Milestone { name: string; countdownKey: string; countdownParams?: Record<string, unknown>; date: string; dotCls: string; }
interface PendingDeliverable { file: string; submitter: string; meta: string; initials: string; color: string; }

@Component({
  selector: 'app-pm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
  <div class="dash-wrap">

    <!-- ═══ KPI cards ═══ -->
    <div class="kpi-grid">
      <div class="kpi-card anim" *ngFor="let k of kpis; let i = index; trackBy: trackKpi" [style.--d]="(i*0.05)+'s'">
        <div class="kpi-text">
          <div class="kpi-label">{{ k.labelKey | translate }}</div>
          <div class="kpi-value">{{ k.value }}</div>
        </div>
        <div class="kpi-icon" [ngClass]="k.tint" [ngSwitch]="k.icon">
          <svg *ngSwitchCase="'folder'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          <svg *ngSwitchCase="'list'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 5h8"></path><path d="M13 12h8"></path><path d="M13 19h8"></path><path d="m3 17 2 2 4-4"></path><path d="m3 7 2 2 4-4"></path></svg>
          <svg *ngSwitchCase="'alert'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <svg *ngSwitchCase="'users'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <svg *ngSwitchCase="'file'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 22h2a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2v2.85"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><circle cx="8" cy="16" r="6"></circle><path d="M8 14v2.2l1.6 1"></path></svg>
        </div>
      </div>
    </div>

    <!-- ═══ Row 1 : Santé des projets · Charge de l'équipe ═══ -->
    <div class="row-2">
      <!-- Santé des projets -->
      <div class="card anim" style="--d:.1s">
        <div class="card-head">
          <h2>{{ 'pm.dashboard.projectHealth' | translate }}</h2>
          <a routerLink="/pm/projects" class="link">{{ 'pm.dashboard.viewAll' | translate }}</a>
        </div>
        <div class="health-list">
          <div class="health-item" *ngFor="let p of healthProjects">
            <div class="hi-top">
              <div class="hi-id">
                <span class="hi-name">{{ p.name }}</span>
                <span class="hi-client">{{ p.statusKey | translate }}</span>
              </div>
              <span class="health-badge" [ngClass]="p.health.cls">{{ p.health.labelKey | translate }}</span>
            </div>
            <div class="hi-meta">{{ 'pm.dashboard.deadline' | translate:{ date: p.due } }}</div>
            <div class="hi-progress">
              <div class="bar"><div class="bar-fill" [style.width.%]="animated ? p.progress : 0"></div></div>
              <span class="pct">{{ p.progress }}%</span>
              <a [routerLink]="['/pm/projects', p.id]" class="link sm">{{ 'pm.dashboard.view' | translate }}</a>
            </div>
          </div>
          <div class="empty" *ngIf="healthProjects.length === 0">{{ 'pm.dashboard.noProjects' | translate }}</div>
        </div>
      </div>

      <!-- Charge de l'équipe -->
      <div class="card anim" style="--d:.16s">
        <div class="card-head">
          <h2>{{ 'pm.dashboard.teamLoad' | translate }}</h2>
          <span class="muted-sm">{{ 'pm.dashboard.thisWeek' | translate }}</span>
        </div>
        <div class="team-load reveal">
          <div class="tl-row" *ngFor="let m of teamLoad; let i = index" (mouseenter)="hoverIdx = i" (mouseleave)="hoverIdx = -1">
            <span class="tl-name" [title]="m.fullName">{{ m.name }}</span>
            <div class="tl-bars">
              <div class="tl-track">
                <div class="tl-bar" [ngClass]="'load-' + m.level" [style.width.%]="animated ? m.assignPct : 0"></div>
                <span class="tl-val">{{ m.assignees }}</span>
              </div>
              <div class="tl-track">
                <div class="tl-bar done" [style.width.%]="animated ? m.donePct : 0"></div>
                <span class="tl-val">{{ m.completed }}</span>
              </div>
            </div>
            <!-- Hover detail (like the admin dashboard charts); the top rows render it downward so it isn't clipped. -->
            <div class="tl-tip" [class.below]="i < teamLoad.length / 2" *ngIf="hoverIdx === i">
              <div class="tt-name">{{ m.fullName }}</div>
              <div class="tt-row"><i class="sw" [ngClass]="m.level"></i>{{ 'pm.dashboard.assigned' | translate }}<b>{{ m.assignees }}</b></div>
              <div class="tt-row"><i class="sw blue"></i>{{ 'pm.dashboard.completed' | translate }}<b>{{ m.completed }}</b></div>
              <div class="tt-row"><i class="sw" [ngClass]="m.level"></i>{{ 'pm.dashboard.load' | translate }}<b>{{ levelLabel(m.level) | translate }}</b></div>
            </div>
          </div>
          <div class="empty" *ngIf="teamLoad.length === 0">{{ 'pm.dashboard.noTeamData' | translate }}</div>
        </div>
        <div class="tl-legend">
          <span class="lg"><i class="sw green"></i> {{ 'pm.dashboard.available' | translate }}</span>
          <span class="lg"><i class="sw orange"></i> {{ 'pm.dashboard.busy' | translate }}</span>
          <span class="lg"><i class="sw red"></i> {{ 'pm.dashboard.overloaded' | translate }}</span>
          <span class="lg"><i class="sw blue"></i> {{ 'pm.dashboard.completed' | translate }}</span>
        </div>
      </div>
    </div>

    <!-- ═══ Row 2 : Jalons à venir · Livrables en attente ═══ -->
    <div class="row-2">
      <!-- Jalons à venir -->
      <div class="card anim" style="--d:.22s">
        <div class="card-head"><h2>{{ 'pm.dashboard.upcomingMilestones' | translate }}</h2></div>
        <ol class="timeline">
          <li class="tl-item" *ngFor="let j of milestones">
            <span class="tl-dot" [ngClass]="j.dotCls"></span>
            <div class="tl-line">
              <div class="tl-info">
                <div class="tl-title">{{ j.name }}</div>
                <div class="tl-sub">{{ j.countdownKey | translate:j.countdownParams }} • {{ j.date }}</div>
              </div>
              <svg class="tl-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
          </li>
          <li class="empty" *ngIf="milestones.length === 0">{{ 'pm.dashboard.noMilestones' | translate }}</li>
        </ol>
      </div>

      <!-- Livrables en attente -->
      <div class="card anim" style="--d:.28s">
        <div class="card-head">
          <h2>{{ 'pm.dashboard.pendingDeliverables' | translate }}</h2>
          <a routerLink="/pm/deliverables" class="link">{{ 'pm.dashboard.viewAll' | translate }}</a>
        </div>
        <div class="deliv-list">
          <div class="deliv-item" *ngFor="let d of pendingDeliverables">
            <div class="deliv-avatar" [style.background]="d.color">{{ d.initials }}</div>
            <div class="deliv-body">
              <div class="deliv-file">{{ d.file }}</div>
              <div class="deliv-meta">{{ d.meta }}</div>
            </div>
            <a routerLink="/pm/deliverables" class="btn-review">{{ 'pm.dashboard.review' | translate }}</a>
          </div>
          <div class="empty" *ngIf="pendingDeliverables.length === 0">{{ 'pm.dashboard.noPending' | translate }}</div>
        </div>
      </div>
    </div>

    <!-- ═══ OKR snapshot ═══ -->
    <div class="card anim" style="--d:.34s">
      <div class="card-head">
        <h2>{{ 'pm.dashboard.okrTitle' | translate }}</h2>
        <a routerLink="/pm/okrs" class="link">{{ 'pm.dashboard.viewAll' | translate }}</a>
      </div>
      <div class="okr-snap">
        <div class="okr-snap-row" *ngFor="let o of topObjectives" routerLink="/pm/okrs">
          <span class="okr-snap-dot" [ngClass]="'st-' + o.status"></span>
          <span class="okr-snap-title">{{ o.title }}</span>
          <div class="okr-snap-bar"><div class="okr-snap-fill" [style.width.%]="animated ? okr.objectiveProgress(o) : 0"></div></div>
          <span class="okr-snap-pct">{{ okr.objectiveProgress(o) }}%</span>
        </div>
        <div class="empty" *ngIf="topObjectives.length === 0">{{ 'pm.dashboard.okrEmpty' | translate }}</div>
      </div>
    </div>

  </div>
  `,
  styles: [`
    .dash-wrap { display: flex; flex-direction: column; gap: 24px; }
    @keyframes dFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes dWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    .anim { animation: dFade .5s ease both; animation-delay: var(--d, 0s); }
    .reveal { animation: dWipe .9s cubic-bezier(.4,0,.2,1) both; }

    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 20px; }
    .card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
    .card-head h2 { font-size: 15.5px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .link { font-size: 12px; font-weight: 500; color: #2563eb; text-decoration: none; white-space: nowrap; }
    .link:hover { text-decoration: underline; }
    .link.sm { font-size: 11.5px; }
    .muted-sm { font-size: 12px; color: var(--text-muted); }
    .empty { padding: 22px 4px; text-align: center; color: var(--text-muted); font-size: 13px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .okr-snap { display: flex; flex-direction: column; gap: 12px; }
    .okr-snap-row { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 4px 2px; border-radius: 8px; }
    .okr-snap-row:hover { background: var(--bg-subtle); }
    .okr-snap-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .okr-snap-dot.st-ON_TRACK { background: var(--success); }
    .okr-snap-dot.st-AT_RISK { background: var(--warning); }
    .okr-snap-dot.st-OFF_TRACK { background: var(--danger); }
    .okr-snap-dot.st-ACHIEVED { background: var(--primary); }
    .okr-snap-title { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .okr-snap-bar { width: 130px; height: 7px; background: var(--bg-subtle); border-radius: 20px; overflow: hidden; flex-shrink: 0; }
    .okr-snap-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light, #3b82f6)); border-radius: 20px; transition: width .6s ease; }
    .okr-snap-pct { font-size: 12.5px; font-weight: 700; color: var(--text-secondary); min-width: 36px; text-align: right; }
    @media (max-width: 1024px) { .row-2 { grid-template-columns: 1fr; } }

    /* KPI */
    .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
    @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 640px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .kpi-label { font-size: 12px; font-weight: 500; color: var(--text-muted); }
    .kpi-value { margin-top: 8px; font-size: 26px; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .kpi-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0; }
    .kpi-icon svg { width: 18px; height: 18px; }
    .kpi-icon.primary { background: rgba(37,99,235,.1); color: #2563eb; }
    .kpi-icon.info { background: rgba(2,132,199,.1); color: #0284c7; }
    .kpi-icon.destructive { background: rgba(220,38,38,.1); color: var(--danger-text); }
    .kpi-icon.success { background: rgba(22,163,74,.1); color: #16a34a; }
    .kpi-icon.warning { background: rgba(217,119,6,.14); color: #d97706; }

    /* Santé des projets */
    .health-list { display: flex; flex-direction: column; gap: 12px; }
    .health-item { border: 1px solid var(--border); border-radius: 12px; padding: 12px; transition: background .15s ease; }
    .health-item:hover { background: var(--bg-muted); }
    .hi-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .hi-id { min-width: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .hi-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
    .hi-client { font-size: 10px; font-weight: 500; color: #2563eb; background: rgba(37,99,235,.1); padding: 2px 6px; border-radius: 5px; }
    .hi-meta { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; }
    .health-badge { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; white-space: nowrap; flex-shrink: 0; }
    .health-badge.ok { background: rgba(22,163,74,.12); color: #16a34a; }
    .health-badge.warn { background: rgba(217,119,6,.14); color: #d97706; }
    .health-badge.danger { background: rgba(220,38,38,.1); color: var(--danger-text); }
    .hi-progress { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
    .bar { flex: 1; height: 8px; border-radius: 9999px; background: var(--bg-subtle); overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 9999px; background: linear-gradient(90deg, #2563eb, #1e3a8a); transition: width .9s cubic-bezier(.4,0,.2,1); }
    .pct { font-size: 12px; font-weight: 700; color: var(--text-primary); }

    /* Charge de l'équipe */
    .team-load { display: flex; flex-direction: column; gap: 14px; min-height: 220px; }
    .tl-row { position: relative; display: grid; grid-template-columns: 72px 1fr; align-items: center; gap: 10px; cursor: default; border-radius: 8px; padding: 2px 4px; transition: background .15s ease; }
    .tl-row:hover { background: var(--bg-muted); }
    .tl-name { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tl-bars { display: flex; flex-direction: column; gap: 4px; }
    .tl-track { display: flex; align-items: center; gap: 6px; }
    .tl-bar { height: 11px; border-radius: 0 4px 4px 0; min-width: 2px; transition: width .8s cubic-bezier(.4,0,.2,1); }
    .tl-bar.load-green { background: #22c55e; } .tl-bar.load-orange { background: #f97316; } .tl-bar.load-red { background: #ef4444; }
    .tl-bar.done { background: #2d6be4; }
    .tl-val { font-size: 10.5px; color: var(--text-muted); font-weight: 600; }
    /* Hover tooltip */
    .tl-tip { position: absolute; z-index: 20; right: 4px; bottom: calc(100% + 6px); min-width: 150px;
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 8px 24px rgba(15,23,42,.16); padding: 9px 11px; pointer-events: none; }
    .tl-tip.below { bottom: auto; top: calc(100% + 6px); }
    .tt-name { font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 5px; }
    .tt-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); line-height: 1.7; }
    .tt-row b { margin-left: auto; color: var(--text-primary); padding-left: 10px; }
    .tt-row .sw { width: 8px; height: 8px; border-radius: 50%; }
    .tl-legend { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; margin-top: 14px; }
    .tl-legend .lg { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-muted); }
    .sw { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
    .sw.green { background: #22c55e; } .sw.orange { background: #f97316; } .sw.red { background: #ef4444; } .sw.blue { background: #2d6be4; }

    /* Jalons (timeline) */
    .timeline { position: relative; list-style: none; margin: 0; padding: 0 0 0 20px; border-left: 2px solid var(--border); display: flex; flex-direction: column; gap: 16px; }
    .tl-item { position: relative; }
    .tl-dot { position: absolute; left: -26px; top: 4px; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 2px #fff; }
    .tl-dot.atteint { background: #16a34a; } .tl-dot.manque { background: #dc2626; } .tl-dot.avenir { background: #2563eb; } .tl-dot.urgent { background: #d97706; }
    .tl-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .tl-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .tl-sub { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
    .tl-cal { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }

    /* Livrables en attente */
    .deliv-list { display: flex; flex-direction: column; gap: 8px; }
    .deliv-item { display: flex; align-items: center; gap: 12px; border: 1px solid var(--border); border-radius: 12px; padding: 11px; transition: background .15s ease; }
    .deliv-item:hover { background: var(--bg-muted); }
    .deliv-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; color: #fff; font-size: 12px; font-weight: 700; }
    .deliv-body { flex: 1; min-width: 0; }
    .deliv-file { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .deliv-meta { font-size: 11.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .btn-review { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 12px; border-radius: 8px; background: #2563eb; color: #fff; font-size: 12px; font-weight: 600; text-decoration: none; }
    .btn-review:hover { background: #1d4ed8; }
  `]
})
export class PmDashboardComponent implements OnInit, OnDestroy {
  managerId = 0;
  stats: ManagerDashboardStats = { totalTasks: 0, activeTasks: 0, completedTasks: 0, overdueTasks: 0, taskCompletionRate: 0, teamMembers: 0 };
  activeProjects = 0;
  healthProjects: HealthProject[] = [];
  teamLoad: TeamLoad[] = [];
  milestones: Milestone[] = [];
  pendingDeliverables: PendingDeliverable[] = [];

  animated = false;
  hoverIdx = -1;
  private subs: Subscription[] = [];

  constructor(
    private dashboardService: DashboardService,
    private projectService: ProjectService,
    private analyticsService: AnalyticsService,
    private deliverableService: DeliverableService,
    private authService: AuthService,
    private badges: BadgeCountsService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    public okr: OkrService
  ) {}

  topObjectives: Objective[] = [];
  private loadObjectives(): void {
    this.okr.list().subscribe({
      next: o => { this.topObjectives = (o || []).slice(0, 4); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  trackKpi(_i: number, k: { labelKey: string }): string { return k.labelKey; }

  get kpis() {
    return [
      { labelKey: 'pm.dashboard.kpiActiveProjects', value: this.activeProjects, icon: 'folder', tint: 'primary' },
      { labelKey: 'pm.dashboard.kpiTasksInProgress', value: this.stats.activeTasks, icon: 'list', tint: 'info' },
      { labelKey: 'pm.dashboard.kpiTasksOverdue', value: this.stats.overdueTasks, icon: 'alert', tint: 'destructive' },
      { labelKey: 'pm.dashboard.kpiTeamMembers', value: this.stats.teamMembers, icon: 'users', tint: 'success' },
      { labelKey: 'pm.dashboard.kpiDeliverablesToReview', value: this.pendingDeliverables.length, icon: 'file', tint: 'warning' }
    ];
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.managerId = user?.id || 0;
    this.loadStats();
    this.loadProjects();
    this.loadTeamLoad();
    this.loadDeliverables();
    this.loadObjectives();

    // Listen for deliverables count updates to keep dashboard list synchronized
    this.subs.push(this.badges.deliverables$.subscribe(() => {
      this.loadDeliverables();
    }));

    // Trigger the chart/bar load animation once the view is in.
    setTimeout(() => { this.animated = true; this.cdr.detectChanges(); }, 90);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private loadStats(): void {
    this.dashboardService.getManagerStats().subscribe({
      next: (d: any) => { this.stats = d && d.data ? d.data : (d || this.stats); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  private loadProjects(): void {
    this.projectService.getProjectsByManager(this.managerId, 0, 20).subscribe({
      next: (r: any) => { this.applyProjects(r && r.data ? r.data : (Array.isArray(r) ? r : [])); },
      error: () => {
        this.projectService.getAllProjects(0, 20).subscribe({
          next: (r: any) => this.applyProjects(r && r.data ? r.data : []),
          error: () => {}
        });
      }
    });
  }

  private applyProjects(list: Project[]): void {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isActive = (s?: string) => !['COMPLETED', 'CANCELLED'].includes((s || '').toUpperCase());
    this.activeProjects = list.filter(p => isActive(p.status)).length;

    this.healthProjects = list.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      statusKey: this.statusKey(p.status),
      due: p.endDate ? new Date(p.endDate).toLocaleDateString(this.dateLocale()) : '—',
      progress: p.progress || 0,
      health: this.health(p, today)
    }));

    // Jalons à venir = échéances de projet À VENIR (non terminées, date future),
    // triées par date croissante, avec compte à rebours.
    this.milestones = list
      .filter(p => p.endDate && (p.status || '').toUpperCase() !== 'COMPLETED')
      .map(p => ({ p, end: this.midnight(p.endDate!) }))
      .filter(x => x.end.getTime() >= today.getTime())
      .sort((a, b) => a.end.getTime() - b.end.getTime())
      .slice(0, 5)
      .map(({ p, end }) => {
        const days = Math.round((end.getTime() - today.getTime()) / 86400000);
        const countdownKey = days === 0 ? 'pm.dashboard.today' : days === 1 ? 'pm.dashboard.tomorrow' : 'pm.dashboard.inDays';
        const countdownParams = days > 1 ? { days } : undefined;
        const dotCls = days <= 3 ? 'urgent' : 'avenir';
        return { name: p.name, countdownKey, countdownParams, date: end.toLocaleDateString(this.dateLocale()), dotCls };
      });
    this.cdr.detectChanges();
  }

  private loadTeamLoad(): void {
    this.analyticsService.getManagerAnalytics().subscribe({
      next: (r: any) => {
        const d = r && r.data ? r.data : r;
        const members: any[] = (d && d.workloadByMember) ? d.workloadByMember : [];
        const rows = members.map(m => {
          const completed = m.completedTasks || 0;
          const open = m.openTasks || 0;
          const assignees = open + completed;
          const level = open >= 9 ? 'red' : open >= 5 ? 'orange' : 'green';
          return { fullName: m.memberName || '—', name: (m.memberName || '—').split(' ')[0], assignees, completed, level };
        });
        const max = Math.max(1, ...rows.map(r => r.assignees));
        this.teamLoad = rows.slice(0, 6).map(r => ({
          name: r.name, fullName: r.fullName, assignees: r.assignees, completed: r.completed,
          assignPct: (r.assignees / max) * 100, donePct: (r.completed / max) * 100, level: r.level
        }));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private loadDeliverables(): void {
    this.deliverableService.getPendingDeliverables().subscribe({
      next: (list: any[]) => {
        const arr = Array.isArray(list) ? list : [];
        this.badges.setDeliverables(arr.length);
        const unknown = this.translate.instant('pm.dashboard.unknown');
        this.pendingDeliverables = arr.slice(0, 6).map(d => {
          const submitter = d.submittedByName || unknown;
          const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString(this.dateLocale()) : '';
          return {
            file: d.fileName || this.translate.instant('pm.dashboard.deliverable'),
            submitter,
            meta: [submitter, d.taskName, date].filter(Boolean).join(' • '),
            initials: this.initials(submitter),
            color: this.avatarColor(submitter)
          };
        });
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  /** Translation key for a workload level (rendered with the translate pipe in the template). */
  levelLabel(level: string): string {
    return level === 'red' ? 'pm.dashboard.overloaded' : level === 'orange' ? 'pm.dashboard.busy' : 'pm.dashboard.available';
  }

  /** Locale for date formatting follows the active UI language. */
  private dateLocale(): string {
    return this.translate.currentLang() === 'en' ? 'en-GB' : 'fr-FR';
  }

  private midnight(dateStr: string): Date {
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0); return d;
  }

  private health(p: Project, today: Date): { labelKey: string; cls: string } {
    const status = (p.status || '').toUpperCase();
    const progress = p.progress || 0;
    if (status === 'COMPLETED' || progress >= 100) return { labelKey: 'pm.dashboard.healthCompleted', cls: 'ok' };
    if (p.endDate && new Date(p.endDate) < today) return { labelKey: 'pm.dashboard.healthOverdue', cls: 'danger' };
    if (progress < 40) return { labelKey: 'pm.dashboard.healthWatch', cls: 'warn' };
    return { labelKey: 'pm.dashboard.healthOnTrack', cls: 'ok' };
  }

  private statusKey(s?: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'pm.dashboard.statusActive', IN_PROGRESS: 'pm.dashboard.statusInProgress', PLANNED: 'pm.dashboard.statusPlanned',
      ON_HOLD: 'pm.dashboard.statusOnHold', COMPLETED: 'pm.dashboard.statusCompleted', CANCELLED: 'pm.dashboard.statusCancelled'
    };
    return map[(s || '').toUpperCase()] || 'pm.dashboard.statusActive';
  }

  private initials(name: string): string {
    return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
  private avatarColor(name: string): string {
    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }
}
