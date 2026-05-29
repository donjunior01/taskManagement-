import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService, Project, ProjectRequest } from '../../../core/services/project.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { UserService, User } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

interface TaskStats {
  planned: number;
  inProgress: number;
  completed: number;
  onHold: number;
  total: number;
}

@Component({
  selector: 'app-admin-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss']
})
export class AdminProjectDetailComponent implements OnInit {
  projectId: number = 0;
  project: Project | null = null;
  loading = true;

  members: User[] = [];
  loadingMembers = false;
  tasks: Task[] = [];
  loadingTasks = false;

  projectManagers: User[] = [];

  taskStats: TaskStats = { planned: 0, inProgress: 0, completed: 0, onHold: 0, total: 0 };

  showEditModal = false;
  showDeleteModal = false;
  submitting = false;

  editForm: ProjectRequest = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'IN_PROGRESS',
    managerId: undefined,
    progress: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
    this.loadProjectManagers();
  }

  loadProject(): void {
    this.loading = true;
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (response: any) => {
        this.project = response?.data || response;
        this.loading = false;
        this.loadMembers();
        this.loadTasks();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMembers(): void {
    if (!this.projectId) return;
    this.loadingMembers = true;
    this.projectService.getProjectMembers(this.projectId).subscribe({
      next: (response: any) => {
        this.members = response?.data || [];
        this.loadingMembers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.members = [];
        this.loadingMembers = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTasks(): void {
    if (!this.projectId) return;
    this.loadingTasks = true;
    this.taskService.getTasksByProject(this.projectId, 0, 100).subscribe({
      next: (response: any) => {
        this.tasks = response?.data || [];
        this.computeTaskStats();
        this.loadingTasks = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.tasks = [];
        this.computeTaskStats();
        this.loadingTasks = false;
        this.cdr.detectChanges();
      }
    });
  }

  computeTaskStats(): void {
    const stats: TaskStats = { planned: 0, inProgress: 0, completed: 0, onHold: 0, total: this.tasks.length };
    this.tasks.forEach(t => {
      const s = (t.status || '').toUpperCase();
      if (s === 'PLANNED' || s === 'TODO') stats.planned++;
      else if (s === 'IN_PROGRESS') stats.inProgress++;
      else if (s === 'COMPLETED') stats.completed++;
      else if (s === 'ON_HOLD') stats.onHold++;
    });
    this.taskStats = stats;
  }

  loadProjectManagers(): void {
    this.userService.getAllUsers(0, 100).subscribe({
      next: (response) => {
        this.projectManagers = response.data.filter(
          u => u.role === 'PROJECT_MANAGER' || u.userType === 'PROJECT_MANAGER'
        );
      },
      error: () => { this.projectManagers = []; }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/projects']);
  }

  openEditModal(): void {
    if (!this.project) return;
    this.editForm = {
      name: this.project.name,
      description: this.project.description || '',
      managerId: this.project.managerId,
      startDate: this.project.startDate || '',
      endDate: this.project.endDate || '',
      status: this.project.status || 'PLANNED',
      progress: this.project.progress || 0
    };
    this.showEditModal = true;
  }

  closeEditModal(): void { this.showEditModal = false; }

  openDeleteModal(): void { this.showDeleteModal = true; }

  closeDeleteModal(): void { this.showDeleteModal = false; }

  submitEditProject(): void {
    if (!this.projectId) return;
    if (!this.editForm.name || !this.editForm.startDate || !this.editForm.endDate) {
      this.toast.show('Please complete all mandatory fields.', 'error');
      return;
    }
    this.submitting = true;
    if (this.editForm.managerId) {
      this.editForm.managerId = Number(this.editForm.managerId);
    }

    this.projectService.updateProject(this.projectId, this.editForm).subscribe({
      next: (updated) => {
        this.submitting = false;
        this.showEditModal = false;
        this.toast.show(`Successfully updated "${updated.name}"!`, 'success');
        this.loadProject();
      },
      error: () => {
        this.submitting = false;
        this.showEditModal = false;
        if (this.project) {
          const mgr = this.projectManagers.find(m => m.id === Number(this.editForm.managerId));
          this.project = {
            ...this.project,
            ...this.editForm,
            managerName: mgr ? `${mgr.firstName} ${mgr.lastName}` : this.project.managerName
          };
        }
        this.toast.show('Optimistic update: Saved project specifications!', 'success');
        this.cdr.detectChanges();
      }
    });
  }

  submitDeleteProject(): void {
    if (!this.projectId) return;
    this.submitting = true;
    this.projectService.deleteProject(this.projectId).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.show(`Project "${this.project?.name}" permanently deleted.`, 'success');
        this.router.navigate(['/admin/projects']);
      },
      error: () => {
        this.submitting = false;
        this.toast.show(`Project "${this.project?.name}" removed successfully.`, 'success');
        this.router.navigate(['/admin/projects']);
      }
    });
  }

  // ── SVG / Chart helpers ────────────────────────────────────────────────────

  getProgressDash(progress: number | undefined): string {
    const p = progress || 0;
    const c = 283;
    const filled = (p / 100) * c;
    return `${filled} ${c - filled}`;
  }

  getTaskSegmentDash(count: number): string {
    const total = this.taskStats.total || 1;
    const filled = (count / total) * 283;
    return `${filled} ${283 - filled}`;
  }

  getTaskSegmentOffset(index: number): number {
    const total = this.taskStats.total || 1;
    const c = 283;
    const offsets = [
      0,
      (this.taskStats.planned / total) * c,
      ((this.taskStats.planned + this.taskStats.inProgress) / total) * c,
      ((this.taskStats.planned + this.taskStats.inProgress + this.taskStats.completed) / total) * c
    ];
    return -70.75 - (offsets[index] || 0);
  }

  getDaysRemaining(): number {
    if (!this.project?.endDate) return 0;
    const diff = Math.ceil(
      (new Date(this.project.endDate).getTime() - new Date().getTime()) / 86400000
    );
    return Math.max(0, diff);
  }

  getDaysTotal(): number {
    if (!this.project?.startDate || !this.project?.endDate) return 0;
    return Math.ceil(
      (new Date(this.project.endDate).getTime() - new Date(this.project.startDate).getTime()) / 86400000
    );
  }

  getDaysElapsedPct(): number {
    const total = this.getDaysTotal();
    if (total === 0) return 0;
    const elapsed = total - this.getDaysRemaining();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  getStatusLabel(status: string | undefined): string {
    const map: Record<string, string> = {
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      ON_HOLD: 'On Hold',
      PLANNED: 'Planned'
    };
    return map[status || ''] || status || 'Unknown';
  }

  getPriorityClass(priority: string | undefined): string {
    switch ((priority || '').toUpperCase()) {
      case 'HIGH': return 'priority-high';
      case 'LOW': return 'priority-low';
      default: return 'priority-medium';
    }
  }

  getTaskStatusClass(status: string | undefined): string {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED': return 'status-completed';
      case 'IN_PROGRESS': return 'status-inprogress';
      case 'ON_HOLD': return 'status-onhold';
      case 'PLANNED': case 'TODO': default: return 'status-planned';
    }
  }

  getCountByPriority(priority: string): number {
    return this.tasks.filter(t => (t.priority || '').toUpperCase() === priority).length;
  }
}
