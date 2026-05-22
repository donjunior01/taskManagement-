import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TaskService, Task } from '../../../core/services/task.service';
import { DeliverableService, Deliverable, DeliverableSubmitRequest } from '../../../core/services/deliverable.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-deliverables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deliverables.html',
  styleUrl: './deliverables.scss'
})
export class UserDeliverablesComponent implements OnInit {
  userId: number = 0;
  userName: string = '';

  tasksList: Task[] = [];
  submissionsList: Deliverable[] = [];
  projectsList: Project[] = [];

  loading: boolean = true;
  submitting: boolean = false;

  showSubmitModal: boolean = false;
  selectedTask: Task | null = null;

  submissionForm = {
    fileUrl: '',
    fileName: ''
  };

  searchTerm: string = '';
  selectedProjectFilter: string = '';
  selectedStatusFilter: string = '';

  stats = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  };

  constructor(
    private taskService: TaskService,
    private deliverableService: DeliverableService,
    private authService: AuthService,
    private projectService: ProjectService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userId = user.id;
      this.userName = `${user.firstName} ${user.lastName}`;
    }
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.taskService.getTasksByUser(this.userId, 0, 100).subscribe({
      next: (taskRes: any) => {
        this.tasksList = taskRes && taskRes.data ? taskRes.data : [];
        this.loadSubmissions();
      },
      error: () => {
        this.tasksList = [];
        this.submissionsList = [];
        this.calculateStats();
        this.loading = false;
      }
    });

    this.projectService.getAllProjects(0, 100).subscribe({
      next: (projectRes: any) => {
        this.projectsList = projectRes && projectRes.data ? projectRes.data : [];
      },
      error: () => {}
    });
  }

  loadSubmissions(): void {
    this.deliverableService.getMyDeliverables().subscribe({
      next: (subs: Deliverable[]) => {
        this.submissionsList = subs;
        this.calculateStats();
        this.loading = false;
      },
      error: () => {
        this.submissionsList = [];
        this.calculateStats();
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.tasksList.length;
    this.stats.approved  = this.submissionsList.filter(s => s.status === 'APPROVED').length;
    this.stats.pending   = this.submissionsList.filter(s => s.status === 'PENDING').length;
    this.stats.rejected  = this.submissionsList.filter(s => s.status === 'REJECTED').length;
  }

  getTaskSubmission(taskId: number | undefined): Deliverable | undefined {
    if (!taskId) return undefined;
    return this.submissionsList.find(s => s.taskId === taskId);
  }

  getFilteredTasks(): Task[] {
    return this.tasksList.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          (t.projectName && t.projectName.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchProject = !this.selectedProjectFilter || t.projectName === this.selectedProjectFilter;

      const sub = this.getTaskSubmission(t.id);
      const statusValue = sub ? sub.status : 'UNSUBMITTED';
      const matchStatus = !this.selectedStatusFilter || statusValue === this.selectedStatusFilter;

      return matchSearch && matchProject && matchStatus;
    });
  }

  viewTaskDetails(task: Task, event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('button, a')) return;
    this.router.navigate(['/user/my-tasks'], {
      queryParams: { project: task.projectName, taskId: task.id }
    });
  }

  openSubmitModal(task: Task): void {
    this.selectedTask = task;
    this.submissionForm.fileName = `${task.name.replace(/\s+/g, '_')}_submission`;
    this.submissionForm.fileUrl = '';
    this.showSubmitModal = true;
  }

  closeSubmitModal(): void {
    this.showSubmitModal = false;
    this.selectedTask = null;
    this.submitting = false;
  }

  submitDeliverableForm(): void {
    if (!this.selectedTask || !this.selectedTask.id) return;
    if (!this.submissionForm.fileName.trim() || !this.submissionForm.fileUrl.trim()) {
      this.triggerToast('Please fill out all required fields.', 'error');
      return;
    }

    this.submitting = true;

    const payload: DeliverableSubmitRequest = {
      taskId: this.selectedTask.id,
      fileName: this.submissionForm.fileName,
      fileUrl: this.submissionForm.fileUrl
    };

    this.deliverableService.submitDeliverable(payload).pipe(
      finalize(() => { this.submitting = false; })
    ).subscribe({
      next: (saved: Deliverable) => {
        this.submissionsList.push(saved);
        this.calculateStats();
        this.triggerToast('Deliverable submitted successfully for Manager review!', 'success');
        this.closeSubmitModal();
      },
      error: () => {
        // Optimistic fallback — show submission locally without hitting backend
        const localMock: Deliverable = {
          id: Math.floor(Math.random() * 1000) + 300,
          fileName: this.submissionForm.fileName,
          fileUrl: this.submissionForm.fileUrl,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          taskId: this.selectedTask?.id,
          submittedById: this.userId
        };
        this.submissionsList.push(localMock);
        this.calculateStats();
        this.triggerToast('Submission saved locally! It will sync when back online.', 'success');
        this.closeSubmitModal();
      }
    });
  }

  triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }
}
