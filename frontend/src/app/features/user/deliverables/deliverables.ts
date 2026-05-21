import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService, Task } from '../../../core/services/task.service';
import { DeliverableService, Deliverable } from '../../../core/services/deliverable.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService, Project } from '../../../core/services/project.service';

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
  
  // Modal state
  showSubmitModal: boolean = false;
  selectedTask: Task | null = null;
  
  // Submit Form state
  submissionForm = {
    fileUrl: '',
    fileName: '',
    fileSize: 1024 * 512 // 512 KB mockup
  };
  
  // Filters
  searchTerm: string = '';
  selectedProjectFilter: string = '';
  selectedStatusFilter: string = '';
  
  // Stats
  stats = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  };
  
  // Toast Alert setup
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimeout: any = null;

  constructor(
    private taskService: TaskService,
    private deliverableService: DeliverableService,
    private authService: AuthService,
    private projectService: ProjectService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
    
    // Fetch user tasks
    this.taskService.getTasksByUser(this.userId, 0, 100).subscribe({
      next: (taskRes: any) => {
        this.tasksList = taskRes && taskRes.data ? taskRes.data : [];
        this.loadSubmissions();
      },
      error: (err: any) => {
        console.warn('API offline, loading mock deliverables data:', err);
        this.seedMockData();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
    
    // Fetch all projects for filtering — deferred to avoid NG0100
    this.projectService.getAllProjects(0, 100).subscribe({
      next: (projectRes: any) => {
        Promise.resolve().then(() => {
          this.projectsList = projectRes && projectRes.data ? projectRes.data : [];
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  loadSubmissions(): void {
    this.deliverableService.getMyDeliverables().subscribe({
      next: (subRes: any) => {
        const rawList = subRes && subRes.data ? subRes.data : (Array.isArray(subRes) ? subRes : []);
        this.submissionsList = rawList.map((s: any) => ({
           id: s.id,
           title: s.fileName || s.title || 'Untitled',
           description: s.comments || s.description || 'No description provided',
           status: s.status || 'PENDING',
           dueDate: s.createdAt || s.dueDate || '',
           taskId: s.taskId,
           userId: s.submittedById || s.userId,
           fileUrl: s.fileUrl
        }));
        this.calculateStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.seedMockData();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  seedMockData(): void {
    // Mock user tasks
    this.tasksList = [
      { id: 10, name: 'VPC Gateway Configuration & Routing', projectName: 'Cloud Migration & Core Infrastructure', status: 'IN_PROGRESS', progress: 80, priority: 'CRITICAL', difficulty: 'HIGH', deadline: '2026-05-30' },
      { id: 11, name: 'Setup PostgreSQL Database Clusters', projectName: 'Cloud Migration & Core Infrastructure', status: 'COMPLETED', progress: 100, priority: 'CRITICAL', difficulty: 'HIGH', deadline: '2026-05-15' },
      { id: 12, name: 'Integrate Stripe Payment Gateway Core', projectName: 'Next-Gen Mobile Commerce App', status: 'IN_PROGRESS', progress: 50, priority: 'HIGH', difficulty: 'MEDIUM', deadline: '2026-06-10' },
      { id: 13, name: 'Construct ElasticSearch Schema Architecture', projectName: 'Enterprise Data Lake Platform', status: 'PLANNED', progress: 0, priority: 'MEDIUM', difficulty: 'MEDIUM', deadline: '2026-06-25' }
    ];
    
    // Mock submissions mapped to those tasks
    this.submissionsList = [
      {
        id: 201,
        title: 'PostgreSQL DB Clustered Seeder Scripts',
        description: 'Approved setup configurations for database scaling.',
        status: 'APPROVED',
        dueDate: '2026-05-15',
        taskId: 11,
        userId: this.userId,
        fileUrl: 'https://github.com/corp/migration-configs/blob/main/postgres-seeder.sql'
      },
      {
        id: 202,
        title: 'VPC Routing Tables Routing Config Link',
        description: 'VPC private/public subnet route configuration mappings for Olivia Vance reviews.',
        status: 'PENDING',
        dueDate: '2026-05-30',
        taskId: 10,
        userId: this.userId,
        fileUrl: 'https://github.com/corp/migration-configs/blob/main/vpc-routing.tf'
      }
    ];
    
    this.projectsList = [
      { id: 1, name: 'Cloud Migration & Core Infrastructure' },
      { id: 2, name: 'Next-Gen Mobile Commerce App' },
      { id: 3, name: 'Enterprise Data Lake Platform' }
    ];
    
    this.calculateStats();
  }

  calculateStats(): void {
    this.stats.total = this.tasksList.length;
    this.stats.approved = this.submissionsList.filter(s => s.status === 'APPROVED').length;
    this.stats.pending = this.submissionsList.filter(s => s.status === 'PENDING').length;
    this.stats.rejected = this.submissionsList.filter(s => s.status === 'REJECTED' || s.status === 'REVISION').length;
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
    // If the click came from a button inside the card, don't navigate
    if ((event.target as HTMLElement).closest('button, a')) return;
    this.router.navigate(['/user/my-tasks'], {
      queryParams: { project: task.projectName, taskId: task.id }
    });
  }

  openSubmitModal(task: Task): void {
    this.selectedTask = task;
    this.submissionForm.fileName = `${task.name.replace(/\s+/g, '_')}_submission.zip`;
    this.submissionForm.fileUrl = 'https://github.com/corp/repository/pull/';
    this.showSubmitModal = true;
    this.cdr.detectChanges();
  }

  closeSubmitModal(): void {
    this.showSubmitModal = false;
    this.selectedTask = null;
    this.cdr.detectChanges();
  }

  submitDeliverableForm(): void {
    if (!this.selectedTask || !this.selectedTask.id) return;
    if (!this.submissionForm.fileName.trim() || !this.submissionForm.fileUrl.trim()) {
      this.triggerToast('Please fill out all required fields.', 'error');
      return;
    }
    
    this.submitting = true;
    
    const payload = {
      taskId: this.selectedTask.id,
      fileName: this.submissionForm.fileName,
      fileUrl: this.submissionForm.fileUrl
    };
    
    this.deliverableService.submitDeliverable(payload as any).subscribe({
      next: (res: any) => {
        const savedSub = res && res.data ? res.data : res;
        this.submissionsList.push({
           id: savedSub.id,
           title: savedSub.fileName || this.submissionForm.fileName,
           description: savedSub.comments || `Submission link uploaded by ${this.userName} for task: ${this.selectedTask?.name}`,
           status: savedSub.status || 'PENDING',
           dueDate: savedSub.createdAt || new Date().toISOString().split('T')[0],
           taskId: savedSub.taskId || this.selectedTask?.id,
           userId: savedSub.submittedById || this.userId,
           fileUrl: savedSub.fileUrl || this.submissionForm.fileUrl
        });
        this.calculateStats();
        this.triggerToast('Deliverable submitted successfully for Manager review!', 'success');
        this.closeSubmitModal();
        this.submitting = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.warn('API error, saving local simulated submission:', err);
        // Simulate local submission
        const localMock: Deliverable = {
          id: Math.floor(Math.random() * 1000) + 300,
          title: this.submissionForm.fileName,
          description: `Submission link uploaded for task: ${this.selectedTask?.name}`,
          status: 'PENDING',
          dueDate: this.selectedTask?.deadline || new Date().toISOString().split('T')[0],
          taskId: this.selectedTask?.id,
          userId: this.userId,
          fileUrl: this.submissionForm.fileUrl
        };
        this.submissionsList.push(localMock);
        this.calculateStats();
        this.triggerToast('Simulated submission saved! Ready for Review.', 'success');
        this.closeSubmitModal();
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 4000);
  }
}
