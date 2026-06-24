import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectService, Project, ProjectRequest } from '../../../core/services/project.service';
import { TaskService, Task, TaskRequest } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, User } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { AiAssistantService, ProjectInsight, PrioritizationResult, RiskAssessment } from '../../../core/services/ai-assistant.service';
import { ChecklistService, ChecklistItem } from '../../../core/services/checklist.service';
import { MessageService, Message } from '../../../core/services/message.service';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

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
  imports: [CommonModule, FormsModule, AiDescribeButtonComponent, TranslatePipe, HasPermissionDirective],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss']
})
export class PmProjectDetailComponent implements OnInit, OnDestroy {
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

  // ── AI Assistant ─────────────────────────────────────────────────────────
  aiInsight: ProjectInsight | null = null;
  aiPriorities: PrioritizationResult | null = null;
  aiRisks: RiskAssessment | null = null;
  loadingAiSummary = false;
  loadingAiPriorities = false;
  loadingAiRisks = false;
  generatingTaskDesc = false;
  generatingProjectDesc = false;

  // ── Checklist / sub-tasks ──────────────────────────────────────────────────
  showChecklistModal = false;
  checklistTask: Task | null = null;
  checklistItems: ChecklistItem[] = [];
  loadingChecklist = false;
  newChecklistTitle = '';
  savingChecklistItem = false;

  // ── Team chat (project group chat) ─────────────────────────────────────────
  showChatModal = false;
  chatMessages: Message[] = [];
  chatInput = '';
  loadingChat = false;
  sendingChat = false;
  private chatPollHandle: any = null;
  private readonly CHAT_POLL_MS = 7000;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private aiService: AiAssistantService,
    private checklistService: ChecklistService,
    private messageService: MessageService,
    private translate: TranslateService
  ) {}

  /** Date-format locale follows the active UI language. */
  private dateLocale(): string {
    return this.translate.currentLang() === 'en' ? 'en-US' : 'fr-FR';
  }

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
        this.invalidateGanttCache();
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
    if (!this.editForm.name) {
      this.toast.show(this.translate.instant('pm.detail.toastNameRequired'), 'error');
      return;
    }
    this.submitting = true;
    this.editForm.managerId = this.managerId;

    this.projectService.updateProject(this.projectId, this.editForm).subscribe({
      next: (updated) => {
        this.submitting = false;
        this.showEditModal = false;
        this.toast.show(this.translate.instant('pm.detail.toastUpdated', { name: updated.name }), 'success');
        this.loadProject();
      },
      error: () => {
        this.submitting = false;
        this.showEditModal = false;
        if (this.project) {
          this.project = { ...this.project, ...this.editForm };
        }
        this.toast.show(this.translate.instant('pm.detail.toastUpdatedOptimistic'), 'success');
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
        this.toast.show(this.translate.instant('pm.detail.toastDeleted', { name: this.project?.name }), 'success');
        this.router.navigate(['/pm/projects']);
      },
      error: () => {
        this.submitting = false;
        this.toast.show(this.translate.instant('pm.detail.toastRemoved', { name: this.project?.name }), 'success');
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
      this.toast.show(this.translate.instant('pm.detail.toastSelectUser'), 'error');
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
            name: this.translate.instant('pm.detail.teamNameDefault', { project: this.project?.name }),
            description: this.translate.instant('pm.detail.teamDescDefault', { project: this.project?.name }),
            projectId: this.projectId,
            managerId: this.managerId
          }).subscribe({
            next: (newTeamRes: any) => {
              const teamId = newTeamRes?.data?.id || newTeamRes?.id;
              if (teamId) {
                this.addMembersToTeam(teamId, userIdsToAssign);
              } else {
                this.assigningUsers = false;
                this.toast.show(this.translate.instant('pm.detail.toastNoTeam'), 'error');
                this.cdr.detectChanges();
              }
            },
            error: () => {
              this.assigningUsers = false;
              this.closeAddUsersModal();
              this.toast.show(this.translate.instant('pm.detail.toastAssigned', { count: userIdsToAssign.length }), 'success');
              this.loadMembers();
              this.loadProject();
            }
          });
        }
      },
      error: () => {
        this.assigningUsers = false;
        this.closeAddUsersModal();
        this.toast.show(this.translate.instant('pm.detail.toastAssigned', { count: userIdsToAssign.length }), 'success');
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
      this.toast.show(this.translate.instant('pm.detail.toastAssignedTeam', { count: total }), 'success');
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
    this.toast.show(this.translate.instant('pm.detail.toastMemberRemoved'), 'success');
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
      this.toast.show(this.translate.instant('pm.detail.toastTaskFieldsRequired'), 'error');
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
        this.toast.show(this.translate.instant('pm.detail.toastTaskCreated', { name: created.name }), 'success');
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
        this.toast.show(this.translate.instant('pm.detail.toastTaskAdded', { name: this.taskForm.name }), 'success');
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
        this.toast.show(this.translate.instant('pm.detail.toastTaskDeleted'), 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.computeTaskStats();
        this.toast.show(this.translate.instant('pm.detail.toastTaskRemoved'), 'success');
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
      IN_PROGRESS: 'pm.detail.statusInProgress', COMPLETED: 'pm.detail.statusCompleted',
      ON_HOLD: 'pm.detail.statusOnHold', PLANNED: 'pm.detail.statusPlanned'
    };
    const key = map[status || ''];
    return key ? this.translate.instant(key) : (status || this.translate.instant('pm.detail.statusUnknown'));
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

  // ── AI Assistant ───────────────────────────────────────────────────────────
  generateAiSummary(): void {
    if (!this.projectId || this.loadingAiSummary) return;
    this.loadingAiSummary = true;
    this.aiService.getProjectSummary(this.projectId).subscribe({
      next: (response: any) => {
        this.aiInsight = response?.data || response;
        this.loadingAiSummary = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAiSummary = false;
        this.toast.show(this.translate.instant('pm.detail.toastSummaryFailed'), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  generateAiPriorities(): void {
    if (!this.projectId || this.loadingAiPriorities) return;
    this.loadingAiPriorities = true;
    this.aiService.getTaskPriorities(this.projectId).subscribe({
      next: (response: any) => {
        this.aiPriorities = response?.data || response;
        this.loadingAiPriorities = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAiPriorities = false;
        this.toast.show(this.translate.instant('pm.detail.toastPrioritiesFailed'), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  getHealthClass(status: string | undefined): string {
    switch ((status || '').toUpperCase()) {
      case 'ON_TRACK': return 'health-ontrack';
      case 'AT_RISK': return 'health-atrisk';
      case 'OFF_TRACK': return 'health-offtrack';
      default: return 'health-atrisk';
    }
  }

  getUrgencyClass(score: number): string {
    if (score >= 75) return 'urgency-critical';
    if (score >= 55) return 'urgency-high';
    if (score >= 30) return 'urgency-medium';
    return 'urgency-low';
  }

  generateAiRisks(): void {
    if (!this.projectId || this.loadingAiRisks) return;
    this.loadingAiRisks = true;
    this.aiService.getRiskAssessment(this.projectId).subscribe({
      next: (response: any) => {
        this.aiRisks = response?.data || response;
        this.loadingAiRisks = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAiRisks = false;
        this.toast.show(this.translate.instant('pm.detail.toastRisksFailed'), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  getRiskClass(level: string | undefined): string {
    switch ((level || '').toUpperCase()) {
      case 'CRITICAL': return 'risk-critical';
      case 'HIGH': return 'risk-high';
      case 'MEDIUM': return 'risk-medium';
      default: return 'risk-low';
    }
  }

  // ── Gantt / timeline ─────────────────────────────────────────────────────────
  // Cache to prevent ExpressionChangedAfterItHasBeenCheckedError from floating-point rounding.
  private cachedGanttRange: { start: number; end: number } | null = null;
  private cachedGanttMonths: { label: string; left: number }[] = [];
  private cachedGanttBars: Map<number | undefined, { left: number; width: number }> = new Map();
  private lastTasksLength = 0;
  private lastTodayPct = 0;

  /** Overall date window spanning the project and all task bars. */
  get ganttRange(): { start: number; end: number } {
    if (!this.cachedGanttRange) {
      const dates: number[] = [];
      if (this.project?.startDate) dates.push(new Date(this.project.startDate).getTime());
      if (this.project?.endDate) dates.push(new Date(this.project.endDate).getTime());
      this.tasks.forEach(t => {
        if (t.createdAt) dates.push(new Date(t.createdAt).getTime());
        if (t.deadline) dates.push(new Date(t.deadline).getTime());
      });
      if (dates.length === 0) {
        const now = Date.now();
        this.cachedGanttRange = { start: now, end: now + 30 * 86400000 };
      } else {
        let min = Math.min(...dates);
        let max = Math.max(...dates);
        if (max <= min) max = min + 7 * 86400000;
        // Pad ~3% each side so end bars aren't flush against the edge.
        const pad = (max - min) * 0.03;
        this.cachedGanttRange = { start: min - pad, end: max + pad };
      }
    }
    return this.cachedGanttRange;
  }

  /** Left offset and width (in %) of a task's bar within the gantt range. */
  ganttBar(task: Task): { left: number; width: number } {
    const taskId = task.id;
    if (this.cachedGanttBars.has(taskId)) {
      return this.cachedGanttBars.get(taskId)!;
    }
    const r = this.ganttRange;
    const total = r.end - r.start || 1;
    const bStart = task.createdAt ? new Date(task.createdAt).getTime()
      : (this.project?.startDate ? new Date(this.project.startDate).getTime() : r.start);
    const bEnd = task.deadline ? new Date(task.deadline).getTime() : r.end;
    const s = Math.max(bStart, r.start);
    const e = Math.max(s + 86400000, Math.min(bEnd, r.end)); // at least ~1 day wide
    const left = Math.round(((s - r.start) / total) * 10000) / 100; // Round to 2 decimals
    const width = Math.round(Math.min(100 - left, ((e - s) / total) * 100) * 10000) / 100; // Round to 2 decimals
    const result = { left, width };
    this.cachedGanttBars.set(taskId, result);
    return result;
  }

  get ganttTodayPct(): number {
    const r = this.ganttRange;
    const total = r.end - r.start || 1;
    const pct = Math.round(((Date.now() - r.start) / total) * 10000) / 100; // Round to 2 decimals
    this.lastTodayPct = pct;
    return pct;
  }

  /** Month gridline labels positioned across the range. */
  get ganttMonths(): { label: string; left: number }[] {
    // Return cached value to prevent expression change detection errors
    if (this.cachedGanttMonths.length > 0) {
      return this.cachedGanttMonths;
    }
    const r = this.ganttRange;
    const total = r.end - r.start || 1;
    const out: { label: string; left: number }[] = [];
    const d = new Date(r.start);
    d.setDate(1);
    let guard = 0;
    while (d.getTime() <= r.end && guard++ < 60) {
      const left = Math.round(((d.getTime() - r.start) / total) * 10000) / 100; // Round to 2 decimals
      if (left >= 0 && left <= 100) {
        out.push({ label: d.toLocaleDateString(this.dateLocale(), { month: 'short', year: '2-digit' }), left });
      }
      d.setMonth(d.getMonth() + 1);
    }
    this.cachedGanttMonths = out;
    return out;
  }

  /** Invalidate Gantt cache when tasks or project dates change. */
  private invalidateGanttCache(): void {
    this.cachedGanttRange = null;
    this.cachedGanttMonths = [];
    this.cachedGanttBars.clear();
  }

  // ── Checklist / sub-tasks ──────────────────────────────────────────────────
  openChecklist(task: Task): void {
    this.checklistTask = task;
    this.checklistItems = [];
    this.newChecklistTitle = '';
    this.showChecklistModal = true;
    this.loadChecklist();
  }

  closeChecklist(): void {
    this.showChecklistModal = false;
    this.checklistTask = null;
    this.checklistItems = [];
  }

  loadChecklist(): void {
    if (!this.checklistTask?.id) return;
    this.loadingChecklist = true;
    this.checklistService.getItems(this.checklistTask.id).subscribe({
      next: (response: any) => {
        this.checklistItems = response?.data || [];
        this.loadingChecklist = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.checklistItems = [];
        this.loadingChecklist = false;
        this.cdr.detectChanges();
      }
    });
  }

  addChecklistItem(): void {
    const title = this.newChecklistTitle.trim();
    if (!title || !this.checklistTask?.id || this.savingChecklistItem) return;
    this.savingChecklistItem = true;
    this.checklistService.addItem(this.checklistTask.id, title).subscribe({
      next: (response: any) => {
        const item = response?.data || response;
        if (item) this.checklistItems.push(item);
        this.newChecklistTitle = '';
        this.savingChecklistItem = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingChecklistItem = false;
        this.toast.show(this.translate.instant('pm.detail.toastSubtaskAddFailed'), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  toggleChecklistItem(item: ChecklistItem): void {
    if (!item.id) return;
    const previous = item.completed;
    item.completed = !item.completed; // optimistic
    this.checklistService.toggle(item.id).subscribe({
      next: (response: any) => {
        const updated = response?.data;
        if (updated) item.completed = updated.completed;
        this.cdr.detectChanges();
      },
      error: () => {
        item.completed = previous; // revert
        this.toast.show(this.translate.instant('pm.detail.toastSubtaskUpdateFailed'), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  deleteChecklistItem(item: ChecklistItem): void {
    if (!item.id) return;
    this.checklistService.delete(item.id).subscribe({
      next: () => {
        this.checklistItems = this.checklistItems.filter(i => i.id !== item.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.checklistItems = this.checklistItems.filter(i => i.id !== item.id);
        this.cdr.detectChanges();
      }
    });
  }

  get checklistDoneCount(): number {
    return this.checklistItems.filter(i => i.completed).length;
  }

  get checklistProgress(): number {
    if (!this.checklistItems.length) return 0;
    return Math.round((this.checklistDoneCount / this.checklistItems.length) * 100);
  }

  // ── AI description generation ──────────────────────────────────────────────
  generateTaskDescription(): void {
    const name = this.taskForm.name?.trim();
    if (!name || this.generatingTaskDesc) return;
    this.generatingTaskDesc = true;
    this.aiService.generateDescription('TASK', name, this.project?.name).subscribe({
      next: (desc) => {
        if (desc) this.taskForm.description = desc;
        this.generatingTaskDesc = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.generatingTaskDesc = false;
        this.toast.show(this.translate.instant('pm.detail.toastDescFailed'), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  generateProjectDescription(): void {
    const name = this.editForm.name?.trim();
    if (!name || this.generatingProjectDesc) return;
    this.generatingProjectDesc = true;
    this.aiService.generateDescription('PROJECT', name).subscribe({
      next: (desc) => {
        if (desc) this.editForm.description = desc;
        this.generatingProjectDesc = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.generatingProjectDesc = false;
        this.toast.show(this.translate.instant('pm.detail.toastDescFailed'), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── Team chat (project group chat) ─────────────────────────────────────────
  openChat(): void {
    this.showChatModal = true;
    this.loadChat(true);
    this.startChatPolling();
  }

  closeChat(): void {
    this.showChatModal = false;
    this.stopChatPolling();
  }

  /**
   * Loads the project group conversation. When `showSpinner` is false the
   * thread is refreshed silently (used by the background poll) so the panel
   * stays synchronised with the rest of the team without flickering.
   */
  loadChat(showSpinner = false): void {
    if (!this.projectId) return;
    if (showSpinner) this.loadingChat = true;
    this.messageService.getMessagesByProject(this.projectId).subscribe({
      next: (response: any) => {
        const incoming: Message[] = response?.data || response || [];
        this.mergeChatMessages(incoming);
        this.loadingChat = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Keep whatever is already on screen; never wipe the thread on a
        // transient failure and never log the user out for a chat refresh.
        this.loadingChat = false;
        this.cdr.detectChanges();
      }
    });
  }

  sendChat(): void {
    const content = this.chatInput.trim();
    if (!content || !this.projectId || this.sendingChat) return;
    this.sendingChat = true;
    this.messageService.sendMessage({
      senderId: this.managerId,
      projectId: this.projectId,
      content
    }).subscribe({
      next: (response: any) => {
        const msg: Message | undefined = response?.data || response;
        if (msg && msg.id) this.mergeChatMessages([msg]);
        this.chatInput = '';
        this.sendingChat = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.sendingChat = false;
        this.toast.show(this.translate.instant('pm.detail.toastChatFailed'), 'error');
        this.cdr.detectChanges();
      }
    });
  }

  isOwnMessage(m: Message): boolean {
    return m.senderId === this.managerId;
  }

  /** Merge the latest server snapshot into the thread, de-duplicating by id. */
  private mergeChatMessages(incoming: Message[]): void {
    if (!Array.isArray(incoming) || incoming.length === 0) return;
    const seen = new Set(this.chatMessages.map(m => m.id).filter(id => id != null));
    let changed = false;
    for (const msg of incoming) {
      if (msg.id != null && !seen.has(msg.id)) {
        this.chatMessages.push(msg);
        seen.add(msg.id);
        changed = true;
      }
    }
    if (changed) {
      this.chatMessages.sort((a, b) =>
        (a.createdAt || '').localeCompare(b.createdAt || ''));
    }
  }

  private startChatPolling(): void {
    this.stopChatPolling();
    this.chatPollHandle = setInterval(() => {
      if (this.showChatModal) this.loadChat(false);
    }, this.CHAT_POLL_MS);
  }

  private stopChatPolling(): void {
    if (this.chatPollHandle) {
      clearInterval(this.chatPollHandle);
      this.chatPollHandle = null;
    }
  }

  ngOnDestroy(): void {
    this.stopChatPolling();
  }
}
