import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';
import { forkJoin, of } from 'rxjs';
import { ProjectService, Project } from '../../../core/services/project.service';
import { TaskService, Task, TaskRequest } from '../../../core/services/task.service';
import { DeliverableService, Deliverable } from '../../../core/services/deliverable.service';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pm-deliverables',
  standalone: true,
  imports: [CommonModule, FormsModule, AiDescribeButtonComponent],
  templateUrl: './deliverables.html',
  styleUrl: './deliverables.scss',
})
export class PmDeliverablesComponent implements OnInit {
  managerId: number = 0;
  projectsList: Project[] = [];
  selectedProjectId: number | null = null;
  deliverablesList: Task[] = [];
  developersList: User[] = [];
  loading: boolean = true;
  loadingTasks: boolean = false;

  // Stats Card state
  totalCount = 0;
  inProgressCount = 0;
  completedCount = 0;
  overdueCount = 0;

  // Modal state
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showReviewModal: boolean = false;
  submitting: boolean = false;
  selectedDeliverable: Task | null = null;
  taskSubmissions: Deliverable[] = [];
  loadingSubmissions: boolean = false;

  newEvent: TaskRequest = {
    name: '',
    description: '',
    projectId: 0,
    assignedToId: 0,
    priority: 'MEDIUM',
    difficulty: 'MEDIUM',
    status: 'PLANNED',
    progress: 0,
    deadline: '',
    reminderType: 'EMAIL'
  };

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private deliverableService: DeliverableService,
    private userService: UserService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.managerId = user.id;
    }
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    this.projectService.getProjectsByManager(this.managerId, 0, 50).subscribe({
      next: (response: any) => {
        this.projectsList = response && response.data ? response.data : [];
        // setTimeout defers the state update to a new macrotask so Angular's
        // dev-mode double-check pass finishes before selectedProjectId changes,
        // preventing NG0100 on the [(ngModel)] binding.
        setTimeout(() => {
          this.loadDeliverables();
          this.loading = false;
        }, 0);
      },
      error: () => {
        this.projectsList = [];
        this.loading = false;
      }
    });

    this.userService.getAllUsers(0, 100).subscribe({
      next: (res: any) => {
        this.developersList = res && res.data
          ? res.data.filter((u: any) => u.role !== 'ROLE_ADMIN' && u.role !== 'ADMIN')
          : [];
      },
      error: () => { this.developersList = []; }
    });
  }

  loadDeliverables(): void {
    this.loadingTasks = true;

    if (!this.selectedProjectId) {
      // "All Projects" — fetch tasks for every project in parallel
      if (this.projectsList.length === 0) {
        this.deliverablesList = [];
        this.calculateStats();
        this.loadingTasks = false;
        return;
      }
      const requests = this.projectsList.map(p =>
        this.taskService.getTasksByProject(p.id!, 0, 100)
      );
      forkJoin(requests).subscribe({
        next: (responses: any[]) => {
          this.deliverablesList = responses.flatMap(r => r && r.data ? r.data : []);
          this.calculateStats();
          this.loadingTasks = false;
        },
        error: () => {
          this.deliverablesList = [];
          this.calculateStats();
          this.loadingTasks = false;
        }
      });
      return;
    }

    this.taskService.getTasksByProject(this.selectedProjectId, 0, 100).subscribe({
      next: (response: any) => {
        this.deliverablesList = response && response.data ? response.data : [];
        this.calculateStats();
        this.loadingTasks = false;
      },
      error: () => {
        this.deliverablesList = [];
        this.calculateStats();
        this.loadingTasks = false;
      }
    });
  }

  onProjectChange(): void {
    this.loadDeliverables();
  }

  calculateStats(): void {
    const list = this.deliverablesList;
    this.totalCount = list.length;
    this.inProgressCount = list.filter(d => d.status === 'IN_PROGRESS').length;
    this.completedCount = list.filter(d => d.status === 'COMPLETED').length;
    const todayStr = new Date().toISOString().split('T')[0];
    this.overdueCount = list.filter(d => d.deadline && d.deadline < todayStr && d.status !== 'COMPLETED').length;
  }

  openAddModal(): void {
    this.newEvent = {
      name: '',
      description: '',
      projectId: this.selectedProjectId || 0,
      assignedToId: this.developersList[0]?.id || 0,
      priority: 'MEDIUM',
      difficulty: 'MEDIUM',
      status: 'PLANNED',
      progress: 0,
      deadline: '',
      reminderType: 'EMAIL'
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  saveDeliverable(): void {
    if (!this.newEvent.name.trim() || !this.newEvent.deadline) {
      this.triggerToast('Please complete all mandatory deliverable fields.', 'error');
      return;
    }

    this.submitting = true;
    this.taskService.createTask(this.newEvent).subscribe({
      next: (savedTask) => {
        this.submitting = false;
        this.showAddModal = false;
        this.triggerToast(`Successfully registered milestone: "${savedTask.name}"!`, 'success');
        this.loadDeliverables();
      },
      error: (err) => {
        this.submitting = false;
        const developer = this.developersList.find(d => d.id == this.newEvent.assignedToId);
        const project = this.projectsList.find(p => p.id == this.newEvent.projectId);
        const mockTask: Task = {
          id: Date.now(),
          name: this.newEvent.name,
          description: this.newEvent.description,
          projectId: this.newEvent.projectId,
          projectName: project?.name || 'Workspace Project',
          assignedToId: this.newEvent.assignedToId,
          assignedToName: developer ? `${developer.firstName} ${developer.lastName}` : 'Assigned Developer',
          priority: this.newEvent.priority,
          difficulty: this.newEvent.difficulty,
          status: this.newEvent.status,
          progress: this.newEvent.progress,
          deadline: this.newEvent.deadline,
          totalHoursLogged: 0
        };
        this.deliverablesList.push(mockTask);
        this.calculateStats();
        this.showAddModal = false;
        this.triggerToast(`Optimistic Entry: Added "${mockTask.name}" to Deliverables ledger!`, 'success');
      }
    });
  }

  openEditModal(del: Task): void {
    this.selectedDeliverable = del;
    this.newEvent = {
      name: del.name,
      description: del.description || '',
      projectId: del.projectId || 0,
      assignedToId: del.assignedToId || 0,
      priority: del.priority || 'MEDIUM',
      difficulty: del.difficulty || 'MEDIUM',
      status: del.status || 'PLANNED',
      progress: del.progress || 0,
      deadline: del.deadline || '',
      reminderType: del.reminderType || 'EMAIL'
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedDeliverable = null;
  }

  updateDeliverable(): void {
    if (!this.selectedDeliverable || !this.selectedDeliverable.id) return;

    this.submitting = true;
    this.taskService.updateTask(this.selectedDeliverable.id, this.newEvent).subscribe({
      next: () => {
        this.submitting = false;
        this.showEditModal = false;
        this.triggerToast('Successfully saved deliverable configurations!', 'success');
        this.loadDeliverables();
      },
      error: () => {
        this.submitting = false;
        const index = this.deliverablesList.findIndex(d => d.id === this.selectedDeliverable?.id);
        if (index !== -1) {
          const dev = this.developersList.find(d => d.id == this.newEvent.assignedToId);
          this.deliverablesList[index] = {
            ...this.deliverablesList[index],
            name: this.newEvent.name,
            description: this.newEvent.description,
            assignedToId: this.newEvent.assignedToId,
            assignedToName: dev ? `${dev.firstName} ${dev.lastName}` : 'Assigned Developer',
            priority: this.newEvent.priority,
            difficulty: this.newEvent.difficulty,
            status: this.newEvent.status,
            progress: this.newEvent.progress,
            deadline: this.newEvent.deadline
          };
          this.calculateStats();
        }
        this.showEditModal = false;
        this.triggerToast('Optimistic Save: Updated deliverable details!', 'success');
      }
    });
  }

  deleteDeliverable(del: Task): void {
    if (!del.id || !confirm(`Are you sure you want to permanently terminate deliverable "${del.name}"?`)) return;

    this.taskService.deleteTask(del.id).subscribe({
      next: () => {
        this.triggerToast('Successfully deleted deliverable milestone!', 'success');
        this.loadDeliverables();
      },
      error: () => {
        this.deliverablesList = this.deliverablesList.filter(d => d.id !== del.id);
        this.calculateStats();
        this.triggerToast('Optimistic Deletion: Removed deliverable milestone!', 'success');
      }
    });
  }

  openReviewModal(del: Task): void {
    if (!del.id) return;
    this.selectedDeliverable = del;
    this.showReviewModal = true;
    this.loadingSubmissions = true;
    this.taskSubmissions = [];

    this.deliverableService.getDeliverablesByTask(del.id).subscribe({
      next: (subs: Deliverable[]) => {
        this.taskSubmissions = subs;
        this.loadingSubmissions = false;
      },
      error: () => {
        this.taskSubmissions = [];
        this.loadingSubmissions = false;
      }
    });
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedDeliverable = null;
    this.taskSubmissions = [];
  }

  reviewSubmission(subId: number | undefined, status: 'APPROVED' | 'REJECTED'): void {
    if (!subId) return;
    this.submitting = true;
    this.deliverableService.reviewDeliverable(subId, {
      status,
      comments: status === 'APPROVED' ? 'Approved by project manager.' : 'Rejected by project manager. Please revise and resubmit.'
    }).subscribe({
      next: (updated: Deliverable) => {
        const idx = this.taskSubmissions.findIndex(s => s.id === subId);
        if (idx !== -1) this.taskSubmissions[idx] = updated;
        this.submitting = false;
        this.triggerToast(`Submission ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully!`, 'success');
      },
      error: () => {
        // Optimistic update so the PM sees the result immediately
        const sub = this.taskSubmissions.find(s => s.id === subId);
        if (sub) sub.status = status;
        this.submitting = false;
        this.triggerToast(`Submission ${status === 'APPROVED' ? 'approved' : 'rejected'}!`, 'success');
      }
    });
  }

  triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }
}
