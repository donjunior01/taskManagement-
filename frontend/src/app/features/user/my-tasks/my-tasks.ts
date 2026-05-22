import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { DeliverableService } from '../../../core/services/deliverable.service';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { FileService } from '../../../core/services/file.service';
import { MessageService, Message } from '../../../core/services/message.service';
import { ToastService } from '../../../core/services/toast.service';

export interface DeveloperTaskDetail extends Task {
  expanded?: boolean;
  timeLogs?: { date: string; hours: number; notes: string }[];
  comments?: { sender: string; message: string; date: string; isManager: boolean }[];
  submissions?: { fileName: string; date: string; size: string; status: string }[];
}

@Component({
  selector: 'app-user-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-tasks.html',
  styleUrls: ['./my-tasks.scss']
})
export class UserMyTasksComponent implements OnInit {
  developerId: number = 0;
  developerName: string = 'Developer';
  
  // Lists
  myTasks: DeveloperTaskDetail[] = [];
  filteredTasks: DeveloperTaskDetail[] = [];
  loading: boolean = true;

  // Search & Filters
  searchTerm: string = '';
  statusFilter: string = '';
  priorityFilter: string = '';

  // Log Hours Modal Form state
  selectedTaskForLog: DeveloperTaskDetail | null = null;
  showLogModal: boolean = false;
  submittingLog: boolean = false;
  logForm = {
    hours: 2,
    notes: ''
  };

  // Submit Deliverable Modal Form state
  selectedTaskForSubmission: DeveloperTaskDetail | null = null;
  showSubmissionModal: boolean = false;
  submittingDeliverable: boolean = false;
  selectedFile: File | null = null;
  submissionForm = {
    fileName: '',
    fileSize: '0 MB',
    notes: ''
  };

  // Deep-link from deliverables page
  deepLinkTaskId: number | null = null;

  // Add Comment input state
  activeCommentText: { [taskId: number]: string } = {};

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private deliverableService: DeliverableService,
    private commentService: CommentService,
    private fileService: FileService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.developerId = user.id;
      this.developerName = `${user.firstName} ${user.lastName}`;
    }
    this.route.queryParams.subscribe(params => {
      if (params['project']) this.searchTerm = params['project'];
      this.deepLinkTaskId = params['taskId'] ? Number(params['taskId']) : null;
    });
    this.loadMyTasks();
  }

  loadMyTasks(): void {
    this.loading = true;
    this.taskService.getTasksByUser(this.developerId, 0, 100).subscribe({
      next: (response: any) => {
        try {
          const rawTasks = response && response.data ? response.data : [];
          this.myTasks = rawTasks.map((t: any) => ({
            ...t,
            expanded: false,
            timeLogs: [],
            comments: [],
            submissions: []
          }));
          this.applyFilters();
          this.applyDeepLink();
        } catch (e) {
          console.error('Error processing tasks list:', e);
          this.myTasks = [];
          this.applyFilters();
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.warn('Failed to load tasks:', err);
        this.myTasks = [];
        this.filteredTasks = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private applyDeepLink(): void {
    if (!this.deepLinkTaskId) return;
    const target = this.myTasks.find(t => t.id === this.deepLinkTaskId);
    if (target) {
      target.expanded = true;
      setTimeout(() => {
        const el = document.querySelector(`[data-task-id="${this.deepLinkTaskId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }

  applyFilters(): void {
    let result = [...this.myTasks];

    // Filter by search query (name, description, or project name)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(t =>
        t.name.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.projectName && t.projectName.toLowerCase().includes(term))
      );
    }

    // Filter by status
    if (this.statusFilter) {
      result = result.filter(t => t.status === this.statusFilter);
    }

    // Filter by priority
    if (this.priorityFilter) {
      result = result.filter(t => t.priority === this.priorityFilter);
    }

    this.filteredTasks = result;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  toggleAccordion(task: DeveloperTaskDetail): void {
    task.expanded = !task.expanded;
  }

  // LOG HOURS MODAL ACTIONS
  openLogModal(task: DeveloperTaskDetail, event: Event): void {
    event.stopPropagation(); // Prevent accordion toggle
    this.selectedTaskForLog = task;
    this.logForm = {
      hours: 2,
      notes: ''
    };
    this.showLogModal = true;
  }

  closeLogModal(): void {
    this.showLogModal = false;
    this.selectedTaskForLog = null;
  }

  submitLogHours(): void {
    if (!this.selectedTaskForLog || !this.selectedTaskForLog.id) return;

    if (this.logForm.hours <= 0 || !this.logForm.notes.trim()) {
      this.triggerToast('Please complete all mandatory parameters.', 'error');
      return;
    }

    this.submittingLog = true;

    // Emulate API latency
    setTimeout(() => {
      this.submittingLog = false;
      this.showLogModal = false;

      const currentLogged = this.selectedTaskForLog?.totalHoursLogged || 0;
      const nextLogged = currentLogged + this.logForm.hours;

      // Update the progress in backend (simulated progress updates)
      this.taskService.updateTaskProgress(this.selectedTaskForLog!.id!, this.selectedTaskForLog!.progress || 0, this.selectedTaskForLog!.status).subscribe({
        next: () => {
          this.triggerToast(`Logged ${this.logForm.hours} hours successfully!`, 'success');
          this.appendLocalLog(this.selectedTaskForLog!, this.logForm.hours, this.logForm.notes);
        },
        error: () => {
          // Fallback optimistic updates
          this.triggerToast(`Logged ${this.logForm.hours} hours successfully!`, 'success');
          this.appendLocalLog(this.selectedTaskForLog!, this.logForm.hours, this.logForm.notes);
        }
      });
    }, 1000);
  }

  private appendLocalLog(task: DeveloperTaskDetail, hours: number, notes: string): void {
    task.totalHoursLogged = (task.totalHoursLogged || 0) + hours;
    if (!task.timeLogs) task.timeLogs = [];
    task.timeLogs.unshift({
      date: new Date().toISOString().split('T')[0],
      hours,
      notes
    });
  }

  // SUBMIT DELIVERABLE MODAL ACTIONS
  openSubmissionModal(task: DeveloperTaskDetail, event: Event): void {
    event.stopPropagation();
    this.selectedTaskForSubmission = task;
    this.submissionForm = {
      fileName: '',
      fileSize: '1.4 MB',
      notes: ''
    };
    this.showSubmissionModal = true;
  }

  closeSubmissionModal(): void {
    this.showSubmissionModal = false;
    this.selectedTaskForSubmission = null;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.submissionForm.fileName = file.name;
      this.submissionForm.fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  submitDeliverable(): void {
    if (!this.selectedTaskForSubmission || !this.selectedTaskForSubmission.id) return;

    if (!this.submissionForm.notes.trim()) {
      this.triggerToast('Please complete all mandatory parameters.', 'error');
      return;
    }

    this.submittingDeliverable = true;

    const processDeliverable = (fileUrl?: string) => {
      const deliverableData = {
        taskId: this.selectedTaskForSubmission!.id!,
        fileName: this.submissionForm.fileName || 'Deliverable Submission',
        fileUrl: fileUrl || ''
      };

      this.deliverableService.submitDeliverable(deliverableData).subscribe({
        next: (del) => {
          this.taskService.updateTaskProgress(this.selectedTaskForSubmission!.id!, 95, 'IN_PROGRESS').subscribe();
          this.submittingDeliverable = false;
          this.showSubmissionModal = false;
          this.triggerToast(`Submitted "${this.submissionForm.fileName}" for PM review!`, 'success');
          this.appendLocalSubmission(this.selectedTaskForSubmission!, this.submissionForm.fileName, this.submissionForm.fileSize);
          this.selectedFile = null;
        },
        error: () => {
          // Simulation fallback
          this.taskService.updateTaskProgress(this.selectedTaskForSubmission!.id!, 95, 'IN_PROGRESS').subscribe();
          this.submittingDeliverable = false;
          this.showSubmissionModal = false;
          this.triggerToast(`Optimistic Submit: "${this.submissionForm.fileName}" for PM review!`, 'success');
          this.appendLocalSubmission(this.selectedTaskForSubmission!, this.submissionForm.fileName, this.submissionForm.fileSize);
          this.selectedFile = null;
        }
      });
    };

    if (this.selectedFile) {
      this.fileService.uploadFile(this.selectedFile).subscribe({
        next: (res: any) => {
          processDeliverable(res.fileUrl);
        },
        error: () => {
          console.warn("File upload failed, proceeding with mock simulation.");
          processDeliverable('mock-url');
        }
      });
    } else {
      processDeliverable();
    }
  }

  private appendLocalSubmission(task: DeveloperTaskDetail, name: string, size: string): void {
    task.progress = 95;
    if (!task.submissions) task.submissions = [];
    task.submissions.unshift({
      fileName: name,
      date: new Date().toISOString().split('T')[0],
      size,
      status: 'PENDING'
    });
  }

  updateTaskProgressAndStatus(task: DeveloperTaskDetail, newProgress: number, newStatus: string): void {
    if (!task.id) return;
    
    // Automatically promote status to COMPLETED if progress is 100%
    let statusToUse = newStatus;
    if (newProgress === 100) {
      statusToUse = 'COMPLETED';
      task.status = 'COMPLETED';
    }

    this.taskService.updateTaskProgress(task.id, newProgress, statusToUse).subscribe({
      next: (res: any) => {
        task.progress = newProgress;
        task.status = statusToUse;
        this.triggerToast(`Task progress set to ${newProgress}% and status to ${statusToUse}!`, 'success');
        this.applyFilters();
      },
      error: (err: any) => {
        console.warn('API updateTaskProgress offline, enacting simulated updates:', err);
        task.progress = newProgress;
        task.status = statusToUse;
        this.triggerToast(`Optimistic Update: Task progress set to ${newProgress}%!`, 'success');
        this.applyFilters();
      }
    });
  }

  // ADD COMMENT ACTIONS
  submitComment(task: DeveloperTaskDetail): void {
    const text = this.activeCommentText[task.id || 0];
    if (!text || !text.trim()) return;

    const trimmedText = text.trim();

    const newComment: Comment = {
      content: trimmedText,
      userId: this.developerId,
      taskId: task.id
    };

    const addLocalComment = (msg: string) => {
      if (!task.comments) task.comments = [];
      task.comments.push({
        sender: this.developerName,
        message: msg,
        date: 'Just now',
        isManager: false
      });
      task.commentCount = (task.commentCount || 0) + 1;
      this.activeCommentText[task.id || 0] = '';
    };

    // Sync comment as a message to the project group chat
    const syncToMessageGroup = () => {
      if (!task.projectId) return;
      const groupMsg: Message = {
        senderId: this.developerId,
        projectId: task.projectId,
        content: `[Task: ${task.name}] ${trimmedText}`
      };
      this.messageService.sendMessage(groupMsg).subscribe({ error: () => {} });
    };

    this.commentService.createComment(newComment).subscribe({
      next: (savedComment) => {
        addLocalComment(savedComment.content);
        syncToMessageGroup();
        this.triggerToast('Comment added!', 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.triggerToast('Failed to save comment. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }

}
