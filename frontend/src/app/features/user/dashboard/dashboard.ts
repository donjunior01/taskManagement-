import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';

export interface DeveloperStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  totalProjects: number;
}

export interface ActivityFeed {
  id: number;
  projectName: string;
  taskName: string;
  type: 'COMMENT' | 'REVISION' | 'APPROVAL' | 'DEADLINE';
  message: string;
  timestamp: string;
}

export interface ChartSegment {
  label: string;
  count: number;
  pct: number;
  cls: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class UserDashboardComponent implements OnInit {
  currentUser: any;
  tasksList: Task[] = [];
  projectsList: Project[] = [];
  urgentTasks: Task[] = [];
  activityFeed: ActivityFeed[] = [];
  loading: boolean = true;

  // Quick-summary charts (custom SVG/CSS, no external chart library).
  statusChart: ChartSegment[] = [];
  priorityChart: ChartSegment[] = [];
  donutSegments: { seg: ChartSegment; dash: string; rotation: number }[] = [];
  
  stats: DeveloperStats = {
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    totalProjects: 0
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private taskService: TaskService,
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    console.log('UserDashboardComponent: loadDashboardData started. Current user:', this.currentUser);
    this.loading = true;
    
    if (!this.currentUser || !this.currentUser.id) {
      this.loading = false;
      return;
    }

    this.taskService.getTasksByUser(this.currentUser.id, 0, 100).subscribe({
      next: (response: any) => {
        try {
          this.tasksList = response && response.data ? response.data : [];
          this.calculateStats();
          this.buildCharts();
          if (this.tasksList.length > 0) {
            this.loadProjectsFromTasks();
          }
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

    // Collaboration Feed & Alerts — real data from the user's notifications.
    this.loadActivityFeed();
  }

  /** Builds the Collaboration Feed from the user's real notifications. */
  private loadActivityFeed(): void {
    this.notificationService.getNotifications().subscribe({
      next: (response: any) => {
        const items: any[] = response?.data || response?.content
          || (Array.isArray(response) ? response : []);
        this.activityFeed = items.slice(0, 8).map((n: any) => ({
          id: n.id,
          projectName: n.referenceType || 'Workspace',
          taskName: n.title || '',
          type: this.mapNotificationType(n.type),
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

  private mapNotificationType(type: string): 'COMMENT' | 'REVISION' | 'APPROVAL' | 'DEADLINE' {
    switch (type) {
      case 'COMMENT': return 'COMMENT';
      case 'TASK_COMPLETED': return 'APPROVAL';
      case 'TASK_UPDATED':
      case 'DELIVERABLE_DUE': return 'REVISION';
      case 'TASK_ASSIGNED':
      case 'REMINDER': return 'DEADLINE';
      default: return 'COMMENT';
    }
  }

  private relativeTime(iso: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    const diffMin = Math.round((Date.now() - then) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.round(diffH / 24);
    return `${diffD}d ago`;
  }

  /** Computes task status & priority distributions for the summary charts. */
  private buildCharts(): void {
    const total = this.tasksList.length || 1;
    const todayStr = new Date().toISOString().split('T')[0];

    const completed = this.tasksList.filter(t => t.status === 'COMPLETED').length;
    const inProgress = this.tasksList.filter(t => t.status === 'IN_PROGRESS').length;
    const overdue = this.tasksList.filter(t =>
      t.status !== 'COMPLETED' && t.deadline && t.deadline < todayStr).length;
    const planned = this.tasksList.length - completed - inProgress - overdue;

    this.statusChart = [
      { label: 'Completed', count: completed, pct: Math.round((completed / total) * 100), cls: 'seg-green' },
      { label: 'In Progress', count: inProgress, pct: Math.round((inProgress / total) * 100), cls: 'seg-blue' },
      { label: 'Planned', count: Math.max(0, planned), pct: Math.round((Math.max(0, planned) / total) * 100), cls: 'seg-slate' },
      { label: 'Overdue', count: overdue, pct: Math.round((overdue / total) * 100), cls: 'seg-red' }
    ].filter(s => s.count > 0);

    // Donut segments (each ring normalised to pathLength=100, rotated to start
    // where the previous segment ended; -90 puts the first segment at 12 o'clock).
    let acc = 0;
    this.donutSegments = this.statusChart.map(seg => {
      const len = (seg.count / total) * 100;
      const o = { seg, dash: `${len} ${100 - len}`, rotation: (acc / 100) * 360 - 90 };
      acc += len;
      return o;
    });

    const prio = (p: string) => this.tasksList.filter(t => (t.priority || 'MEDIUM') === p).length;
    const maxPrio = Math.max(1, prio('CRITICAL'), prio('HIGH'), prio('MEDIUM'), prio('LOW'));
    this.priorityChart = [
      { label: 'Critical', count: prio('CRITICAL'), pct: Math.round((prio('CRITICAL') / maxPrio) * 100), cls: 'seg-red' },
      { label: 'High', count: prio('HIGH'), pct: Math.round((prio('HIGH') / maxPrio) * 100), cls: 'seg-orange' },
      { label: 'Medium', count: prio('MEDIUM'), pct: Math.round((prio('MEDIUM') / maxPrio) * 100), cls: 'seg-blue' },
      { label: 'Low', count: prio('LOW'), pct: Math.round((prio('LOW') / maxPrio) * 100), cls: 'seg-slate' }
    ];
  }

  private loadProjectsFromTasks(): void {
    console.log('UserDashboardComponent: loadProjectsFromTasks started.');
    try {
      if (!this.tasksList || this.tasksList.length === 0) {
        console.warn('UserDashboardComponent: tasksList is empty, returning.');
        return;
      }
      const uniqueProjectIds = Array.from(new Set(this.tasksList.map(t => t.projectId).filter(id => id !== undefined && id !== null)));
      console.log('UserDashboardComponent: Unique project IDs derived from tasks:', uniqueProjectIds);
      
      this.projectService.getAllProjects(0, 100).subscribe({
        next: (response: any) => {
          console.log('UserDashboardComponent: getAllProjects response:', response);
          try {
            const projects = response && response.data ? response.data : [];
            this.projectsList = projects.filter((p: any) => p.id && uniqueProjectIds.includes(p.id));
            this.stats.totalProjects = this.projectsList.length;
            console.log('UserDashboardComponent: Filtered projectsList. Length:', this.projectsList.length);
          } catch (e) {
            console.error('UserDashboardComponent: Error parsing projects list:', e);
            this.stats.totalProjects = 0;
          }
        },
        error: () => {
          this.projectsList = [];
          this.stats.totalProjects = 0;
        }
      });
    } catch (e) {
      console.error('UserDashboardComponent: Error preparing projects load:', e);
    }
  }

  private calculateStats(): void {
    const total = this.tasksList.length;
    const active = this.tasksList.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PLANNED').length;
    const completed = this.tasksList.filter(t => t.status === 'COMPLETED').length;

    // Check overdue: past target deadline date and not completed
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = this.tasksList.filter(t => 
      t.status !== 'COMPLETED' && t.deadline && t.deadline < todayStr
    ).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    this.stats = {
      totalTasks: total,
      activeTasks: active,
      completedTasks: completed,
      overdueTasks: overdue,
      completionRate: rate,
      totalProjects: 0 // Will be set after loading projects
    };

    // Filter urgent tasks: CRITICAL or HIGH priority and not completed
    this.urgentTasks = this.tasksList.filter(t =>
      t.status !== 'COMPLETED' && (t.priority === 'CRITICAL' || t.priority === 'HIGH')
    ).slice(0, 4);
  }

}
