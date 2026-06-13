import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { PdfService } from '../../../core/services/pdf.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

interface Donut { name: string; value: number; color: string; pct: number; dash: string; offset: number; }
interface RecapRow { nom: string; pm: string; taches: number; terminees: number; retard: number; heures: number; progression: number; statut: string; }

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="rep-wrap">

    <!-- Toolbar -->
    <div class="rep-card pad-row anim" style="--d:0s">
      <div class="period-tabs">
        <button *ngFor="let p of periods" class="ptab" [class.active]="period === p" (click)="selectPeriod(p)" [disabled]="loadingReports">{{ p }}</button>
      </div>
      <div class="rep-actions">
        <button class="btn btn-primary" (click)="toast.show('Génération du rapport lancée.', 'success')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path></svg>
          Générer le rapport
        </button>
        <button class="btn btn-outline" (click)="exportPdf()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> PDF</button>
        <button class="btn btn-outline" (click)="exportCsv()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> CSV</button>
      </div>
    </div>

    <!-- Executive KPIs -->
    <div class="anim" style="--d:.05s">
      <h2 class="section-eyebrow">Vue Exécutive</h2>
      <div class="exec-grid">
        <div class="exec-tile anim" *ngFor="let k of execKpis; let i = index" [ngClass]="'t-' + k.tone" [style.--d]="(0.08 + i*0.06) + 's'">
          <div class="exec-top"><span class="exec-ico" [innerHTML]="k.icon"></span><span class="exec-label">{{ k.label }}</span></div>
          <div class="exec-value">{{ k.value }}</div>
          <div class="exec-delta">{{ k.delta }}</div>
        </div>
      </div>
    </div>

    <!-- Row: planned vs real (2col) + burndown -->
    <div class="grid-3">
      <div class="rep-card col-span-2 anim" style="--d:.12s">
        <div class="rc-head"><h3>Progression : planifié vs réel</h3></div>
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
                <div class="rtip-r"><i class="d" style="background:var(--text-muted)"></i>Planifié<b>{{ plannedVsReal[hover!.i].planifie }}%</b></div>
                <div class="rtip-r"><i class="d" style="background:var(--primary)"></i>Réel<b>{{ plannedVsReal[hover!.i].reel }}%</b></div>
              </div>
            </div>
            <div class="x-axis bars-x"><span *ngFor="let p of plannedVsReal">{{ p.name }}</span></div>
          </div>
          <div class="legend"><span class="lg"><i class="d" style="background:var(--text-muted)"></i> Planifié</span><span class="lg"><i class="d" style="background:var(--primary)"></i> Réel</span></div>
        </div>
      </div>

      <div class="rep-card anim" style="--d:.18s">
        <div class="rc-head"><h3>Burndown global</h3><span class="sub">14 derniers jours</span></div>
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
                  <div class="rtip-r"><i class="d" style="background:var(--text-muted)"></i>Idéal<b>{{ burndown[hover!.i].ideal }}</b></div>
                  <div class="rtip-r"><i class="d" style="background:var(--primary)"></i>Réel<b>{{ burndown[hover!.i].reel }}</b></div>
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
      <div class="rc-head"><h3>Projets par statut dans le temps</h3><span class="sub">12 derniers mois</span></div>
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
                <div class="rtip-r"><i class="d" style="background:var(--primary)"></i>En cours<b>{{ statusOverTime[hover!.i].encours }}</b></div>
                <div class="rtip-r"><i class="d" style="background:var(--success)"></i>Terminés<b>{{ statusOverTime[hover!.i].termine }}</b></div>
                <div class="rtip-r"><i class="d" style="background:var(--danger)"></i>En retard<b>{{ statusOverTime[hover!.i].retard }}</b></div>
              </div>
            </ng-container>
          </div>
          <div class="x-axis"><span *ngFor="let m of statusOverTime; let i = index" [style.left.%]="(i/(statusOverTime.length-1))*100">{{ m.mois }}</span></div>
        </div>
        <div class="legend"><span class="lg"><i class="d" style="background:var(--primary)"></i> En cours</span><span class="lg"><i class="d" style="background:var(--success)"></i> Terminés</span><span class="lg"><i class="d" style="background:var(--danger)"></i> En retard</span></div>
      </div>
    </div>

    <!-- Row: top performers + radar + DAU -->
    <div class="grid-3">
      <div class="rep-card anim" style="--d:.30s">
        <div class="rc-head"><h3>Top performers</h3><span class="sub">Tâches terminées</span></div>
        <div class="rc-body perf-list reveal">
          <div class="perf-item" *ngFor="let t of topPerformers; let i = index">
            <div class="perf-top"><span class="perf-name">#{{ i+1 }} {{ t.nom }}</span><span class="perf-val">{{ t.taches }}</span></div>
            <div class="perf-track"><div class="perf-fill" [style.width.%]="animated ? (t.taches/topMax)*100 : 0"></div></div>
          </div>
        </div>
      </div>

      <div class="rep-card anim" style="--d:.36s">
        <div class="rc-head"><h3>Charge par équipe</h3></div>
        <div class="rc-body radar-body reveal">
          <svg viewBox="0 0 200 180" class="radar">
            <polygon *ngFor="let ring of [1,0.66,0.33]" [attr.points]="radarRing(ring)" fill="none" stroke="var(--border)" stroke-width="1"></polygon>
            <line *ngFor="let a of radarAxes" [attr.x1]="cx" [attr.y1]="cy" [attr.x2]="a.x" [attr.y2]="a.y" stroke="var(--border)" stroke-width="1"></line>
            <polygon [attr.points]="radarShape" fill="color-mix(in oklab, var(--primary) 35%, transparent)" stroke="var(--primary)" stroke-width="1.5"></polygon>
            <text *ngFor="let a of radarAxes" [attr.x]="a.lx" [attr.y]="a.ly" class="radar-lbl">{{ a.label }}</text>
          </svg>
        </div>
      </div>

      <div class="rep-card anim" style="--d:.42s">
        <div class="rc-head"><h3>Connexions actives</h3><span class="sub">DAU · 30 jours</span></div>
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
                  <div class="rtip-t">Jour {{ dau[hover!.i].jour }}</div>
                  <div class="rtip-r"><i class="d" style="background:var(--accent)"></i>Connexions<b>{{ dau[hover!.i].dau }}</b></div>
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
      <div class="rc-head"><h3>Récapitulatif par projet</h3></div>
      <div class="rc-body no-pad">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Projet</th><th>PM</th><th>Tâches</th><th>Terminées</th><th>En retard</th><th>Heures</th><th>Complétion</th><th>Statut</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of pagedRecap">
                <td class="td-name">{{ r.nom }}</td>
                <td class="muted">{{ r.pm }}</td>
                <td>{{ r.taches }}</td>
                <td class="ok">{{ r.terminees }}</td>
                <td class="bad">{{ r.retard }}</td>
                <td class="muted">{{ r.heures }} h</td>
                <td>{{ r.progression }}%</td>
                <td><span class="badge" [ngClass]="statusBadge(r.statut)">{{ statusLabel(r.statut) }}</span></td>
              </tr>
              <tr *ngIf="recap.length === 0"><td colspan="8"><div class="empty-row">Aucun projet à afficher.</div></td></tr>
            </tbody>
          </table>
        </div>
        <div class="recap-pager" *ngIf="recap.length > recapPageSize">
          <span class="rp-info">{{ recapPage * recapPageSize + 1 }}–{{ recapEnd }} sur {{ recap.length }}</span>
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
        <div class="rc-head"><h3>Tickets par catégorie</h3></div>
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
        <div class="rc-head"><h3>Temps moyen de résolution</h3></div>
        <div class="rc-body center-body">
          <div class="big-stat">{{ avgResolutionLabel }}</div>
          <span class="badge badge-success">{{ fmtNumPub(resolvedRate) }} % de tickets résolus</span>
          <p class="center-note">Délai moyen entre l'ouverture et la résolution des tickets sur la période</p>
        </div>
      </div>

      <div class="rep-card anim" style="--d:.66s">
        <div class="rc-head"><h3>Taux de résolution</h3><span class="sub">12 derniers mois</span></div>
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
                  <div class="rtip-r"><i class="d" style="background:var(--success)"></i>Taux<b>{{ resolutionRate[hover!.i].taux }}%</b></div>
                </div>
              </ng-container>
            </div>
            <div class="x-axis"><span *ngFor="let m of resolutionRate; let i = index" [style.left.%]="(i/(resolutionRate.length-1))*100">{{ m.mois }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
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

    .radar-body { display: flex; align-items: center; justify-content: center; height: 250px; }
    .radar { width: 100%; max-width: 240px; height: 100%; } .radar-lbl { font-size: 7px; fill: var(--text-muted); text-anchor: middle; }

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
  periods = ['Cette semaine', 'Ce mois', 'Ce trimestre', 'Personnalisé'];
  period = 'Ce mois';
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
    { value: '—', label: 'Taux de complétion des projets', tone: 'success', delta: '', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' },
    { value: '—', label: 'Taux de respect des délais', tone: 'brand', delta: '', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>' },
    { value: '—', label: 'Heures totales loguées', tone: 'navy', delta: '', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"></circle><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path></svg>' },
    { value: '—', label: 'Satisfaction support', tone: 'purple', delta: '', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17a2 2 0 0 1-2 2H6.8a2 2 0 0 0-1.4.6L3 22V5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2z"></path></svg>' }
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

  cx = 100; cy = 90; radarR = 70;
  radarAxes: { x: number; y: number; lx: number; ly: number; label: string }[] = [];
  radarShape = '';

  constructor(private projectService: ProjectService, public toast: ToastService, private cdr: ChangeDetectorRef, private analytics: AnalyticsService, private pdf: PdfService) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadReports();
  }

  /** Map the visible period tab to the backend period parameter. */
  private periodParam(): string | undefined {
    switch (this.period) {
      case 'Cette semaine': return 'week';
      case 'Ce mois': return 'month';
      case 'Ce trimestre': return 'quarter';
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
      nom: row.nom, pm: row.pm || 'Non assigné', taches: row.taches || 0, terminees: row.terminees || 0,
      retard: row.retard || 0, heures: row.heures || 0, progression: row.progression || 0, statut: row.statut || 'PLANNED'
    }));
    this.recapPage = 0;

    this.avgResolutionHours = Number(d.avgResolutionHours || 0);
    this.resolvedRate = Number(d.resolvedRate || 0);

    const hours = Number(d.totalHours || 0);
    const sat = Number(d.supportSatisfaction || 0);
    this.execKpis[0].value = `${this.fmtNum(d.completionRate)} %`;
    this.execKpis[1].value = `${this.fmtNum(d.onTimeRate)} %`;
    this.execKpis[2].value = `${Math.round(hours).toLocaleString('fr-FR')} h`;
    this.execKpis[2].delta = `Résolution moy. ${this.fmtNum(d.avgResolutionHours)} h`;
    this.execKpis[3].value = `${sat.toFixed(1).replace('.', ',')} / 5`;
    this.execKpis[3].delta = `${this.fmtNum(d.resolvedRate)} % résolus`;
  }

  private fmtNum(v: any): string { return `${Math.round(Number(v || 0) * 10) / 10}`.replace('.', ','); }

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
    const n = this.teamLoad.length, max = 100;
    this.radarAxes = this.teamLoad.map((t, i) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      return { x: this.cx + Math.cos(ang) * this.radarR, y: this.cy + Math.sin(ang) * this.radarR, lx: this.cx + Math.cos(ang) * (this.radarR + 14), ly: this.cy + Math.sin(ang) * (this.radarR + 14) + 2, label: t.equipe };
    });
    this.radarShape = this.teamLoad.map((t, i) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2; const r = (t.charge / max) * this.radarR;
      return `${(this.cx + Math.cos(ang) * r).toFixed(1)},${(this.cy + Math.sin(ang) * r).toFixed(1)}`;
    }).join(' ');
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

  statusLabel(s: string): string { return ({ IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', ON_HOLD: 'En pause', PLANNED: 'Planifié' } as any)[s] || 'Planifié'; }
  statusBadge(s: string): string { return ({ IN_PROGRESS: 'badge-primary', COMPLETED: 'badge-success', ON_HOLD: 'badge-warning', PLANNED: 'badge-slate' } as any)[s] || 'badge-slate'; }

  exportCsv(): void {
    const rows = [['Projet', 'PM', 'Tâches', 'Terminées', 'En retard', 'Heures', 'Complétion', 'Statut']];
    this.recap.forEach(r => rows.push([r.nom, r.pm, `${r.taches}`, `${r.terminees}`, `${r.retard}`, `${r.heures}`, `${r.progression}%`, this.statusLabel(r.statut)]));
    const csv = rows.map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rapport-projets.csv'; a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Export CSV généré.', 'success');
  }

  exportPdf(): void {
    const esc = (s: any) => this.pdf.esc(s);
    const rows = this.recap.map(r => `<tr><td>${esc(r.nom)}</td><td>${esc(r.pm)}</td><td>${r.terminees}/${r.taches}</td><td>${r.progression}%</td><td>${esc(this.statusLabel(r.statut))}</td></tr>`).join('');
    const body = `<table><thead><tr><th>Projet</th><th>PM</th><th>Tâches</th><th>Complétion</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table>`;
    const ok = this.pdf.open({ title: 'Rapport global', subtitle: `Récapitulatif par projet · ${this.recap.length} projet(s)`, bodyHtml: body });
    if (!ok) { this.toast.show("Autorisez les pop-ups pour l'export PDF.", 'error'); return; }
    this.toast.show('Aperçu PDF ouvert.', 'success');
  }
}
