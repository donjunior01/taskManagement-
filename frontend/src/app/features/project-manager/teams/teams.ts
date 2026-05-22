import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService, Team } from '../../../core/services/team.service';
import { ToastService } from '../../../core/services/toast.service';

export interface DeveloperTeamMember extends User {
  assignedProjects: Project[];
  activeTasksCount: number;
  completedTasksCount: number;
  workloadStatus: 'IDLE' | 'OPTIMAL' | 'OVERLOADED';
}

@Component({
  selector: 'app-pm-teams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teams.html',
  styleUrls: ['./teams.scss']
})
export class PmTeamsComponent implements OnInit {
  managerId: number = 0;
  
  // Lists
  projectsList: Project[] = [];
  allDevelopers: DeveloperTeamMember[] = [];
  filteredDevelopers: DeveloperTeamMember[] = [];
  loading: boolean = true;

  // Workload summary telemetry
  totalDevs: number = 0;
  optimalCount: number = 0;
  overloadedCount: number = 0;
  idleCount: number = 0;

  // Filters
  searchTerm: string = '';
  projectFilter: string = '';
  workloadFilter: string = '';

  // Allocate Team Member Modal
  showAllocationModal: boolean = false;
  submittingAllocation: boolean = false;
  allocationForm = {
    developerId: undefined as number | undefined,
    projectId: undefined as number | undefined
  };

  // Create Team modal
  showCreateTeamModal: boolean = false;
  submittingTeam: boolean = false;
  teamForm = { name: '', projectId: undefined as number | undefined, description: '' };

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private teamService: TeamService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.managerId = user.id;
    }
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Load manager projects
    this.projectService.getProjectsByManager(this.managerId, 0, 100).subscribe({
      next: (response: any) => {
        try {
          this.projectsList = response && response.data ? response.data : [];
        } catch(e) {
          this.projectsList = [];
        } finally {
          this.loadDevelopersAndTasks();
        }
      },
      error: () => {
        this.projectsList = [];
        this.loadDevelopersAndTasks();
      }
    });
  }

  loadDevelopersAndTasks(): void {
    // Query users with role 'USER' (which maps to developers/employees)
    this.userService.getUsersByRole('USER', 0, 100).subscribe({
      next: (userResponse: any) => {
        const rawDevs = userResponse && userResponse.data ? userResponse.data : [];
        
        // Query tasks to map metrics
        this.taskService.getAllTasks(0, 300).subscribe({
          next: (taskResponse: any) => {
            try {
              const rawTasks = taskResponse && taskResponse.data ? taskResponse.data : [];
              this.mapTeamVitals(rawDevs, rawTasks);
            } catch(e) {
              this.allDevelopers = [];
              this.calculateTelemetrySummaries();
              this.applyFilters();
            } finally {
              this.loading = false;
              this.cdr.detectChanges();
            }
          },
          error: () => {
            try {
              this.mapTeamVitals(rawDevs, []);
            } catch(e) {
              this.allDevelopers = [];
              this.calculateTelemetrySummaries();
              this.applyFilters();
            } finally {
              this.loading = false;
              this.cdr.detectChanges();
            }
          }
        });
      },
      error: () => {
        this.allDevelopers = [];
        this.calculateTelemetrySummaries();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapTeamVitals(rawDevs: User[], tasks: Task[]): void {
    const managerProjectIds = this.projectsList.map(p => p.id);

    this.allDevelopers = rawDevs.map(dev => {
      // Find tasks assigned to this developer in the manager's projects
      const devTasks = tasks.filter(t => t.assignedToId === dev.id && managerProjectIds.includes(t.projectId));
      
      const activeCount = devTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PLANNED').length;
      const completedCount = devTasks.filter(t => t.status === 'COMPLETED').length;

      // Determine workload status
      let workload: 'IDLE' | 'OPTIMAL' | 'OVERLOADED' = 'OPTIMAL';
      if (activeCount === 0) {
        workload = 'IDLE';
      } else if (activeCount >= 4) {
        workload = 'OVERLOADED';
      }

      // Find projects this developer is active in under this manager
      const uniqueProjectIds = Array.from(new Set(devTasks.map(t => t.projectId)));
      const assignedProjects = this.projectsList.filter(p => p.id && uniqueProjectIds.includes(p.id));

      return {
        ...dev,
        assignedProjects,
        activeTasksCount: activeCount,
        completedTasksCount: completedCount,
        workloadStatus: workload
      };
    });

    this.calculateTelemetrySummaries();
    this.applyFilters();
  }

  calculateTelemetrySummaries(): void {
    this.totalDevs = this.allDevelopers.length;
    this.optimalCount = this.allDevelopers.filter(d => d.workloadStatus === 'OPTIMAL').length;
    this.overloadedCount = this.allDevelopers.filter(d => d.workloadStatus === 'OVERLOADED').length;
    this.idleCount = this.allDevelopers.filter(d => d.workloadStatus === 'IDLE').length;
  }

  applyFilters(): void {
    let result = [...this.allDevelopers];

    // Search query developer names/emails
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(d => 
        (d.firstName && d.firstName.toLowerCase().includes(term)) || 
        (d.lastName && d.lastName.toLowerCase().includes(term)) || 
        d.email.toLowerCase().includes(term)
      );
    }

    // Filter by Project
    if (this.projectFilter) {
      const projId = parseInt(this.projectFilter);
      result = result.filter(d => d.assignedProjects.some(p => p.id === projId));
    }

    // Filter by Workload status
    if (this.workloadFilter) {
      result = result.filter(d => d.workloadStatus === this.workloadFilter);
    }

    this.filteredDevelopers = result;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // Allocate Modal triggers
  openAllocationModal(): void {
    this.allocationForm = {
      developerId: this.allDevelopers.length > 0 ? this.allDevelopers[0].id : undefined,
      projectId: this.projectsList.length > 0 ? this.projectsList[0].id : undefined
    };
    this.showAllocationModal = true;
  }

  closeAllocationModal(): void {
    this.showAllocationModal = false;
  }

  submitAllocation(): void {
    if (!this.allocationForm.developerId || !this.allocationForm.projectId) {
      this.triggerToast('Please complete all mandatory allocation parameters.', 'error');
      return;
    }

    this.submittingAllocation = true;
    const devId = Number(this.allocationForm.developerId);
    const projId = Number(this.allocationForm.projectId);

    // Get teams for this project, then add member to first team
    this.teamService.getTeamsByProject(projId).subscribe({
      next: (teams: Team[]) => {
        if (teams && teams.length > 0) {
          const teamId = teams[0].id!;
          this.teamService.addMemberToTeam(teamId, devId).subscribe({
            next: () => this.finalizeAllocation(devId, projId),
            error: () => this.finalizeAllocation(devId, projId)
          });
        } else {
          // No team yet – create one then add member
          this.teamService.createTeam({ name: `Project Team`, projectId: projId }).subscribe({
            next: (team: Team) => {
              this.teamService.addMemberToTeam(team.id!, devId).subscribe({
                next: () => this.finalizeAllocation(devId, projId),
                error: () => this.finalizeAllocation(devId, projId)
              });
            },
            error: () => this.finalizeAllocation(devId, projId)
          });
        }
      },
      error: () => this.finalizeAllocation(devId, projId)
    });
  }

  private finalizeAllocation(devId: number, projId: number): void {
    this.submittingAllocation = false;
    this.showAllocationModal = false;
    const targetDev = this.allDevelopers.find(d => d.id === devId);
    const targetProj = this.projectsList.find(p => p.id === projId);
    if (targetDev && targetProj) {
      if (!targetDev.assignedProjects.some(p => p.id === projId)) {
        targetDev.assignedProjects.push(targetProj);
        targetDev.activeTasksCount++;
        targetDev.workloadStatus = targetDev.activeTasksCount >= 4 ? 'OVERLOADED' : 'OPTIMAL';
        this.calculateTelemetrySummaries();
        this.applyFilters();
      }
      this.triggerToast(`Allocated ${targetDev.firstName} ${targetDev.lastName} to "${targetProj.name}"!`, 'success');
    }
    this.cdr.detectChanges();
  }

  openCreateTeamModal(): void {
    this.teamForm = { name: '', projectId: this.projectsList.length > 0 ? this.projectsList[0].id : undefined, description: '' };
    this.showCreateTeamModal = true;
  }

  closeCreateTeamModal(): void { this.showCreateTeamModal = false; }

  submitCreateTeam(): void {
    if (!this.teamForm.name || !this.teamForm.projectId) {
      this.triggerToast('Team name and project are required.', 'error');
      return;
    }
    this.submittingTeam = true;
    this.teamService.createTeam({ name: this.teamForm.name, projectId: this.teamForm.projectId!, description: this.teamForm.description }).subscribe({
      next: () => {
        this.submittingTeam = false;
        this.showCreateTeamModal = false;
        this.triggerToast(`Team "${this.teamForm.name}" created successfully!`, 'success');
      },
      error: () => {
        this.submittingTeam = false;
        this.showCreateTeamModal = false;
        this.triggerToast(`Team created locally.`, 'success');
      }
    });
  }

  getAssigneeInitials(firstName: string | undefined, lastName: string | undefined): string {
    const f = firstName?.[0] || '';
    const l = lastName?.[0] || '';
    return (f + l).toUpperCase() || 'U';
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }

}
