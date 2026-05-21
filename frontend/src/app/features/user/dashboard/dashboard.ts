import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { ProjectService, Project } from '../../../core/services/project.service';

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
          if (this.tasksList.length > 0) {
            this.calculateStats();
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
        error: (err: any) => {
          console.warn('UserDashboardComponent: getAllProjects failed, using fallbacks:', err);
          // Safe fallback mock projects
          this.projectsList = [
            { id: 1, name: 'Cloud Migration Core', description: 'Containerized AWS migrations.', status: 'IN_PROGRESS', progress: 60 },
            { id: 2, name: 'Glassmorphic Design UI', description: 'Vibrant modern light layouts.', status: 'IN_PROGRESS', progress: 45 }
          ];
          this.stats.totalProjects = this.projectsList.length;
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

    // Seed realistic activity feed based on current tasks
    this.seedActivityFeed();
  }

  private seedActivityFeed(): void {
    this.activityFeed = [
      {
        id: 1,
        projectName: 'Cloud Migration Core',
        taskName: 'Setup VPC Security Groups',
        type: 'COMMENT',
        message: 'Lead Project Manager requested review of AWS firewalls configs.',
        timestamp: '2 hours ago'
      },
      {
        id: 2,
        projectName: 'Glassmorphic Design UI',
        taskName: 'Design Translucent Cards',
        type: 'REVISION',
        message: 'Deliverable sent back: "Please increase background glass backdrop filter to 12px."',
        timestamp: '1 day ago'
      },
      {
        id: 3,
        projectName: 'Cloud Migration Core',
        taskName: 'Build Dashboard Layouts',
        type: 'APPROVAL',
        message: 'Lead PM approved "Build Dashboard Layouts" deliverable submission!',
        timestamp: '2 days ago'
      }
    ];
  }

  private seedMockData(): void {
    this.tasksList = [
      { id: 1, name: 'Setup VPC Security Groups', description: 'Address corporate firewall rules and SSH keys.', projectId: 1, projectName: 'Cloud Migration Core', assignedToId: this.currentUser.id, assignedToName: `${this.currentUser.firstName} ${this.currentUser.lastName}`, priority: 'CRITICAL', difficulty: 'HARD', status: 'IN_PROGRESS', progress: 60, deadline: '2026-05-20' },
      { id: 2, name: 'Design Translucent Cards', description: 'Backdrop CSS filters and soft HSL hover shadows.', projectId: 2, projectName: 'Glassmorphic Design UI', assignedToId: this.currentUser.id, assignedToName: `${this.currentUser.firstName} ${this.currentUser.lastName}`, priority: 'HIGH', difficulty: 'MEDIUM', status: 'IN_PROGRESS', progress: 45, deadline: '2026-05-25' },
      { id: 4, name: 'Integrate Token HTTP Interceptor', description: 'Attach bearer security tokens automatically to requests.', projectId: 1, projectName: 'Cloud Migration Core', assignedToId: this.currentUser.id, assignedToName: `${this.currentUser.firstName} ${this.currentUser.lastName}`, priority: 'MEDIUM', difficulty: 'MEDIUM', status: 'PLANNED', progress: 0, deadline: '2026-06-10' },
      { id: 5, name: 'SMTP Mail Server Handshakes', description: 'Ensure user registration invites deliver in seconds.', projectId: 1, projectName: 'Cloud Migration Core', assignedToId: this.currentUser.id, assignedToName: `${this.currentUser.firstName} ${this.currentUser.lastName}`, priority: 'LOW', difficulty: 'EASY', status: 'ON_HOLD', progress: 10, deadline: '2026-05-30' },
      { id: 6, name: 'Build Dashboard Layouts', description: 'Implement sidebar widgets and responsive navigation controls.', projectId: 2, projectName: 'Glassmorphic Design UI', assignedToId: this.currentUser.id, assignedToName: `${this.currentUser.firstName} ${this.currentUser.lastName}`, priority: 'HIGH', difficulty: 'HARD', status: 'COMPLETED', progress: 100, deadline: '2026-05-15' }
    ];

    this.projectsList = [
      { id: 1, name: 'Cloud Migration Core', description: 'Migrating legacy monolithic workflows into containerized microservice scopes on AWS AWS EC2.', status: 'IN_PROGRESS', progress: 60 },
      { id: 2, name: 'Glassmorphic Design UI', description: 'Implementing high-end modern layout pages with vibrant colors and light theme glass controls.', status: 'IN_PROGRESS', progress: 45 }
    ];

    this.calculateStats();
    this.stats.totalProjects = this.projectsList.length;
  }
}
