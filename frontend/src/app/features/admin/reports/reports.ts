import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { PdfService } from '../../../core/services/pdf.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ReportService } from '../../../core/services/report.service';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { ActivityLogService } from '../../../core/services/activity-log.service';
import { SupportTicketService } from '../../../core/services/support-ticket.service';
import { AdminSecurityService } from '../../../core/services/admin-security.service';

/** A column in a generated report: i18n header key suffix + a cell extractor. */
interface RepCol { h: string; get: (row: any) => string; }
/** A generated dataset ready to export. */
interface RepData { titleKey: string; columns: RepCol[]; rows: any[]; }

interface Donut { name: string; value: number; color: string; pct: number; dash: string; offset: number; }
interface RecapRow { nom: string; pm: string; taches: number; terminees: number; retard: number; heures: number; progression: number; statut: string; }

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="rep-wrap">

    <!-- Toolbar -->
    <div class="rep-card pad-row anim" style="--d:0s">
      <div class="period-tabs">
        <button *ngFor="let p of periods" class="ptab" [class.active]="period === p" (click)="selectPeriod(p)" [disabled]="loadingReports">{{ p | translate }}</button>
      </div>
      <div class="rep-actions">
        <button class="btn btn-primary" (click)="generateReport()" [disabled]="generating">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path></svg>
          {{ (generating ? 'admin.reports.generating' : 'admin.reports.generate') | translate }}
        </button>
        <button class="btn btn-outline" (click)="exportPdf()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> PDF</button>
        <button class="btn btn-outline" (click)="exportCsv()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> CSV</button>
      </div>
    </div>

    <!-- Executive KPIs -->
    <div class="anim" style="--d:.05s">
      <h2 class="section-eyebrow">{{ 'admin.reports.execTitle' | translate }}</h2>
      <div class="exec-grid">
        <div class="exec-tile anim" *ngFor="let k of execKpis; let i = index" [ngClass]="'t-' + k.tone" [style.--d]="(0.08 + i*0.06) + 's'">
          <div class="exec-top"><span class="exec-ico" [innerHTML]="k.icon"></span><span class="exec-label">{{ k.labelKey | translate }}</span></div>
          <div class="exec-value">{{ k.value }}</div>
          <div class="exec-delta">{{ k.delta }}</div>
        </div>
      </div>
    </div>

    <!-- Row: planned vs real (2col) + burndown -->
    <div class="grid-3">
      <div class="rep-card col-span-2 anim" style="--d:.12s">
        <div class="rc-head"><h3>{{ 'admin.reports.pvrTitle' | translate }}</h3></div>
        <div class="rc-body">
          <div class="rc xy">
            <div class="y-axis"><span *ngFor="let t of pct100Ticks">{{ t }}</span></div>
            <div class="plot reveal" (mousemove)="onMove($event, 'pvr', plannedVsReal.length)" (mouseleave)="hover = null">
              <div class="gridline" *ngFor="let t of pct100Ticks" [style.top.%]="(1 - t/100)*100"></div>
              <div class="gbars">
                <div class="gbar-group" *ngFor="let p of plannedVsReal; let i = index">
                  <div class="gbar-pair">
                    <div class="gbar plan" [style.height.%]="animated ? p.planifie : 0"></div>
                    <div class="gbar real" [style.height.%]="animated ? p.reel : 0"></div>
                  </div>
                </div>
              </div>
              <div class="rtip" *ngIf="hover?.chart === 'pvr' && plannedVsReal[hover!.i]" [style.left.%]="hover!.leftPct" [class.flip]="hover!.leftPct > 65">
                <div class="rtip-t">{{ plannedVsReal[hover!.i].name }}</div>
                <div class="rtip-r"><i class="d" style="background:var(--text-muted)"></i>{{ 'admin.reports.planned' | translate }}<b>{{ plannedVsReal[hover!.i].planifie }}%</b></div>
                <div class="rtip-r"><i class="d" style="background:var(--primary)"></i>{{ 'admin.reports.real' | translate }}<b>{{ plannedVsReal[hover!.i].reel }}%</b></div>
              </div>
            </div>
            <div class="x-axis bars-x"><span *ngFor="let p of plannedVsReal">{{ p.name }}</span></div>
          </div>
          <div class="legend"><span class="lg"><i class="d" style="background:var(--text-muted)"></i> {{ 'admin.reports.planned' | translate }}</span><span class="lg"><i class="d" style="background:var(--primary)"></i> {{ 'admin.reports.real' | translate }}</span></div>
        </div>
      </div>

      <div class="rep-card anim" style="--d:.18s">
        <div class="rc-head"><h3>{{ 'admin.reports.burnTitle' | translate }}</h3><span class="sub">{{ 'admin.reports.last14' | translate }}</span></div>
        <div class="rc-body">
          <div class="rc xy">
            <div class="y-axis"><span *ngFor="let t of burnTicks">{{ t }}</span></div>
            <div class="plot" (mousemove)="onMove($event, 'burn', burndown.length)" (mouseleave)="hover = null">
              <div class="gridline" *ngFor="let t of burnTicks" [style.top.%]="(1 - t/burnMax)*100"></div>
              <svg class="line-svg reveal" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline [attr.points]="burnIdeal" fill="none" stroke="var(--text-muted)" stroke-width="1.4" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"></polyline>
                <polyline class="draw" [attr.points]="burnReal" fill="none" stroke="var(--primary)" stroke-width="1.8" vector-effect="non-scaling-stroke" pathLength="1"></polyline>
              </svg>
              <ng-container *ngIf="hover?.chart === 'burn' && burndown[hover!.i]">
                <div class="rcursor" [style.left.%]="hover!.leftPct"></div>
                <div class="rdot" [style.left.%]="hover!.leftPct" [style.top.%]="(1 - burndown[hover!.i].reel/burnMax)*100" style="background:var(--primary)"></div>
                <div class="rtip" [style.left.%]="hover!.leftPct" [class.flip]="hover!.leftPct > 65">
                  <div class="rtip-t">{{ burndown[hover!.i].jour }}</div>
                  <div class="rtip-r"><i class="d" style="background:var(--text-muted)"></i>{{ 'admin.reports.ideal' | translate }}<b>{{ burndown[hover!.i].ideal }}</b></div>
                  <div class="rtip-r"><i class="d" style="background:var(--primary)"></i>{{ 'admin.reports.real' | translate }}<b>{{ burndown[hover!.i].reel }}</b></div>
                </div>
              </ng-container>
            </div>
            <div class="x-axis"><span *ngFor="let t of burnXTicks" [style.left.%]="(t.i/(burndown.length-1))*100">{{ t.label }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Projets par statut dans le temps (STACKED AREA) -->
    <div class="rep-card anim" style="--d:.24s">
      <div class="rc-head"><h3>{{ 'admin.reports.sotTitle' | translate }}</h3><span class="sub">{{ 'admin.reports.last12' | translate }}</span></div>
      <div class="rc-body">
        <div class="rc xy">
          <div class="y-axis"><span *ngFor="let t of statusTicks">{{ t }}</span></div>
          <div class="plot" (mousemove)="onMove($event, 'sot', statusOverTime.length)" (mouseleave)="hover = null">
            <div class="gridline" *ngFor="let t of statusTicks" [style.top.%]="(1 - t/statusMax)*100"></div>
            <svg class="line-svg reveal" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path [attr.d]="bandEncours" fill="var(--primary)" fill-opacity=".65"></path>
              <path [attr.d]="bandTermine" fill="var(--success)" fill-opacity=".65"></path>
              <path [attr.d]="bandRetard" fill="var(--danger)" fill-opacity=".65"></path>
              <polyline [attr.points]="lineTotal" fill="none" stroke="var(--text-muted)" stroke-width="0.5" vector-effect="non-scaling-stroke" opacity=".3"></polyline>
            </svg>
            <ng-container *ngIf="hover?.chart === 'sot' && statusOverTime[hover!.i]">
              <div class="rcursor" [style.left.%]="hover!.leftPct"></div>
              <div class="rtip" [style.left.%]="hover!.leftPct" [class.flip]="hover!.leftPct > 70">
                <div class="rtip-t">{{ statusOverTime[hover!.i].mois }}</div>
                <div class="rtip-r"><i class="d" style="background:var(--primary)"></i>{{ 'admin.reports.inProgress' | translate }}<b>{{ statusOverTime[hover!.i].encours }}</b></div>
                <div class="rtip-r"><i class="d" style="background:var(--success)"></i>{{ 'admin.reports.completedPlural' | translate }}<b>{{ statusOverTime[hover!.i].termine }}</b></div>
                <div class="rtip-r"><i class="d" style="background:var(--danger)"></i>{{ 'admin.reports.late' | translate }}<b>{{ statusOverTime[hover!.i].retard }}</b></div>
              </div>
            </ng-container>
          </div>
          <div class="x-axis"><span *ngFor="let m of statusOverTime; let i = index" [style.left.%]="(i/(statusOverTime.length-1))*100">{{ m.mois }}</span></div>
        </div>
        <div class="legend"><span class="lg"><i class="d" style="background:var(--primary)"></i> {{ 'admin.reports.inProgress' | translate }}</span><span class="lg"><i class="d" style="background:var(--success)"></i> {{ 'admin.reports.completedPlural' | translate }}</span><span class="lg"><i class="d" style="background:var(--danger)"></i> {{ 'admin.reports.late' | translate }}</span></div>
      </div>
    </div>

    <!-- Row: top performers + radar + DAU -->
    <div class="grid-3">
      <div class="rep-card anim" style="--d:.30s">
        <div class="rc-head"><h3>{{ 'admin.reports.topTitle' | translate }}</h3><span class="sub">{{ 'admin.reports.tasksDone' | translate }}</span></div>
        <div class="rc-body perf-list reveal">
          <div class="perf-item" *ngFor="let t of topPerformers; let i = index">
            <div class="perf-top"><span class="perf-name">#{{ i+1 }} {{ t.nom }}</span><span class="perf-val">{{ t.taches }}</span></div>
            <div class="perf-track"><div class="perf-fill" [style.width.%]="animated ? (t.taches/topMax)*100 : 0"></div></div>
          </div>
        </div>
      </div>

      <div class="rep-card anim" style="--d:.36s">
        <div class="rc-head"><h3>{{ 'admin.reports.teamLoadTitle' | translate }}</h3><span class="sub">{{ 'admin.reports.teamLoadSub' | translate }}</span></div>
        <div class="rc-body radar-body reveal">
          <svg *ngIf="teamLoad.length > 0" viewBox="0 0 200 180" class="radar">
            <!-- concentric rings (grid) -->
            <polygon *ngFor="let ring of radarScales" [attr.points]="radarRing(ring)" fill="none" stroke="var(--border)" stroke-width="1"></polygon>
            <!-- one spoke per team -->
            <line *ngFor="let a of radarAxes" [attr.x1]="cx" [attr.y1]="cy" [attr.x2]="a.x" [attr.y2]="a.y" stroke="var(--border)" stroke-width="1"></line>
            <!-- workload shape -->
            <polygon [attr.points]="radarShape" fill="color-mix(in oklab, var(--primary) 35%, transparent)" stroke="var(--primary)" stroke-width="1.5"></polygon>
            <!-- numeric scale up the vertical axis so the rings are interpretable -->
            <text *ngFor="let r of radarRingLabels" [attr.x]="cx + 2" [attr.y]="r.y - 1" class="radar-scale">{{ r.value }}</text>
            <!-- team name on each spoke -->
            <text *ngFor="let a of radarAxes" [attr.x]="a.lx" [attr.y]="a.ly" class="radar-lbl">{{ a.label }}</text>
            <!-- visible data points -->
            <circle *ngFor="let a of radarAxes; let i = index" [attr.cx]="a.vx" [attr.cy]="a.vy" [attr.r]="radarHover === i ? 3.2 : 2" fill="var(--primary)"></circle>
            <!-- larger transparent hit areas so points are easy to hover -->
            <circle *ngFor="let a of radarAxes; let i = index" [attr.cx]="a.vx" [attr.cy]="a.vy" r="9" fill="transparent" style="cursor:pointer"
                    (mouseenter)="radarHover = i" (mouseleave)="radarHover = -1"></circle>
          </svg>
          <!-- Detail is rendered BELOW the chart (never clipped) instead of a tooltip above the point. -->
          <div class="radar-detail" *ngIf="teamLoad.length > 0">
            <ng-container *ngIf="radarHover >= 0 && teamLoad[radarHover]">
              <span class="d"></span>{{ teamLoad[radarHover].equipe }} — <b>{{ teamLoad[radarHover].charge }}</b> {{ 'admin.reports.openTasks' | translate }}
            </ng-container>
            <span class="hint" *ngIf="radarHover < 0">{{ 'admin.reports.teamLoadHint' | translate }}</span>
          </div>
          <div class="empty-row" *ngIf="teamLoad.length === 0">{{ 'admin.reports.empty' | translate }}</div>
        </div>
      </div>

      <div class="rep-card anim" style="--d:.42s">
        <div class="rc-head"><h3>{{ 'admin.reports.dauTitle' | translate }}</h3><span class="sub">{{ 'admin.reports.dauSub' | translate }}</span></div>
        <div class="rc-body">
          <div class="rc xy">
            <div class="y-axis"><span *ngFor="let t of dauTicks">{{ t }}</span></div>
            <div class="plot" (mousemove)="onMove($event, 'dau', dau.length)" (mouseleave)="hover = null">
              <div class="gridline" *ngFor="let t of dauTicks" [style.top.%]="(1 - t/dauMax)*100"></div>
              <svg class="line-svg reveal" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs><linearGradient id="dauG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".5"></stop><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"></stop></linearGradient></defs>
                <path [attr.d]="dauArea" fill="url(#dauG)"></path>
                <polyline class="draw" [attr.points]="dauLine" fill="none" stroke="var(--accent)" stroke-width="1.8" vector-effect="non-scaling-stroke" pathLength="1"></polyline>
              </svg>
              <ng-container *ngIf="hover?.chart === 'dau' && dau[hover!.i]">
                <div class="rcursor" [style.left.%]="hover!.leftPct"></div>
                <div class="rdot" [style.left.%]="hover!.leftPct" [style.top.%]="(1 - dau[hover!.i].dau/dauMax)*100" style="background:var(--accent)"></div>
                <div class="rtip" [style.left.%]="hover!.leftPct" [class.flip]="hover!.leftPct > 65">
                  <div class="rtip-t">{{ 'admin.reports.day' | translate:{ n: dau[hover!.i].jour } }}</div>
                  <div class="rtip-r"><i class="d" style="background:var(--accent)"></i>{{ 'admin.reports.connections' | translate }}<b>{{ dau[hover!.i].dau }}</b></div>
                </div>
              </ng-container>
            </div>
            <div class="x-axis"><span *ngFor="let t of dauXTicks" [style.left.%]="(t.i/(dau.length-1))*100">{{ t.label }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Récapitulatif par projet -->
    <div class="rep-card anim" style="--d:.48s">
      <div class="rc-head"><h3>{{ 'admin.reports.recapTitle' | translate }}</h3></div>
      <div class="rc-body no-pad">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>{{ 'admin.reports.thProject' | translate }}</th><th>{{ 'admin.reports.thPm' | translate }}</th><th>{{ 'admin.reports.thTasks' | translate }}</th><th>{{ 'admin.reports.thCompleted' | translate }}</th><th>{{ 'admin.reports.thLate' | translate }}</th><th>{{ 'admin.reports.thHours' | translate }}</th><th>{{ 'admin.reports.thCompletion' | translate }}</th><th>{{ 'admin.reports.thStatus' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of pagedRecap">
                <td class="td-name">{{ r.nom }}</td>
                <td class="muted">{{ r.pm }}</td>
                <td>{{ r.taches }}</td>
                <td class="ok">{{ r.terminees }}</td>
                <td class="bad">{{ r.retard }}</td>
                <td class="muted">{{ r.heures }} h</td>
                <td>{{ r.progression }}%</td>
                <td><span class="badge" [ngClass]="statusBadge(r.statut)">{{ statusKey(r.statut) | translate }}</span></td>
              </tr>
              <tr *ngIf="recap.length === 0"><td colspan="8"><div class="empty-row">{{ 'admin.reports.empty' | translate }}</div></td></tr>
            </tbody>
          </table>
        </div>
        <div class="recap-pager" *ngIf="recap.length > recapPageSize">
          <span class="rp-info">{{ 'admin.reports.pager' | translate:{ from: recapPage * recapPageSize + 1, to: recapEnd, total: recap.length } }}</span>
          <div class="rp-ctrl">
            <button class="rp-btn" (click)="recapPage = recapPage - 1" [disabled]="recapPage === 0">‹</button>
            <span class="rp-num">{{ recapPage + 1 }} / {{ recapTotalPages }}</span>
            <button class="rp-btn" (click)="recapPage = recapPage + 1" [disabled]="recapPage >= recapTotalPages - 1">›</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Row: tickets donut + avg resolution + resolution rate -->
    <div class="grid-3">
      <div class="rep-card anim" style="--d:.54s">
        <div class="rc-head"><h3>{{ 'admin.reports.ticketsTitle' | translate }}</h3></div>
        <div class="rc-body donut-split">
          <div class="donut-wrap reveal">
            <svg viewBox="0 0 36 36" class="donut">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--border)" stroke-width="3.4"></circle>
              <circle class="dseg" *ngFor="let s of ticketsByCat; let i = index" cx="18" cy="18" r="15.9155" fill="none" [attr.stroke]="s.color" stroke-width="3.4" [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset" (mouseenter)="donutHover = i" (mouseleave)="donutHover = -1"></circle>
            </svg>
          </div>
          <ul class="donut-legend">
            <li *ngFor="let s of ticketsByCat; let i = index" [class.on]="donutHover === i"><span class="d" [style.background]="s.color"></span><span class="nm">{{ s.name }}</span><span class="vl">{{ s.value }}</span></li>
          </ul>
        </div>
      </div>

      <div class="rep-card center-card anim" style="--d:.60s">
        <div class="rc-head"><h3>{{ 'admin.reports.avgResTitle' | translate }}</h3></div>
        <div class="rc-body center-body">
          <div class="big-stat">{{ avgResolutionLabel }}</div>
          <span class="badge badge-success">{{ 'admin.reports.resolvedPct' | translate:{ n: fmtNumPub(resolvedRate) } }}</span>
          <p class="center-note">{{ 'admin.reports.avgResNote' | translate }}</p>
        </div>
      </div>

      <div class="rep-card anim" style="--d:.66s">
        <div class="rc-head"><h3>{{ 'admin.reports.resRateTitle' | translate }}</h3><span class="sub">{{ 'admin.reports.last12' | translate }}</span></div>
        <div class="rc-body">
          <div class="rc xy">
            <div class="y-axis"><span *ngFor="let t of pct100Ticks">{{ t }}</span></div>
            <div class="plot" (mousemove)="onMove($event, 'res', resolutionRate.length)" (mouseleave)="hover = null">
              <div class="gridline" *ngFor="let t of pct100Ticks" [style.top.%]="(1 - t/100)*100"></div>
              <svg class="line-svg reveal" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline class="draw" [attr.points]="resLine" fill="none" stroke="var(--success)" stroke-width="1.8" vector-effect="non-scaling-stroke" pathLength="1"></polyline>
              </svg>
              <ng-container *ngIf="hover?.chart === 'res' && resolutionRate[hover!.i]">
                <div class="rcursor" [style.left.%]="hover!.leftPct"></div>
                <div class="rdot" [style.left.%]="hover!.leftPct" [style.top.%]="(1 - resolutionRate[hover!.i].taux/100)*100" style="background:var(--success)"></div>
                <div class="rtip" [style.left.%]="hover!.leftPct" [class.flip]="hover!.leftPct > 65">
                  <div class="rtip-t">{{ resolutionRate[hover!.i].mois }}</div>
                  <div class="rtip-r"><i class="d" style="background:var(--success)"></i>{{ 'admin.reports.rate' | translate }}<b>{{ resolutionRate[hover!.i].taux }}%</b></div>
                </div>
              </ng-container>
            </div>
            <div class="x-axis"><span *ngFor="let m of resolutionRate; let i = index" [style.left.%]="(i/(resolutionRate.length-1))*100">{{ m.mois }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ Report generator modal ═══ -->
  <div class="rg-backdrop" *ngIf="showReportModal" (click)="closeReportModal()">
    <div class="rg-modal" (click)="$event.stopPropagation()">
      <div class="rg-head">
        <h3>{{ 'admin.reports.rgTitle' | translate }}</h3>
        <button class="rg-x" (click)="closeReportModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
      <div class="rg-body">
        <div class="rg-label">{{ 'admin.reports.rgPick' | translate }}</div>
        <div class="rg-list">
          <button type="button" class="rg-item" *ngFor="let r of reportCatalog" [class.on]="selectedReport === r.key" (click)="selectedReport = r.key">
            <span class="rg-name">{{ ('admin.reports.rt.' + r.key) | translate }}</span>
            <span class="rg-fmt" [class.pdf-only]="!r.csv">{{ r.csv ? 'PDF · CSV' : ('admin.reports.pdfOnly' | translate) }}</span>
          </button>
        </div>
        <div class="rg-period">
          <label>{{ 'admin.reports.rgPeriod' | translate }}</label>
          <select [(ngModel)]="reportPeriod">
            <option value="all">{{ 'admin.reports.rperiod.all' | translate }}</option>
            <option value="week">{{ 'admin.reports.rperiod.week' | translate }}</option>
            <option value="month">{{ 'admin.reports.rperiod.month' | translate }}</option>
            <option value="quarter">{{ 'admin.reports.rperiod.quarter' | translate }}</option>
            <option value="year">{{ 'admin.reports.rperiod.year' | translate }}</option>
          </select>
        </div>
      </div>
      <div class="rg-foot">
        <button type="button" class="btn btn-outline" (click)="closeReportModal()">{{ 'admin.reports.rgCancel' | translate }}</button>
        <span class="rg-spacer"></span>
        <button type="button" class="btn btn-primary" [disabled]="reportLoading" (click)="downloadReport('PDF')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          {{ 'admin.reports.downloadPdf' | translate }}
        </button>
        <button type="button" class="btn btn-primary" [disabled]="reportLoading || !selectedReportDef?.csv"
                [title]="!selectedReportDef?.csv ? ('admin.reports.csvUnavailable' | translate) : ''" (click)="downloadReport('CSV')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          {{ 'admin.reports.downloadCsv' | translate }}
        </button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    /* Report generator modal */
    .rg-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(3px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .rg-modal { width: 100%; max-width: 480px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: 0 24px 60px rgba(15,23,42,.3); display: flex; flex-direction: column; max-height: 88vh; }
    .rg-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-light); }
    .rg-head h3 { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); }
    .rg-x { width: 30px; height: 30px; border: none; background: var(--bg-subtle); border-radius: var(--radius-md); cursor: pointer; color: var(--text-muted); display: grid; place-items: center; } .rg-x svg { width: 15px; height: 15px; }
    .rg-body { padding: 16px 20px; overflow-y: auto; }
    .rg-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin-bottom: 8px; }
    .rg-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .rg-item { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-md); background: var(--bg-card); cursor: pointer; text-align: left; font-family: inherit; transition: border-color .12s ease, background .12s ease; }
    .rg-item:hover { background: var(--bg-subtle); }
    .rg-item.on { border-color: var(--primary); background: var(--primary-bg, rgba(37,99,235,.06)); }
    .rg-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .rg-fmt { font-size: 10.5px; font-weight: 600; color: var(--text-muted); } .rg-fmt.pdf-only { color: var(--warning); }
    .rg-period { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; }
    .rg-period label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .rg-period select { height: 38px; padding: 0 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); font-family: inherit; font-size: 13px; }
    .rg-foot { display: flex; align-items: center; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--border-light); } .rg-foot .rg-spacer { flex: 1; }
    .rg-foot .btn:disabled { opacity: .5; cursor: not-allowed; }

    .rep-wrap { display: flex; flex-direction: column; gap: 24px; }
    .rep-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); overflow: hidden; }
    .pad-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 16px; }
    .rc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--border-light);
      h3 { font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin: 0; } .sub { font-size: 11.5px; color: var(--text-muted); } }
    .rc-body { padding: 18px 20px; }
    .rc-body.no-pad { padding: 0; }

    /* load animations */
    @keyframes repFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes repWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    @keyframes repDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
    .anim { animation: repFade .5s ease both; animation-delay: var(--d, 0s); }
    .reveal { animation: repWipe .9s cubic-bezier(.4,0,.2,1) both; }
    .draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: repDraw 1.1s ease forwards .2s; }

    .period-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .ptab { height: 32px; padding: 0 14px; border: none; border-radius: var(--radius-md); background: var(--bg-subtle); color: var(--text-muted); font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .ptab.active { background: var(--primary); color: #fff; }
    .rep-actions { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border: none; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      svg { width: 15px; height: 15px; }
      &.btn-primary { background: var(--primary); color: #fff; } &.btn-primary:hover { background: var(--primary-hover); }
      &.btn-outline { background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); } &.btn-outline:hover { background: var(--bg-subtle); } }

    .section-eyebrow { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); margin: 0 0 12px; }
    .exec-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 1100px) { .exec-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .exec-grid { grid-template-columns: 1fr; } }
    .exec-tile { border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 20px; }
    .exec-tile.t-success { background: linear-gradient(135deg, color-mix(in oklab,var(--success) 14%,transparent), transparent); }
    .exec-tile.t-brand { background: linear-gradient(135deg, color-mix(in oklab,var(--primary) 14%,transparent), transparent); }
    .exec-tile.t-navy { background: linear-gradient(135deg, color-mix(in oklab,var(--sidebar-bg) 12%,transparent), transparent); }
    .exec-tile.t-purple { background: linear-gradient(135deg, color-mix(in oklab,var(--accent) 14%,transparent), transparent); }
    .exec-top { display: flex; align-items: center; gap: 8px; }
    .exec-ico { width: 18px; height: 18px; display: inline-flex; }
    .t-success .exec-ico { color: var(--success); } .t-brand .exec-ico { color: var(--primary); } .t-navy .exec-ico { color: var(--sidebar-bg); } .t-purple .exec-ico { color: var(--accent); }
    .exec-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; font-weight: 600; color: var(--text-secondary); }
    .exec-value { font-size: 28px; font-weight: 800; letter-spacing: -.5px; color: var(--text-primary); margin-top: 12px; line-height: 1; }
    .exec-delta { font-size: 11.5px; color: var(--text-muted); margin-top: 6px; }

    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 1100px) { .grid-3 { grid-template-columns: 1fr; } }
    .col-span-2 { grid-column: span 2; } @media (max-width: 1100px) { .col-span-2 { grid-column: span 1; } }

    /* chart layout (axes) */
    .rc.xy { display: grid; grid-template-columns: 34px 1fr; grid-template-rows: 1fr 20px; column-gap: 8px; height: 250px; }
    .y-axis { grid-column: 1; grid-row: 1; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; padding: 1px 0;
      span { font-size: 10px; color: var(--text-muted); } }
    .plot { grid-column: 2; grid-row: 1; position: relative; }
    .x-axis { grid-column: 2; grid-row: 2; position: relative;
      span { position: absolute; top: 4px; transform: translateX(-50%); font-size: 9.5px; color: var(--text-muted); white-space: nowrap; } }
    .x-axis.bars-x { display: flex; padding: 0; }
    .x-axis.bars-x span { position: static; flex: 1; text-align: center; transform: none; overflow: hidden; text-overflow: ellipsis; }
    .gridline { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--border); transform: translateY(-.5px); }
    .line-svg { position: absolute; inset: 0; width: 100%; height: 100%; }

    .rcursor { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--text-muted); opacity: .4; transform: translateX(-.5px); pointer-events: none; }
    .rdot { position: absolute; width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--bg-card); transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 1px 2px rgba(0,0,0,.2); }
    .rtip { position: absolute; z-index: 8; top: 8px; transform: translateX(10px); background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 8px 11px; min-width: 130px; pointer-events: none;
      .rtip-t { font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 5px; }
      .rtip-r { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); line-height: 1.7; b { margin-left: auto; color: var(--text-primary); padding-left: 10px; } }
      .d { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; } }
    .rtip.flip { transform: translateX(-100%) translateX(-10px); }

    .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px;
      .lg { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); } .d { width: 9px; height: 9px; border-radius: 3px; display: inline-block; } }

    .gbars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 16px; padding: 0 6px; }
    .gbar-group { flex: 1; display: flex; align-items: flex-end; justify-content: center; height: 100%; }
    .gbar-pair { width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 4px; }
    .gbar { width: 14px; border-radius: 4px 4px 0 0; min-height: 1px; transition: height .8s cubic-bezier(.4,0,.2,1); }
    .gbar.plan { background: var(--text-muted); } .gbar.real { background: var(--primary); }

    .perf-list { display: flex; flex-direction: column; gap: 14px; }
    .perf-top { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .perf-name { font-weight: 600; color: var(--text-primary); } .perf-val { color: var(--text-muted); }
    .perf-track { height: 6px; border-radius: var(--radius-full); background: var(--bg-subtle); overflow: hidden; }
    .perf-fill { height: 100%; border-radius: var(--radius-full); background: linear-gradient(90deg,var(--primary),var(--accent)); transition: width .9s cubic-bezier(.4,0,.2,1); }

    .radar-body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 250px; gap: 6px; }
    .radar { width: 100%; max-width: 240px; flex: 1; min-height: 0; } .radar-lbl { font-size: 7px; fill: var(--text-muted); text-anchor: middle; }
    .radar-scale { font-size: 5.5px; fill: var(--text-muted); opacity: .75; text-anchor: start; }
    .radar-detail { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); min-height: 18px; }
    .radar-detail b { color: var(--text-primary); } .radar-detail .hint { color: var(--text-muted); }
    .radar-detail .d { width: 9px; height: 9px; border-radius: 50%; background: var(--primary); display: inline-block; }

    .donut-split { display: flex; align-items: center; gap: 14px; }
    .donut-wrap { width: 46%; max-width: 130px; } .donut { width: 100%; transform: rotate(-90deg); }
    .donut .dseg { cursor: pointer; transition: opacity .15s ease, stroke-width .15s ease; }
    .donut:hover .dseg { opacity: .4; } .donut .dseg:hover { opacity: 1; stroke-width: 4.2; }
    .donut-legend { width: 54%; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px;
      li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; border-radius: 6px; padding: 2px 4px; transition: background .15s ease; } li.on { background: var(--bg-subtle); }
      .d { width: 10px; height: 10px; border-radius: 50%; } .nm { color: var(--text-muted); } .vl { margin-left: auto; font-weight: 700; color: var(--text-primary); } }

    .center-card .center-body { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 200px; gap: 10px; }
    .big-stat { font-size: 44px; font-weight: 800; letter-spacing: -1px; color: var(--primary); }
    .center-note { font-size: 11.5px; color: var(--text-muted); max-width: 240px; }

    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px;
      thead tr { background: var(--bg-subtle); }
      th { text-align: left; padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); white-space: nowrap; }
      th:first-child, td:first-child { padding-left: 20px; }
      td { padding: 12px 14px; border-top: 1px solid var(--border-light); color: var(--text-secondary); }
      tbody tr:hover { background: var(--bg-subtle); }
      .td-name { font-weight: 600; color: var(--text-primary); }
      .muted { color: var(--text-muted); } .ok { color: var(--success); font-weight: 600; } .bad { color: var(--danger); } }
    .empty-row { padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px; }
    .recap-pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-top: 1px solid var(--border-light); }
    .rp-info { font-size: 12px; color: var(--text-muted); }
    .rp-ctrl { display: flex; align-items: center; gap: 8px; }
    .rp-num { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
    .rp-btn { width: 30px; height: 30px; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); cursor: pointer; color: var(--text-secondary); font-size: 16px; line-height: 1; }
    .rp-btn:hover:not(:disabled) { background: var(--bg-subtle); color: var(--text-primary); }
    .rp-btn:disabled { opacity: .4; cursor: default; }

    .badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: var(--radius-full); white-space: nowrap; }
    .badge-primary { background: var(--primary-bg); color: var(--primary); }
    .badge-success { background: var(--success-bg); color: var(--success-text); }
    .badge-warning { background: var(--warning-bg); color: var(--warning-text); }
    .badge-slate { background: var(--bg-subtle); color: var(--text-muted); }
  `]
})
export class AdminReportsComponent implements OnInit {
  periods = ['admin.reports.periodWeek', 'admin.reports.periodMonth', 'admin.reports.periodQuarter', 'admin.reports.periodCustom'];
  period = 'admin.reports.periodMonth';
  animated = false;
  hover: { chart: string; i: number; leftPct: number } | null = null;
  donutHover = -1;

  loadingReports = false;
  avgResolutionHours = 0;
  resolvedRate = 0;
  get avgResolutionLabel(): string {
    const h = Math.floor(this.avgResolutionHours);
    const m = Math.round((this.avgResolutionHours - h) * 60);
    return this.avgResolutionHours > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : '—';
  }
  fmtNumPub(v: any): string { return this.fmtNum(v); }

  // Values start as placeholders and are replaced by real backend data (no mock numbers).
  execKpis = [
    { value: '—', labelKey: 'admin.reports.kpiCompletion', tone: 'success', delta: '', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' },
    { value: '—', labelKey: 'admin.reports.kpiOnTime', tone: 'brand', delta: '', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>' },
    { value: '—', labelKey: 'admin.reports.kpiHours', tone: 'navy', delta: '', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"></circle><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path></svg>' },
    { value: '—', labelKey: 'admin.reports.kpiSupport', tone: 'purple', delta: '', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17a2 2 0 0 1-2 2H6.8a2 2 0 0 0-1.4.6L3 22V5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2z"></path></svg>' }
  ];

  pct100Ticks = [100, 75, 50, 25, 0];

  plannedVsReal: { name: string; planifie: number; reel: number }[] = [];

  burndown: { jour: string; ideal: number; reel: number }[] = [];
  burnMax = 200; burnTicks: number[] = []; burnXTicks: { i: number; label: string }[] = [];
  burnIdeal = ''; burnReal = '';

  statusOverTime: { mois: string; encours: number; termine: number; retard: number }[] = [];
  statusMax = 1; statusTicks: number[] = [];
  bandEncours = ''; bandTermine = ''; bandRetard = ''; lineTotal = '';

  dau: { jour: number; dau: number }[] = [];
  dauMax = 1; dauTicks: number[] = []; dauXTicks: { i: number; label: string }[] = [];
  dauLine = ''; dauArea = '';

  resolutionRate: { mois: string; taux: number }[] = [];
  resLine = '';

  topPerformers: { nom: string; taches: number }[] = [];
  topMax = 1;
  teamLoad: { equipe: string; charge: number }[] = [];
  recap: RecapRow[] = [];
  // Pagination for the "Récapitulatif par projet" table (10 rows per page).
  recapPage = 0;
  readonly recapPageSize = 10;
  get pagedRecap(): RecapRow[] { return this.recap.slice(this.recapPage * this.recapPageSize, (this.recapPage + 1) * this.recapPageSize); }
  get recapTotalPages(): number { return Math.max(1, Math.ceil(this.recap.length / this.recapPageSize)); }
  get recapEnd(): number { return Math.min((this.recapPage + 1) * this.recapPageSize, this.recap.length); }
  ticketsByCat: Donut[] = [];

  // Team workload radar — auto-scaled to the busiest team, with a readable numeric ring scale.
  cx = 100; cy = 90; radarR = 70;
  radarMax = 5;                                   // value at the outermost ring (auto-scaled)
  readonly radarScales = [1, 0.66, 0.33];         // concentric grid rings
  radarAxes: { x: number; y: number; lx: number; ly: number; label: string; vx: number; vy: number; value: number }[] = [];
  radarShape = '';
  radarRingLabels: { y: number; value: number }[] = [];
  radarHover = -1;                                // index of the point being hovered (-1 = none)
  generating = false;                             // true while a report is being built

  // ── Report generator modal ────────────────────────────────────────────────
  showReportModal = false;
  reportLoading = false;
  selectedReport = 'projects';
  reportPeriod: 'all' | 'week' | 'month' | 'quarter' | 'year' = 'all';
  /** Catalog of generatable reports. csv=false → CSV download is disabled for that report. */
  reportCatalog: { key: string; csv: boolean }[] = [
    { key: 'projects',      csv: true },
    { key: 'tasks',         csv: true },
    { key: 'users',         csv: true },
    { key: 'activityLogs',  csv: true },
    { key: 'tickets',       csv: true },
    { key: 'loginAttempts', csv: true },
    { key: 'execSummary',   csv: false },   // narrative overview — PDF only
  ];
  get selectedReportDef() { return this.reportCatalog.find(r => r.key === this.selectedReport); }

  constructor(
    private projectService: ProjectService,
    public toast: ToastService,
    private cdr: ChangeDetectorRef,
    private analytics: AnalyticsService,
    private pdf: PdfService,
    private translate: TranslateService,
    private reportService: ReportService,
    private taskService: TaskService,
    private userService: UserService,
    private activityLogService: ActivityLogService,
    private supportTicketService: SupportTicketService,
    private adminSecurity: AdminSecurityService,
  ) {}

  /** Translate helper for TS-side strings (toasts, exports, deltas). */
  t(key: string, params?: any): string { return this.translate.instant(key, params); }

  /** "Generate report" → open the report picker. */
  generateReport(): void { this.selectedReport = 'projects'; this.reportPeriod = 'all'; this.showReportModal = true; }
  closeReportModal(): void { this.showReportModal = false; }

  /** Calendar window for the chosen period, or null for "all time". */
  private reportWindow(): { start: number; end: number } | null {
    const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
    switch (this.reportPeriod) {
      case 'week': { const d = now.getDay() || 7; const s = new Date(y, m, now.getDate() - d + 1); return { start: s.getTime(), end: now.getTime() + 864e5 }; }
      case 'month':   return { start: new Date(y, m, 1).getTime(),            end: new Date(y, m + 1, 0, 23, 59, 59).getTime() };
      case 'quarter': { const q = Math.floor(m / 3) * 3; return { start: new Date(y, q, 1).getTime(), end: new Date(y, q + 3, 0, 23, 59, 59).getTime() }; }
      case 'year':    return { start: new Date(y, 0, 1).getTime(),            end: new Date(y, 11, 31, 23, 59, 59).getTime() };
      default:        return null;
    }
  }
  private inWindow(dateStr?: string): boolean {
    const w = this.reportWindow();
    if (!w || !dateStr) return true;
    const t = new Date(dateStr).getTime();
    return isNaN(t) ? true : (t >= w.start && t <= w.end);
  }
  /** Normalise any backend list response (array | {data} | {content} | {data:{content}}) to an array. */
  private asArray(r: any): any[] {
    if (Array.isArray(r)) return r;
    if (!r) return [];
    return r.data?.content || r.content || r.data || [];
  }

  /** Build the dataset for a report key (fetches, maps to columns, filters by period). */
  private loadReportData(key: string): Observable<RepData> {
    switch (key) {
      case 'projects':
        return this.projectService.getAllProjects(0, 1000).pipe(map((r: any) => ({
          titleKey: 'admin.reports.rt.projects',
          columns: [
            { h: 'name', get: (p: any) => p.name }, { h: 'manager', get: (p: any) => p.managerName || '—' },
            { h: 'status', get: (p: any) => p.status || '—' }, { h: 'progress', get: (p: any) => (p.progress || 0) + '%' },
            { h: 'start', get: (p: any) => p.startDate || '—' }, { h: 'end', get: (p: any) => p.endDate || '—' },
          ],
          rows: this.asArray(r).filter((p: any) => this.inWindow(p.createdAt || p.startDate)),
        })));
      case 'tasks':
        return this.taskService.getAllTasks(0, 2000).pipe(map((r: any) => ({
          titleKey: 'admin.reports.rt.tasks',
          columns: [
            { h: 'name', get: (t: any) => t.name }, { h: 'project', get: (t: any) => t.projectName || '—' },
            { h: 'assignee', get: (t: any) => t.assignedToName || '—' }, { h: 'priority', get: (t: any) => t.priority || '—' },
            { h: 'status', get: (t: any) => t.status || '—' }, { h: 'progress', get: (t: any) => (t.progress || 0) + '%' },
            { h: 'deadline', get: (t: any) => t.deadline || '—' },
          ],
          rows: this.asArray(r).filter((t: any) => this.inWindow(t.createdAt || t.deadline)),
        })));
      case 'users':
        return this.userService.getAllUsers(0, 2000).pipe(map((r: any) => ({
          titleKey: 'admin.reports.rt.users',
          columns: [
            { h: 'name', get: (u: any) => `${u.firstName || ''} ${u.lastName || ''}`.trim() }, { h: 'username', get: (u: any) => u.username },
            { h: 'email', get: (u: any) => u.email }, { h: 'role', get: (u: any) => u.role || u.userType || '—' },
            { h: 'active', get: (u: any) => this.t(u.isActive ? 'admin.reports.yes' : 'admin.reports.no') },
            { h: 'created', get: (u: any) => this.fmtDate(u.createdAt) },
          ],
          rows: this.asArray(r).filter((u: any) => this.inWindow(u.createdAt)),
        })));
      case 'activityLogs':
        return this.activityLogService.getAllActivityLogs().pipe(map((list: any[]) => ({
          titleKey: 'admin.reports.rt.activityLogs',
          columns: [
            { h: 'date', get: (l: any) => this.fmtDate(l.timestamp || l.createdAt) },
            { h: 'user', get: (l: any) => l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() || ('#' + l.userId) : ('#' + (l.userId ?? '—')) },
            { h: 'action', get: (l: any) => l.action || l.activityType || '—' },
            { h: 'entity', get: (l: any) => l.entityType || '—' },
            { h: 'details', get: (l: any) => l.details || l.description || '—' },
          ],
          rows: this.asArray(list).filter((l: any) => this.inWindow(l.timestamp || l.createdAt)),
        })));
      case 'tickets':
        return this.supportTicketService.getAllTickets().pipe(map((list: any[]) => ({
          titleKey: 'admin.reports.rt.tickets',
          columns: [
            { h: 'id', get: (s: any) => 'TKT-' + (s.id ?? '') }, { h: 'subject', get: (s: any) => s.subject || s.title || '—' },
            { h: 'status', get: (s: any) => s.status || '—' }, { h: 'priority', get: (s: any) => s.priority || '—' },
            { h: 'user', get: (s: any) => s.userName || ('#' + (s.userId ?? '—')) }, { h: 'created', get: (s: any) => this.fmtDate(s.createdAt) },
          ],
          rows: this.asArray(list).filter((s: any) => this.inWindow(s.createdAt)),
        })));
      case 'loginAttempts':
        return this.adminSecurity.getLoginAttempts().pipe(map((list: any[]) => ({
          titleKey: 'admin.reports.rt.loginAttempts',
          columns: [
            { h: 'date', get: (a: any) => this.fmtDate(a.attemptedAt || a.createdAt) },
            { h: 'username', get: (a: any) => a.username || '—' },
            { h: 'result', get: (a: any) => this.t(a.success ? 'admin.reports.success' : 'admin.reports.failure') },
            { h: 'ip', get: (a: any) => a.ipAddress || '—' },
          ],
          rows: this.asArray(list).filter((a: any) => this.inWindow(a.attemptedAt || a.createdAt)),
        })));
      default:
        return of({ titleKey: 'admin.reports.rt.' + key, columns: [], rows: [] });
    }
  }

  /** Run the selected report in the requested format. */
  downloadReport(format: 'PDF' | 'CSV'): void {
    if (this.reportLoading) return;
    const def = this.selectedReportDef;
    if (!def) return;
    if (format === 'CSV' && !def.csv) return;          // guard: CSV not available for this report

    // The executive overview is a narrative (PDF only) built from the on-page KPIs.
    if (def.key === 'execSummary') { this.exportExecSummary(); this.closeReportModal(); return; }

    // For PDF, open the tab NOW (within the click) so the browser doesn't block it after the async fetch.
    let win: Window | null = null;
    if (format === 'PDF') {
      win = this.pdf.blankWindow();
      if (!win) { this.toast.show(this.t('admin.reports.toastPdfPopup'), 'error'); return; }
    }

    this.reportLoading = true;
    this.toast.show(this.t('admin.reports.toastGen'), 'success');
    this.loadReportData(def.key).subscribe({
      next: (d) => {
        if (format === 'CSV') this.exportTableCsv(d); else this.exportTablePdf(d, win);
        this.reportLoading = false;
        this.showReportModal = false;
        this.cdr.markForCheck();
      },
      error: () => { if (win) win.close(); this.toast.show(this.t('admin.reports.toastGenFail'), 'error'); this.reportLoading = false; this.cdr.markForCheck(); },
    });
  }

  private periodLabel(): string { return this.t('admin.reports.rperiod.' + this.reportPeriod); }

  private exportTablePdf(d: RepData, win?: Window | null): void {
    const th = d.columns.map(c => `<th>${this.pdf.esc(this.t('admin.reports.rcol.' + c.h))}</th>`).join('');
    const body = d.rows.length
      ? d.rows.map(r => `<tr>${d.columns.map(c => `<td>${this.pdf.esc(c.get(r))}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${d.columns.length}">${this.pdf.esc(this.t('admin.reports.empty'))}</td></tr>`;
    const html = `<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
    const ok = this.pdf.open({ title: `${this.t(d.titleKey)} — ${this.periodLabel()}`, subtitle: this.t('admin.reports.rgRows', { n: d.rows.length }), bodyHtml: html }, win);
    if (!ok) { if (win) win.close(); this.toast.show(this.t('admin.reports.toastPdfPopup'), 'error'); return; }
    this.toast.show(this.t('admin.reports.toastGenDone'), 'success');
  }

  private exportTableCsv(d: RepData): void {
    const rows = [d.columns.map(c => this.t('admin.reports.rcol.' + c.h)), ...d.rows.map(r => d.columns.map(c => c.get(r)))];
    const csv = rows.map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    ReportService.triggerDownload(blob, `${this.selectedReport}-${this.reportPeriod}-${new Date().toISOString().slice(0, 10)}.csv`);
    this.toast.show(this.t('admin.reports.toastGenDone'), 'success');
  }

  /** PDF-only executive overview built from the page's KPI tiles. */
  private exportExecSummary(): void {
    const rows = this.execKpis.map(k => `<tr><td>${this.pdf.esc(this.t(k.labelKey))}</td><td><b>${this.pdf.esc(k.value)}</b></td><td>${this.pdf.esc(k.delta)}</td></tr>`).join('');
    const html = `<table><thead><tr><th>${this.pdf.esc(this.t('admin.reports.rcol.indicator'))}</th><th>${this.pdf.esc(this.t('admin.reports.rcol.value'))}</th><th>${this.pdf.esc(this.t('admin.reports.rcol.trend'))}</th></tr></thead><tbody>${rows}</tbody></table>`;
    const ok = this.pdf.open({ title: `${this.t('admin.reports.rt.execSummary')} — ${this.periodLabel()}`, subtitle: this.t('admin.reports.execTitle'), bodyHtml: html });
    if (!ok) { this.toast.show(this.t('admin.reports.toastPdfPopup'), 'error'); return; }
    this.toast.show(this.t('admin.reports.toastGenDone'), 'success');
  }

  private fmtDate(s?: string): string { if (!s) return '—'; const d = new Date(s); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(this.locale(), { day: '2-digit', month: 'short', year: 'numeric' }); }

  private locale(): string { return this.translate.currentLang() === 'en' ? 'en-GB' : 'fr-FR'; }

  ngOnInit(): void {
    this.loadProjects();
    this.loadReports();
  }

  /** Map the visible period tab to the backend period parameter. */
  private periodParam(): string | undefined {
    switch (this.period) {
      case 'admin.reports.periodWeek': return 'week';
      case 'admin.reports.periodMonth': return 'month';
      case 'admin.reports.periodQuarter': return 'quarter';
      default: return undefined; // Personnalisé → all-time
    }
  }

  selectPeriod(p: string): void {
    if (this.loadingReports || this.period === p) return;
    this.period = p;
    this.loadReports();
  }

  private loadReports(): void {
    this.loadingReports = true;
    this.analytics.getAdminReports(this.periodParam()).subscribe({
      next: (r: any) => {
        const d = r && r.data ? r.data : r;
        if (d && Array.isArray(d.statusOverTime)) this.applyReports(d);
        this.computeGeometry();
        this.loadingReports = false;
        this.reveal();
      },
      error: () => { this.loadingReports = false; this.computeGeometry(); this.reveal(); }
    });
  }

  private reveal(): void {
    setTimeout(() => { this.animated = true; this.cdr.detectChanges(); }, 80);
    this.cdr.detectChanges();
  }

  /** Map the real backend report payload into the chart/table data arrays. */
  private applyReports(d: any): void {
    this.statusOverTime = (d.statusOverTime || []).map((m: any) => ({ mois: m.mois, encours: m.encours || 0, termine: m.termine || 0, retard: m.retard || 0 }));
    this.burndown = (d.burndown || []).map((b: any) => ({ jour: b.jour, ideal: b.ideal || 0, reel: b.reel || 0 }));
    this.dau = (d.dau || []).map((x: any) => ({ jour: x.jour, dau: x.dau || 0 }));
    this.resolutionRate = (d.resolutionTrend || []).map((m: any) => ({ mois: m.mois, taux: m.taux || 0 }));
    this.topPerformers = (d.topPerformers || []).map((p: any) => ({ nom: p.nom, taches: p.taches || 0 }));
    this.teamLoad = (d.teamLoad || []).map((t: any) => ({ equipe: t.equipe, charge: t.charge || 0 }));
    this.ticketsByCat = (d.ticketsByCategory || []).map((c: any) => ({ name: c.name, value: c.value || 0, color: '', pct: 0, dash: '', offset: 0 }));

    // Real per-project recap (replaces the previously fabricated rows).
    this.recap = (d.recap || []).map((row: any) => ({
      nom: row.nom, pm: row.pm || this.t('admin.reports.notAssigned'), taches: row.taches || 0, terminees: row.terminees || 0,
      retard: row.retard || 0, heures: row.heures || 0, progression: row.progression || 0, statut: row.statut || 'PLANNED'
    }));
    this.recapPage = 0;

    this.avgResolutionHours = Number(d.avgResolutionHours || 0);
    this.resolvedRate = Number(d.resolvedRate || 0);

    const hours = Number(d.totalHours || 0);
    const sat = Number(d.supportSatisfaction || 0);
    this.execKpis[0].value = `${this.fmtNum(d.completionRate)} %`;
    this.execKpis[1].value = `${this.fmtNum(d.onTimeRate)} %`;
    this.execKpis[2].value = `${Math.round(hours).toLocaleString(this.locale())} h`;
    this.execKpis[2].delta = this.t('admin.reports.deltaAvgRes', { n: this.fmtNum(d.avgResolutionHours) });
    this.execKpis[3].value = `${this.fmtDec(sat)} / 5`;
    this.execKpis[3].delta = this.t('admin.reports.deltaResolved', { n: this.fmtNum(d.resolvedRate) });
  }

  private fmtNum(v: any): string {
    const s = `${Math.round(Number(v || 0) * 10) / 10}`;
    return this.translate.currentLang() === 'en' ? s : s.replace('.', ',');
  }
  private fmtDec(v: number): string {
    const s = v.toFixed(1);
    return this.translate.currentLang() === 'en' ? s : s.replace('.', ',');
  }

  private ticks5(max: number): number[] {
    return [max, Math.round(max * .75), Math.round(max * .5), Math.round(max * .25), 0];
  }

  /** Recompute all axis ticks + SVG path strings from the current data arrays. */
  private computeGeometry(): void {
    // Burndown
    this.burnMax = Math.max(1, ...this.burndown.map(d => Math.max(d.ideal, d.reel)));
    this.burnMax = Math.max(4, Math.ceil(this.burnMax / 4) * 4);
    this.burnTicks = this.ticks5(this.burnMax);
    this.burnXTicks = this.burndown.map((d, i) => ({ i, label: d.jour })).filter(t => t.i % 3 === 0);
    this.burnIdeal = this.line(this.burndown.map(d => d.ideal), this.burnMax);
    this.burnReal = this.line(this.burndown.map(d => d.reel), this.burnMax);

    // Status over time (stacked area)
    this.statusMax = Math.max(1, ...this.statusOverTime.map(s => s.encours + s.termine + s.retard));
    this.statusMax = Math.max(4, Math.ceil(this.statusMax / 4) * 4);
    this.statusTicks = this.ticks5(this.statusMax);
    const sn = this.statusOverTime.length || 1;
    const sx = (i: number) => (i / (sn - 1)) * 100;
    const yTop = (cum: number) => (100 - (cum / this.statusMax) * 100);
    const c1 = this.statusOverTime.map(s => s.encours);
    const c2 = this.statusOverTime.map(s => s.encours + s.termine);
    const c3 = this.statusOverTime.map(s => s.encours + s.termine + s.retard);
    this.bandEncours = this.band(c1.map((v, i) => ({ x: sx(i), y: yTop(v) })), this.statusOverTime.map((_, i) => ({ x: sx(i), y: 100 })));
    this.bandTermine = this.band(c2.map((v, i) => ({ x: sx(i), y: yTop(v) })), c1.map((v, i) => ({ x: sx(i), y: yTop(v) })));
    this.bandRetard = this.band(c3.map((v, i) => ({ x: sx(i), y: yTop(v) })), c2.map((v, i) => ({ x: sx(i), y: yTop(v) })));
    this.lineTotal = c3.map((v, i) => `${sx(i).toFixed(2)} ${yTop(v).toFixed(2)}`).join(' ');

    // DAU
    this.dauMax = Math.max(5, Math.ceil(Math.max(1, ...this.dau.map(d => d.dau)) / 5) * 5);
    this.dauTicks = this.ticks5(this.dauMax);
    this.dauXTicks = this.dau.map((d, i) => ({ i, label: `${d.jour}` })).filter(t => t.i % 5 === 0);
    this.dauLine = this.line(this.dau.map(d => d.dau), this.dauMax);
    this.dauArea = `M 0 100 L ${this.dauLine} L 100 100 Z`;

    // Resolution trend
    this.resLine = this.line(this.resolutionRate.map(d => d.taux), 100);

    // Top performers / radar / donut
    this.topMax = Math.max(1, ...this.topPerformers.map(t => t.taches));
    this.buildRadar();
    this.computeDonut();
  }

  private computeDonut(): void {
    const palette: Record<string, string> = { Urgente: 'var(--danger)', Haute: 'var(--warning)', Moyenne: 'var(--primary)', Faible: 'var(--success)' };
    const fallback = ['var(--danger)', 'var(--primary)', 'var(--warning)', 'var(--accent)', 'var(--success)'];
    const total = this.ticketsByCat.reduce((s, p) => s + p.value, 0) || 1;
    let acc = 0;
    this.ticketsByCat = this.ticketsByCat.map((p, i) => {
      const pct = (p.value / total) * 100;
      const seg: Donut = { ...p, color: palette[p.name] || fallback[i % fallback.length], pct, dash: `${Math.max(0, pct - 1.5)} ${100 - Math.max(0, pct - 1.5)}`, offset: -acc };
      acc += pct; return seg;
    });
  }

  onMove(e: MouseEvent, chart: string, n: number): void {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (!rect.width || n < 2) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const i = Math.round(ratio * (n - 1));
    this.hover = { chart, i, leftPct: (i / (n - 1)) * 100 };
  }

  private line(vals: number[], max: number): string {
    const n = vals.length;
    return vals.map((v, i) => `${((i / (n - 1)) * 100).toFixed(2)} ${(100 - (v / max) * 100).toFixed(2)}`).join(' ');
  }

  /** Area band between a top line and a bottom line (bottom drawn in reverse). */
  private band(top: { x: number; y: number }[], bottom: { x: number; y: number }[]): string {
    const t = top.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ');
    const b = [...bottom].reverse().map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ');
    return `M ${t} L ${b} Z`;
  }

  private buildRadar(): void {
    const n = this.teamLoad.length;
    // Auto-scale to the busiest team (rounded up to a "nice" value) instead of a fixed 100,
    // so the shape actually fills the chart and the rings carry meaningful numbers.
    this.radarMax = this.niceCeil(Math.max(1, ...this.teamLoad.map(t => t.charge || 0)));
    this.radarAxes = this.teamLoad.map((t, i) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (t.charge / this.radarMax) * this.radarR;
      return {
        x: this.cx + Math.cos(ang) * this.radarR,
        y: this.cy + Math.sin(ang) * this.radarR,
        lx: this.cx + Math.cos(ang) * (this.radarR + 14),
        ly: this.cy + Math.sin(ang) * (this.radarR + 14) + 2,
        label: t.equipe,
        vx: this.cx + Math.cos(ang) * r,
        vy: this.cy + Math.sin(ang) * r,
        value: t.charge,
      };
    });
    this.radarShape = this.radarAxes.map(a => `${a.vx.toFixed(1)},${a.vy.toFixed(1)}`).join(' ');
    // Numeric label for each concentric ring, placed up the vertical axis.
    this.radarRingLabels = this.radarScales.map(s => ({
      y: this.cy - this.radarR * s,
      value: Math.round(this.radarMax * s),
    }));
  }

  /** Round a max up to a clean axis value (5, 10, 15, 20, 50, …) for legible ring labels. */
  private niceCeil(v: number): number {
    if (v <= 5) return 5;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const half = pow / 2;
    return Math.ceil(v / half) * half;
  }

  radarRing(scale: number): string {
    const n = this.teamLoad.length;
    return this.teamLoad.map((_, i) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2; const r = this.radarR * scale;
      return `${(this.cx + Math.cos(ang) * r).toFixed(1)},${(this.cy + Math.sin(ang) * r).toFixed(1)}`;
    }).join(' ');
  }

  private loadProjects(): void {
    // Only the "planifié vs réel" mini-chart comes from here; the recap table is built
    // server-side from real per-project data (see applyReports).
    this.projectService.getAllProjects(0, 50).subscribe({
      next: (r: any) => {
        const list: any[] = r && r.data ? r.data : (Array.isArray(r) ? r : []);
        this.plannedVsReal = list.slice(0, 6).map(p => ({ name: (p.name || '').split(' ').slice(0, 2).join(' '), planifie: 100, reel: p.progress || 0 }));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  statusKey(s: string): string { return ({ IN_PROGRESS: 'admin.reports.stIn', COMPLETED: 'admin.reports.stDone', ON_HOLD: 'admin.reports.stHold', PLANNED: 'admin.reports.stPlanned' } as any)[s] || 'admin.reports.stPlanned'; }
  statusBadge(s: string): string { return ({ IN_PROGRESS: 'badge-primary', COMPLETED: 'badge-success', ON_HOLD: 'badge-warning', PLANNED: 'badge-slate' } as any)[s] || 'badge-slate'; }

  exportCsv(): void {
    const rows = [[this.t('admin.reports.thProject'), this.t('admin.reports.thPm'), this.t('admin.reports.thTasks'), this.t('admin.reports.thCompleted'), this.t('admin.reports.thLate'), this.t('admin.reports.thHours'), this.t('admin.reports.thCompletion'), this.t('admin.reports.thStatus')]];
    this.recap.forEach(r => rows.push([r.nom, r.pm, `${r.taches}`, `${r.terminees}`, `${r.retard}`, `${r.heures}`, `${r.progression}%`, this.t(this.statusKey(r.statut))]));
    const csv = rows.map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rapport-projets.csv'; a.click();
    URL.revokeObjectURL(url);
    this.toast.show(this.t('admin.reports.toastCsv'), 'success');
  }

  exportPdf(): void {
    const esc = (s: any) => this.pdf.esc(s);
    const rows = this.recap.map(r => `<tr><td>${esc(r.nom)}</td><td>${esc(r.pm)}</td><td>${r.terminees}/${r.taches}</td><td>${r.progression}%</td><td>${esc(this.t(this.statusKey(r.statut)))}</td></tr>`).join('');
    const body = `<table><thead><tr><th>${esc(this.t('admin.reports.thProject'))}</th><th>${esc(this.t('admin.reports.thPm'))}</th><th>${esc(this.t('admin.reports.thTasks'))}</th><th>${esc(this.t('admin.reports.thCompletion'))}</th><th>${esc(this.t('admin.reports.thStatus'))}</th></tr></thead><tbody>${rows}</tbody></table>`;
    const ok = this.pdf.open({ title: this.t('admin.reports.pdfTitle'), subtitle: this.t('admin.reports.pdfSubtitle', { n: this.recap.length }), bodyHtml: body });
    if (!ok) { this.toast.show(this.t('admin.reports.toastPdfPopup'), 'error'); return; }
    this.toast.show(this.t('admin.reports.toastPdf'), 'success');
  }
}
