import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSecurityService, LoginAttempt, SecurityMetrics } from '../../../core/services/admin-security.service';
import { UserService, User } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

interface SecEvent { id: number; time: string; rawTime: string; user: string; ip: string; type: string; result: string; details: string; }
interface HeatCell { day: number; count: number; level: number; }
interface ProfileView { found: boolean; name: string; email: string; role: string; active: boolean; username: string; total: number; failed: number; lastSeen: string; }

@Component({
  selector: 'app-admin-security-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="sec-wrap">

    <!-- ═══ Top bar : dates + filters + auto + export ═══ -->
    <div class="sec-card toolbar">
      <div class="date-range">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
        <input type="date" [(ngModel)]="dateStart" (change)="applyFilters()" />
        <span class="sep">au</span>
        <input type="date" [(ngModel)]="dateEnd" (change)="applyFilters()" />
      </div>

      <div class="filters">
        <select [(ngModel)]="typeFilter" (change)="applyFilters()">
          <option value="">Type d'événement</option>
          <option value="success">Connexion réussie</option>
          <option value="failed">Tentative échouée</option>
        </select>
        <select [(ngModel)]="userFilter" (change)="applyFilters()">
          <option value="">Utilisateur</option>
          <option *ngFor="let u of userOptions" [value]="u">{{ u }}</option>
        </select>
        <select [(ngModel)]="ipFilter" (change)="applyFilters()">
          <option value="">IP</option>
          <option *ngFor="let ip of ipOptions" [value]="ip">{{ ip }}</option>
        </select>
        <select [(ngModel)]="resultFilter" (change)="applyFilters()">
          <option value="">Résultat</option>
          <option value="Succès">Succès</option>
          <option value="Échec">Échec</option>
        </select>
      </div>

      <div class="toolbar-right">
        <label class="auto-toggle">
          <svg class="ico refresh" [class.spin]="autoRefresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          <button type="button" class="switch" [class.on]="autoRefresh" (click)="toggleAuto()"><span class="knob"></span></button>
          Auto 30s
        </label>
        <button class="btn btn-secondary" (click)="exportCsv()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exporter
        </button>
      </div>
    </div>

    <!-- ═══ 4 KPI cards ═══ -->
    <div class="kpi-grid">
      <div class="kpi-tile t-success"><div class="kv">{{ kpi.success }}</div><div class="kl">Connexions réussies (24h)</div></div>
      <div class="kpi-tile t-danger"><div class="kv">{{ kpi.failed }}</div><div class="kl">Tentatives échouées (24h)</div></div>
      <div class="kpi-tile t-warning"><div class="kv">{{ kpi.locked }}</div><div class="kl">Comptes verrouillés</div></div>
      <div class="kpi-tile t-purple"><div class="kv">{{ kpi.suspicious }}</div><div class="kl">IPs suspectes</div></div>
    </div>

    <!-- ═══ Journal card ═══ -->
    <div class="sec-card">
      <div class="card-head">
        <div><h3>Événements de sécurité</h3><span class="sub">Cliquer une ligne pour les détails complets</span></div>
      </div>
      <div class="table-scroll">
        <table class="sec-table">
          <thead>
            <tr><th>Horodatage</th><th>Utilisateur</th><th>Adresse IP</th><th>Type</th><th>Résultat</th><th>Détails</th><th class="ar">Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of pagedEvents">
              <td class="mono">{{ s.time }}</td>
              <td>{{ s.user }}</td>
              <td class="mono">{{ s.ip }}</td>
              <td><span class="ev-badge" [ngClass]="s.type">{{ typeMap[s.type]?.label || s.type }}</span></td>
              <td class="muted">{{ s.result }}</td>
              <td class="muted">{{ s.details }}</td>
              <td class="ar">
                <div class="row-actions">
                  <button class="ico-btn danger" title="Bloquer l'IP" (click)="blockIp(s)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></button>
                  <button class="ico-btn" title="Voir le profil" (click)="viewProfile(s)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredEvents.length === 0"><td colspan="7"><div class="empty">Aucun événement de sécurité pour ces critères.</div></td></tr>
          </tbody>
        </table>
      </div>
      <div class="pager" *ngIf="filteredEvents.length > secPageSize">
        <span class="pg-info">{{ secPage * secPageSize + 1 }}–{{ pageEnd }} sur {{ filteredEvents.length }}</span>
        <div class="pg-ctrl">
          <button class="pg-btn" (click)="secPage = secPage - 1" [disabled]="secPage === 0">‹</button>
          <span class="pg-num">{{ secPage + 1 }} / {{ secTotalPages }}</span>
          <button class="pg-btn" (click)="secPage = secPage + 1" [disabled]="secPage >= secTotalPages - 1">›</button>
        </div>
      </div>
    </div>

    <!-- ═══ Heatmap card ═══ -->
    <div class="sec-card">
      <div class="card-head"><div><h3>Heatmap des tentatives échouées</h3><span class="sub">90 derniers jours · densité quotidienne</span></div></div>
      <div class="heat-body">
        <div class="heat-grid">
          <div class="heat-cell" *ngFor="let c of heatmap" [ngClass]="'h' + c.level" [title]="c.count + ' tentative(s)'"></div>
        </div>
        <div class="heat-legend">
          <span>Moins</span>
          <div class="heat-cell h0"></div><div class="heat-cell h1"></div><div class="heat-cell h2"></div><div class="heat-cell h3"></div><div class="heat-cell h4"></div>
          <span>Plus</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ User profile modal ("Voir le profil") ═══ -->
  <div class="modal-backdrop" *ngIf="profile" (click)="profile = null">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>Profil utilisateur</h3><button class="x" (click)="profile = null"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
      <div class="m-body">
        <div class="prof-head">
          <span class="prof-avatar">{{ (profile!.name || '?').slice(0, 1).toUpperCase() }}</span>
          <div>
            <div class="prof-name">{{ profile!.name }}</div>
            <div class="prof-sub">{{ profile!.email }}</div>
          </div>
          <span class="badge" [class.badge-success]="profile!.active" [class.badge-danger]="!profile!.active">{{ profile!.active ? 'Actif' : 'Désactivé' }}</span>
        </div>
        <div class="prof-warn" *ngIf="!profile!.found">Aucun compte ne correspond à « {{ profile!.username }} » — il s'agit probablement d'un identifiant inexistant utilisé lors de tentatives.</div>
        <div class="prof-rows">
          <div class="prow"><span class="pk">Identifiant</span><span class="pv mono">{{ profile!.username }}</span></div>
          <div class="prow"><span class="pk">Rôle</span><span class="pv">{{ profile!.role }}</span></div>
          <div class="prow"><span class="pk">Tentatives totales</span><span class="pv">{{ profile!.total }}</span></div>
          <div class="prow"><span class="pk">Échecs</span><span class="pv">{{ profile!.failed }}</span></div>
          <div class="prow"><span class="pk">Dernière activité</span><span class="pv">{{ profile!.lastSeen }}</span></div>
        </div>
      </div>
      <div class="m-foot"><button class="btn btn-secondary" (click)="profile = null">Fermer</button></div>
    </div>
  </div>
  `,
  styles: [`
    .sec-wrap { display: flex; flex-direction: column; gap: 16px; }
    .sec-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); overflow: hidden; }

    /* toolbar */
    .toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 16px; }
    .date-range { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
    .date-range .ico { width: 16px; height: 16px; color: var(--text-muted); }
    .date-range input, .filters select {
      height: 36px; padding: 0 10px; border-radius: var(--radius-md);
      background-color: var(--bg-subtle); border: 1px solid transparent; font-size: 12.5px;
      color: var(--text-primary); outline: none; font-family: inherit; cursor: pointer;
      &:focus { background-color: var(--bg-card); border-color: var(--primary-border); }
    }
    .date-range .sep { color: var(--text-muted); font-size: 12px; }
    .filters { display: flex; gap: 8px; flex-wrap: nowrap; }
    .filters select {
      color: var(--text-secondary); font-weight: 600; max-width: 170px; min-width: 0;
      appearance: none; -webkit-appearance: none;
      padding: 0 30px 0 10px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 10px center; background-size: 12px;
    }
    .toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
    .auto-toggle { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-muted); white-space: nowrap; }
    .auto-toggle .refresh { width: 14px; height: 14px; }
    .auto-toggle .refresh.spin { color: var(--success); animation: secspin 1.2s linear infinite; }
    @keyframes secspin { to { transform: rotate(360deg); } }
    .switch { width: 34px; height: 19px; padding: 0; border: none; border-radius: 999px; background: var(--border-strong); position: relative; cursor: pointer; flex-shrink: 0;
      .knob { position: absolute; top: 2px; left: 2px; width: 15px; height: 15px; border-radius: 50%; background: #fff; transition: transform .2s ease; box-shadow: 0 1px 2px rgba(0,0,0,.25); }
      &.on { background: var(--success); } &.on .knob { transform: translateX(15px); } }
    .btn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border: none; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      svg { width: 15px; height: 15px; }
      &.btn-secondary { background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); &:hover { background: var(--bg-subtle); color: var(--text-primary); } } }

    /* KPI */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 760px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi-tile { border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 20px; }
    .kpi-tile .kv { font-size: 28px; font-weight: 800; letter-spacing: -.5px; line-height: 1; }
    .kpi-tile .kl { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; opacity: .85; margin-top: 8px; }
    .t-success { background: linear-gradient(135deg, color-mix(in oklab, var(--success) 15%, transparent), transparent); border-color: color-mix(in oklab, var(--success) 30%, var(--border)); .kv, .kl { color: var(--success); } }
    .t-danger  { background: linear-gradient(135deg, color-mix(in oklab, var(--danger) 15%, transparent), transparent); border-color: color-mix(in oklab, var(--danger) 30%, var(--border)); .kv, .kl { color: var(--danger); } }
    .t-warning { background: linear-gradient(135deg, color-mix(in oklab, var(--warning) 15%, transparent), transparent); border-color: color-mix(in oklab, var(--warning) 30%, var(--border)); .kv, .kl { color: var(--warning); } }
    .t-purple  { background: linear-gradient(135deg, color-mix(in oklab, var(--accent) 15%, transparent), transparent); border-color: color-mix(in oklab, var(--accent) 30%, var(--border)); .kv, .kl { color: var(--accent); } }

    /* card head + table */
    .card-head { padding: 16px 20px; border-bottom: 1px solid var(--border-light);
      h3 { font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin: 0; }
      .sub { font-size: 11.5px; color: var(--text-muted); } }
    .table-scroll { overflow-x: auto; }
    .sec-table { width: 100%; border-collapse: collapse; font-size: 13px;
      thead tr { background: var(--bg-subtle); }
      th { text-align: left; padding: 11px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); white-space: nowrap; }
      th:first-child, td:first-child { padding-left: 20px; }
      th.ar, td.ar { text-align: right; padding-right: 20px; }
      td { padding: 12px; border-top: 1px solid var(--border-light); color: var(--text-secondary); vertical-align: middle; }
      tbody tr:hover { background: var(--bg-subtle); }
      .mono { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: var(--text-primary); }
      .muted { color: var(--text-muted); } }
    .ev-badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: var(--radius-full);
      &.success { background: var(--success-bg); color: var(--success-text); }
      &.failed  { background: var(--danger-bg);  color: var(--danger-text); }
      &.locked  { background: var(--warning-bg); color: var(--warning-text); }
      &.reset   { background: var(--primary-bg); color: var(--primary); }
      &.logout  { background: var(--bg-subtle);  color: var(--text-muted); }
      &.suspicious { background: var(--accent-bg); color: var(--accent); } }
    .row-actions { display: inline-flex; gap: 4px; }
    .ico-btn { width: 30px; height: 30px; border: none; background: transparent; border-radius: var(--radius-sm); display: grid; place-items: center; cursor: pointer; color: var(--text-muted);
      svg { width: 15px; height: 15px; }
      &:hover { background: var(--bg-subtle); color: var(--text-primary); }
      &.danger { color: var(--danger); } &.danger:hover { background: var(--danger-bg); } }
    .empty { padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px; }

    /* pager */
    .pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-top: 1px solid var(--border-light); }
    .pg-info { font-size: 12px; color: var(--text-muted); }
    .pg-ctrl { display: flex; align-items: center; gap: 8px; }
    .pg-num { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
    .pg-btn { width: 30px; height: 30px; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); cursor: pointer; color: var(--text-secondary); font-size: 16px; line-height: 1; }
    .pg-btn:hover:not(:disabled) { background: var(--bg-subtle); color: var(--text-primary); }
    .pg-btn:disabled { opacity: .4; cursor: default; }

    /* heatmap */
    .heat-body { padding: 20px; }
    .heat-grid { display: grid; grid-template-columns: repeat(15, 1fr); gap: 4px; }
    @media (min-width: 640px) { .heat-grid { grid-template-columns: repeat(30, 1fr); } }
    .heat-cell { aspect-ratio: 1; border-radius: 3px; }
    .heat-cell.h0 { background: var(--bg-subtle); }
    .heat-cell.h1 { background: color-mix(in oklab, var(--danger) 15%, transparent); }
    .heat-cell.h2 { background: color-mix(in oklab, var(--danger) 35%, transparent); }
    .heat-cell.h3 { background: color-mix(in oklab, var(--danger) 60%, transparent); }
    .heat-cell.h4 { background: var(--danger); }
    .heat-legend { display: flex; align-items: center; gap: 5px; margin-top: 16px; font-size: 11px; color: var(--text-muted);
      .heat-cell { width: 12px; height: 12px; aspect-ratio: auto; } }

    /* profile modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 460px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-light); h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; } }
    .x { width: 32px; height: 32px; border: none; background: var(--bg-subtle); border-radius: var(--radius-sm); cursor: pointer; color: var(--text-muted); display: grid; place-items: center; svg { width: 15px; height: 15px; } &:hover { color: var(--text-primary); } }
    .m-body { padding: 16px 20px; }
    .m-foot { display: flex; justify-content: flex-end; padding: 12px 20px 18px; }
    .btn-secondary { height: 36px; padding: 0 14px; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-md); font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; font-family: inherit; }
    .btn-secondary:hover { background: var(--bg-subtle); color: var(--text-primary); }
    .badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: var(--radius-full); }
    .badge-success { background: var(--success-bg); color: var(--success-text); }
    .badge-danger { background: var(--danger-bg); color: var(--danger-text); }
    .prof-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .prof-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--primary); color: #fff; display: grid; place-items: center; font-size: 18px; font-weight: 700; flex-shrink: 0; }
    .prof-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
    .prof-sub { font-size: 12.5px; color: var(--text-muted); }
    .prof-head .badge { margin-left: auto; }
    .prof-warn { font-size: 12px; color: var(--warning-text); background: var(--warning-bg); border-radius: var(--radius-md); padding: 9px 11px; margin-bottom: 12px; }
    .prof-rows { display: flex; flex-direction: column; gap: 2px; }
    .prow { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-top: 1px solid var(--border-light); font-size: 13px; }
    .prow:first-child { border-top: none; }
    .pk { color: var(--text-muted); }
    .pv { font-weight: 600; color: var(--text-primary); }
    .pv.mono { font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
  `]
})
export class AdminSecurityLogComponent implements OnInit, OnDestroy {
  metrics: SecurityMetrics = { totalAttempts: 0, failedAttempts: 0, blockedIps: 0 };
  events: SecEvent[] = [];
  filteredEvents: SecEvent[] = [];
  heatmap: HeatCell[] = [];
  kpi = { success: 0, failed: 0, locked: 0, suspicious: 0 };

  userOptions: string[] = [];
  ipOptions: string[] = [];

  // Pagination for the security-events table (max 15 rows per page).
  secPage = 0;
  readonly secPageSize = 15;
  get pagedEvents(): SecEvent[] { return this.filteredEvents.slice(this.secPage * this.secPageSize, (this.secPage + 1) * this.secPageSize); }
  get secTotalPages(): number { return Math.max(1, Math.ceil(this.filteredEvents.length / this.secPageSize)); }
  get pageEnd(): number { return Math.min((this.secPage + 1) * this.secPageSize, this.filteredEvents.length); }

  dateStart = '';
  dateEnd = '';
  typeFilter = '';
  userFilter = '';
  ipFilter = '';
  resultFilter = '';

  autoRefresh = false;
  private timer: any = null;

  typeMap: Record<string, { label: string }> = {
    success: { label: 'Connexion réussie' },
    failed: { label: 'Tentative échouée' },
    locked: { label: 'Compte verrouillé' },
    reset: { label: 'Réinitialisation MDP' },
    logout: { label: 'Déconnexion' },
    suspicious: { label: 'Activité suspecte' }
  };

  private usersByKey = new Map<string, User>();
  profile: ProfileView | null = null;

  constructor(
    private security: AdminSecurityService,
    private userService: UserService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const start = new Date(); start.setDate(start.getDate() - 35);
    this.dateEnd = this.iso(today);
    this.dateStart = this.iso(start);
    this.loadUsers();
    this.load();
  }

  private loadUsers(): void {
    this.userService.getAllUsers(0, 500).subscribe({
      next: (res: any) => {
        const list: User[] = res && res.data ? res.data : [];
        this.usersByKey.clear();
        list.forEach(u => {
          if (u.email) this.usersByKey.set(u.email.toLowerCase(), u);
          if (u.username) this.usersByKey.set(u.username.toLowerCase(), u);
        });
      },
      error: () => {}
    });
  }

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  private iso(d: Date): string { return d.toISOString().split('T')[0]; }

  toggleAuto(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.autoRefresh) this.timer = setInterval(() => this.load(), 30000);
  }

  load(): void {
    this.security.getSecurityMetrics().subscribe({
      next: (m: any) => { this.metrics = (m && m.data ? m.data : m) || this.metrics; this.recomputeKpis(); this.cdr.detectChanges(); },
      error: () => {}
    });
    this.security.getLoginAttempts().subscribe({
      next: (list: any) => {
        const raw: LoginAttempt[] = Array.isArray(list) ? list : (list?.data ?? []);
        const sorted = raw.slice().sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime());
        this.events = sorted.map(a => ({
          id: a.id,
          time: this.fmt(a.attemptedAt),
          rawTime: a.attemptedAt,
          user: a.username || '—',
          ip: a.ipAddress,
          type: a.success ? 'success' : 'failed',
          result: a.success ? 'Succès' : 'Échec',
          details: a.success ? 'Connexion réussie' : 'Identifiants invalides'
        }));
        this.userOptions = Array.from(new Set(this.events.map(e => e.user).filter(u => u && u !== '—'))).slice(0, 50);
        this.ipOptions = Array.from(new Set(this.events.map(e => e.ip).filter(Boolean))).slice(0, 50);
        this.buildHeatmap(sorted);
        this.recomputeKpis();
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => { this.events = []; this.applyFilters(); this.cdr.detectChanges(); }
    });
  }

  private recomputeKpis(): void {
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    const last24 = this.events.filter(e => new Date(e.rawTime).getTime() >= dayAgo);
    const failBy: Record<string, number> = {};
    this.events.filter(e => e.type === 'failed').forEach(e => { failBy[e.user] = (failBy[e.user] || 0) + 1; });
    this.kpi = {
      success: last24.filter(e => e.type === 'success').length,
      failed: this.metrics.failedAttempts || last24.filter(e => e.type === 'failed').length,
      locked: Object.values(failBy).filter(n => n >= 5).length,
      suspicious: this.metrics.blockedIps || new Set(this.events.filter(e => e.type === 'failed').map(e => e.ip)).size
    };
  }

  private buildHeatmap(sorted: LoginAttempt[]): void {
    const counts = new Array(90).fill(0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    sorted.filter(a => !a.success).forEach(a => {
      const d = new Date(a.attemptedAt); d.setHours(0, 0, 0, 0);
      const idx = 89 - Math.round((today.getTime() - d.getTime()) / 86400000);
      if (idx >= 0 && idx < 90) counts[idx]++;
    });
    this.heatmap = counts.map((count, day) => ({
      day, count,
      level: count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 12 ? 3 : 4
    }));
  }

  applyFilters(): void {
    let r = [...this.events];
    if (this.dateStart) r = r.filter(e => (e.rawTime || '').slice(0, 10) >= this.dateStart);
    if (this.dateEnd) r = r.filter(e => (e.rawTime || '').slice(0, 10) <= this.dateEnd);
    if (this.typeFilter) r = r.filter(e => e.type === this.typeFilter);
    if (this.userFilter) r = r.filter(e => e.user === this.userFilter);
    if (this.ipFilter) r = r.filter(e => e.ip === this.ipFilter);
    if (this.resultFilter) r = r.filter(e => e.result === this.resultFilter);
    this.filteredEvents = r;
    // Keep the current page in range after filtering.
    if (this.secPage > this.secTotalPages - 1) this.secPage = this.secTotalPages - 1;
  }

  blockIp(s: SecEvent): void {
    this.security.blockIp(s.ip, 'Bloquée depuis le journal de sécurité').subscribe({
      next: () => this.toast.show(`Adresse IP ${s.ip} bloquée.`, 'success'),
      error: (err: any) => this.toast.show(err?.error?.message || `Échec du blocage de ${s.ip}.`, 'error')
    });
  }

  /** Show a popup with the user's profile details + their login-attempt history. */
  viewProfile(s: SecEvent): void {
    const u = s.user ? this.usersByKey.get(s.user.toLowerCase()) : undefined;
    const mine = this.events.filter(e => e.user === s.user);
    const failed = mine.filter(e => e.type === 'failed').length;
    const lastSeen = mine.length ? mine[0].time : '—'; // events are sorted newest-first
    this.profile = {
      found: !!u,
      name: u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username : s.user,
      email: u?.email || '—',
      role: (u?.role || u?.userType || '—').toString().replace('ROLE_', ''),
      active: u ? u.isActive !== false : true,
      username: u?.username || s.user,
      total: mine.length,
      failed,
      lastSeen
    };
    this.cdr.detectChanges();
  }

  exportCsv(): void {
    const rows = [['Horodatage', 'Utilisateur', 'IP', 'Type', 'Résultat', 'Détails']];
    this.filteredEvents.forEach(e => rows.push([e.time, e.user, e.ip, this.typeMap[e.type]?.label || e.type, e.result, e.details]));
    const csv = rows.map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'journal-securite.csv'; a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Journal de sécurité exporté.', 'success');
  }

  private fmt(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
