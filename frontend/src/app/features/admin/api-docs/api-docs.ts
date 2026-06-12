import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface Endpoint { method: string; path: string; desc: string; secure: boolean; req?: string; res?: string; }
interface ApiGroup { title: string; endpoints: Endpoint[]; }

@Component({
  selector: 'app-admin-api-docs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="api-wrap">

    <!-- Header card -->
    <div class="api-head">
      <div class="head-left">
        <h2>API TaskMaster Pro <span class="muted">— v2.0</span></h2>
        <code class="base-url">{{ baseUrl }}</code>
      </div>
      <div class="head-right">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input placeholder="Filtrer les endpoints..." [(ngModel)]="filter" />
        </div>
        <button class="btn btn-outline" (click)="openSpec()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          OpenAPI JSON
        </button>
      </div>
    </div>

    <!-- Accordion groups -->
    <div class="api-groups">
      <div class="api-card" *ngFor="let g of visibleGroups()">
        <button class="grp-head" (click)="toggleGroup(g.title)">
          <svg class="chev" [class.collapsed]="!isOpen(g.title)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          <span class="grp-title">{{ g.title }}</span>
          <span class="grp-badge">{{ g.endpoints.length }} endpoints</span>
        </button>

        <ul class="ep-list" *ngIf="isOpen(g.title)">
          <li *ngFor="let e of filteredEndpoints(g)">
            <button class="ep-row" (click)="toggleEp(g, e)">
              <span class="method" [ngClass]="e.method.toLowerCase()">{{ e.method }}</span>
              <code class="ep-path">{{ e.path }}</code>
              <span class="ep-desc">{{ e.desc }}</span>
              <svg *ngIf="e.secure" class="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </button>

            <div class="ep-detail" *ngIf="isEpOpen(g, e)">
              <div class="detail-grid">
                <div>
                  <div class="detail-lbl">Request</div>
                  <pre><code>{{ sampleReq(e) }}</code></pre>
                </div>
                <div>
                  <div class="detail-lbl">Response 200</div>
                  <pre><code>{{ sampleRes(e) }}</code></pre>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" (click)="tryIt()">▶ Essayer</button>
            </div>
          </li>
        </ul>
      </div>

      <div class="no-result" *ngIf="visibleGroups().length === 0">Aucun endpoint ne correspond à « {{ filter }} ».</div>
    </div>
  </div>
  `,
  styles: [`
    .api-wrap { display: flex; flex-direction: column; gap: 16px; }
    .api-card, .api-head { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); }

    .api-head { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
    @media (min-width: 760px) { .api-head { flex-direction: row; align-items: center; } }
    .head-left h2 { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .head-left h2 .muted { color: var(--text-muted); font-weight: 400; }
    .base-url { display: inline-block; margin-top: 6px; font-family: ui-monospace, Menlo, monospace; font-size: 12px; padding: 3px 8px; border-radius: var(--radius-sm); background: var(--bg-subtle); color: var(--text-secondary); }
    .head-right { display: flex; align-items: center; gap: 8px; }
    @media (min-width: 760px) { .head-right { margin-left: auto; } }
    .search { position: relative; }
    .search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--text-muted); }
    .search input { height: 36px; width: 240px; max-width: 100%; padding: 0 12px 0 33px; border-radius: var(--radius-md); background: var(--bg-subtle); border: 1px solid transparent; font-size: 13px; color: var(--text-primary); outline: none; }
    .search input:focus { background: var(--bg-card); border-color: var(--primary-border); }

    .btn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border: none; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .btn svg { width: 15px; height: 15px; }
    .btn-outline { background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); }
    .btn-outline:hover { background: var(--bg-subtle); color: var(--text-primary); }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-sm { height: 30px; padding: 0 12px; font-size: 12px; }

    .api-groups { display: flex; flex-direction: column; gap: 12px; }
    .grp-head { width: 100%; display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: none; border: none; cursor: pointer; text-align: left; font-family: inherit; }
    .chev { width: 16px; height: 16px; color: var(--text-secondary); transition: transform .2s ease; }
    .chev.collapsed { transform: rotate(-90deg); }
    .grp-title { font-size: 14.5px; font-weight: 700; color: var(--text-primary); }
    .grp-badge { margin-left: 8px; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: var(--radius-full); background: var(--bg-subtle); color: var(--text-muted); }

    .ep-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border-light); }
    .ep-list li { border-top: 1px solid var(--border-light); }
    .ep-list li:first-child { border-top: none; }
    .ep-row { width: 100%; display: flex; align-items: center; gap: 12px; padding: 11px 20px; background: none; border: none; cursor: pointer; text-align: left; font-family: inherit; }
    .ep-row:hover { background: var(--bg-subtle); }
    .method { width: 64px; flex-shrink: 0; height: 24px; display: grid; place-items: center; font-size: 10px; font-weight: 800; border-radius: 6px; letter-spacing: .5px; }
    .method.get { background: var(--success-bg); color: var(--success-text); }
    .method.post { background: var(--primary-bg); color: var(--primary); }
    .method.put, .method.patch { background: var(--warning-bg); color: var(--warning-text); }
    .method.delete { background: var(--danger-bg); color: var(--danger-text); }
    .ep-path { font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
    .ep-desc { font-size: 12.5px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    @media (max-width: 760px) { .ep-desc { display: none; } }
    .lock { width: 14px; height: 14px; color: var(--warning); margin-left: auto; flex-shrink: 0; }

    .ep-detail { padding: 8px 20px 20px; background: color-mix(in oklab, var(--bg-subtle) 55%, transparent); }
    .detail-grid { display: grid; gap: 12px; }
    @media (min-width: 760px) { .detail-grid { grid-template-columns: 1fr 1fr; } }
    .detail-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin-bottom: 5px; }
    .ep-detail pre { margin: 0; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; overflow-x: auto; }
    .ep-detail pre code { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: var(--text-secondary); white-space: pre; }
    .ep-detail > .btn { margin-top: 12px; }

    .no-result { padding: 28px; text-align: center; color: var(--text-muted); font-size: 13px; }
  `]
})
export class AdminApiDocsComponent {
  baseUrl = environment.apiUrl;
  filter = '';
  private openGroups = new Set<string>(['Authentification']);
  private openEp: string | null = null;

  groups: ApiGroup[] = [
    { title: 'Authentification', endpoints: [
      { method: 'POST', path: '/auth/login', desc: 'Authentifier un utilisateur', secure: false,
        req: '{\n  "email": "user@gpi.app",\n  "password": "••••••••"\n}', res: '{\n  "token": "eyJhbGciOiJIUzI1NiIs...",\n  "expiresIn": 3600\n}' },
      { method: 'POST', path: '/auth/register', desc: 'Créer un compte', secure: false,
        req: '{\n  "firstName": "Awa",\n  "lastName": "Diop",\n  "email": "awa@gpi.app",\n  "password": "••••••••"\n}', res: '{\n  "id": 42,\n  "email": "awa@gpi.app",\n  "role": "USER"\n}' },
      { method: 'POST', path: '/auth/refresh', desc: 'Rafraîchir le jeton JWT', secure: true,
        req: '{\n  "refreshToken": "..."\n}', res: '{\n  "token": "eyJhbGci...",\n  "expiresIn": 3600\n}' }
    ]},
    { title: 'Utilisateurs', endpoints: [
      { method: 'GET', path: '/users', desc: 'Lister les utilisateurs', secure: true },
      { method: 'POST', path: '/users', desc: 'Créer un utilisateur', secure: true },
      { method: 'PUT', path: '/users/{id}', desc: 'Modifier un utilisateur', secure: true },
      { method: 'DELETE', path: '/users/{id}', desc: 'Supprimer un utilisateur', secure: true }
    ]},
    { title: 'Projets', endpoints: [
      { method: 'GET', path: '/projects', desc: 'Lister les projets', secure: true },
      { method: 'POST', path: '/projects', desc: 'Créer un projet', secure: true },
      { method: 'PUT', path: '/projects/{id}', desc: 'Modifier un projet', secure: true }
    ]},
    { title: 'Tâches', endpoints: [
      { method: 'GET', path: '/tasks', desc: 'Lister les tâches', secure: true },
      { method: 'POST', path: '/tasks', desc: 'Créer une tâche', secure: true },
      { method: 'DELETE', path: '/tasks/{id}', desc: 'Supprimer une tâche', secure: true }
    ]},
    { title: 'Support', endpoints: [
      { method: 'GET', path: '/tickets', desc: 'Lister les tickets', secure: true },
      { method: 'POST', path: '/tickets', desc: 'Créer un ticket', secure: true },
      { method: 'PUT', path: '/tickets/{id}', desc: 'Mettre à jour un ticket', secure: true }
    ]},
    { title: 'Rapports', endpoints: [
      { method: 'GET', path: '/analytics/admin/reports', desc: 'Rapport global agrégé', secure: true },
      { method: 'GET', path: '/analytics/admin/performance', desc: 'Métriques de performance', secure: true },
      { method: 'GET', path: '/analytics/manager', desc: 'Analytique chef de projet', secure: true }
    ]}
  ];

  toggleGroup(title: string): void {
    if (this.openGroups.has(title)) this.openGroups.delete(title);
    else this.openGroups.add(title);
  }
  isOpen(title: string): boolean { return this.filter.trim().length > 0 || this.openGroups.has(title); }

  toggleEp(g: ApiGroup, e: Endpoint): void {
    const key = this.epKey(g, e);
    this.openEp = this.openEp === key ? null : key;
  }
  isEpOpen(g: ApiGroup, e: Endpoint): boolean { return this.openEp === this.epKey(g, e); }
  private epKey(g: ApiGroup, e: Endpoint): string { return `${g.title}-${e.path}-${e.method}`; }

  visibleGroups(): ApiGroup[] {
    const f = this.filter.trim().toLowerCase();
    if (!f) return this.groups;
    return this.groups.filter(g => this.filteredEndpoints(g).length > 0);
  }
  filteredEndpoints(g: ApiGroup): Endpoint[] {
    const f = this.filter.trim().toLowerCase();
    if (!f) return g.endpoints;
    return g.endpoints.filter(e => e.path.toLowerCase().includes(f) || e.desc.toLowerCase().includes(f) || e.method.toLowerCase().includes(f));
  }

  sampleReq(e: Endpoint): string {
    if (e.req) return e.req;
    if (e.method === 'GET' || e.method === 'DELETE') return '// Aucun corps de requête';
    return '{\n  "name": "...",\n  "description": "..."\n}';
  }
  sampleRes(e: Endpoint): string {
    if (e.res) return e.res;
    return '{\n  "success": true,\n  "message": "...",\n  "data": { }\n}';
  }

  private origin(): string { return this.baseUrl.replace(/\/api\/?$/, ''); }
  openSpec(): void { window.open(this.origin() + '/v3/api-docs', '_blank'); }
  tryIt(): void { window.open(this.origin() + '/swagger-ui/index.html', '_blank'); }
}
