import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityLogService } from '../../../core/services/activity-log.service';
import { ToastService } from '../../../core/services/toast.service';
import { PdfService } from '../../../core/services/pdf.service';

interface AuditRow {
  time: string;
  rawTime: string;
  user: string;
  role: string;
  module: string;
  action: string;       // normalised FR label (CRÉÉ / MODIFIÉ / …)
  actionTone: string;   // success | brand | danger | warning | purple | muted
  details: string;
  ip: string;
}

@Component({
  selector: 'app-admin-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="act-wrap">

    <!-- ═══ Toolbar : search + filters + exports ═══ -->
    <div class="act-card toolbar">
      <div class="search">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Rechercher dans le journal..." [(ngModel)]="search" (ngModelChange)="apply()" />
      </div>

      <div class="filters">
        <select [(ngModel)]="userFilter" (change)="apply()">
          <option value="">Utilisateur</option>
          <option *ngFor="let u of userOptions" [value]="u">{{ u }}</option>
        </select>
        <select [(ngModel)]="moduleFilter" (change)="apply()">
          <option value="">Module</option>
          <option *ngFor="let m of moduleOptions" [value]="m">{{ m }}</option>
        </select>
        <select [(ngModel)]="actionFilter" (change)="apply()">
          <option value="">Type d'action</option>
          <option *ngFor="let a of actionOptions" [value]="a">{{ a }}</option>
        </select>
        <select [(ngModel)]="periodFilter" (change)="apply()">
          <option value="">Période</option>
          <option value="today">Aujourd'hui</option>
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
        </select>
      </div>

      <div class="exports">
        <button class="btn btn-outline" (click)="exportCsv()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          CSV
        </button>
        <button class="btn btn-outline" (click)="exportPdf()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          PDF
        </button>
      </div>
    </div>

    <!-- ═══ Table ═══ -->
    <div class="act-card">
      <div class="table-scroll">
        <table class="act-table">
          <thead>
            <tr><th>Horodatage</th><th>Utilisateur</th><th>Rôle</th><th>Module</th><th>Action</th><th>Détails</th><th>IP</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of paged()">
              <td class="mono">{{ l.time }}</td>
              <td>{{ l.user }}</td>
              <td class="role">{{ l.role }}</td>
              <td><span class="badge module">{{ l.module }}</span></td>
              <td><span class="badge" [ngClass]="l.actionTone">{{ l.action }}</span></td>
              <td class="muted">{{ l.details }}</td>
              <td class="mono">{{ l.ip }}</td>
            </tr>
            <tr *ngIf="filtered.length === 0"><td colspan="7"><div class="empty">Aucune entrée de journal pour ces critères.</div></td></tr>
          </tbody>
        </table>
      </div>

      <!-- footer : page size + pagination -->
      <div class="act-foot" *ngIf="filtered.length > 0">
        <select [(ngModel)]="pageSize" (change)="currentPage = 0">
          <option [ngValue]="50">50 entrées par page</option>
          <option [ngValue]="100">100</option>
          <option [ngValue]="200">200</option>
        </select>
        <div class="pager">
          <button class="btn btn-outline btn-sm" (click)="prev()" [disabled]="currentPage === 0">Précédent</button>
          <button class="btn btn-sm" *ngFor="let p of pageList()" [class.btn-outline]="p - 1 !== currentPage" (click)="currentPage = p - 1">{{ p }}</button>
          <button class="btn btn-outline btn-sm" (click)="next()" [disabled]="currentPage >= totalPages - 1">Suivant</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .act-wrap { display: flex; flex-direction: column; gap: 16px; }
    .act-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); overflow: hidden; }

    .toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 16px; }
    .search { position: relative; flex: 1; min-width: 220px; max-width: 420px;
      .ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted); }
      input { width: 100%; height: 36px; padding: 0 12px 0 34px; border-radius: var(--radius-md); background: var(--bg-subtle); border: 1px solid transparent; font-size: 13px; color: var(--text-primary); outline: none;
        &::placeholder { color: var(--text-muted); } &:focus { background: var(--bg-card); border-color: var(--primary-border); } } }
    .filters { display: flex; gap: 8px; flex-wrap: nowrap; }
    .filters select {
      height: 36px; padding: 0 30px 0 10px; border-radius: var(--radius-md); background-color: var(--bg-subtle);
      border: 1px solid transparent; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); cursor: pointer; outline: none;
      max-width: 170px; appearance: none; -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 10px center; background-size: 12px;
      &:focus { background-color: var(--bg-card); border-color: var(--primary-border); } }
    .exports { margin-left: auto; display: flex; gap: 8px; }

    .btn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border: none; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap;
      svg { width: 15px; height: 15px; }
      &.btn-sm { height: 30px; padding: 0 11px; font-size: 12.5px; }
      &.btn-outline { background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); &:hover:not(:disabled) { background: var(--bg-subtle); color: var(--text-primary); } }
      &:not(.btn-outline) { background: var(--primary); color: #fff; }
      &:disabled { opacity: .5; cursor: not-allowed; } }

    .table-scroll { overflow-x: auto; }
    .act-table { width: 100%; border-collapse: collapse; font-size: 13px;
      thead tr { background: var(--bg-subtle); }
      th { text-align: left; padding: 11px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-muted); white-space: nowrap; }
      th:first-child, td:first-child { padding-left: 20px; }
      td { padding: 12px; border-top: 1px solid var(--border-light); color: var(--text-secondary); vertical-align: middle; }
      tbody tr:hover { background: var(--bg-subtle); }
      .mono { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: var(--text-primary); }
      .role { color: var(--text-muted); font-size: 12px; }
      .muted { color: var(--text-muted); } }
    .badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: var(--radius-full); white-space: nowrap;
      &.module { background: var(--primary-bg); color: var(--primary); }
      &.success { background: var(--success-bg); color: var(--success-text); }
      &.brand   { background: var(--primary-bg); color: var(--primary); }
      &.danger  { background: var(--danger-bg);  color: var(--danger-text); }
      &.warning { background: var(--warning-bg); color: var(--warning-text); }
      &.purple  { background: var(--accent-bg);  color: var(--accent); }
      &.muted   { background: var(--bg-subtle);  color: var(--text-muted); } }
    .empty { padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px; }

    .act-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--border); flex-wrap: wrap;
      select { height: 32px; padding: 0 10px; border-radius: var(--radius-sm); background: var(--bg-subtle); border: 1px solid var(--border); font-size: 12px; color: var(--text-secondary); cursor: pointer; outline: none; } }
    .pager { display: flex; gap: 4px; flex-wrap: wrap; }
  `]
})
export class AdminActivityLogsComponent implements OnInit {
  logs: AuditRow[] = [];
  filtered: AuditRow[] = [];

  search = '';
  userFilter = '';
  moduleFilter = '';
  actionFilter = '';
  periodFilter = '';

  userOptions: string[] = [];
  moduleOptions: string[] = [];
  actionOptions: string[] = [];

  pageSize = 50;
  currentPage = 0;
  totalPages = 1;

  private actionTones: Record<string, string> = {
    'CRÉÉ': 'success', 'MODIFIÉ': 'brand', 'SUPPRIMÉ': 'danger', 'EXPORTÉ': 'warning', 'CONNEXION': 'purple'
  };

  constructor(
    private activityLogService: ActivityLogService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private pdf: PdfService
  ) {}

  ngOnInit(): void { this.loadLogs(); }

  loadLogs(): void {
    this.activityLogService.getAllActivityLogs().subscribe({
      next: (response: any) => {
        let raw: any[] = [];
        if (Array.isArray(response)) raw = response;
        else if (response?.content) raw = response.content;
        else if (response?.data) raw = response.data;
        else if (response?.logs) raw = response.logs;

        this.logs = raw
          .sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())
          .map(l => this.mapRow(l));

        this.userOptions = Array.from(new Set(this.logs.map(l => l.user).filter(Boolean))).slice(0, 80);
        this.moduleOptions = Array.from(new Set(this.logs.map(l => l.module).filter(Boolean)));
        this.actionOptions = Array.from(new Set(this.logs.map(l => l.action).filter(Boolean)));
        this.apply();
        this.cdr.detectChanges();
      },
      error: () => { this.logs = []; this.apply(); this.cdr.detectChanges(); }
    });
  }

  private mapRow(l: any): AuditRow {
    const rawAction = l.action || l.activityType || '';
    const { label, tone } = this.actionInfo(rawAction);
    const rawTime = l.timestamp || l.createdAt || '';
    return {
      time: this.fmt(rawTime),
      rawTime,
      user: l.userName || (l.user?.firstName ? `${l.user.firstName} ${l.user.lastName}` : (l.user?.username || 'Système')),
      role: this.roleLabel(l.userRole || l.user?.role || 'SYSTEM'),
      module: this.moduleLabel(l.category || l.entityType || l.module || 'SYSTEM'),
      action: label,
      actionTone: tone,
      details: l.details || l.description || '—',
      ip: l.ipAddress || '—'
    };
  }

  private actionInfo(a: string): { label: string; tone: string } {
    const up = (a || '').toUpperCase();
    if (up.includes('CREA') || up.includes('CRÉ') || up.includes('ADD')) return { label: 'CRÉÉ', tone: 'success' };
    if (up.includes('UPDAT') || up.includes('MODIF') || up.includes('EDIT')) return { label: 'MODIFIÉ', tone: 'brand' };
    if (up.includes('DELET') || up.includes('SUPPR') || up.includes('REMOV')) return { label: 'SUPPRIMÉ', tone: 'danger' };
    if (up.includes('EXPORT')) return { label: 'EXPORTÉ', tone: 'warning' };
    if (up.includes('LOGIN') || up.includes('CONNEX') || up.includes('AUTH') || up.includes('LOGOUT')) return { label: 'CONNEXION', tone: 'purple' };
    return { label: a || '—', tone: 'muted' };
  }

  private moduleLabel(c: string): string {
    const up = (c || '').toUpperCase();
    const map: Record<string, string> = {
      SECURITY: 'Sécurité', DATA_MUTATION: 'Données', SYSTEM: 'Système',
      USER: 'Utilisateurs', USERS: 'Utilisateurs', PROJECT: 'Projets', PROJECTS: 'Projets',
      TASK: 'Tâches', TASKS: 'Tâches', TEAM: 'Équipes', REPORT: 'Rapports'
    };
    return map[up] || (c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : 'Système');
  }

  private roleLabel(r: string): string {
    const up = (r || '').replace('ROLE_', '').toUpperCase();
    return up === 'ADMIN' ? 'Administrateur' : up === 'PROJECT_MANAGER' ? 'Chef de Projet' : up === 'USER' ? 'Collaborateur' : (r || 'Système');
  }

  apply(): void {
    let r = [...this.logs];
    if (this.search.trim()) {
      const t = this.search.toLowerCase().trim();
      r = r.filter(l => l.user.toLowerCase().includes(t) || l.details.toLowerCase().includes(t) || l.module.toLowerCase().includes(t) || l.ip.includes(t) || l.action.toLowerCase().includes(t));
    }
    if (this.userFilter) r = r.filter(l => l.user === this.userFilter);
    if (this.moduleFilter) r = r.filter(l => l.module === this.moduleFilter);
    if (this.actionFilter) r = r.filter(l => l.action === this.actionFilter);
    if (this.periodFilter) {
      const now = Date.now();
      const cutoff = this.periodFilter === 'today'
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
        : now - Number(this.periodFilter) * 86400000;
      r = r.filter(l => { const ts = new Date(l.rawTime).getTime(); return !isNaN(ts) && ts >= cutoff; });
    }
    this.filtered = r;
    this.totalPages = Math.max(1, Math.ceil(r.length / this.pageSize));
    if (this.currentPage >= this.totalPages) this.currentPage = 0;
  }

  paged(): AuditRow[] {
    const start = this.currentPage * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  pageList(): number[] {
    const max = Math.min(this.totalPages, 5);
    const start = Math.min(Math.max(0, this.currentPage - 2), Math.max(0, this.totalPages - max));
    return Array.from({ length: max }, (_, i) => start + i + 1);
  }

  prev(): void { if (this.currentPage > 0) this.currentPage--; }
  next(): void { if (this.currentPage < this.totalPages - 1) this.currentPage++; }

  // ─── Exports ───
  private rowsForExport(): string[][] {
    const head = ['Horodatage', 'Utilisateur', 'Rôle', 'Module', 'Action', 'Détails', 'IP'];
    const body = this.filtered.map(l => [l.time, l.user, l.role, l.module, l.action, l.details, l.ip]);
    return [head, ...body];
  }

  exportCsv(): void {
    const csv = this.rowsForExport().map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'journal-activite.csv'; a.click();
    URL.revokeObjectURL(url);
    this.toast.show(`Export CSV de ${this.filtered.length} entrée(s) généré.`, 'success');
  }

  exportPdf(): void {
    const esc = (s: any) => this.pdf.esc(s);
    const rows = this.filtered.map(l =>
      `<tr><td>${esc(l.time)}</td><td>${esc(l.user)}</td><td>${esc(l.role)}</td><td>${esc(l.module)}</td><td>${esc(l.action)}</td><td>${esc(l.details)}</td><td>${esc(l.ip)}</td></tr>`
    ).join('');
    const body = `<table><thead><tr><th>Horodatage</th><th>Utilisateur</th><th>Rôle</th><th>Module</th><th>Action</th><th>Détails</th><th>IP</th></tr></thead><tbody>${rows}</tbody></table>`;
    const ok = this.pdf.open({ title: "Journal d'activité", subtitle: `${this.filtered.length} entrée(s)`, bodyHtml: body });
    if (!ok) { this.toast.show("Veuillez autoriser les pop-ups pour l'export PDF.", 'error'); return; }
    this.toast.show('Aperçu PDF ouvert — utilisez « Enregistrer au format PDF ».', 'success');
  }

  private fmt(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
