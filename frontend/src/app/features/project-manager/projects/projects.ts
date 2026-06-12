import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';
import { ProjectService, Project, ProjectRequest } from '../../../core/services/project.service';
import { TeamService } from '../../../core/services/team.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { UserService, User } from '../../../core/services/user.service';
import { CalendarService, CalendarEvent } from '../../../core/services/calendar.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pm-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AiDescribeButtonComponent],
  template: `
  <div class="proj-wrap">

    <!-- ═══ Toolbar ═══ -->
    <div class="toolbar">
      <div class="filters">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Rechercher un projet…" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" />
        </div>
        <select class="sel w36" [(ngModel)]="statusFilter" (change)="applyFilters()">
          <option value="all">Tous statuts</option>
          <option value="en-cours">En cours</option>
          <option value="termine">Terminé</option>
          <option value="en-pause">En pause</option>
          <option value="en-retard">En retard</option>
        </select>
        <select class="sel w32" [(ngModel)]="teamFilter" (change)="applyFilters()">
          <option value="all">Toutes les équipes</option>
          <option *ngFor="let t of teamOptions" [value]="t">{{ t }}</option>
        </select>
        <select class="sel w36" [(ngModel)]="periodFilter" (change)="applyFilters()">
          <option value="all">Toute période</option>
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
        </select>
      </div>

      <div class="toolbar-right">
        <div class="view-toggle">
          <button [class.on]="view === 'cards'" (click)="view = 'cards'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Cartes
          </button>
          <button [class.on]="view === 'list'" (click)="view = 'list'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            Liste
          </button>
        </div>
        <button class="btn-primary" (click)="openWizard()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nouveau Projet
        </button>
      </div>
    </div>

    <!-- ═══ Cards view ═══ -->
    <div class="cards-grid" *ngIf="view === 'cards' && filteredProjects.length > 0">
      <div class="proj-card anim" *ngFor="let p of filteredProjects; let i = index" [style.--d]="(i*0.04)+'s'">
        <div class="pc-top">
          <h3 class="pc-name">{{ p.name }}</h3>
          <span class="status-badge" [ngClass]="statusInfo(p).cls">{{ statusInfo(p).label }}</span>
        </div>
        <p class="pc-desc">{{ p.description || 'Aucune description.' }}</p>
        <div class="pc-progress">
          <div class="bar"><div class="bar-fill" [style.width.%]="animated ? (p.progress || 0) : 0"></div></div>
          <span class="pct">{{ p.progress || 0 }}%</span>
        </div>
        <div class="pc-meta">
          <svg class="cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path></svg>
          {{ p.endDate ? (p.endDate | date:'dd/MM/yyyy') : '—' }}
          <span class="owner-pill" *ngIf="p.managerName">{{ p.managerName }}</span>
        </div>
        <div class="pc-foot">
          <span class="team" [title]="teamName(p)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>
            <span class="team-name">{{ teamName(p) }}</span>
            <span class="team-count" *ngIf="memberCount(p) > 0">· {{ memberCount(p) }}</span>
          </span>
          <span class="tasks">{{ p.taskCount || 0 }} tâches<span class="late" *ngIf="late(p) > 0"> · {{ late(p) }} en retard</span></span>
        </div>
        <a class="btn-open" [routerLink]="['/pm/projects', p.id]">Ouvrir le projet</a>
      </div>
    </div>

    <!-- ═══ List view ═══ -->
    <div class="list-card" *ngIf="view === 'list' && filteredProjects.length > 0">
      <table class="proj-table">
        <thead>
          <tr><th>Projet</th><th>Statut</th><th>Progression</th><th>Équipe</th><th>Échéance</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of filteredProjects">
            <td>
              <div class="td-name">{{ p.name }}</div>
              <div class="td-sub">{{ p.managerName || '—' }}</div>
            </td>
            <td><span class="status-badge" [ngClass]="statusInfo(p).cls">{{ statusInfo(p).label }}</span></td>
            <td>
              <div class="td-progress">
                <div class="bar sm"><div class="bar-fill" [style.width.%]="animated ? (p.progress || 0) : 0"></div></div>
                <span class="pct">{{ p.progress || 0 }}%</span>
              </div>
            </td>
            <td><span class="team" [title]="teamName(p)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg><span class="team-name">{{ teamName(p) }}</span></span></td>
            <td class="muted">{{ p.endDate ? (p.endDate | date:'dd/MM/yyyy') : '—' }}</td>
            <td class="right"><a class="open-link" [routerLink]="['/pm/projects', p.id]">Ouvrir →</a></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ Empty state ═══ -->
    <div class="empty-card" *ngIf="!loading && filteredProjects.length === 0">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <h3>Aucun projet pour l'instant</h3>
      <p>Lancez votre premier projet pour commencer.</p>
      <button class="btn-primary" (click)="openWizard()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Créer votre premier projet
      </button>
    </div>
  </div>

  <!-- ═══ Nouveau Projet — wizard 4 étapes ═══ -->
  <div class="modal-backdrop" *ngIf="showWizard" (click)="closeWizard()">
    <div class="wizard" (click)="$event.stopPropagation()">
      <div class="wiz-head"><h3>Créer un nouveau projet</h3>
        <button class="x" (click)="closeWizard()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>

      <!-- Stepper -->
      <div class="stepper">
        <div class="step" *ngFor="let s of stepLabels; let n = index">
          <div class="dot" [class.on]="step >= n+1">{{ n+1 }}</div>
          <span class="lbl">{{ s }}</span>
          <div class="connector" *ngIf="n < 3" [class.on]="step > n+1"></div>
        </div>
      </div>

      <!-- Step 1 : Infos -->
      <div class="wiz-body" *ngIf="step === 1">
        <div class="fg"><label>Nom du projet *</label><input type="text" [(ngModel)]="form.name" placeholder="Ex : Refonte Portail Client"></div>
        <div class="fg"><label>Description</label><app-ai-describe [type]="'PROJECT'" [title]="form.name" (generated)="form.description = $event"></app-ai-describe><textarea rows="3" [(ngModel)]="form.description" placeholder="Brève description du projet…"></textarea></div>
        <div class="grid2">
          <div class="fg"><label>Date de début</label><input type="date" [(ngModel)]="form.startDate"></div>
          <div class="fg"><label>Date de fin</label><input type="date" [(ngModel)]="form.endDate"></div>
        </div>
        <div class="grid2">
          <div class="fg"><label>Priorité</label>
            <select [(ngModel)]="priority"><option value="faible">Faible</option><option value="normale">Normale</option><option value="haute">Haute</option><option value="critique">Critique</option></select>
          </div>
          <div class="fg"><label>Statut initial</label>
            <select [(ngModel)]="form.status"><option value="PLANNED">Planifié</option><option value="IN_PROGRESS">En cours</option></select>
          </div>
        </div>
      </div>

      <!-- Step 2 : Équipe -->
      <div class="wiz-body" *ngIf="step === 2">
        <p class="muted">Sélectionnez les membres et leurs rôles… <strong>({{ selectedMemberCount }} sélectionné(s))</strong></p>
        <div class="fg"><input type="text" placeholder="Rechercher un membre…" [(ngModel)]="memberSearch"></div>
        <div class="member-list">
          <div class="member-row" *ngFor="let m of filteredWizMembers" [class.on]="m.selected">
            <label class="m-check"><input type="checkbox" [(ngModel)]="m.selected"><span class="m-avatar">{{ (m.name || '?').slice(0,1).toUpperCase() }}</span><span class="m-name">{{ m.name }}</span></label>
            <select class="m-role" [(ngModel)]="m.role" [disabled]="!m.selected">
              <option *ngFor="let r of roleOptions" [value]="r">{{ r }}</option>
            </select>
          </div>
          <div class="member-empty" *ngIf="filteredWizMembers.length === 0">Aucun collaborateur disponible.</div>
        </div>
      </div>

      <!-- Step 3 : Jalons -->
      <div class="wiz-body" *ngIf="step === 3">
        <p class="muted">Ajoutez des jalons à votre planning… Ils s'ajoutent à l'agenda des membres.</p>
        <div class="milestone-row" *ngFor="let ms of milestones; let i = index">
          <input type="text" class="ms-name" placeholder="Nom du jalon (ex : Livraison MVP)" [(ngModel)]="ms.name">
          <input type="date" class="ms-date" [(ngModel)]="ms.date">
          <button class="ms-del" (click)="removeMilestone(i)" title="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="ms-empty" *ngIf="milestones.length === 0">Aucun jalon pour l'instant.</div>
        <button class="btn-outline sm" (click)="addMilestone()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Ajouter un jalon</button>
      </div>

      <!-- Step 4 : Confirmation -->
      <div class="wiz-body" *ngIf="step === 4">
        <div class="recap">
          <p><strong>{{ form.name || 'Projet sans nom' }}</strong> — récapitulatif prêt à être créé.</p>
          <ul>
            <li>Statut : {{ form.status === 'IN_PROGRESS' ? 'En cours' : 'Planifié' }}</li>
            <li>Priorité : {{ priority }}</li>
            <li>Période : {{ form.startDate || '—' }} → {{ form.endDate || '—' }}</li>
            <li>Membres : {{ selectedMemberCount }} sélectionné(s)</li>
            <li>Jalons : {{ milestones.length }}</li>
          </ul>
        </div>
      </div>

      <div class="wiz-foot">
        <button class="btn-ghost" *ngIf="step > 1" (click)="step = step - 1">Retour</button>
        <span class="spacer"></span>
        <button class="btn-primary" *ngIf="step < 4" (click)="nextStep()">Suivant</button>
        <button class="btn-primary" *ngIf="step === 4" (click)="submitProject()" [disabled]="submitting">Créer le projet</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .member-list { display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto; margin-top: 8px; }
    .member-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px; }
    .member-row.on { border-color: #2563eb; background: rgba(37,99,235,.05); }
    .m-check { display: flex; align-items: center; gap: 9px; flex: 1; cursor: pointer; }
    .m-check input { width: 15px; height: 15px; accent-color: #2563eb; }
    .m-avatar { width: 28px; height: 28px; border-radius: 50%; background: #2563eb; color: #fff; display: grid; place-items: center; font-size: 11px; font-weight: 700; }
    .m-name { font-size: 13.5px; font-weight: 600; color: #1e293b; }
    .m-role { height: 32px; padding: 0 8px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12.5px; color: #475569; background: #fff; }
    .m-role:disabled { opacity: .5; }
    .member-empty, .ms-empty { padding: 16px; text-align: center; color: #94a3b8; font-size: 13px; }
    .milestone-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .milestone-row .ms-name { flex: 1; height: 38px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; outline: none; }
    .milestone-row .ms-date { height: 38px; padding: 0 10px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; outline: none; }
    .milestone-row .ms-del { width: 34px; height: 34px; border: none; background: #f1f5f9; border-radius: 8px; color: #64748b; cursor: pointer; display: grid; place-items: center; } .milestone-row .ms-del svg { width: 15px; height: 15px; } .milestone-row .ms-del:hover { background: rgba(220,38,38,.1); color: #dc2626; }
    .proj-wrap { display: flex; flex-direction: column; gap: 20px; }
    @keyframes pFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .anim { animation: pFade .45s ease both; animation-delay: var(--d, 0s); }

    /* Toolbar */
    .toolbar { display: flex; flex-direction: column; gap: 12px; }
    @media (min-width: 760px) { .toolbar { flex-direction: row; align-items: center; justify-content: space-between; } }
    .filters { display: flex; flex: 1; flex-wrap: wrap; align-items: center; gap: 8px; }
    .search { position: relative; flex: 1; min-width: 200px; max-width: 360px; }
    .search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #94a3b8; }
    .search input { width: 100%; height: 38px; padding: 0 12px 0 34px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #1e293b; outline: none; background: #fff; }
    .search input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .sel { height: 38px; padding: 0 30px 0 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 12.5px; font-weight: 500; color: #475569; background: #fff; cursor: pointer; outline: none; appearance: none; -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; }
    .sel.w36 { width: 150px; } .sel.w32 { width: 132px; }
    .toolbar-right { display: flex; align-items: center; gap: 10px; }
    .view-toggle { display: inline-flex; padding: 2px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
    .view-toggle button { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border: none; background: none; border-radius: 8px; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; }
    .view-toggle button svg { width: 14px; height: 14px; }
    .view-toggle button.on { background: #2563eb; color: #fff; }

    .btn-primary { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 15px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-primary svg { width: 15px; height: 15px; } .btn-primary:hover { background: #1d4ed8; } .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-ghost { height: 38px; padding: 0 14px; border: none; background: none; border-radius: 10px; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-ghost:hover { background: #f1f5f9; }
    .btn-outline { display: inline-flex; align-items: center; gap: 5px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; color: #475569; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-outline.sm { height: 30px; padding: 0 10px; font-size: 12px; } .btn-outline svg { width: 13px; height: 13px; }

    /* Status badge */
    .status-badge { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; white-space: nowrap; }
    .status-badge.st-blue { background: rgba(37,99,235,.1); color: #2563eb; }
    .status-badge.st-green { background: rgba(22,163,74,.12); color: #16a34a; }
    .status-badge.st-amber { background: rgba(217,119,6,.14); color: #d97706; }
    .status-badge.st-red { background: rgba(220,38,38,.1); color: #dc2626; }
    .status-badge.st-slate { background: #eef2f7; color: #64748b; }

    /* Cards */
    .cards-grid { display: grid; gap: 16px; grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 1100px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 680px) { .cards-grid { grid-template-columns: 1fr; } }
    .proj-card { display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 18px; transition: box-shadow .2s ease; }
    .proj-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,.1); }
    .pc-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .pc-name { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
    .pc-desc { margin: 6px 0 0; font-size: 13px; color: #64748b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 36px; }
    .pc-progress { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
    .bar { flex: 1; height: 8px; border-radius: 9999px; background: #eef2f7; overflow: hidden; }
    .bar.sm { width: 96px; flex: none; height: 6px; }
    .bar-fill { height: 100%; border-radius: 9999px; background: linear-gradient(90deg,#2563eb,#1e3a8a); transition: width .9s cubic-bezier(.4,0,.2,1); }
    .pct { font-size: 12px; font-weight: 700; color: #1e293b; }
    .pc-meta { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 12px; color: #64748b; }
    .pc-meta .cal { width: 14px; height: 14px; }
    .owner-pill { margin-left: auto; font-size: 11px; font-weight: 500; color: #2563eb; background: rgba(37,99,235,.1); padding: 2px 8px; border-radius: 9999px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pc-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 14px; border-top: 1px solid #eef2f7; font-size: 12px; color: #64748b; }
    .team { display: inline-flex; align-items: center; gap: 5px; min-width: 0; } .team svg { width: 14px; height: 14px; flex-shrink: 0; }
    .team-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
    .team-count { color: #94a3b8; flex-shrink: 0; }
    .late { color: #dc2626; font-weight: 600; }
    .btn-open { margin-top: 14px; display: block; text-align: center; height: 38px; line-height: 38px; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; text-decoration: none; }
    .btn-open:hover { background: #1d4ed8; }

    /* List */
    .list-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
    .proj-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .proj-table thead { background: #f8fafc; }
    .proj-table th { text-align: left; padding: 11px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #94a3b8; }
    .proj-table td { padding: 12px 16px; border-top: 1px solid #eef2f7; color: #475569; vertical-align: middle; }
    .proj-table tbody tr:hover { background: #f8fafc; }
    .td-name { font-weight: 600; color: #1e293b; } .td-sub { font-size: 11.5px; color: #94a3b8; margin-top: 1px; }
    .td-progress { display: flex; align-items: center; gap: 8px; }
    .muted { color: #94a3b8; } .right { text-align: right; }
    .open-link { color: #2563eb; font-weight: 600; text-decoration: none; } .open-link:hover { text-decoration: underline; }

    /* Empty */
    .empty-card { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 6px; padding: 56px 24px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; }
    .empty-icon { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: rgba(37,99,235,.1); color: #2563eb; margin-bottom: 8px; }
    .empty-icon svg { width: 28px; height: 28px; }
    .empty-card h3 { font-size: 15.5px; font-weight: 700; color: #1e293b; margin: 0; }
    .empty-card p { font-size: 13px; color: #64748b; margin: 0 0 8px; }

    /* Wizard */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .wizard { width: 100%; max-width: 640px; background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); max-height: calc(100vh - 48px); overflow-y: auto; }
    .wiz-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 12px; }
    .wiz-head h3 { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0; }
    .x { width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; color: #64748b; display: grid; place-items: center; } .x svg { width: 15px; height: 15px; }
    .stepper { display: flex; align-items: center; gap: 8px; padding: 8px 24px 16px; }
    .step { display: flex; flex: 1; align-items: center; gap: 8px; }
    .dot { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; font-size: 12px; font-weight: 700; background: #eef2f7; color: #94a3b8; flex-shrink: 0; transition: all .2s ease; }
    .dot.on { background: #2563eb; color: #fff; }
    .step .lbl { font-size: 12px; color: #64748b; white-space: nowrap; }
    @media (max-width: 560px) { .step .lbl { display: none; } }
    .connector { flex: 1; height: 2px; background: #e2e8f0; } .connector.on { background: #2563eb; }
    .wiz-body { padding: 8px 24px; display: flex; flex-direction: column; gap: 14px; }
    .fg { display: flex; flex-direction: column; gap: 6px; }
    .fg label { font-size: 12px; font-weight: 700; color: #475569; }
    .fg input, .fg textarea, .fg select { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13.5px; font-family: inherit; color: #1e293b; outline: none; background: #fff; }
    .fg input:focus, .fg textarea:focus, .fg select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .recap { background: rgba(37,99,235,.07); border-radius: 12px; padding: 16px; font-size: 13.5px; color: #1e293b; }
    .recap ul { margin: 8px 0 0; padding-left: 18px; color: #475569; font-size: 12.5px; }
    .wiz-foot { display: flex; align-items: center; gap: 8px; padding: 14px 24px 22px; } .spacer { flex: 1; }
  `]
})
export class PmProjectsComponent implements OnInit {
  managerId = 0;
  projectsList: Project[] = [];
  filteredProjects: Project[] = [];
  loading = true;
  animated = false;

  view: 'cards' | 'list' = 'cards';
  searchTerm = '';
  statusFilter = 'all';
  teamFilter = 'all';
  periodFilter = 'all';

  // Per-project enrichments loaded from teams + overdue tasks.
  teamsByProject: Record<number, string[]> = {};
  membersByProject: Record<number, number> = {};
  lateByProject: Record<number, number> = {};
  teamOptions: string[] = [];

  // Wizard
  showWizard = false;
  step = 1;
  stepLabels = ['Infos', 'Équipe', 'Jalons', 'Confirmation'];
  submitting = false;
  priority = 'normale';
  form: ProjectRequest = { name: '', description: '', startDate: '', endDate: '', status: 'PLANNED' };

  // Wizard — team & milestones
  memberPool: User[] = [];                                   // all collaborators (loaded automatically)
  wizMembers: { id: number; name: string; role: string; selected: boolean }[] = [];
  memberSearch = '';
  roleOptions = ['Membre', 'Lead', 'Développeur', 'Designer', 'QA', 'Analyste'];
  milestones: { name: string; date: string }[] = [];

  constructor(
    private projectService: ProjectService,
    private teamService: TeamService,
    private taskService: TaskService,
    private userService: UserService,
    private calendarService: CalendarService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  get filteredWizMembers() {
    const q = this.memberSearch.trim().toLowerCase();
    return q ? this.wizMembers.filter(m => m.name.toLowerCase().includes(q)) : this.wizMembers;
  }
  get selectedMemberCount(): number { return this.wizMembers.filter(m => m.selected).length; }

  /** Load the pool of collaborators once so the wizard's "Équipe" step is populated automatically. */
  private loadMemberPool(): void {
    this.userService.getUsersByRole('USER', 0, 300).subscribe({
      next: (r: any) => {
        this.memberPool = (r && r.data ? r.data : (Array.isArray(r) ? r : [])) as User[];
        this.cdr.detectChanges();
      },
      error: () => { this.memberPool = []; }
    });
  }

  addMilestone(): void { this.milestones.push({ name: '', date: this.form.endDate || '' }); }
  removeMilestone(i: number): void { this.milestones.splice(i, 1); }

  ngOnInit(): void {
    this.managerId = this.authService.getCurrentUser()?.id || 0;
    this.loadProjects();
    this.loadTeams();
    this.loadOverdue();
    this.loadMemberPool();
    this.route.queryParams.subscribe(p => { if (p['openAddModal'] === 'true') this.openWizard(); });
    setTimeout(() => { this.animated = true; this.cdr.detectChanges(); }, 90);
  }

  /** Map team names + member counts per project, and build the Équipe filter options. */
  private loadTeams(): void {
    this.teamService.getAllTeams().subscribe({
      next: (r: any) => {
        const teams: any[] = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        const byProject: Record<number, string[]> = {};
        const members: Record<number, number> = {};
        const names = new Set<string>();
        teams.forEach(t => {
          if (t.name) names.add(t.name);
          const pid = t.projectId;
          if (pid == null) return;
          (byProject[pid] = byProject[pid] || []).push(t.name);
          members[pid] = (members[pid] || 0) + (Array.isArray(t.members) ? t.members.length : 0);
        });
        this.teamsByProject = byProject;
        this.membersByProject = members;
        this.teamOptions = Array.from(names).sort();
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  /** Count overdue tasks per project so the card can show "· N en retard". */
  private loadOverdue(): void {
    this.taskService.getOverdueTasks().subscribe({
      next: (r: any) => {
        const tasks: Task[] = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        const late: Record<number, number> = {};
        tasks.forEach(t => { if (t.projectId != null) late[t.projectId] = (late[t.projectId] || 0) + 1; });
        this.lateByProject = late;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  teamName(p: Project): string {
    const names = p.id != null ? this.teamsByProject[p.id] : null;
    return names && names.length ? names.join(', ') : 'Aucune équipe';
  }
  memberCount(p: Project): number {
    return (p.id != null ? this.membersByProject[p.id] : 0) || 0;
  }
  late(p: Project): number {
    return (p.id != null ? this.lateByProject[p.id] : 0) || 0;
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjectsByManager(this.managerId, 0, 50).subscribe({
      next: (r: any) => {
        this.projectsList = r && r.data ? r.data : (Array.isArray(r) ? r : []);
        this.applyFilters(); this.loading = false; this.cdr.detectChanges();
      },
      error: () => {
        this.projectService.getAllProjects(0, 50).subscribe({
          next: (r: any) => { this.projectsList = r && r.data ? r.data : []; this.applyFilters(); this.loading = false; this.cdr.detectChanges(); },
          error: () => { this.projectsList = []; this.applyFilters(); this.loading = false; this.cdr.detectChanges(); }
        });
      }
    });
  }

  applyFilters(): void {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let result = [...this.projectsList];

    if (this.searchTerm.trim()) {
      const t = this.searchTerm.toLowerCase().trim();
      result = result.filter(p => p.name.toLowerCase().includes(t) || (p.description || '').toLowerCase().includes(t));
    }

    if (this.statusFilter !== 'all') {
      result = result.filter(p => {
        const s = (p.status || '').toUpperCase();
        const overdue = p.endDate ? new Date(p.endDate) < today && s !== 'COMPLETED' : false;
        switch (this.statusFilter) {
          case 'en-cours': return s === 'IN_PROGRESS' || s === 'ACTIVE';
          case 'termine': return s === 'COMPLETED';
          case 'en-pause': return s === 'ON_HOLD';
          case 'en-retard': return overdue;
          default: return true;
        }
      });
    }

    if (this.teamFilter !== 'all') {
      result = result.filter(p => (p.id != null ? (this.teamsByProject[p.id] || []) : []).includes(this.teamFilter));
    }

    if (this.periodFilter !== 'all') {
      result = result.filter(p => {
        if (!p.endDate) return false;
        const d = new Date(p.endDate);
        if (this.periodFilter === 'month') return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        if (this.periodFilter === 'quarter') return Math.floor(d.getMonth() / 3) === Math.floor(today.getMonth() / 3) && d.getFullYear() === today.getFullYear();
        return true;
      });
    }

    this.filteredProjects = result;
  }

  statusInfo(p: Project): { label: string; cls: string } {
    const s = (p.status || '').toUpperCase();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (s !== 'COMPLETED' && p.endDate && new Date(p.endDate) < today) return { label: 'En retard', cls: 'st-red' };
    const map: Record<string, { label: string; cls: string }> = {
      IN_PROGRESS: { label: 'En cours', cls: 'st-blue' },
      ACTIVE: { label: 'En cours', cls: 'st-blue' },
      COMPLETED: { label: 'Terminé', cls: 'st-green' },
      ON_HOLD: { label: 'En pause', cls: 'st-amber' },
      PLANNED: { label: 'Planifié', cls: 'st-slate' },
      CANCELLED: { label: 'Annulé', cls: 'st-red' }
    };
    return map[s] || { label: 'Planifié', cls: 'st-slate' };
  }

  openWizard(): void {
    this.step = 1;
    this.priority = 'normale';
    this.form = { name: '', description: '', startDate: '', endDate: '', status: 'PLANNED', managerId: this.managerId };
    // Build the member checklist from the auto-loaded pool, and reset milestones.
    this.memberSearch = '';
    this.wizMembers = this.memberPool.map(u => ({
      id: u.id!, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username, role: 'Membre', selected: false
    }));
    this.milestones = [];
    if (!this.memberPool.length) this.loadMemberPool();
    this.showWizard = true;
  }
  closeWizard(): void { this.showWizard = false; }

  nextStep(): void {
    if (this.step === 1 && !this.form.name?.trim()) { this.toast.show('Le nom du projet est requis.', 'error'); return; }
    if (this.step < 4) this.step++;
  }

  submitProject(): void {
    if (!this.form.name?.trim()) { this.step = 1; this.toast.show('Le nom du projet est requis.', 'error'); return; }
    this.submitting = true;
    this.form.managerId = this.managerId;
    this.projectService.createProject(this.form).subscribe({
      next: (res: any) => {
        const created = res?.data ?? res;
        const projectId = created?.id;
        this.submitting = false; this.showWizard = false;
        this.toast.show(`Projet « ${created?.name || this.form.name} » créé.`, 'success');
        if (projectId) {
          this.createTeamAndMilestones(projectId, created?.name || this.form.name);
        }
        this.loadProjects();
      },
      error: (err: any) => {
        this.submitting = false;
        this.toast.show(err?.error?.message || 'Échec de la création du projet.', 'error');
      }
    });
  }

  /** After the project is created, persist the chosen team members + milestone events. */
  private createTeamAndMilestones(projectId: number, projectName: string): void {
    const chosen = this.wizMembers.filter(m => m.selected);
    if (chosen.length) {
      this.teamService.createTeam({ name: `Équipe ${projectName}`, projectId, description: 'Équipe du projet' }).subscribe({
        next: (t: any) => {
          const teamId = (t?.data ?? t)?.id;
          if (teamId) chosen.forEach(m => this.teamService.addMemberToTeam(teamId, m.id).subscribe({ error: () => {} }));
          this.loadTeams();
        },
        error: () => {}
      });
    }
    // Milestones → calendar events distributed to the project members (same flow as PM events).
    this.milestones.filter(ms => ms.name.trim() && ms.date).forEach(ms => {
      const start = new Date(ms.date + 'T09:00:00');
      const payload: CalendarEvent = {
        title: `Jalon : ${ms.name.trim()}`,
        description: `Jalon du projet « ${projectName} » #type:milestone #proj:${projectName}`,
        startTime: start.toISOString(),
        endTime: new Date(start.getTime() + 3600000).toISOString(),
        isAllDay: false, userId: this.managerId, projectId, audience: 'PROJECT'
      };
      this.calendarService.createEvent(payload).subscribe({ error: () => {} });
    });
  }
}
