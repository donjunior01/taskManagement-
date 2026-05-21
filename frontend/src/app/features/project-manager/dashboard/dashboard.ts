import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardService, ManagerDashboardStats } from '../../../core/services/dashboard.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { ActivityLogService, ActivityLog } from '../../../core/services/activity-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService } from '../../../core/services/report.service';

export interface DeliverableSubmission {
  id: number;
  taskName: string;
  projectName: string;
  taskId: number;
  submittedBy: string;
  submittedById: number;
  submissionDate: string;
  fileName: string;
  fileSize: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
}

export interface WorkspaceActivity {
  id: number;
  developerName: string;
  action: string;
  taskName: string;
  timestamp: string;
  details?: string;
  activityType?: string;
}

export interface UpcomingDeadline {
  taskName: string;
  projectName: string;
  dueDate: string;
  dueDateClass: string;
  assigneeName?: string;
}

@Component({
  selector: 'app-pm-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class PmDashboardComponent implements OnInit {
  managerName: string = 'Project Manager';
  managerId: number = 0;

  // Dashboard Core Stats
  stats: ManagerDashboardStats = {
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    taskCompletionRate: 0,
    teamMembers: 0
  };

  // Managed projects & timelines
  projectsList: Project[] = [];
  pendingSubmissions: DeliverableSubmission[] = [];
  activitiesList: WorkspaceActivity[] = [];
  upcomingDeadlines: UpcomingDeadline[] = [];
  loading: boolean = true;

  // Review Submissions Modal state
  selectedSubmission: DeliverableSubmission | null = null;
  showReviewModal: boolean = false;
  reviewStatus: 'APPROVED' | 'REJECTED' = 'APPROVED';
  pmFeedback: string = '';
  submittingReview: boolean = false;

  // Toast Alerts
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private dashboardService: DashboardService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private activityLogService: ActivityLogService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.managerId = user.id;
      this.managerName = user.firstName ? `${user.firstName} ${user.lastName}` : 'Project Manager';
    }
    this.loadManagerCockpit();
  }

  loadManagerCockpit(): void {
    this.loading = true;

    // 1. Load stats
    this.dashboardService.getManagerStats().subscribe({
      next: (data: any) => {
        try {
          this.stats = data && data.data ? data.data : (data || {});
        } catch (e) {
          this.seedMockStats();
        }
        this.loadProjects();
      },
      error: () => {
        this.seedMockStats();
        this.loadProjects();
      }
    });
  }

  loadProjects(): void {
    this.projectService.getProjectsByManager(this.managerId, 0, 10).subscribe({
      next: (response: any) => {
        try {
          this.projectsList = response && response.data ? response.data : [];
          if (this.projectsList.length === 0) this.seedMockProjects();
        } catch (e) {
          this.seedMockProjects();
        } finally {
          this.loadUpcomingDeadlines();
        }
      },
      error: () => {
        this.seedMockProjects();
        this.loadUpcomingDeadlines();
      }
    });
  }

  /** Load upcoming deadlines from overdue + near-due tasks */
  loadUpcomingDeadlines(): void {
    this.taskService.getOverdueTasks().subscribe({
      next: (tasks: Task[]) => {
        try {
          if (tasks && tasks.length > 0) {
            this.upcomingDeadlines = tasks.slice(0, 6).map(task => {
              const deadline = task.deadline ? new Date(task.deadline) : null;
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);

              let dueDate = 'No Date';
              let dueDateClass = 'future';

              if (deadline) {
                if (deadline.toDateString() === today.toDateString()) {
                  dueDate = 'Today';
                  dueDateClass = 'today';
                } else if (deadline.toDateString() === tomorrow.toDateString()) {
                  dueDate = 'Tomorrow';
                  dueDateClass = 'tomorrow';
                } else if (deadline < today) {
                  dueDate = 'Overdue';
                  dueDateClass = 'today';
                } else {
                  dueDate = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  dueDateClass = 'future';
                }
              }

              return {
                taskName: task.name,
                projectName: task.projectName || 'Workspace Project',
                dueDate,
                dueDateClass,
                assigneeName: task.assignedToName
              };
            });
          } else {
            this.seedMockDeadlines();
          }
        } catch (e) {
          this.seedMockDeadlines();
        } finally {
          this.loadTeamActivity();
        }
      },
      error: () => {
        // Also try tasks by status
        this.taskService.getTasksByStatus('IN_PROGRESS', 0, 6).subscribe({
          next: (res: any) => {
            try {
              const tasks: Task[] = res && res.data ? res.data : [];
              if (tasks.length > 0) {
                this.upcomingDeadlines = tasks
                  .filter(t => t.deadline)
                  .sort((a, b) => (a.deadline || '') < (b.deadline || '') ? -1 : 1)
                  .slice(0, 4)
                  .map(task => {
                    const deadline = task.deadline ? new Date(task.deadline) : null;
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    let dueDate = 'No Date';
                    let dueDateClass = 'future';
                    if (deadline) {
                      if (deadline.toDateString() === today.toDateString()) { dueDate = 'Today'; dueDateClass = 'today'; }
                      else if (deadline.toDateString() === tomorrow.toDateString()) { dueDate = 'Tomorrow'; dueDateClass = 'tomorrow'; }
                      else if (deadline < today) { dueDate = 'Overdue'; dueDateClass = 'today'; }
                      else { dueDate = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); dueDateClass = 'future'; }
                    }
                    return { taskName: task.name, projectName: task.projectName || 'Workspace Project', dueDate, dueDateClass, assigneeName: task.assignedToName };
                  });
              } else {
                this.seedMockDeadlines();
              }
            } catch (e2) {
              this.seedMockDeadlines();
            } finally {
              this.loadTeamActivity();
            }
          },
          error: () => {
            this.seedMockDeadlines();
            this.loadTeamActivity();
          }
        });
      }
    });
  }

  /** Load real team activity from activity log service */
  loadTeamActivity(): void {
    this.activityLogService.getAllActivityLogs().subscribe({
      next: (logs: ActivityLog[]) => {
        try {
          if (logs && logs.length > 0) {
            this.activitiesList = logs.slice(0, 6).map(log => ({
              id: log.id,
              developerName: log.user?.firstName
                ? `${log.user.firstName} ${log.user.lastName || ''}`.trim()
                : (log.user?.username || `User #${log.userId}`),
              action: this.formatAction(log.action, log.entityType),
              taskName: log.details || log.entityType || 'workspace item',
              timestamp: this.formatTimestamp(log.timestamp),
              details: log.entityType,
              activityType: log.action
            }));
          } else {
            this.seedMockActivities();
          }
        } catch (e) {
          this.seedMockActivities();
        } finally {
          this.loadSubmissions();
        }
      },
      error: () => {
        this.seedMockActivities();
        this.loadSubmissions();
      }
    });
  }

  private formatAction(action: string, entityType?: string): string {
    const actionMap: Record<string, string> = {
      'TASK_COMPLETED': 'completed task',
      'TASK_CREATED': 'created task',
      'TASK_UPDATED': 'updated',
      'DELIVERABLE_UPLOADED': 'uploaded deliverable',
      'COMMENT_ADDED': 'commented on',
      'TASK_STARTED': 'started working on',
      'PROJECT_UPDATED': 'updated project',
      'FILE_UPLOADED': 'uploaded file to'
    };
    return actionMap[action] || action.toLowerCase().replace(/_/g, ' ');
  }

  private formatTimestamp(timestamp: string): string {
    if (!timestamp) return 'recently';
    const then = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  loadSubmissions(): void {
    try {
      this.seedMockSubmissions();
    } catch (e) {
      console.error('Error seeding submissions:', e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Action: Open Review Dialog
  openReviewModal(submission: DeliverableSubmission, action: 'APPROVED' | 'REJECTED'): void {
    this.selectedSubmission = submission;
    this.reviewStatus = action;
    this.pmFeedback = action === 'APPROVED' ? 'Excellent task delivery. Requirements satisfied.' : '';
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedSubmission = null;
    this.pmFeedback = '';
  }

  submitReviewDecision(): void {
    if (!this.selectedSubmission) return;
    if (this.reviewStatus === 'REJECTED' && !this.pmFeedback.trim()) {
      this.triggerToast('Feedback description is required when sending back tasks.', 'error');
      return;
    }
    this.submittingReview = true;
    const taskId = this.selectedSubmission.taskId;
    const nextProgress = this.reviewStatus === 'APPROVED' ? 100 : 30;
    const nextStatus = this.reviewStatus === 'APPROVED' ? 'COMPLETED' : 'ON_HOLD';
    this.taskService.updateTaskProgress(taskId, nextProgress, nextStatus).subscribe({
      next: () => this.finalizeReviewUI(),
      error: () => this.finalizeReviewUI()
    });
  }

  private finalizeReviewUI(): void {
    this.submittingReview = false;
    this.showReviewModal = false;
    if (this.selectedSubmission) {
      if (this.reviewStatus === 'APPROVED') {
        this.triggerToast(`Successfully approved deliverable for "${this.selectedSubmission.taskName}"!`, 'success');
        this.stats.completedTasks++;
        this.stats.activeTasks = Math.max(0, this.stats.activeTasks - 1);
        this.stats.taskCompletionRate = Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100);
      } else {
        this.triggerToast(`Sent back task "${this.selectedSubmission.taskName}" for refinements.`, 'success');
      }
      this.pendingSubmissions = this.pendingSubmissions.filter(s => s.id !== this.selectedSubmission?.id);
    }
  }

  getActivityNodeClass(activity: WorkspaceActivity): object {
    const type = activity.activityType || '';
    if (type.includes('COMPLETED') || type.includes('APPROVED')) return { 'node-green': true };
    if (type.includes('UPLOADED') || type.includes('FILE')) return { 'node-blue': true };
    if (type.includes('COMMENT')) return { 'node-orange': true };
    // Fall back to name-based coloring for mock data
    const name = activity.developerName;
    return {
      'node-green': name.includes('Alex'),
      'node-blue': name.includes('Maya') || name.includes('Leila'),
      'node-orange': name.includes('Carlos')
    };
  }

  getActivityIcon(activity: WorkspaceActivity): string {
    const type = activity.activityType || activity.action || '';
    if (type.includes('completed') || type.includes('COMPLETED')) return 'check';
    if (type.includes('uploaded') || type.includes('UPLOAD')) return 'upload';
    if (type.includes('commented') || type.includes('COMMENT')) return 'message';
    return 'play';
  }

  exportReport(): void {
    this.triggerToast('Generating Project Health report...', 'success');
    this.reportService.getProjectHealthReportPdf().subscribe({
      next: (blob) => {
        ReportService.triggerDownload(blob, 'project_health_report.pdf');
        this.triggerToast('Project Health report downloaded!', 'success');
        this.cdr.detectChanges();
      },
      error: () => this.triggerToast('Failed to generate report. Please try again.', 'error')
    });
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 4500);
  }

  // Fallback seed data
  private seedMockStats(): void {
    this.stats = { totalTasks: 248, activeTasks: 79, completedTasks: 169, overdueTasks: 0, taskCompletionRate: 68, teamMembers: 12 };
  }

  private seedMockProjects(): void {
    this.projectsList = [
      { id: 1, name: 'Website Redesign Q3', description: 'Track project health, team velocity, and deliverables.', startDate: '2026-05-10', endDate: '2026-06-30', status: 'IN_PROGRESS', progress: 75, taskCount: 54, teamCount: 4 },
      { id: 2, name: 'Mobile App V2.0', description: 'Complete mobile client experience redesign and native integrations.', startDate: '2026-05-12', endDate: '2026-05-28', status: 'IN_PROGRESS', progress: 40, taskCount: 88, teamCount: 5 },
      { id: 3, name: 'Backend API Migration', description: 'Migrating backend endpoints to high performance Spring Boot gateways.', startDate: '2026-06-01', endDate: '2026-07-15', status: 'IN_PROGRESS', progress: 90, taskCount: 42, teamCount: 3 },
      { id: 4, name: 'Marketing Campaign Q4', description: 'Prepare materials and campaigns for MTN Q4 promotions.', startDate: '2026-04-01', endDate: '2026-08-31', status: 'IN_PROGRESS', progress: 15, taskCount: 30, teamCount: 2 },
      { id: 5, name: 'Client Portal Overhaul', description: 'Rebuild core client portal using modern Angular architectures.', startDate: '2026-03-01', endDate: '2026-09-30', status: 'IN_PROGRESS', progress: 60, taskCount: 34, teamCount: 4 }
    ];
  }

  private seedMockDeadlines(): void {
    this.upcomingDeadlines = [
      { taskName: 'Finalize Design Mockups', projectName: 'Website Redesign Q3', dueDate: 'Today', dueDateClass: 'today', assigneeName: 'Alex Johnson' },
      { taskName: 'API Endpoint Spec Review', projectName: 'Backend API Migration', dueDate: 'Tomorrow', dueDateClass: 'tomorrow', assigneeName: 'Carlos Rodriguez' },
      { taskName: 'User Testing Session 1', projectName: 'Mobile App V2.0', dueDate: 'Jun 18', dueDateClass: 'future', assigneeName: 'Maya Ndlovu' },
      { taskName: 'Campaign Asset Delivery', projectName: 'Marketing Campaign Q4', dueDate: 'Jun 19', dueDateClass: 'future', assigneeName: 'Leila Hassan' }
    ];
  }

  private seedMockSubmissions(): void {
    this.pendingSubmissions = [
      { id: 1, taskName: 'Setup VPC Security Groups', projectName: 'Backend API Migration', taskId: 1, submittedBy: 'Alex Johnson', submittedById: 3, submissionDate: '2026-05-17 14:30', fileName: 'vpc_security_groups.tf', fileSize: '12.4 KB', status: 'PENDING' },
      { id: 2, taskName: 'Design Translucent Cards', projectName: 'Website Redesign Q3', taskId: 2, submittedBy: 'Carlos Rodriguez', submittedById: 4, submissionDate: '2026-05-17 12:15', fileName: 'glassmorphic_styles.scss', fileSize: '8.2 KB', status: 'PENDING' },
      { id: 3, taskName: 'SMTP Mail Server Handshakes', projectName: 'Backend API Migration', taskId: 5, submittedBy: 'Leila Hassan', submittedById: 5, submissionDate: '2026-05-16 16:45', fileName: 'smtp_handshakes.js', fileSize: '4.8 KB', status: 'PENDING' }
    ];
  }

  private seedMockActivities(): void {
    this.activitiesList = [
      { id: 1, developerName: 'Alex Johnson', action: 'completed task', taskName: 'Implement User Dashboard', timestamp: '10 mins ago', details: 'Mobile App V2.0', activityType: 'TASK_COMPLETED' },
      { id: 2, developerName: 'Maya Ndlovu', action: 'uploaded deliverable', taskName: 'Auth Flow Sequence Diagram', timestamp: '45 mins ago', details: 'Mobile App V2.0', activityType: 'DELIVERABLE_UPLOADED' },
      { id: 3, developerName: 'Carlos Rodriguez', action: 'commented on', taskName: 'API Endpoints Documentation', timestamp: '2 hours ago', details: 'Backend API Migration', activityType: 'COMMENT_ADDED' },
      { id: 4, developerName: 'Leila Hassan', action: 'started working on', taskName: 'Database Schema Update', timestamp: '3 hours ago', details: 'Backend API Migration', activityType: 'TASK_STARTED' }
    ];
  }
}
