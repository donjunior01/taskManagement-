import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService, Team } from '../../../core/services/team.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';

interface MemberVital {
  id?: number;
  name: string;
  role: string;
  roleLabelKey: string;
  teams: string[];
  active: number;
  completed: number;
  hours: number;
  load: 'dispo' | 'occupe' | 'surcharge';
  online: boolean;
}

@Component({
  selector: 'app-pm-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, AiDescribeButtonComponent, TranslatePipe],
  template: `
  <div class="tm-wrap">

    <!-- ═══ Toolbar ═══ -->
    <div class="toolbar">
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" [placeholder]="'pm.teams.searchPlaceholder' | translate" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" />
      </div>
      <select class="sel" [(ngModel)]="roleFilter" (change)="applyFilters()">
        <option value="">{{ 'pm.teams.allRoles' | translate }}</option>
        <option value="USER">{{ 'pm.teams.roleCollaborator' | translate }}</option>
        <option value="PROJECT_MANAGER">{{ 'pm.teams.roleManager' | translate }}</option>
      </select>
      <select class="sel" [(ngModel)]="projectFilter" (change)="applyFilters()">
        <option value="">{{ 'pm.teams.allProjects' | translate }}</option>
        <option *ngFor="let p of projectsList" [value]="p.id">{{ p.name }}</option>
      </select>
      <select class="sel" [(ngModel)]="availFilter" (change)="applyFilters()">
        <option value="">{{ 'pm.teams.allAvailability' | translate }}</option>
        <option value="dispo">{{ 'pm.teams.availAvailable' | translate }}</option><option value="occupe">{{ 'pm.teams.availBusy' | translate }}</option><option value="surcharge">{{ 'pm.teams.availOverloaded' | translate }}</option>
      </select>
      <button class="btn-primary tb-add" (click)="openCreateTeam()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> {{ 'pm.teams.buildTeam' | translate }}
      </button>
    </div>

    <!-- ═══ Main grid ═══ -->
    <div class="main-grid">
      <!-- Member cards -->
      <div class="cards-col">
        <div class="m-card anim" *ngFor="let m of filtered; let i = index" [style.--d]="(i*0.04)+'s'">
          <div class="mc-top">
            <div class="avatar-wrap">
              <span class="avatar" [style.background]="avatarColor(m.name)">{{ initials(m.name) }}</span>
              <span class="online-dot" [class.on]="m.online"></span>
            </div>
            <div class="mc-id">
              <div class="mc-head">
                <div>
                  <div class="mc-name">{{ m.name }}</div>
                  <div class="mc-role">{{ m.roleLabelKey | translate }}</div>
                </div>
                <span class="role-badge">{{ m.roleLabelKey | translate }}</span>
              </div>
              <div class="team-chips">
                <span class="chip" *ngFor="let t of m.teams.slice(0,3)">{{ t }}</span>
                <span class="chip more" *ngIf="m.teams.length > 3">+{{ m.teams.length - 3 }}</span>
                <span class="chip empty" *ngIf="m.teams.length === 0">{{ 'pm.teams.noTeam' | translate }}</span>
              </div>
            </div>
          </div>

          <div class="mc-stats">
            <div><span class="num">{{ m.active }}</span> {{ 'pm.teams.activeTasks' | translate }}</div>
            <div><span class="num">{{ m.hours }}h</span> {{ 'pm.teams.loggedHours' | translate }}</div>
          </div>

          <div class="mc-charge">
            <div class="charge-row"><span class="lbl">{{ 'pm.teams.chargeLabel' | translate }}</span><span class="val" [ngClass]="loadInfo(m.load).text">{{ loadInfo(m.load).labelKey | translate }}</span></div>
            <div class="charge-bar"><div class="charge-fill" [ngClass]="loadInfo(m.load).bg" [style.width.%]="animated ? chargePct(m) : 0"></div></div>
          </div>

          <button class="btn-outline full" (click)="openAllocation(m)">{{ 'pm.teams.assignToProject' | translate }}</button>
        </div>
        <div class="empty-card" *ngIf="!loading && filtered.length === 0">{{ 'pm.teams.noMembers' | translate }}</div>
      </div>

      <!-- Vue d'ensemble (chart) -->
      <div class="overview anim" style="--d:.1s">
        <div class="ov-head">
          <h3>{{ 'pm.teams.overview' | translate }}</h3>
          <span class="muted-sm">{{ 'pm.teams.loadPerMember' | translate }}</span>
        </div>
        <div class="chart">
          <div class="ch-row" *ngFor="let m of chartData; let i = index" (mouseenter)="hoverIdx = i" (mouseleave)="hoverIdx = -1">
            <span class="ch-name" [title]="m.name">{{ firstName(m.name) }}</span>
            <div class="ch-track">
              <div class="ch-bar" [ngClass]="loadInfo(m.load).bg" [style.width.%]="animated ? barPct(m) : 0"></div>
              <span class="ch-val">{{ m.active }}</span>
            </div>
            <div class="ch-tip" [class.below]="i < chartData.length / 2" *ngIf="hoverIdx === i">
              <div class="tt-name">{{ m.name }}</div>
              <div class="tt-row"><i class="sw" [ngClass]="loadInfo(m.load).bg"></i>{{ 'pm.teams.tipActiveTasks' | translate }}<b>{{ m.active }}</b></div>
              <div class="tt-row"><i class="sw blue"></i>{{ 'pm.teams.tipCompleted' | translate }}<b>{{ m.completed }}</b></div>
              <div class="tt-row"><i class="sw slate"></i>{{ 'pm.teams.tipHours' | translate }}<b>{{ m.hours }}h</b></div>
              <div class="tt-row"><i class="sw" [ngClass]="loadInfo(m.load).bg"></i>{{ 'pm.teams.tipStatus' | translate }}<b>{{ loadInfo(m.load).labelKey | translate }}</b></div>
            </div>
          </div>
          <div class="empty" *ngIf="chartData.length === 0">{{ 'pm.teams.noData' | translate }}</div>
        </div>
        <div class="ov-legend">
          <span class="lg"><i class="sw green"></i> {{ 'pm.teams.legendNormal' | translate }}</span>
          <span class="lg"><i class="sw orange"></i> {{ 'pm.teams.legendNearCapacity' | translate }}</span>
          <span class="lg"><i class="sw red"></i> {{ 'pm.teams.legendOverloaded' | translate }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ Allocation modal ═══ -->
  <div class="modal-backdrop" *ngIf="showAlloc" (click)="showAlloc = false">
    <div class="modal sm" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>{{ 'pm.teams.assignToProject' | translate }}</h3><button class="x" (click)="showAlloc = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body">
        <div class="fg"><label>{{ 'pm.teams.member' | translate }}</label><select [(ngModel)]="allocForm.developerId"><option *ngFor="let m of allMembers" [ngValue]="m.id">{{ m.name }}</option></select></div>
        <div class="fg"><label>{{ 'pm.teams.project' | translate }}</label><select [(ngModel)]="allocForm.projectId"><option *ngFor="let p of projectsList" [ngValue]="p.id">{{ p.name }}</option></select></div>
      </div>
      <div class="m-foot"><button class="btn-ghost" (click)="showAlloc = false">{{ 'pm.teams.cancel' | translate }}</button><button class="btn-primary" (click)="submitAllocation()" [disabled]="submitting">{{ 'pm.teams.assign' | translate }}</button></div>
    </div>
  </div>

  <!-- ═══ Create team modal ═══ -->
  <div class="modal-backdrop" *ngIf="showCreateTeam" (click)="showCreateTeam = false">
    <div class="modal sm" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>{{ 'pm.teams.buildTeamTitle' | translate }}</h3><button class="x" (click)="showCreateTeam = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body">
        <div class="fg"><label>{{ 'pm.teams.teamName' | translate }}</label><input type="text" [(ngModel)]="teamForm.name" [placeholder]="'pm.teams.phTeamName' | translate"></div>
        <div class="fg"><label>{{ 'pm.teams.projectReq' | translate }}</label><select [(ngModel)]="teamForm.projectId"><option [ngValue]="undefined">{{ 'pm.teams.selectPlaceholder' | translate }}</option><option *ngFor="let p of projectsList" [ngValue]="p.id">{{ p.name }}</option></select></div>
        <div class="fg"><label>{{ 'pm.teams.description' | translate }}</label><app-ai-describe [type]="'TEAM'" [title]="teamForm.name" (generated)="teamForm.description = $event"></app-ai-describe><textarea rows="2" [(ngModel)]="teamForm.description"></textarea></div>
      </div>
      <div class="m-foot"><button class="btn-ghost" (click)="showCreateTeam = false">{{ 'pm.teams.cancel' | translate }}</button><button class="btn-primary" (click)="submitCreateTeam()" [disabled]="submitting">{{ 'pm.teams.createTeam' | translate }}</button></div>
    </div>
  </div>
  `,
  styles: [`
    .tm-wrap { display: flex; flex-direction: column; gap: 18px; }
    @keyframes tFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes tWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    .anim { animation: tFade .45s ease both; animation-delay: var(--d, 0s); }
    .reveal { animation: tWipe .9s cubic-bezier(.4,0,.2,1) both; }

    .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .search { position: relative; flex: 1 1 220px; max-width: 360px; }
    .search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #94a3b8; }
    .search input { width: 100%; height: 38px; padding: 0 12px 0 34px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #1e293b; outline: none; background: #fff; }
    .search input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .sel { height: 38px; padding: 0 30px 0 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 12.5px; font-weight: 500; color: #475569; background: #fff; cursor: pointer; outline: none; appearance: none; -webkit-appearance: none; width: 150px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; }
    .tb-add { margin-left: auto; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 15px; border: none; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-primary svg { width: 15px; height: 15px; } .btn-primary:hover { background: #1d4ed8; } .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-ghost { height: 38px; padding: 0 14px; border: none; background: none; border-radius: 10px; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-ghost:hover { background: #f1f5f9; }
    .btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 34px; padding: 0 12px; border: 1px solid #e2e8f0; background: #fff; border-radius: 9px; color: #475569; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; } .btn-outline:hover { background: #f8fafc; } .btn-outline.full { width: 100%; }

    .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
    @media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr; } }
    .cards-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 640px) { .cards-col { grid-template-columns: 1fr; } }

    .m-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 16px; }
    .mc-top { display: flex; align-items: flex-start; gap: 12px; }
    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 14px; font-weight: 700; }
    .online-dot { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; box-shadow: 0 0 0 2px #fff; }
    .online-dot.on { background: #22c55e; }
    .mc-id { min-width: 0; flex: 1; }
    .mc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .mc-name { font-size: 14px; font-weight: 700; color: #1e293b; }
    .mc-role { font-size: 11.5px; color: #64748b; }
    .role-badge { font-size: 10px; font-weight: 600; color: #2563eb; background: rgba(37,99,235,.1); padding: 2px 7px; border-radius: 6px; white-space: nowrap; }
    .team-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .chip { font-size: 10px; font-weight: 600; color: #1e293b; background: #eef2f7; padding: 2px 7px; border-radius: 5px; }
    .chip.more { color: #64748b; } .chip.empty { color: #94a3b8; font-weight: 500; background: transparent; padding-left: 0; }
    .mc-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; font-size: 12px; color: #64748b; }
    .mc-stats .num { font-weight: 700; color: #1e293b; }
    .mc-charge { margin-top: 14px; }
    .charge-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
    .charge-row .lbl { color: #64748b; }
    .charge-row .val { font-weight: 600; }
    .charge-row .val.t-green { color: #16a34a; } .charge-row .val.t-orange { color: #d97706; } .charge-row .val.t-red { color: #dc2626; }
    .charge-bar { height: 6px; border-radius: 9999px; background: #eef2f7; overflow: hidden; }
    .charge-fill { height: 100%; border-radius: 9999px; transition: width .8s cubic-bezier(.4,0,.2,1); }
    .charge-fill.b-green { background: #22c55e; } .charge-fill.b-orange { background: #f97316; } .charge-fill.b-red { background: #ef4444; }
    .m-card .btn-outline { margin-top: 14px; }
    .empty-card { grid-column: 1 / -1; padding: 36px; text-align: center; color: #94a3b8; font-size: 13px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; }

    /* Overview chart */
    .overview { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 18px; position: sticky; top: 84px; }
    .ov-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .ov-head h3 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0; }
    .muted-sm { font-size: 11.5px; color: #94a3b8; }
    .chart { display: flex; flex-direction: column; gap: 12px; min-height: 120px; }
    .ch-row { position: relative; display: grid; grid-template-columns: 64px 1fr; align-items: center; gap: 10px; padding: 2px 4px; border-radius: 8px; cursor: default; transition: background .15s ease; }
    .ch-row:hover { background: #f8fafc; }
    .ch-name { font-size: 11.5px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ch-track { display: flex; align-items: center; gap: 7px; }
    .ch-bar { height: 14px; border-radius: 0 4px 4px 0; min-width: 2px; transition: width .8s cubic-bezier(.4,0,.2,1); }
    .ch-bar.b-green { background: #22c55e; } .ch-bar.b-orange { background: #f97316; } .ch-bar.b-red { background: #ef4444; }
    .ch-val { font-size: 11px; font-weight: 700; color: #475569; }
    .ch-tip { position: absolute; z-index: 20; right: 4px; bottom: calc(100% + 6px); min-width: 170px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 24px rgba(15,23,42,.16); padding: 9px 11px; pointer-events: none; }
    .ch-tip.below { bottom: auto; top: calc(100% + 6px); }
    .tt-name { font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 5px; }
    .tt-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; line-height: 1.7; }
    .tt-row b { margin-left: auto; color: #1e293b; padding-left: 10px; }
    .tt-row .sw { width: 8px; height: 8px; border-radius: 50%; }
    .ov-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 14px; }
    .ov-legend .lg { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #64748b; }
    .sw { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
    .sw.green, .sw.b-green { background: #22c55e; } .sw.orange, .sw.b-orange { background: #f97316; } .sw.red, .sw.b-red { background: #ef4444; } .sw.blue { background: #2d6be4; } .sw.slate { background: #94a3b8; }
    .empty { padding: 24px; text-align: center; color: #94a3b8; font-size: 12.5px; }

    /* Modals */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 560px; background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); } .modal.sm { max-width: 440px; }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 10px; } .m-head h3 { font-size: 16.5px; font-weight: 700; color: #1e293b; margin: 0; }
    .x { width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; color: #64748b; display: grid; place-items: center; } .x svg { width: 15px; height: 15px; }
    .m-body { padding: 8px 22px; display: flex; flex-direction: column; gap: 13px; }
    .fg { display: flex; flex-direction: column; gap: 6px; } .fg label { font-size: 12px; font-weight: 700; color: #475569; }
    .fg input, .fg textarea, .fg select { width: 100%; padding: 9px 11px; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 13px; font-family: inherit; color: #1e293b; outline: none; background: #fff; }
    .fg input:focus, .fg textarea:focus, .fg select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .m-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 22px 20px; }
  `]
})
export class PmTeamsComponent implements OnInit {
  managerId = 0;
  projectsList: Project[] = [];
  allMembers: MemberVital[] = [];
  filtered: MemberVital[] = [];
  loading = true;
  animated = false;

  searchTerm = '';
  roleFilter = '';
  projectFilter = '';
  availFilter = '';
  hoverIdx = -1;

  private projectIds: number[] = [];
  private projectNameById: Record<number, string> = {};
  private memberProjectIds: Record<number, number[]> = {};

  showAlloc = false;
  showCreateTeam = false;
  submitting = false;
  allocForm: { developerId?: number; projectId?: number } = {};
  teamForm: { name: string; projectId?: number; description: string } = { name: '', projectId: undefined, description: '' };

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private teamService: TeamService,
    private authService: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.managerId = this.authService.getCurrentUser()?.id || 0;
    this.loadData();
  }

  /** Render bars at 0 first, then flip so the width transition (re)plays each load/entry. */
  private triggerAnim(): void {
    this.animated = false;
    this.cdr.detectChanges();
    setTimeout(() => { this.animated = true; this.cdr.detectChanges(); }, 60);
  }

  private loadData(): void {
    this.loading = true;
    this.projectService.getProjectsByManager(this.managerId, 0, 100).subscribe({
      next: (r: any) => { this.projectsList = r && r.data ? r.data : []; this.afterProjects(); },
      error: () => { this.projectsList = []; this.afterProjects(); }
    });
  }

  private afterProjects(): void {
    this.projectIds = this.projectsList.map(p => p.id!).filter(Boolean);
    this.projectNameById = {};
    this.projectsList.forEach(p => { if (p.id != null) this.projectNameById[p.id] = p.name; });

    forkJoinSafe([
      this.userService.getUsersByRole('USER', 0, 200),
      this.taskService.getAllTasks(0, 400),
      this.teamService.getAllTeams()
    ], ([usersR, tasksR, teamsR]: any[]) => {
      const users: User[] = usersR && usersR.data ? usersR.data : [];
      const tasks: Task[] = tasksR && tasksR.data ? tasksR.data : [];
      const teams: any[] = Array.isArray(teamsR) ? teamsR : (teamsR && teamsR.data ? teamsR.data : []);
      this.build(users, tasks, teams);
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  private build(users: User[], tasks: Task[], teams: any[]): void {
    // Team names + team project ids per member.
    const teamsByMember: Record<number, string[]> = {};
    const teamProjectsByMember: Record<number, number[]> = {};
    teams.forEach(t => {
      (t.members || []).forEach((mm: any) => {
        const id = typeof mm === 'number' ? mm : mm?.id;
        if (id == null) return;
        (teamsByMember[id] = teamsByMember[id] || []).push(t.name);
        if (t.projectId != null) (teamProjectsByMember[id] = teamProjectsByMember[id] || []).push(t.projectId);
      });
    });

    this.memberProjectIds = {};
    this.allMembers = users.map(u => {
      const devTasks = tasks.filter(t => t.assignedToId === u.id && (this.projectIds.length === 0 || this.projectIds.includes(t.projectId!)));
      const active = devTasks.filter(t => ['IN_PROGRESS', 'TODO', 'PLANNED', 'ON_HOLD'].includes((t.status || '').toUpperCase())).length;
      const completed = devTasks.filter(t => (t.status || '').toUpperCase() === 'COMPLETED').length;
      const hours = Math.round(devTasks.reduce((s, t) => s + (t.totalHoursLogged || 0), 0));
      const load: MemberVital['load'] = active === 0 ? 'dispo' : active >= 4 ? 'surcharge' : 'occupe';
      // Project membership = projects via tasks AND via team assignment (so "Assigner à un projet" reflects immediately).
      this.memberProjectIds[u.id!] = Array.from(new Set([
        ...devTasks.map(t => t.projectId!),
        ...(teamProjectsByMember[u.id!] || [])
      ].filter(Boolean)));
      return {
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || this.translate.instant('pm.teams.memberFallback'),
        role: (u.role || 'USER').replace('ROLE_', ''),
        roleLabelKey: this.roleLabelKey(u.role),
        teams: teamsByMember[u.id!] || [],
        active, completed, hours, load,
        online: active > 0
      };
    });
    this.applyFilters();
    this.triggerAnim();
  }

  applyFilters(): void {
    let r = [...this.allMembers];
    if (this.searchTerm.trim()) {
      const t = this.searchTerm.toLowerCase().trim();
      r = r.filter(m => m.name.toLowerCase().includes(t));
    }
    if (this.roleFilter) r = r.filter(m => m.role === this.roleFilter);
    if (this.projectFilter) {
      const pid = +this.projectFilter;
      r = r.filter(m => (this.memberProjectIds[m.id!] || []).includes(pid));
    }
    if (this.availFilter) r = r.filter(m => m.load === this.availFilter);
    this.filtered = r;
  }

  get chartData(): MemberVital[] {
    // Members with at least one active task first; cap to keep the chart readable.
    return [...this.filtered].sort((a, b) => b.active - a.active).slice(0, 12);
  }
  private get maxActive(): number { return Math.max(1, ...this.chartData.map(m => m.active)); }
  barPct(m: MemberVital): number { return (m.active / this.maxActive) * 100; }
  chargePct(m: MemberVital): number { return Math.min(100, (m.active / 6) * 100); }

  loadInfo(load: string): { labelKey: string; bg: string; text: string } {
    if (load === 'surcharge') return { labelKey: 'pm.teams.loadOverloaded', bg: 'b-red', text: 't-red' };
    if (load === 'occupe') return { labelKey: 'pm.teams.loadBusy', bg: 'b-orange', text: 't-orange' };
    return { labelKey: 'pm.teams.loadAvailable', bg: 'b-green', text: 't-green' };
  }
  private roleLabelKey(role?: string): string {
    const r = (role || '').replace('ROLE_', '').toUpperCase();
    return r === 'PROJECT_MANAGER' ? 'pm.teams.roleManagerLabel' : r === 'ADMIN' ? 'pm.teams.roleAdmin' : 'pm.teams.roleCollaboratorLabel';
  }
  firstName(name: string): string { return (name || '').split(' ')[0]; }
  initials(name?: string): string {
    if (!name) return 'U';
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || 'U';
  }
  avatarColor(name?: string): string {
    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
    const n = name || '?'; let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  // ─── Allocation ───
  openAllocation(m: MemberVital): void {
    this.allocForm = { developerId: m.id, projectId: this.projectsList[0]?.id };
    this.showAlloc = true;
  }
  submitAllocation(): void {
    if (!this.allocForm.developerId || !this.allocForm.projectId) { this.toast.show(this.translate.instant('pm.teams.toastSelectMemberProject'), 'error'); return; }
    const devId = +this.allocForm.developerId, projId = +this.allocForm.projectId;
    this.submitting = true;
    this.teamService.getTeamsByProject(projId).subscribe({
      next: (r: any) => {
        const teams: Team[] = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        if (teams.length > 0 && teams[0].id) {
          this.teamService.addMemberToTeam(teams[0].id, devId).subscribe({ next: () => this.afterAlloc(projId), error: () => this.afterAlloc(projId) });
        } else {
          this.teamService.createTeam({ name: this.translate.instant('pm.teams.teamProjectName'), projectId: projId }).subscribe({
            next: (team: Team) => this.teamService.addMemberToTeam(team.id!, devId).subscribe({ next: () => this.afterAlloc(projId), error: () => this.afterAlloc(projId) }),
            error: () => this.afterAlloc(projId)
          });
        }
      },
      error: () => this.afterAlloc(projId)
    });
  }
  private afterAlloc(projId: number): void {
    this.submitting = false; this.showAlloc = false;
    this.toast.show(this.translate.instant('pm.teams.toastMemberAssigned', { project: this.projectNameById[projId] || this.translate.instant('pm.teams.projectFallback') }), 'success');
    this.loadData();
  }

  // ─── Create team ───
  openCreateTeam(): void {
    this.teamForm = { name: '', projectId: this.projectsList[0]?.id, description: '' };
    this.showCreateTeam = true;
  }
  submitCreateTeam(): void {
    if (!this.teamForm.name?.trim() || !this.teamForm.projectId) { this.toast.show(this.translate.instant('pm.teams.toastTeamNameRequired'), 'error'); return; }
    this.submitting = true;
    this.teamService.createTeam({ name: this.teamForm.name, projectId: this.teamForm.projectId, description: this.teamForm.description }).subscribe({
      next: () => { this.submitting = false; this.showCreateTeam = false; this.toast.show(this.translate.instant('pm.teams.toastTeamCreated', { name: this.teamForm.name }), 'success'); this.loadData(); },
      error: () => { this.submitting = false; this.showCreateTeam = false; this.toast.show(this.translate.instant('pm.teams.toastTeamCreatedLocal'), 'success'); }
    });
  }
}

/** Run several observables and invoke cb once all complete (errors → null result). */
function forkJoinSafe(obs: any[], cb: (results: any[]) => void): void {
  const results: any[] = new Array(obs.length).fill(null);
  let done = 0;
  obs.forEach((o, i) => o.subscribe({
    next: (v: any) => { results[i] = v; },
    error: () => { if (++done === obs.length) cb(results); },
    complete: () => { if (++done === obs.length) cb(results); }
  }));
}
