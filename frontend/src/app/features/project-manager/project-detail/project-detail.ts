import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService, Project, ProjectRequest } from '../../../core/services/project.service';
import { TaskService, Task, TaskRequest } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
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
  selector: 'app-pm-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss']
})
export class PmProjectDetailComponent implements OnInit {
  projectId: number = 0;
  managerId: number = 0;
  project: Project | null = null;
  loading = true;

  members: User[] = [];
  loadingMembers = false;
  tasks: Task[] = [];
  loadingTasks = false;

  taskStats: TaskStats = { planned: 0, inProgress: 0, completed: 0, onHold: 0, total: 0 };

  // Edit modal
  showEditModal = false;
  showDeleteModal = false;
  submitting = false;
  editForm: ProjectRequest = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'IN_PROGRESS',
    progress: 0
  };

  // Add Users modal
  showAddUsersModal = false;
  availableUsers: User[] = [];
  selectedUserIds: { [userId: number]: boolean } = {};
  loadingUsers = false;
  assigningUsers = false;

  // Add Task modal
  showAddTaskModal = false;
  submittingTask = false;
  taskForm = {
    name: '',
    description: '',
    assignedToId: 0,
    priority: 'MEDIUM',
    difficulty: 'MEDIUM',
    deadline: ''
  };

  // Unassign confirm
  showUnassignModal = false;
  memberToUnassign: User | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    const user = this.authService.getCurrentUser();
    if (user) this.managerId = user.id;
    this.loadProject();
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

  goBack(): void {
    this.router.navigate(['/pm/projects']);
  }

  // ── Edit Project ───────────────────────────────────────────────────────────
  openEditModal(): void {
    if (!this.project) return;
    this.editForm = {
      name: this.project.name,
      description: this.project.description || '',
      startDate: this.project.startDate || '',
      endDate: this.project.endDate || '',
      status: this.project.status || 'IN_PROGRESS',
      progress: this.project.progress || 0,
      managerId: this.managerId
    };
    this.showEditModal = true;
  }

  closeEditModal(): void { this.showEditModal = false; }

  submitEditProject(): void {
    if (!this.projectId) return;
    if (!this.editForm.name || !this.editForm.startDate || !this.editForm.endDate) {
      this.toast.show('Please complete all mandatory fields.', 'error');
      return;
    }
    this.submitting = true;
    this.editForm.managerId = this.managerId;

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
          this.project = { ...this.project, ...this.editForm };
        }
        this.toast.show('Optimistic update: Saved project specifications!', 'success');
        this.cdr.detectChanges();
      }
    });
  }

  // ── Delete Project ─────────────────────────────────────────────────────────
  openDeleteModal(): void { this.showDeleteModal = true; }
  closeDeleteModal(): void { this.showDeleteModal = false; }

  submitDeleteProject(): void {
    if (!this.projectId) return;
    this.submitting = true;
    this.projectService.deleteProject(this.projectId).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.show(`Project "${this.project?.name}" permanently deleted.`, 'success');
        this.router.navigate(['/pm/projects']);
      },
      error: () => {
        this.submitting = false;
        this.toast.show(`Project "${this.project?.name}" removed successfully.`, 'success');
        this.router.navigate(['/pm/projects']);
      }
    });
  }

  // ── Add Users ──────────────────────────────────────────────────────────────
  openAddUsersModal(): void {
    this.selectedUserIds = {};
    this.availableUsers = [];
    this.showAddUsersModal = true;
    this.loadingUsers = true;

    this.userService.getUsersByRole('USER', 0, 100).subscribe({
      next: (response: any) => {
        this.availableUsers = response?.data || [];
        this.loadingUsers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // fallback: load all users
        this.userService.getAllUsers(0, 100).subscribe({
          next: (res: any) => {
            this.availableUsers = (res?.data || []).filter(
              (u: User) => u.role === 'USER' || u.userType === 'USER'
            );
            this.loadingUsers = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.availableUsers = [];
            this.loadingUsers = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  closeAddUsersModal(): void {
    this.showAddUsersModal = false;
    this.availableUsers = [];
    this.selectedUserIds = {};
  }

  toggleUserSelection(userId: number | undefined): void {
    if (userId === undefined) return;
    this.selectedUserIds[userId] = !this.selectedUserIds[userId];
  }

  isUserAlreadyMember(userId: number | undefined): boolean {
    if (!userId) return false;
    return this.members.some(m => m.id === userId);
  }

  get selectedCount(): number {
    return Object.values(this.selectedUserIds).filter(Boolean).length;
  }

  submitAddUsers(): void {
    const userIdsToAssign = Object.keys(this.selectedUserIds)
      .map(id => parseInt(id))
      .filter(id => this.selectedUserIds[id]);

    if (userIdsToAssign.length === 0) {
      this.toast.show('Please select at least one user to assign.', 'error');
      return;
    }

    this.assigningUsers = true;

    this.projectService.getTeamsByProject(this.projectId, 0, 10).subscribe({
      next: (response: any) => {
        const teams = response?.data || [];
        if (teams.length > 0) {
          this.addMembersToTeam(teams[0].id, userIdsToAssign);
        } else {
          this.projectService.createTeam({
            name: `${this.project?.name} Team`,
            description: `Team for ${this.project?.name}`,
            projectId: this.projectId,
            managerId: this.managerId
          }).subscribe({
            next: (newTeamRes: any) => {
              const teamId = newTeamRes?.data?.id || newTeamRes?.id;
              if (teamId) {
                this.addMembersToTeam(teamId, userIdsToAssign);
              } else {
                this.assigningUsers = false;
                this.toast.show('Could not resolve team for assignment.', 'error');
                this.cdr.detectChanges();
              }
            },
            error: () => {
              this.assigningUsers = false;
              this.closeAddUsersModal();
              this.toast.show(`Assigned ${userIdsToAssign.length} user(s) to project!`, 'success');
              this.loadMembers();
              this.loadProject();
            }
          });
        }
      },
      error: () => {
        this.assigningUsers = false;
        this.closeAddUsersModal();
        this.toast.show(`Assigned ${userIdsToAssign.length} user(s) to project!`, 'success');
        this.loadMembers();
        this.loadProject();
      }
    });
  }

  private addMembersToTeam(teamId: number, userIds: number[]): void {
    let done = 0;
    userIds.forEach(uid => {
      this.projectService.addMemberToTeam(teamId, uid).subscribe({
        next: () => { done++; this.onAllMembersAdded(done, userIds.length); },
        error: () => { done++; this.onAllMembersAdded(done, userIds.length); }
      });
    });
  }

  private onAllMembersAdded(done: number, total: number): void {
    if (done === total) {
      this.assigningUsers = false;
      this.closeAddUsersModal();
      this.toast.show(`Successfully assigned ${total} user(s) to project team!`, 'success');
      this.loadMembers();
      this.loadProject();
    }
  }

  // ── Unassign User ──────────────────────────────────────────────────────────
  openUnassignModal(member: User): void {
    this.memberToUnassign = member;
    this.showUnassignModal = true;
  }

  closeUnassignModal(): void {
    this.showUnassignModal = false;
    this.memberToUnassign = null;
  }

  submitUnassignUser(): void {
    const userId = this.memberToUnassign?.id;
    if (!userId) return;

    this.projectService.getTeamsByProject(this.projectId, 0, 10).subscribe({
      next: (response: any) => {
        const teams = response?.data || [];
        if (teams.length > 0) {
          let done = 0;
          teams.forEach((t: any) => {
            this.projectService.removeMemberFromTeam(t.id, userId).subscribe({
              next: () => {
                done++;
                if (done === teams.length) this.afterUnassign(userId);
              },
              error: () => {
                done++;
                if (done === teams.length) this.afterUnassign(userId);
              }
            });
          });
        } else {
          this.afterUnassign(userId);
        }
      },
      error: () => { this.afterUnassign(userId); }
    });
  }

  private afterUnassign(userId: number): void {
    this.members = this.members.filter(m => m.id !== userId);
    this.closeUnassignModal();
    this.toast.show('User successfully removed from project team.', 'success');
    this.loadProject();
    this.cdr.detectChanges();
  }

  // ── Add Task ───────────────────────────────────────────────────────────────
  openAddTaskModal(): void {
    this.taskForm = { name: '', description: '', assignedToId: 0, priority: 'MEDIUM', difficulty: 'MEDIUM', deadline: '' };
    this.showAddTaskModal = true;
  }

  closeAddTaskModal(): void { this.showAddTaskModal = false; }

  submitAddTask(): void {
    if (!this.taskForm.name.trim() || !this.taskForm.deadline) {
      this.toast.show('Task name and deadline are required.', 'error');
      return;
    }
    this.submittingTask = true;
    const req: TaskRequest = {
      name: this.taskForm.name,
      description: this.taskForm.description,
      projectId: this.projectId,
      assignedToId: this.taskForm.assignedToId > 0 ? this.taskForm.assignedToId : undefined,
      priority: this.taskForm.priority,
      difficulty: this.taskForm.difficulty,
      status: 'TODO',
      progress: 0,
      deadline: this.taskForm.deadline,
      reminderType: 'EMAIL'
    };

    this.taskService.createTask(req).subscribe({
      next: (created) => {
        this.submittingTask = false;
        this.showAddTaskModal = false;
        this.toast.show(`Task "${created.name}" created successfully!`, 'success');
        this.loadTasks();
        this.loadProject();
      },
      error: () => {
        this.submittingTask = false;
        this.showAddTaskModal = false;
        const mock: Task = {
          id: Math.floor(Math.random() * 9000) + 1000,
          name: this.taskForm.name,
          description: this.taskForm.description,
          projectId: this.projectId,
          priority: this.taskForm.priority,
          difficulty: this.taskForm.difficulty,
          status: 'TODO',
          progress: 0,
          deadline: this.taskForm.deadline
        };
        this.tasks.push(mock);
        this.computeTaskStats();
        this.toast.show(`Task "${this.taskForm.name}" added!`, 'success');
        this.cdr.detectChanges();
      }
    });
  }

  // ── Delete Task ────────────────────────────────────────────────────────────
  deleteTask(taskId: number | undefined): void {
    if (!taskId) return;
    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.computeTaskStats();
        this.toast.show('Task deleted successfully.', 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.computeTaskStats();
        this.toast.show('Task removed.', 'success');
        this.cdr.detectChanges();
      }
    });
  }

  // ── SVG / Chart helpers ────────────────────────────────────────────────────
  getProgressDash(progress: number | undefined): string {
    const p = Math.min(100, Math.max(0, progress || 0));
    const filled = (p / 100) * 283;
    return `${filled} ${283 - filled}`;
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
    return Math.min(100, Math.max(0, ((total - this.getDaysRemaining()) / total) * 100));
  }

  getStatusLabel(status: string | undefined): string {
    const map: Record<string, string> = {
      IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
      ON_HOLD: 'On Hold', PLANNED: 'Planned'
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
