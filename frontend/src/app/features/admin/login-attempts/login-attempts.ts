import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminSecurityService, LoginAttempt, SecurityMetrics } from '../../../core/services/admin-security.service';
import { UserService, User } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

interface IpRow { ip: string; pays: string; tentatives: number; dernier: string; cibles: number; statut: string; }
interface TargetRow { nom: string; email: string; n: number; last: string; statut: string; }
interface UserRef { id: number; isActive: boolean; firstName: string; lastName: string; email: string; }

@Component({
  selector: 'app-admin-login-attempts',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
  <div class="conx-wrap">

    <!-- ═══ Alert banner ═══ -->
    <div class="alert-banner">
      <svg class="ab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <div class="ab-text">
        <p class="ab-title">{{ 'admin.loginAttempts.failedDetected' | translate:{ count: failed24 } }}</p>
        <p class="ab-sub">{{ 'admin.loginAttempts.suspiciousIdentified' | translate:{ count: suspiciousIps.length } }}</p>
      </div>
      <button class="btn btn-danger" (click)="openDetails()">{{ 'admin.loginAttempts.viewDetails' | translate }}</button>
    </div>

    <!-- ═══ Adresses IP suspectes ═══ -->
    <div class="conx-card">
      <div class="card-head"><div><h3>{{ 'admin.loginAttempts.suspiciousTitle' | translate }}</h3><span class="sub">{{ 'admin.loginAttempts.suspiciousSub' | translate }}</span></div></div>
      <div class="table-scroll">
        <table class="conx-table">
          <thead>
            <tr><th>{{ 'admin.loginAttempts.colIp' | translate }}</th><th>{{ 'admin.loginAttempts.colCountry' | translate }}</th><th>{{ 'admin.loginAttempts.colAttempts' | translate }}</th><th>{{ 'admin.loginAttempts.colLastTry' | translate }}</th><th>{{ 'admin.loginAttempts.colTargets' | translate }}</th><th>{{ 'admin.loginAttempts.colStatus' | translate }}</th><th class="ar">{{ 'admin.loginAttempts.colActions' | translate }}</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of suspiciousIps">
              <td class="mono">{{ r.ip }}</td>
              <td class="muted">{{ r.pays | translate }}</td>
              <td class="danger-num">{{ r.tentatives }}</td>
              <td class="muted">{{ r.dernier }}</td>
              <td>{{ r.cibles }}</td>
              <td><span class="badge" [class.badge-danger]="r.statut === 'Bloquée'" [class.badge-warning]="r.statut !== 'Bloquée'">{{ (r.statut === 'Bloquée' ? 'admin.loginAttempts.statBlockedDot' : 'admin.loginAttempts.statMonitoredDot') | translate }}</span></td>
              <td class="ar">
                <div class="row-actions">
                  <button *ngIf="r.statut !== 'Bloquée'" class="ico-btn danger" [title]="'admin.loginAttempts.blockIpTitle' | translate" (click)="blockIp(r)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></button>
                  <button *ngIf="r.statut === 'Bloquée'" class="ico-btn success" [title]="'admin.loginAttempts.unblockIpTitle' | translate" (click)="unblockIp(r)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg></button>
                  <button class="ico-btn" [title]="'admin.loginAttempts.viewAttemptsTitle' | translate" (click)="viewIpAttempts(r)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="suspiciousIps.length === 0"><td colspan="7"><div class="empty">{{ 'admin.loginAttempts.noSuspicious' | translate }}</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ Tentatives échouées par heure (line + alert threshold) ═══ -->
    <div class="conx-card">
      <div class="card-head"><div><h3>{{ 'admin.loginAttempts.hourlyTitle' | translate }}</h3><span class="sub">{{ 'admin.loginAttempts.hourlySub' | translate }}</span></div></div>
      <div class="card-body">
        <div class="xy">
          <div class="y-axis"><span *ngFor="let t of yTicks">{{ t }}</span></div>
          <div class="plot" (mousemove)="onMove($event)" (mouseleave)="hover = null">
            <div class="gridline" *ngFor="let t of yTicks" [style.top.%]="(1 - t/yMax)*100"></div>
            <div class="threshold" [style.top.%]="(1 - 10/yMax)*100"><span>{{ 'admin.loginAttempts.alertZone' | translate }}</span></div>
            <svg class="line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline [attr.points]="linePoints" fill="none" stroke="var(--danger)" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"></polyline>
            </svg>
            <div class="dot" *ngFor="let p of points" [style.left.%]="p.x" [style.top.%]="p.y"></div>
            <ng-container *ngIf="hover">
              <div class="cursor-line" [style.left.%]="hover.leftPct"></div>
              <div class="cursor-dot" [style.left.%]="hover.leftPct" [style.top.%]="hover.top"></div>
              <div class="float-tip" [style.left.%]="hover.leftPct" [class.flip]="hover.leftPct > 70">
                <div class="tip-title">{{ hover.label }}</div>
                <div class="tip-row"><span class="tdot"></span>{{ 'admin.loginAttempts.tipFailed' | translate }} <b>{{ hover.count }}</b></div>
              </div>
            </ng-container>
          </div>
          <div class="x-axis"><span *ngFor="let t of xTicks" [style.left.%]="(t.i/23)*100">{{ t.label }}</span></div>
        </div>
      </div>
    </div>

    <!-- ═══ Comptes ciblés ═══ -->
    <div class="conx-card">
      <div class="card-head"><div><h3>{{ 'admin.loginAttempts.targetedTitle' | translate }}</h3><span class="sub">{{ 'admin.loginAttempts.targetedSub' | translate }}</span></div></div>
      <div class="table-scroll">
        <table class="conx-table">
          <thead>
            <tr><th>{{ 'admin.loginAttempts.colUser' | translate }}</th><th>{{ 'admin.loginAttempts.colEmail' | translate }}</th><th>{{ 'admin.loginAttempts.colAttemptsReceived' | translate }}</th><th>{{ 'admin.loginAttempts.colLastIncident' | translate }}</th><th>{{ 'admin.loginAttempts.colAccountStatus' | translate }}</th><th class="ar">{{ 'admin.loginAttempts.colActions' | translate }}</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of targeted">
              <td class="strong">{{ t.nom }}</td>
              <td class="muted">{{ t.email }}</td>
              <td class="danger-num">{{ t.n }}</td>
              <td class="muted">{{ t.last }}</td>
              <td><span class="badge" [class.badge-warning]="t.statut === 'Verrouillé'" [class.badge-success]="t.statut !== 'Verrouillé'">{{ (t.statut === 'Verrouillé' ? 'admin.loginAttempts.statLocked' : 'admin.loginAttempts.statActive') | translate }}</span></td>
              <td class="ar">
                <div class="t-actions">
                  <button class="btn btn-sm btn-outline" (click)="resetPwd(t)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"/></svg> {{ 'admin.loginAttempts.resetPwd' | translate }}</button>
                  <button class="btn btn-sm btn-danger" (click)="lockAccount(t)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> {{ 'admin.loginAttempts.lock' | translate }}</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="targeted.length === 0"><td colspan="6"><div class="empty">{{ 'admin.loginAttempts.noTargeted' | translate }}</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ═══ Details modal (top "Voir les détails") ═══ -->
  <div class="modal-backdrop" *ngIf="showDetails" (click)="showDetails = false">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>{{ 'admin.loginAttempts.detailsTitle' | translate }}</h3><button class="x" (click)="showDetails = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
      <div class="m-body">
        <div class="stat-grid">
          <div class="stat"><span class="sv">{{ failed24 }}</span><span class="sl">{{ 'admin.loginAttempts.statFailed24' | translate }}</span></div>
          <div class="stat"><span class="sv">{{ suspiciousIps.length }}</span><span class="sl">{{ 'admin.loginAttempts.statSuspIp' | translate }}</span></div>
          <div class="stat"><span class="sv">{{ targeted.length }}</span><span class="sl">{{ 'admin.loginAttempts.statTargeted' | translate }}</span></div>
          <div class="stat"><span class="sv">{{ metrics.totalAttempts }}</span><span class="sl">{{ 'admin.loginAttempts.statTotal' | translate }}</span></div>
        </div>
        <h4 class="sub-h">{{ 'admin.loginAttempts.topSuspicious' | translate }}</h4>
        <div class="mini-list">
          <div class="mini-row" *ngFor="let r of suspiciousIps.slice(0, 5)"><span class="mono">{{ r.ip }}</span><span class="muted">{{ 'admin.loginAttempts.attemptsAccounts' | translate:{ att: r.tentatives, acc: r.cibles } }}</span><span class="badge" [class.badge-danger]="r.statut === 'Bloquée'" [class.badge-warning]="r.statut !== 'Bloquée'">{{ (r.statut === 'Bloquée' ? 'admin.loginAttempts.statBlocked' : 'admin.loginAttempts.statMonitored') | translate }}</span></div>
          <div class="empty" *ngIf="suspiciousIps.length === 0">{{ 'admin.loginAttempts.noSuspIpShort' | translate }}</div>
        </div>
        <h4 class="sub-h">{{ 'admin.loginAttempts.topTargeted' | translate }}</h4>
        <div class="mini-list">
          <div class="mini-row" *ngFor="let t of targeted.slice(0, 5)"><span class="strong">{{ t.nom }}</span><span class="muted">{{ 'admin.loginAttempts.attemptsLast' | translate:{ att: t.n, last: t.last } }}</span><span class="badge" [class.badge-warning]="t.statut === 'Verrouillé'" [class.badge-success]="t.statut !== 'Verrouillé'">{{ (t.statut === 'Verrouillé' ? 'admin.loginAttempts.statLocked' : 'admin.loginAttempts.statActive') | translate }}</span></div>
          <div class="empty" *ngIf="targeted.length === 0">{{ 'admin.loginAttempts.noTargeted' | translate }}</div>
        </div>
      </div>
      <div class="m-foot"><button class="btn btn-outline" (click)="showDetails = false">{{ 'admin.loginAttempts.close' | translate }}</button></div>
    </div>
  </div>

  <!-- ═══ IP attempts modal ("Voir tentatives") ═══ -->
  <div class="modal-backdrop" *ngIf="ipModal" (click)="ipModal = null">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>{{ 'admin.loginAttempts.attemptsFrom' | translate }} <span class="mono">{{ ipModal!.ip }}</span></h3><button class="x" (click)="ipModal = null"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
      <div class="m-body">
        <div class="table-scroll">
          <table class="conx-table">
            <thead><tr><th>{{ 'admin.loginAttempts.colTimestamp' | translate }}</th><th>{{ 'admin.loginAttempts.colUser' | translate }}</th><th>{{ 'admin.loginAttempts.colResult' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of ipModal!.rows"><td class="mono">{{ row.time }}</td><td>{{ row.user }}</td><td><span class="badge" [class.badge-danger]="row.result === 'admin.loginAttempts.resFailure'" [class.badge-success]="row.result !== 'admin.loginAttempts.resFailure'">{{ row.result | translate }}</span></td></tr>
              <tr *ngIf="ipModal!.rows.length === 0"><td colspan="3"><div class="empty">{{ 'admin.loginAttempts.noAttemptsIp' | translate }}</div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="m-foot"><button class="btn btn-outline" (click)="ipModal = null">{{ 'admin.loginAttempts.close' | translate }}</button></div>
    </div>
  </div>
  `,
  styles: [`
    .conx-wrap { display: flex; flex-direction: column; gap: 16px; }
    .conx-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); overflow: hidden; }

    /* alert banner */
    .alert-banner { display: flex; align-items: flex-start; gap: 12px; padding: 16px;
      border-radius: var(--radius-xl); border: 1px solid color-mix(in oklab, var(--danger) 40%, var(--border));
      background: color-mix(in oklab, var(--danger) 6%, transparent); }
    .ab-ico { width: 20px; height: 20px; color: var(--danger); flex-shrink: 0; margin-top: 2px; }
    .ab-text { flex: 1; }
    .ab-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .ab-sub { font-size: 13px; color: var(--text-muted); margin: 2px 0 0; }

    .card-head { padding: 16px 20px; border-bottom: 1px solid var(--border-light);
      h3 { font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin: 0; }
      .sub { font-size: 11.5px; color: var(--text-muted); } }
    .card-body { padding: 18px 20px; }

    /* tables */
    .table-scroll { overflow-x: auto; }
    .conx-table { width: 100%; border-collapse: collapse; font-size: 13px;
      thead tr { background: var(--bg-subtle); }
      th { text-align: left; padding: 11px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); white-space: nowrap; }
      th:first-child, td:first-child { padding-left: 20px; }
      th.ar, td.ar { text-align: right; padding-right: 20px; }
      td { padding: 12px; border-top: 1px solid var(--border-light); color: var(--text-secondary); vertical-align: middle; }
      tbody tr:hover { background: var(--bg-subtle); }
      .mono { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: var(--text-primary); }
      .muted { color: var(--text-muted); }
      .strong { font-weight: 600; color: var(--text-primary); }
      .danger-num { font-weight: 700; color: var(--danger); } }
    .row-actions { display: inline-flex; gap: 4px; }
    .ico-btn { width: 30px; height: 30px; border: none; background: transparent; border-radius: var(--radius-sm); display: grid; place-items: center; cursor: pointer; color: var(--text-muted);
      svg { width: 15px; height: 15px; }
      &:hover { background: var(--bg-subtle); }
      &.danger { color: var(--danger); } &.danger:hover { background: var(--danger-bg); }
      &.success { color: var(--success); } &.success:hover { background: var(--success-bg); } }
    .t-actions { display: inline-flex; gap: 6px; justify-content: flex-end; }
    .empty { padding: 28px; text-align: center; color: var(--text-muted); font-size: 13px; }

    /* buttons */
    .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border: none; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap;
      svg { width: 14px; height: 14px; }
      &.btn-sm { height: 30px; padding: 0 10px; font-size: 12px; }
      &.btn-danger { background: var(--danger); color: #fff; &:hover { filter: brightness(.93); } }
      &.btn-outline { background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); &:hover { background: var(--bg-subtle); color: var(--text-primary); } } }

    /* line chart */
    .xy { display: grid; grid-template-columns: 30px 1fr; grid-template-rows: 1fr 20px; column-gap: 8px; height: 260px; }
    .y-axis { grid-column: 1; grid-row: 1; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; padding: 1px 0;
      span { font-size: 10px; color: var(--text-muted); } }
    .plot { grid-column: 2; grid-row: 1; position: relative; cursor: crosshair; }
    .cursor-line { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--text-muted); opacity: .45; transform: translateX(-.5px); pointer-events: none; }
    .cursor-dot { position: absolute; width: 9px; height: 9px; border-radius: 50%; background: var(--danger); border: 2px solid var(--bg-card); transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
    .float-tip { position: absolute; z-index: 8; top: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 8px 11px; min-width: 150px; pointer-events: none; transform: translateX(10px);
      .tip-title { font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 5px; }
      .tip-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); b { margin-left: auto; color: var(--text-primary); font-weight: 700; } }
      .tdot { width: 8px; height: 8px; border-radius: 50%; background: var(--danger); flex-shrink: 0; } }
    .float-tip.flip { transform: translateX(-100%) translateX(-10px); }
    .gridline { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--border); transform: translateY(-.5px); }
    .threshold { position: absolute; left: 0; right: 0; border-top: 1.5px dashed var(--danger); transform: translateY(-.5px);
      span { position: absolute; right: 0; top: -14px; font-size: 9px; font-weight: 700; color: var(--danger); } }
    .line-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .dot { position: absolute; width: 7px; height: 7px; border-radius: 50%; background: var(--danger); border: 1.5px solid var(--bg-card); transform: translate(-50%, -50%); }
    .x-axis { grid-column: 2; grid-row: 2; position: relative;
      span { position: absolute; top: 4px; transform: translateX(-50%); font-size: 10px; color: var(--text-muted); } }

    /* badges used in tables + modals */
    .badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: var(--radius-full); white-space: nowrap; }
    .badge-danger { background: var(--danger-bg); color: var(--danger-text); }
    .badge-warning { background: var(--warning-bg); color: var(--warning-text); }
    .badge-success { background: var(--success-bg); color: var(--success-text); }

    /* modals */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 560px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); max-height: calc(100vh - 48px); overflow-y: auto; }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-light); h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; } }
    .x { width: 32px; height: 32px; border: none; background: var(--bg-subtle); border-radius: var(--radius-sm); cursor: pointer; color: var(--text-muted); display: grid; place-items: center; svg { width: 15px; height: 15px; } &:hover { color: var(--text-primary); } }
    .m-body { padding: 16px 20px; }
    .m-foot { display: flex; justify-content: flex-end; padding: 12px 20px 18px; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    @media (max-width: 560px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
    .stat { display: flex; flex-direction: column; gap: 3px; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-subtle); }
    .stat .sv { font-size: 22px; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .stat .sl { font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .3px; }
    .sub-h { font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .4px; margin: 14px 0 8px; }
    .mini-list { display: flex; flex-direction: column; gap: 6px; }
    .mini-row { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border: 1px solid var(--border-light); border-radius: var(--radius-md); font-size: 12.5px; color: var(--text-secondary); }
    .mini-row .badge { margin-left: auto; }
    .mini-row .mono { font-family: ui-monospace, Menlo, monospace; color: var(--text-primary); }
    .mini-row .strong { font-weight: 600; color: var(--text-primary); }
    .mini-row .muted { color: var(--text-muted); }
  `]
})
export class AdminLoginAttemptsComponent implements OnInit {
  attempts: LoginAttempt[] = [];
  metrics: SecurityMetrics = { totalAttempts: 0, failedAttempts: 0, blockedIps: 0 };
  failed24 = 0;
  suspiciousIps: IpRow[] = [];
  targeted: TargetRow[] = [];

  // hourly failed line chart
  yMax = 12;
  yTicks: number[] = [];
  xTicks: { i: number; label: string }[] = [];
  linePoints = '';
  points: { x: number; y: number; label: string; count: number }[] = [];
  hover: { leftPct: number; top: number; label: string; count: number } | null = null;

  // Users keyed by lowercase email AND username, so targeted-account actions can resolve a real id.
  private usersByKey = new Map<string, UserRef>();
  // IPs the admin has actually blocked (source of truth for the "Bloquée" status + unblock button).
  private blockedIpSet = new Set<string>();
  private blockedAt = new Map<string, string>();

  // Modals
  showDetails = false;
  ipModal: { ip: string; rows: { time: string; user: string; result: string }[] } | null = null;

  constructor(
    private security: AdminSecurityService,
    private userService: UserService,
    public toast: ToastService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  private locale(): string { return this.translate.currentLang() === 'en' ? 'en-GB' : 'fr-FR'; }

  ngOnInit(): void {
    this.loadUsers();
    this.loadBlockedIps();
    this.load();
  }

  /** Load the persisted blocked IPs so they always appear (with an unblock button), even with no recent attempts. */
  private loadBlockedIps(): void {
    this.security.getBlockedIps().subscribe({
      next: (res: any) => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.blockedIpSet = new Set(list.map(b => b.ipAddress));
        this.blockedAt = new Map(list.map(b => [b.ipAddress, b.blockedAt]));
        this.applyBlocked();
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  /** Reconcile the suspicious-IP list with the real block list: correct statuses + surface blocked IPs. */
  private applyBlocked(): void {
    // 1) Correct the status of every visible row.
    this.suspiciousIps.forEach(r => { r.statut = this.blockedIpSet.has(r.ip) ? 'Bloquée' : 'Surveillée'; });
    // 2) Add any blocked IP that isn't already shown (so it can always be unblocked).
    this.blockedIpSet.forEach(ip => {
      if (!this.suspiciousIps.some(r => r.ip === ip)) {
        this.suspiciousIps.unshift({ ip, pays: 'admin.loginAttempts.unknown', tentatives: 0, dernier: this.rel(this.blockedAt.get(ip) || ''), cibles: 0, statut: 'Bloquée' });
      }
    });
  }

  private loadUsers(): void {
    this.userService.getAllUsers(0, 500).subscribe({
      next: (res: any) => {
        const list: User[] = res && res.data ? res.data : [];
        this.usersByKey.clear();
        list.forEach(u => {
          const ref: UserRef = { id: u.id!, isActive: u.isActive !== false, firstName: u.firstName, lastName: u.lastName, email: u.email };
          if (u.email) this.usersByKey.set(u.email.toLowerCase(), ref);
          if (u.username) this.usersByKey.set(u.username.toLowerCase(), ref);
        });
        // Refresh targeted-account statuses against the real account state.
        this.targeted.forEach(t => {
          const ref = this.resolveUser(t.email);
          if (ref && !ref.isActive) t.statut = 'Verrouillé';
        });
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private resolveUser(emailOrName: string): UserRef | undefined {
    if (!emailOrName) return undefined;
    return this.usersByKey.get(emailOrName.toLowerCase());
  }

  load(): void {
    this.security.getSecurityMetrics().subscribe({
      next: (m: any) => { this.metrics = (m && m.data ? m.data : m) || this.metrics; this.failed24 = this.metrics.failedAttempts || this.failed24; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.security.getLoginAttempts().subscribe({
      next: (list: any) => {
        const raw: LoginAttempt[] = Array.isArray(list) ? list : (list?.data ?? []);
        this.attempts = raw.slice().sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime());
        this.buildAll();
        this.cdr.detectChanges();
      },
      error: () => { this.attempts = []; this.buildAll(); this.cdr.detectChanges(); }
    });
    // Prefer the server-side aggregated suspicious IPs; client-side stays as fallback.
    this.security.getSuspiciousIps().subscribe({
      next: (list: any) => {
        const raw: any[] = Array.isArray(list) ? list : (list?.data ?? []);
        if (raw.length) {
          this.suspiciousIps = raw.slice(0, 10).map(r => ({
            ip: r.ipAddress,
            pays: r.country || 'admin.loginAttempts.unknown',
            tentatives: r.attempts || 0,
            dernier: this.rel(r.lastAttempt),
            cibles: r.targets || 0,
            statut: r.status || 'Surveillée'
          }));
          this.applyBlocked();
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  private buildAll(): void {
    const fails = this.attempts.filter(a => !a.success);
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    if (!this.metrics.failedAttempts) this.failed24 = fails.filter(a => new Date(a.attemptedAt).getTime() >= dayAgo).length;

    // Suspicious IPs (grouped failures)
    const ipMap = new Map<string, { count: number; last: string; users: Set<string> }>();
    fails.forEach(a => {
      if (!a.ipAddress) return;
      const e = ipMap.get(a.ipAddress) || { count: 0, last: a.attemptedAt, users: new Set<string>() };
      e.count++; e.users.add(a.username);
      if (new Date(a.attemptedAt) > new Date(e.last)) e.last = a.attemptedAt;
      ipMap.set(a.ipAddress, e);
    });
    this.suspiciousIps = Array.from(ipMap.entries())
      .map(([ip, e]) => ({ ip, pays: 'admin.loginAttempts.unknown', tentatives: e.count, dernier: this.rel(e.last), cibles: e.users.size, statut: 'Surveillée' }))
      .sort((a, b) => b.tentatives - a.tentatives)
      .slice(0, 10);
    this.applyBlocked();

    // Targeted accounts (grouped failures by user)
    const userMap = new Map<string, { email: string; count: number; last: string }>();
    fails.forEach(a => {
      const key = (a.username || '').toLowerCase();
      if (!key) return;
      const e = userMap.get(key) || { email: (a as any).email || a.username, count: 0, last: a.attemptedAt };
      e.count++;
      if (new Date(a.attemptedAt) > new Date(e.last)) e.last = a.attemptedAt;
      userMap.set(key, e);
    });
    this.targeted = Array.from(userMap.entries())
      .map(([user, e]) => ({ nom: this.displayName(user), email: e.email, n: e.count, last: this.rel(e.last), statut: e.count >= 5 ? 'Verrouillé' : 'Actif' }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 10);

    this.buildHourly(fails);
  }

  private buildHourly(fails: LoginAttempt[]): void {
    const counts = new Array(24).fill(0);
    fails.forEach(a => { const d = new Date(a.attemptedAt); if (!isNaN(d.getTime())) counts[d.getHours()]++; });
    this.yMax = Math.max(12, ...counts);
    this.yTicks = [this.yMax, Math.round(this.yMax * 0.75), Math.round(this.yMax * 0.5), Math.round(this.yMax * 0.25), 0];
    this.xTicks = counts.map((_, i) => ({ i, label: `${String(i).padStart(2, '0')}h` })).filter(t => t.i % 3 === 0);
    this.points = counts.map((c, i) => ({ x: (i / 23) * 100, y: (1 - c / this.yMax) * 100, label: `${String(i).padStart(2, '0')}h`, count: c }));
    this.linePoints = this.points.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  }

  onMove(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || this.points.length === 0) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const i = Math.round(ratio * 23);
    const p = this.points[i];
    if (!p) return;
    this.hover = { leftPct: p.x, top: p.y, label: p.label, count: p.count };
  }

  // ── Suspicious IP actions (wired to the backend) ──
  blockIp(r: IpRow): void {
    this.security.blockIp(r.ip, this.translate.instant('admin.loginAttempts.blockReason')).subscribe({
      next: () => { this.blockedIpSet.add(r.ip); r.statut = 'Bloquée'; this.toast.show(this.translate.instant('admin.loginAttempts.toastIpBlocked', { ip: r.ip }), 'success'); this.cdr.detectChanges(); },
      error: (err: any) => this.toast.show(err?.error?.message || this.translate.instant('admin.loginAttempts.toastBlockFailed', { ip: r.ip }), 'error')
    });
  }
  unblockIp(r: IpRow): void {
    this.security.unblockIp(r.ip).subscribe({
      next: () => {
        this.blockedIpSet.delete(r.ip);
        // Keep the row if it still has attempts (now "Surveillée"); drop it if it only existed because it was blocked.
        if (r.tentatives > 0) { r.statut = 'Surveillée'; } else { this.suspiciousIps = this.suspiciousIps.filter(x => x.ip !== r.ip); }
        this.toast.show(this.translate.instant('admin.loginAttempts.toastIpUnblocked', { ip: r.ip }), 'success');
        this.cdr.detectChanges();
      },
      error: (err: any) => this.toast.show(err?.error?.message || this.translate.instant('admin.loginAttempts.toastUnblockFailed', { ip: r.ip }), 'error')
    });
  }
  viewIpAttempts(r: IpRow): void {
    const rows = this.attempts
      .filter(a => a.ipAddress === r.ip)
      .slice(0, 50)
      .map(a => ({ time: this.fmt(a.attemptedAt), user: a.username || '—', result: a.success ? 'admin.loginAttempts.resSuccess' : 'admin.loginAttempts.resFailure' }));
    this.ipModal = { ip: r.ip, rows };
  }

  // ── Targeted-account actions (same implementation as the admin users page) ──
  resetPwd(t: TargetRow): void {
    const ref = this.resolveUser(t.email) || this.resolveUser(t.nom);
    if (!ref) { this.toast.show(this.translate.instant('admin.loginAttempts.toastUserNotFound', { email: t.email }), 'error'); return; }
    this.userService.resetUserPassword(ref.id).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const temp = data?.temporaryPassword;
        this.toast.show(
          temp ? this.translate.instant('admin.loginAttempts.toastPwdResetTemp', { name: t.nom, temp, email: ref.email })
               : this.translate.instant('admin.loginAttempts.toastPwdResetSent', { email: ref.email }),
          'success'
        );
      },
      error: (err: any) => this.toast.show(err?.error?.message || this.translate.instant('admin.loginAttempts.toastPwdResetFailed'), 'error')
    });
  }
  lockAccount(t: TargetRow): void {
    const ref = this.resolveUser(t.email) || this.resolveUser(t.nom);
    if (!ref) { this.toast.show(this.translate.instant('admin.loginAttempts.toastUserNotFound', { email: t.email }), 'error'); return; }
    if (!ref.isActive) { t.statut = 'Verrouillé'; this.toast.show(this.translate.instant('admin.loginAttempts.toastAlreadyDisabled', { name: t.nom }), 'success'); return; }
    // toggleUserStatus flips active↔inactive; the account is active here, so this deactivates it.
    this.userService.toggleUserStatus(ref.id).subscribe({
      next: () => { ref.isActive = false; t.statut = 'Verrouillé'; this.toast.show(this.translate.instant('admin.loginAttempts.toastAccountLocked', { name: t.nom }), 'success'); this.cdr.detectChanges(); },
      error: (err: any) => this.toast.show(err?.error?.message || this.translate.instant('admin.loginAttempts.toastLockFailed'), 'error')
    });
  }

  openDetails(): void { this.showDetails = true; }

  private fmt(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(this.locale(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private displayName(usernameOrEmail: string): string {
    const base = usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail;
    return base.split(/[._-]/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || usernameOrEmail;
  }

  private rel(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr); if (isNaN(d.getTime())) return '—';
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return this.translate.instant('relTime.justNow');
    if (mins < 60) return this.translate.instant('relTime.minAgo', { n: mins });
    const h = Math.floor(mins / 60); if (h < 24) return this.translate.instant('relTime.hAgo', { n: h });
    return this.translate.instant('relTime.dAgo', { n: Math.floor(h / 24) });
  }
}
