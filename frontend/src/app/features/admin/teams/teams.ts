import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService, Team } from '../../../core/services/team.service';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';

interface TeamMember { id?: number; name: string; email: string; initials: string; roleLabel: string; lead: boolean; }

@Component({
  selector: 'app-admin-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, AiDescribeButtonComponent],
  template: `
  <div class="page-wrap">
    <div class="page-header">
      <div class="page-title-block">
        <h1>Équipes</h1>
        <p>Gestion des équipes et de leurs membres</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" (click)="openCreate()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Nouvelle équipe</span>
        </button>
      </div>
    </div>

    <div class="teams-grid">
      @for (t of teams; track t.id) {
        <div class="team-card" (click)="openTeam(t)" title="Voir les membres de l'équipe">
          <div class="tc-top">
            <div class="tc-avatar">{{ initials(t.name) }}</div>
            <span class="badge badge-primary">{{ memberCount(t) }} membre(s)</span>
          </div>
          <h3 class="tc-name">{{ t.name }}</h3>
          <p class="tc-desc">{{ t.description || 'Aucune description.' }}</p>

          <div class="tc-members" *ngIf="memberCount(t) > 0">
            <span class="mini-avatar" *ngFor="let mi of previewInitials(t)">{{ mi }}</span>
            <span class="mini-more" *ngIf="memberCount(t) > 4">+{{ memberCount(t) - 4 }}</span>
          </div>

          <div class="tc-foot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>
            <span>{{ projectName(t.projectId) }}</span>
            <span class="tc-view">Voir les membres ›</span>
          </div>
        </div>
      } @empty {
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
          <h3>Aucune équipe</h3>
          <p>Créez une équipe pour commencer à organiser vos collaborateurs.</p>
        </div>
      }
    </div>
  </div>

  <!-- ═══ Members pop-up (lead first) ═══ -->
  @if (showMembers) {
    <div class="modal-backdrop" (click)="showMembers = false">
      <div class="modal-card members-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="mh-left">
            <div class="tc-avatar sm">{{ initials(selectedTeam?.name || '') }}</div>
            <div>
              <h3>{{ selectedTeam?.name }}</h3>
              <p>{{ projectName(selectedTeam?.projectId) }} · {{ teamMembers.length }} membre(s)</p>
            </div>
          </div>
          <button class="modal-close" (click)="showMembers = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body members-body">
          @if (loadingMembers) {
            <div class="m-state">Chargement des membres…</div>
          } @else if (teamMembers.length === 0) {
            <div class="m-state">Aucun membre dans cette équipe.</div>
          } @else {
            <div class="member-row" *ngFor="let m of teamMembers" [class.is-lead]="m.lead">
              <div class="m-avatar" [class.lead]="m.lead">{{ m.initials }}</div>
              <div class="m-info">
                <span class="m-name">{{ m.name }}</span>
                <span class="m-email">{{ m.email }}</span>
              </div>
              <span class="m-role" [class.lead]="m.lead">
                <svg *ngIf="m.lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
                {{ m.lead ? "Chef d'équipe" : m.roleLabel }}
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  }

  @if (showCreate) {
    <div class="modal-backdrop" (click)="showCreate=false">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div><h3>Nouvelle équipe</h3><p>Définissez une nouvelle équipe de travail</p></div>
          <button class="modal-close" (click)="showCreate=false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nom de l'équipe</label>
            <input type="text" [(ngModel)]="form.name" placeholder="Équipe Backend" />
          </div>
          <div class="form-group">
            <label>Projet associé</label>
            <select [(ngModel)]="form.projectId">
              <option [ngValue]="0">Sélectionner un projet</option>
              @for (p of projects; track p.id) { <option [ngValue]="p.id">{{ p.name }}</option> }
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <app-ai-describe [type]="'TEAM'" [title]="form.name" (generated)="form.description = $event"></app-ai-describe>
            <textarea rows="3" [(ngModel)]="form.description" placeholder="Rôle et périmètre de l'équipe..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showCreate=false">Annuler</button>
          <button class="btn btn-primary" (click)="create()" [disabled]="!form.name">Créer l'équipe</button>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    .page-wrap { display:flex; flex-direction:column; gap:22px; }
    .teams-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:18px; }
    .team-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-xl); padding:20px; box-shadow:var(--shadow-xs); cursor:pointer; transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
    .team-card:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:var(--primary-border); }
    .tc-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
    .tc-avatar { width:44px; height:44px; border-radius:var(--radius-lg); background:var(--primary-bg); color:var(--primary); display:grid; place-items:center; font-weight:800; font-size:15px; }
    .tc-avatar.sm { width:38px; height:38px; font-size:13px; border-radius:var(--radius-md); }
    .tc-name { font-size:15px; font-weight:700; color:var(--text-primary); margin:0 0 5px; }
    .tc-desc { font-size:12.5px; color:var(--text-muted); line-height:1.45; margin:0 0 12px; min-height:34px; }
    .tc-members { display:flex; align-items:center; gap:-6px; margin-bottom:12px; }
    .tc-members .mini-avatar { width:26px; height:26px; border-radius:50%; background:var(--accent-bg); color:var(--accent); display:grid; place-items:center; font-size:10px; font-weight:700; border:2px solid var(--bg-card); margin-left:-6px; }
    .tc-members .mini-avatar:first-child { margin-left:0; }
    .tc-members .mini-more { margin-left:4px; font-size:11px; font-weight:700; color:var(--text-muted); }
    .tc-foot { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); padding-top:12px; border-top:1px solid var(--border-light); }
    .tc-foot svg { width:14px; height:14px; color:var(--primary); flex-shrink:0; }
    .tc-foot .tc-view { margin-left:auto; color:var(--primary); font-weight:600; }

    /* members pop-up */
    .members-modal { width:100%; max-width:480px; }
    .mh-left { display:flex; align-items:center; gap:12px; }
    .members-body { padding:8px 24px 18px; max-height:60vh; overflow-y:auto; }
    .m-state { padding:30px; text-align:center; color:var(--text-muted); font-size:13px; }
    .member-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-light); }
    .member-row:last-child { border-bottom:none; }
    .member-row.is-lead { background:linear-gradient(90deg, var(--warning-bg), transparent); margin:0 -12px; padding:12px; border-radius:var(--radius-md); border-bottom:none; }
    .m-avatar { width:38px; height:38px; border-radius:50%; background:var(--primary-bg); color:var(--primary); display:grid; place-items:center; font-size:13px; font-weight:700; flex-shrink:0; }
    .m-avatar.lead { background:var(--warning-bg); color:var(--warning-text); box-shadow:0 0 0 2px var(--warning); }
    .m-info { flex:1; min-width:0; display:flex; flex-direction:column; }
    .m-name { font-size:13.5px; font-weight:600; color:var(--text-primary); }
    .m-email { font-size:11.5px; color:var(--text-muted); }
    .m-role { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:var(--radius-full); background:var(--bg-subtle); color:var(--text-muted); white-space:nowrap; }
    .m-role svg { width:12px; height:12px; }
    .m-role.lead { background:var(--warning-bg); color:var(--warning-text); }
  `]
})
export class AdminTeamsComponent implements OnInit {
  teams: Team[] = [];
  projects: any[] = [];
  showCreate = false;
  form: Team = { name: '', projectId: 0, description: '' };

  // members pop-up
  showMembers = false;
  loadingMembers = false;
  selectedTeam: Team | null = null;
  teamMembers: TeamMember[] = [];

  constructor(
    private teamService: TeamService,
    private projectService: ProjectService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
    this.projectService.getAllProjects(0, 200).subscribe({
      next: (r: any) => { this.projects = r && r.data ? r.data : (Array.isArray(r) ? r : []); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  load(): void {
    this.teamService.getAllTeams().subscribe({
      next: (list: any) => { this.teams = Array.isArray(list) ? list : (list?.data ?? []); this.cdr.detectChanges(); },
      error: () => { this.teams = []; this.cdr.detectChanges(); }
    });
  }

  memberCount(t: Team): number {
    return Array.isArray(t.members) ? t.members.length : 0;
  }

  previewInitials(t: Team): string[] {
    return (Array.isArray(t.members) ? t.members : []).slice(0, 4).map(m => this.memberInitials(m));
  }

  // ─── Members pop-up ───
  openTeam(t: Team): void {
    this.selectedTeam = t;
    this.teamMembers = [];
    this.showMembers = true;
    this.loadingMembers = true;
    if (t.id == null) { this.buildMembers(t.members || []); this.loadingMembers = false; return; }
    this.teamService.getTeamById(t.id).subscribe({
      next: (full: any) => {
        const team = full && full.data ? full.data : full;
        this.buildMembers(team?.members || t.members || []);
        this.loadingMembers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.buildMembers(t.members || []);
        this.loadingMembers = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Normalises members and puts the team lead (project manager) first. */
  private buildMembers(rawMembers: any[]): void {
    const proj = this.projects.find(p => p.id === this.selectedTeam?.projectId);
    const managerId = proj?.managerId;
    const managerName = proj?.managerName;

    const norm: TeamMember[] = (rawMembers || []).map(m => {
      const id = m.id ?? m.userId;
      const role = (m.role || m.userType || '').replace('ROLE_', '');
      return {
        id,
        name: m.firstName ? `${m.firstName} ${m.lastName || ''}`.trim() : (m.name || m.username || m.email || 'Membre'),
        email: m.email || '',
        initials: this.memberInitials(m),
        roleLabel: this.roleLabel(role),
        lead: false
      };
    });

    // Find the lead: project manager among members, else a PROJECT_MANAGER member.
    let leadIdx = managerId != null ? norm.findIndex(m => m.id === managerId) : -1;
    if (leadIdx < 0) leadIdx = norm.findIndex(m => m.roleLabel === 'Chef de Projet');

    let ordered: TeamMember[];
    if (leadIdx >= 0) {
      ordered = [norm[leadIdx], ...norm.filter((_, i) => i !== leadIdx)];
    } else if (managerName) {
      // manager not in members list → show as lead at the top
      ordered = [{
        name: managerName, email: '', initials: this.initials(managerName),
        roleLabel: 'Chef de Projet', lead: false
      }, ...norm];
    } else {
      ordered = norm;
    }
    if (ordered.length) ordered[0].lead = true;
    this.teamMembers = ordered;
  }

  private memberInitials(m: any): string {
    const f = m?.firstName?.[0] ?? '';
    const l = m?.lastName?.[0] ?? '';
    const fromName = (m?.name || m?.username || m?.email || '').trim();
    return (`${f}${l}`.toUpperCase()) || (fromName ? fromName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : '?');
  }

  private roleLabel(role: string): string {
    switch (role) {
      case 'ADMIN':           return 'Administrateur';
      case 'PROJECT_MANAGER': return 'Chef de Projet';
      case 'USER':            return 'Collaborateur';
      default:                return role || 'Membre';
    }
  }

  openCreate(): void {
    this.form = { name: '', projectId: 0, description: '' };
    this.showCreate = true;
  }

  create(): void {
    this.teamService.createTeam(this.form).subscribe({
      next: () => { this.toast.show(`Équipe « ${this.form.name} » créée.`, 'success'); this.showCreate = false; this.load(); },
      error: (err: any) => { this.toast.show(err?.error?.message || 'Échec de la création de l\'équipe.', 'error'); }
    });
  }

  projectName(id: number | undefined): string {
    const p = this.projects.find(x => x.id === id);
    return p ? p.name : 'Projet non assigné';
  }

  initials(name: string): string {
    if (!name) return 'EQ';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
