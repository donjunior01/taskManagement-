import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TimeLogService } from '../../../core/services/time-log.service';
import { BadgeCountsService } from '../../../core/services/badge-counts.service';
import { UserService } from '../../../core/services/user.service';
import { ActivityLogService } from '../../../core/services/activity-log.service';
import { ToastService } from '../../../core/services/toast.service';

export interface ActivityFeed {
  id: number;
  projectName: string;
  taskName: string;
  type: 'COMMENT' | 'REVISION' | 'APPROVAL' | 'DEADLINE';
  message: string;
  timestamp: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class UserDashboardComponent implements OnInit {
  currentUser: any;
  tasksList: Task[] = [];
  projectsList: Project[] = [];
  activityFeed: ActivityFeed[] = [];
  loading: boolean = true;

  // Kanban bins
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  completedTasks: Task[] = [];

  // Deadlines
  upcomingDeadlines: any[] = [];

  // Quick log form state
  quickLog: any = {
    taskId: '',
    hours: '',
    date: ''
  };

  // KPIs
  openTasksCount: number = 0;
  dueTodayCount: number = 0;
  loggedHoursCount: number = 0;
  unreadMessagesCount: number = 0;

  /** Number of projects the current user works on (from the user DTO). */
  get projectCount(): number { return this.currentUser?.projectCount ?? 0; }

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private taskService: TaskService,
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private timeLogService: TimeLogService,
    private activityLogService: ActivityLogService,
    private badges: BadgeCountsService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.quickLog.date = new Date().toISOString().split('T')[0];
    
    // Subscribe to live unread message counts from global BadgeCountsService
    this.badges.messages$.subscribe(n => {
      this.unreadMessagesCount = n;
      this.cdr.detectChanges();
    });

    // Load full user details to ensure firstName is properly loaded.
    // GET /users/{id} returns a wrapped DTO ({ success, message, data }), so unwrap .data.
    this.userService.getUserById(this.currentUser.id).subscribe({
      next: (res: any) => {
        const u = res?.data ?? res;
        if (u) {
          this.currentUser = { ...this.currentUser, ...u };
          this.authService.updateCurrentUser({ firstName: u.firstName, lastName: u.lastName, email: u.email });
          this.cdr.detectChanges();
        }
      }
    });

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    if (!this.currentUser || !this.currentUser.id) {
      this.loading = false;
      return;
    }

    // Load total hours logged
    this.timeLogService.getTotalHoursByUser(this.currentUser.id).subscribe({
      next: (response: any) => {
        this.loggedHoursCount = (response && response.data !== undefined) ? response.data : (response || 0);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loggedHoursCount = 0;
      }
    });

    // Load tasks list
    this.taskService.getTasksByUser(this.currentUser.id, 0, 100).subscribe({
      next: (response: any) => {
        try {
          this.tasksList = response && response.data ? response.data : [];
          this.calculateStats();
        } catch (e) {
          this.tasksList = [];
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.tasksList = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    // Load activities (from notifications)
    this.loadActivityFeed();
  }

  submitQuickLog(): void {
    if (!this.quickLog.taskId) { this.toast.show('Veuillez sélectionner une tâche.', 'error'); return; }
    const hours = Number(this.quickLog.hours);
    if (!hours || hours <= 0) { this.toast.show('Veuillez saisir un nombre d\'heures valide.', 'error'); return; }
    if (!this.quickLog.date) { this.toast.show('Veuillez choisir une date.', 'error'); return; }
    const dayStr = this.quickLog.date;
    // Same payload shape as the "Suivi du Temps" page (sends both hours/date and hoursSpent/logDate).
    const log = {
      taskId: Number(this.quickLog.taskId),
      hours,
      date: dayStr,
      description: 'Log rapide depuis le tableau de bord',
      hoursSpent: hours,
      logDate: dayStr
    };
    this.timeLogService.createTimeLog(log as any).subscribe({
      next: () => {
        this.quickLog.taskId = '';
        this.quickLog.hours = '';
        this.quickLog.date = new Date().toISOString().split('T')[0];
        this.loadDashboardData();
        this.toast.show('Temps enregistré.', 'success');
      },
      error: () => {
        this.toast.show('Échec de l\'enregistrement du temps.', 'error');
      }
    });
  }

  /**
   * Loads the Recent Activity Feed from the user's own notifications.
   * (The global /api/activity-logs endpoint is admin/manager-only — calling it as a
   * collaborator returns 403, so we use notifications, which every user can read.)
   */
  private loadActivityFeed(): void {
    this.notificationService.getNotifications().subscribe({
      next: (response: any) => {
        const items: any[] = Array.isArray(response) ? response : (response && response.data ? response.data : []);
        this.activityFeed = items.slice(0, 5).map((n: any) => ({
          id: n.id,
          projectName: n.referenceType || 'Notification',
          taskName: n.title || 'Système',
          type: this.mapActivityLogType(n.type),
          message: n.message || n.title || '',
          timestamp: this.relativeTime(n.createdAt)
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.activityFeed = [];
        this.cdr.detectChanges();
      }
    });
  }

  private mapActivityLogType(type: string): 'COMMENT' | 'REVISION' | 'APPROVAL' | 'DEADLINE' {
    switch (type) {
      case 'COMMENT_ADDED':
        return 'COMMENT';
      case 'TASK_COMPLETED':
      case 'DELIVERABLE_REVIEWED':
        return 'APPROVAL';
      case 'TASK_UPDATED':
      case 'PROJECT_UPDATED':
      case 'DELIVERABLE_SUBMITTED':
        return 'REVISION';
      default:
        return 'DEADLINE';
    }
  }

  private relativeTime(iso: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    const diffMin = Math.round((Date.now() - then) / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH} h`;
    const diffD = Math.round(diffH / 24);
    return `Il y a ${diffD} j`;
  }

  private calculateStats(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // KPIs count
    this.openTasksCount = this.tasksList.filter(t => t.status !== 'COMPLETED').length;
    this.dueTodayCount = this.tasksList.filter(t => t.status !== 'COMPLETED' && t.deadline === todayStr).length;

    // Kanban Bins
    this.todoTasks = this.tasksList.filter(t => t.status === 'PLANNED' || t.status === 'TODO');
    this.inProgressTasks = this.tasksList.filter(t => t.status === 'IN_PROGRESS');
    this.completedTasks = this.tasksList.filter(t => t.status === 'COMPLETED');

    // Deadlines
    this.upcomingDeadlines = this.tasksList
      .filter(t => t.status !== 'COMPLETED' && t.deadline)
      .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
      .slice(0, 5)
      .map(t => {
        let dateLabel = t.deadline || '';
        let dotClass = 'bg-purple-500';
        if (t.deadline === todayStr) {
          dateLabel = "Aujourd'hui";
          dotClass = 'bg-red-500';
        } else if (t.deadline === tomorrowStr) {
          dateLabel = 'Demain';
          dotClass = 'bg-amber-500';
        }
        return {
          name: t.name,
          projectName: t.projectName || 'Projet',
          dateLabel,
          dotClass
        };
      });
  }

  formatDeadline(deadline: string | undefined): string {
    if (!deadline) return '';
    const parts = deadline.split('-');
    if (parts.length === 3) {
      return `${parts[1]}-${parts[2]}`;
    }
    return deadline;
  }
}
