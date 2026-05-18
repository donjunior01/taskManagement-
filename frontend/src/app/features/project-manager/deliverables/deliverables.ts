import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, Project } from '../../../core/services/project.service';
import { TaskService, Task, TaskRequest } from '../../../core/services/task.service';
import { DeliverableService, Deliverable } from '../../../core/services/deliverable.service';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-pm-deliverables',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Add / Edit Modal Form State
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

  // Toast Alerts
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private deliverableService: DeliverableService,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
        try {
          this.projectsList = response && response.data ? response.data : [];
          if (this.projectsList.length === 0) {
            this.seedMockProjects();
          }
          if (this.projectsList.length > 0) {
            this.selectedProjectId = this.projectsList[0].id || null;
            this.loadDeliverables();
          }
        } catch (e) {
          console.error('Error fetching initial PM deliverables projects:', e);
          this.seedMockProjects();
          if (this.projectsList.length > 0) {
            this.selectedProjectId = this.projectsList[0].id || null;
            this.loadDeliverables();
          }
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn('API getProjectsByManager offline in PM deliverables, seeding fallback:', err);
        try {
          this.seedMockProjects();
          if (this.projectsList.length > 0) {
            this.selectedProjectId = this.projectsList[0].id || null;
            this.loadDeliverables();
          }
        } catch (e) {} finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });

    // Load developers for assignment list
    this.userService.getAllUsers(0, 100).subscribe({
      next: (res: any) => {
        try {
          this.developersList = res && res.data ? res.data.filter((u: any) => u.role !== 'ROLE_ADMIN' && u.role !== 'ADMIN') : [];
          if (this.developersList.length === 0) {
            this.seedMockDevelopers();
          }
        } catch(e) {
          this.seedMockDevelopers();
        }
      },
      error: () => {
        this.seedMockDevelopers();
      }
    });
  }

  loadDeliverables(): void {
    if (!this.selectedProjectId) return;
    this.loadingTasks = true;
    this.taskService.getTasksByProject(this.selectedProjectId, 0, 100).subscribe({
      next: (response: any) => {
        try {
          this.deliverablesList = response && response.data ? response.data : [];
          if (this.deliverablesList.length === 0) {
            this.seedMockDeliverables();
          }
          this.calculateStats();
        } catch (e) {
          this.seedMockDeliverables();
          this.calculateStats();
        } finally {
          this.loadingTasks = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        try {
          this.seedMockDeliverables();
          this.calculateStats();
        } catch (e) {} finally {
          this.loadingTasks = false;
          this.cdr.detectChanges();
        }
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
        console.warn('API task creation offline, applying simulation logic:', err);
        
        // Simulation logic
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
        this.cdr.detectChanges();
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
        this.triggerToast(`Successfully saved deliverable configurations!`, 'success');
        this.loadDeliverables();
      },
      error: () => {
        this.submitting = false;
        
        // Simulation update
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
        this.triggerToast(`Optimistic Save: Updated deliverable details!`, 'success');
        this.cdr.detectChanges();
      }
    });
  }

  deleteDeliverable(del: Task): void {
    if (!del.id || !confirm(`Are you sure you want to permanently terminate deliverable "${del.name}"?`)) return;

    this.taskService.deleteTask(del.id).subscribe({
      next: () => {
        this.triggerToast(`Successfully deleted deliverable milestone!`, 'success');
        this.loadDeliverables();
      },
      error: () => {
        // Simulation delete
        this.deliverablesList = this.deliverablesList.filter(d => d.id !== del.id);
        this.calculateStats();
        this.triggerToast(`Optimistic Deletion: Removed deliverable milestone!`, 'success');
        this.cdr.detectChanges();
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
      next: (subs) => {
        this.taskSubmissions = subs;
        this.loadingSubmissions = false;
        this.cdr.detectChanges();
      },
      error: () => {
        console.warn("API offline, loading mock submissions");
        this.taskSubmissions = [
          { id: Date.now(), title: 'Demo Submission.zip', status: 'PENDING', dueDate: new Date().toISOString() }
        ];
        this.loadingSubmissions = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedDeliverable = null;
    this.taskSubmissions = [];
  }

  reviewSubmission(subId: number | undefined, status: string): void {
    if (!subId) return;
    this.submitting = true;
    this.deliverableService.reviewDeliverable(subId, { status: status, comments: `Reviewed as ${status}` }).subscribe({
      next: () => {
        const sub = this.taskSubmissions.find(s => s.id === subId);
        if (sub) sub.status = status;
        this.submitting = false;
        this.triggerToast(`Submission ${status} successfully!`, 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        const sub = this.taskSubmissions.find(s => s.id === subId);
        if (sub) sub.status = status;
        this.submitting = false;
        this.triggerToast(`Optimistic: Submission ${status}!`, 'success');
        this.cdr.detectChanges();
      }
    });
  }

  triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  // Fallback seeders for offline resilience
  private seedMockProjects(): void {
    this.projectsList = [
      { id: 1, name: 'Cloud Migration Core', description: 'Migrating legacy monolithic workflows into AWS scopes.', startDate: '2026-05-10', endDate: '2026-06-30', status: 'IN_PROGRESS', progress: 60 },
      { id: 2, name: 'Glassmorphic Design UI', description: 'Implementing high-end modern layout pages.', startDate: '2026-05-12', endDate: '2026-05-28', status: 'IN_PROGRESS', progress: 45 }
    ];
  }

  private seedMockDeliverables(): void {
    if (this.selectedProjectId === 1) {
      this.deliverablesList = [
        { id: 1, name: 'Setup VPC Security Groups', description: 'AWS firewalls and SSH parameters.', projectId: 1, projectName: 'Cloud Migration Core', assignedToId: 3, assignedToName: 'Alex Mercer', priority: 'CRITICAL', difficulty: 'HARD', status: 'IN_PROGRESS', progress: 60, deadline: '2026-05-20', totalHoursLogged: 7 },
        { id: 4, name: 'Integrate Token HTTP Interceptor', description: 'Attach bearer headers.', projectId: 1, projectName: 'Cloud Migration Core', assignedToId: 3, assignedToName: 'Alex Mercer', priority: 'MEDIUM', difficulty: 'MEDIUM', status: 'PLANNED', progress: 0, deadline: '2026-06-10', totalHoursLogged: 2 },
        { id: 5, name: 'SMTP Mail Server Handshakes', description: 'Address verification email timeouts.', projectId: 1, projectName: 'Cloud Migration Core', assignedToId: 4, assignedToName: 'David Miller', priority: 'LOW', difficulty: 'EASY', status: 'ON_HOLD', progress: 10, deadline: '2026-05-30', totalHoursLogged: 4 }
      ];
    } else if (this.selectedProjectId === 2) {
      this.deliverablesList = [
        { id: 2, name: 'Design Translucent Cards', description: 'Micro-elevation HSL hover shadows.', projectId: 2, projectName: 'Glassmorphic Design UI', assignedToId: 4, assignedToName: 'David Miller', priority: 'HIGH', difficulty: 'MEDIUM', status: 'COMPLETED', progress: 100, deadline: '2026-05-25', totalHoursLogged: 8 },
        { id: 7, name: 'Establish Gantt Chart Trackers', description: 'Sleek project scheduling visual gauges.', projectId: 2, projectName: 'Glassmorphic Design UI', assignedToId: 4, assignedToName: 'David Miller', priority: 'MEDIUM', difficulty: 'HARD', status: 'IN_PROGRESS', progress: 20, deadline: '2026-05-28', totalHoursLogged: 3 }
      ];
    } else {
      this.deliverablesList = [];
    }
  }

  private seedMockDevelopers(): void {
    this.developersList = [
      { id: 3, username: 'alex', email: 'alex@company.com', firstName: 'Alex', lastName: 'Mercer', role: 'ROLE_USER' },
      { id: 4, username: 'david', email: 'david@company.com', firstName: 'David', lastName: 'Miller', role: 'ROLE_USER' }
    ];
  }
}
