import { Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';

interface NavItem { label: string; route: string; }

/**
 * Global search / command palette. Open with Ctrl/Cmd-K from anywhere; search projects, tasks and
 * (for admins) people, plus jump to the main pages. Results are filtered client-side from a single
 * fetch per open. Rendered once in the app shell so it's available in every layout.
 */
@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="cp-backdrop" *ngIf="open" (click)="close()">
    <div class="cp" (click)="$event.stopPropagation()">
      <div class="cp-input">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input #cpInput [(ngModel)]="query" (ngModelChange)="onQuery()"
               [placeholder]="'search.placeholder' | translate" autocomplete="off" />
        <kbd>esc</kbd>
      </div>

      <div class="cp-results">
        <ng-container *ngIf="query.trim(); else quicknav">
          <div class="cp-group" *ngIf="projects.length">
            <div class="cp-group-title">{{ 'search.projects' | translate }}</div>
            <button class="cp-item" *ngFor="let p of projects" (click)="goProject(p)">
              <span class="cp-ic pr"></span><span class="cp-label">{{ p.name }}</span>
            </button>
          </div>
          <div class="cp-group" *ngIf="tasks.length">
            <div class="cp-group-title">{{ 'search.tasks' | translate }}</div>
            <button class="cp-item" *ngFor="let t of tasks" (click)="goTask(t)">
              <span class="cp-ic tk"></span><span class="cp-label">{{ t.name }}</span><span class="cp-sub">{{ t.projectName }}</span>
            </button>
          </div>
          <div class="cp-group" *ngIf="people.length">
            <div class="cp-group-title">{{ 'search.people' | translate }}</div>
            <button class="cp-item" *ngFor="let u of people" (click)="goPeople()">
              <span class="cp-ic pe"></span><span class="cp-label">{{ u.firstName }} {{ u.lastName }}</span><span class="cp-sub">{{ u.email }}</span>
            </button>
          </div>
          <div class="cp-empty" *ngIf="!projects.length && !tasks.length && !people.length">
            {{ 'search.noResults' | translate }}
          </div>
        </ng-container>

        <ng-template #quicknav>
          <div class="cp-group">
            <div class="cp-group-title">{{ 'search.goTo' | translate }}</div>
            <button class="cp-item" *ngFor="let n of nav" (click)="goPage(n.route)">
              <span class="cp-ic nv"></span><span class="cp-label">{{ n.label | translate }}</span>
            </button>
          </div>
        </ng-template>
      </div>
      <div class="cp-foot"><kbd>Ctrl</kbd>+<kbd>K</kbd> {{ 'search.hint' | translate }}</div>
    </div>
  </div>
  `,
  styles: [`
    .cp-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.45); backdrop-filter: blur(3px); z-index: 4000; display: flex; align-items: flex-start; justify-content: center; padding-top: 12vh; }
    .cp { width: 100%; max-width: 560px; background: var(--bg-card); border-radius: 14px; box-shadow: 0 24px 60px rgba(15,23,42,.35); overflow: hidden; display: flex; flex-direction: column; max-height: 70vh; }
    .cp-input { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
    .cp-input svg { width: 18px; height: 18px; color: var(--text-muted); flex: 0 0 auto; }
    .cp-input input { flex: 1; border: none; outline: none; font-size: 16px; color: var(--text-primary); background: none; }
    .cp-input kbd, .cp-foot kbd { font-size: 10px; font-weight: 700; color: var(--text-muted); background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 5px; padding: 2px 6px; }
    .cp-results { overflow-y: auto; padding: 8px; }
    .cp-group { margin-bottom: 6px; }
    .cp-group-title { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted); padding: 6px 10px; }
    .cp-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 10px; border: none; background: none; border-radius: 9px; cursor: pointer; text-align: left; font-family: inherit; }
    .cp-item:hover { background: var(--bg-subtle); }
    .cp-ic { width: 9px; height: 9px; border-radius: 3px; flex: 0 0 auto; }
    .cp-ic.pr { background: #2563eb; } .cp-ic.tk { background: #16a34a; } .cp-ic.pe { background: #a855f7; } .cp-ic.nv { background: #94a3b8; }
    .cp-label { font-size: 14px; font-weight: 600; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cp-sub { font-size: 12px; color: var(--text-muted); flex: 0 0 auto; }
    .cp-empty { padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; }
    .cp-foot { border-top: 1px solid var(--border); padding: 8px 14px; font-size: 11px; color: var(--text-muted); }
  `]
})
export class CommandPaletteComponent {
  open = false;
  query = '';
  projects: any[] = [];
  tasks: any[] = [];
  people: any[] = [];
  nav: NavItem[] = [];

  private base = '/user';
  private isAdmin = false;
  private allProjects: any[] = [];
  private allTasks: any[] = [];
  private allPeople: any[] = [];
  private loaded = false;
  private debounce: any;

  constructor(private router: Router, private projectSvc: ProjectService,
              private taskSvc: TaskService, private userSvc: UserService, private cdr: ChangeDetectorRef) {
    const roles = (localStorage.getItem('user_roles') || '').toUpperCase();
    if (roles.includes('ADMIN')) { this.base = '/admin'; this.isAdmin = true; }
    else if (roles.includes('PROJECT_MANAGER')) { this.base = '/pm'; }
    this.nav = this.base === '/admin'
      ? [{ label: 'nav.dashboard', route: '/admin/dashboard' }, { label: 'nav.projects', route: '/admin/projects' }, { label: 'nav.tasks', route: '/admin/tasks' }, { label: 'nav.users', route: '/admin/users' }, { label: 'nav.settings', route: '/admin/settings' }]
      : this.base === '/pm'
        ? [{ label: 'nav.dashboard', route: '/pm/dashboard' }, { label: 'nav.myProjects', route: '/pm/projects' }, { label: 'nav.tasks', route: '/pm/tasks' }, { label: 'nav.teams', route: '/pm/teams' }, { label: 'nav.calendar', route: '/pm/calendar' }]
        : [{ label: 'nav.dashboard', route: '/user/dashboard' }, { label: 'nav.myTasks', route: '/user/my-tasks' }, { label: 'nav.calendar', route: '/user/calendar' }, { label: 'nav.messages', route: '/user/messages' }];
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); this.toggle(); }
    else if (e.key === 'Escape' && this.open) this.close();
  }

  private toggle(): void { this.open ? this.close() : this.openPalette(); }

  private openPalette(): void {
    if (!localStorage.getItem('jwt_token')) return; // only when signed in
    this.open = true; this.query = ''; this.projects = []; this.tasks = []; this.people = [];
    this.loadOnce();
    setTimeout(() => (document.querySelector('.cp-input input') as HTMLInputElement)?.focus(), 30);
  }

  close(): void { this.open = false; this.cdr.detectChanges(); }

  private loadOnce(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.projectSvc.getAllProjects(0, 300).subscribe({ next: (r: any) => { this.allProjects = r?.data || r?.content || (Array.isArray(r) ? r : []); }, error: () => {} });
    this.taskSvc.getAllTasks(0, 500).subscribe({ next: (r: any) => { this.allTasks = r?.data || r?.content || (Array.isArray(r) ? r : []); }, error: () => {} });
    if (this.isAdmin) this.userSvc.getAllUsers(0, 500).subscribe({ next: (r: any) => { this.allPeople = r?.data || r?.content || (Array.isArray(r) ? r : []); }, error: () => {} });
  }

  onQuery(): void {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.filter(), 150);
  }

  private filter(): void {
    const q = this.query.trim().toLowerCase();
    if (!q) { this.projects = []; this.tasks = []; this.people = []; this.cdr.detectChanges(); return; }
    this.projects = this.allProjects.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 6);
    this.tasks = this.allTasks.filter(t => (t.name || '').toLowerCase().includes(q)).slice(0, 6);
    this.people = this.allPeople.filter(u => (`${u.firstName} ${u.lastName} ${u.email}`).toLowerCase().includes(q)).slice(0, 6);
    this.cdr.detectChanges();
  }

  goProject(p: any): void { this.close(); this.router.navigate([this.base + '/projects', p.id]); }
  goTask(t: any): void { this.close(); if (t.projectId) this.router.navigate([this.base + '/projects', t.projectId]); else this.router.navigate([this.base + '/tasks']); }
  goPeople(): void { this.close(); if (this.isAdmin) this.router.navigate(['/admin/users']); }
  goPage(route: string): void { this.close(); this.router.navigate([route]); }
}
