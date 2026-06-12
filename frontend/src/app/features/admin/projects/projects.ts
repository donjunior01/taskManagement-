import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';
import { Router } from '@angular/router';
import { ProjectService, Project, ProjectRequest } from '../../../core/services/project.service';
import { UserService, User } from '../../../core/services/user.service';
import { TeamService, Team } from '../../../core/services/team.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, AiDescribeButtonComponent],
  templateUrl: './projects.html',
  styleUrls: ['./projects.scss']
})
export class AdminProjectsComponent implements OnInit {
  projectsList: Project[] = [];
  filteredProjects: Project[] = [];
  projectManagers: User[] = [];
  loading: boolean = true;

  // Pagination State
  totalElements: number = 0;
  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 9;
  sortBy: string = 'id';
  sortDir: string = 'asc';

  // Filters State
  searchTerm: string = '';
  statusFilter: string = ''; // '', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'
  managerFilter: string = ''; // project manager full name
  teamFilter: string = '';    // team name
  periodFilter: string = '';  // '', 'month', 'quarter', 'year'

  // Modals Visibility
  showAddModal: boolean = false;

  // View state (prototype defaults to list)
  viewMode: 'grid' | 'list' = 'list';

  // Form states
  submitting: boolean = false;

  // Add Project Form (matches ProjectRequest DTO)
  addForm: ProjectRequest = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'IN_PROGRESS',
    managerId: undefined
  };

  // projectId → team names formed for that project
  teamsByProject = new Map<number, string[]>();

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private teamService: TeamService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadProjectManagers();
    this.loadTeams();
  }

  /** Loads all teams and groups their names by project. */
  loadTeams(): void {
    this.teamService.getAllTeams().subscribe({
      next: (list: any) => {
        const raw: Team[] = Array.isArray(list) ? list : (list?.data ?? []);
        const m = new Map<number, string[]>();
        raw.forEach(t => {
          if (t.projectId == null || !t.name) return;
          const arr = m.get(t.projectId) || [];
          arr.push(t.name);
          m.set(t.projectId, arr);
        });
        this.teamsByProject = m;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  /** Distinct project-manager names available for the filter dropdown. */
  get managerOptions(): string[] {
    return Array.from(new Set(this.projectsList.map(p => p.managerName).filter(Boolean) as string[])).sort();
  }

  /** Distinct team names (across all projects) for the filter dropdown. */
  get teamOptions(): string[] {
    const names = new Set<string>();
    this.teamsByProject.forEach(arr => arr.forEach(n => names.add(n)));
    return Array.from(names).sort();
  }

  /** Team name(s) formed for a project (e.g. "Équipe Web, Équipe Data"). */
  teamNames(p: Project): string {
    const names = p.id != null ? this.teamsByProject.get(p.id) : undefined;
    if (names && names.length) return names.join(', ');
    return p.teamCount ? `${p.teamCount} équipe(s)` : 'Aucune équipe';
  }

  /** Completed tasks = progress% of total, with total from taskCount. */
  completedTasks(p: Project): number {
    return Math.round(((p.progress || 0) / 100) * (p.taskCount || 0));
  }
  tasksLabel(p: Project): string {
    return `${this.completedTasks(p)} / ${p.taskCount || 0}`;
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getAllProjects(this.currentPage, this.pageSize, this.sortBy, this.sortDir).subscribe({
      next: (response: any) => {
        try {
          this.projectsList = response && response.data ? response.data : [];
          this.totalElements = response ? response.totalElements : 0;
          this.totalPages = response ? response.totalPages : 0;
          this.applyClientFilters();
        } catch (e) {
          this.projectsList = [];
          this.applyClientFilters();
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.projectsList = [];
        this.applyClientFilters();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProjectManagers(): void {
    this.userService.getAllUsers(0, 100).subscribe({
      next: (response) => {
        this.projectManagers = response.data.filter(u => u.role === 'PROJECT_MANAGER' || u.userType === 'PROJECT_MANAGER');
      },
      error: () => {
        this.projectManagers = [];
      }
    });
  }

  applyClientFilters(): void {
    let result = [...this.projectsList];

    // Search query filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.managerName && p.managerName.toLowerCase().includes(term))
      );
    }

    // Status filter — compare on the canonical key so it matches the displayed badge
    // (e.g. ACTIVE/CANCELLED/unknown all render as "Planifié").
    if (this.statusFilter) {
      result = result.filter(p => this.statusKey(p.status) === this.statusFilter);
    }

    // Project-manager filter (by displayed name)
    if (this.managerFilter) {
      result = result.filter(p => p.managerName === this.managerFilter);
    }

    // Team filter — keep projects that include the chosen team
    if (this.teamFilter) {
      result = result.filter(p => p.id != null && (this.teamsByProject.get(p.id) || []).includes(this.teamFilter));
    }

    // Period filter — keep projects whose start/end window overlaps the selected calendar window
    if (this.periodFilter) {
      const w = this.periodWindow(this.periodFilter);
      if (w) {
        result = result.filter(p => {
          const start = p.startDate ? new Date(p.startDate).getTime() : NaN;
          const end = p.endDate ? new Date(p.endDate).getTime() : NaN;
          if (isNaN(start) && isNaN(end)) return false;
          const s = isNaN(start) ? end : start;
          const e = isNaN(end) ? start : end;
          return s <= w.end && e >= w.start; // overlap test
        });
      }
    }

    this.filteredProjects = result;
  }

  /** Calendar window for the period filter, relative to today. */
  private periodWindow(period: string): { start: number; end: number } | null {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    if (period === 'month') {
      return { start: new Date(y, m, 1).getTime(), end: new Date(y, m + 1, 0, 23, 59, 59).getTime() };
    }
    if (period === 'quarter') {
      const q = Math.floor(m / 3) * 3;
      return { start: new Date(y, q, 1).getTime(), end: new Date(y, q + 3, 0, 23, 59, 59).getTime() };
    }
    if (period === 'year') {
      return { start: new Date(y, 0, 1).getTime(), end: new Date(y, 11, 31, 23, 59, 59).getTime() };
    }
    return null;
  }

  onFilterChange(): void {
    this.applyClientFilters();
  }

  // Pagination Actions
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadProjects();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadProjects();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadProjects();
    }
  }

  // Navigate to project detail page
  openProjectDetail(project: Project): void {
    if (project.id) {
      this.router.navigate(['/admin/projects', project.id]);
    }
  }

  // ── Prototype display helpers ────────────────────────────────────────────────
  // French status label, mirroring the prototype's badge text
  statusLabel(status?: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED':   return 'Terminé';
      case 'ON_HOLD':     return 'En pause';
      case 'PLANNED':     return 'Planifié';
      default:            return 'Planifié';
    }
  }

  /** Canonical status key matching what statusLabel() displays (so filters agree with badges). */
  statusKey(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'IN_PROGRESS': return 'IN_PROGRESS';
      case 'COMPLETED':   return 'COMPLETED';
      case 'ON_HOLD':     return 'ON_HOLD';
      default:            return 'PLANNED'; // PLANNED, ACTIVE, CANCELLED, null → "Planifié"
    }
  }

  // PM initials (max 2) for the avatar chip, like the prototype's split-and-slice
  pmInitials(name?: string): string {
    if (!name) return '—';
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  // Graceful actions for prototype row buttons that lack a dedicated backend flow
  changeManager(project: Project, event: MouseEvent): void {
    event.stopPropagation();
    this.openProjectDetail(project);
  }

  archiveProject(project: Project, event: MouseEvent): void {
    event.stopPropagation();
    if (!project.id) return;
    this.projectService.archiveProject(project.id).subscribe({
      next: () => {
        // Drop it from the current view immediately; it's now excluded from the backend lists.
        this.projectsList = this.projectsList.filter(p => p.id !== project.id);
        this.applyClientFilters();
        this.triggerToast(`Projet "${project.name}" archivé.`, 'success');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.triggerToast(err?.error?.message || `Échec de l'archivage du projet "${project.name}".`, 'error');
      }
    });
  }

  // Add Modal
  openAddModal(): void {
    this.resetAddForm();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  // DTO Submissions
  submitAddProject(): void {
    if (!this.addForm.name || !this.addForm.startDate || !this.addForm.endDate) {
      this.triggerToast('Veuillez renseigner tous les champs obligatoires de l\'espace de travail.', 'error');
      return;
    }

    this.submitting = true;
    
    // Ensure managerId is integer
    if (this.addForm.managerId) {
      this.addForm.managerId = Number(this.addForm.managerId);
    }

    this.projectService.createProject(this.addForm).subscribe({
      next: (newProj) => {
        this.submitting = false;
        this.showAddModal = false;
        this.triggerToast(`Projet "${newProj.name}" lancé avec succès !`, 'success');
        this.loadProjects();
      },
      error: (err) => {
        this.submitting = false;
        this.triggerToast(err?.error?.message || 'Échec du lancement du projet.', 'error');
      }
    });
  }


  private resetAddForm(): void {
    this.addForm = {
      name: '',
      description: '',
      managerId: undefined,
      startDate: '',
      endDate: '',
      status: 'PLANNED'
    };
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }
}
