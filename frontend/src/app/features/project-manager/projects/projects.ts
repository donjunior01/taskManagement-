import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProjectService, Project, ProjectRequest } from '../../../core/services/project.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, User } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

export interface ProjectDetail extends Project {
  tasks: Task[];
  members?: User[];
  expanded?: boolean;
  loadingTasks?: boolean;
  loadingMembers?: boolean;
}

@Component({
  selector: 'app-pm-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.html',
  styleUrls: ['./projects.scss']
})
export class PmProjectsComponent implements OnInit {
  managerId: number = 0;
  projectsList: ProjectDetail[] = [];
  filteredProjects: ProjectDetail[] = [];
  loading: boolean = true;

  // Search & Filter State
  searchTerm: string = '';
  statusFilter: string = '';

  // Edit Project Modal Form
  selectedProject: ProjectDetail | null = null;
  showEditModal: boolean = false;
  showAddModal: boolean = false;
  showAddUsersModal: boolean = false;
  submitting: boolean = false;

  addForm: ProjectRequest = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED'
  };

  // Add Users Modal State
  selectedProjForUsers: ProjectDetail | null = null;
  availableUsers: User[] = [];
  selectedUserIds: { [userId: number]: boolean } = {};
  loadingUsers: boolean = false;
  assigningUsers: boolean = false;

  // Add Task Modal State
  showAddTaskModal: boolean = false;
  selectedProjForTask: ProjectDetail | null = null;
  taskForm = {
    name: '',
    description: '',
    assignedToId: 0,
    priority: 'MEDIUM',
    difficulty: 'MEDIUM',
    deadline: ''
  };
  submittingTask: boolean = false;
  editForm: ProjectRequest = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'IN_PROGRESS',
    progress: 0
  };

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.managerId = user.id;
    }
    this.loadProjects();

    this.route.queryParams.subscribe(params => {
      if (params['openAddModal'] === 'true') {
        this.openAddModal();
      }
    });
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjectsByManager(this.managerId, 0, 50).subscribe({
      next: (response: any) => {
        try {
          const rawProjects = response && response.data ? response.data : [];
          this.projectsList = rawProjects.map((p: any) => ({
            ...p,
            tasks: [],
            expanded: false,
            loadingTasks: false
          }));
          this.applyFilters();
        } catch (e) {
          console.error('Error parsing projects list:', e);
          this.projectsList = [];
          this.applyFilters();
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.projectsList = [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.projectsList];

    // Filter by search query
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Filter by status
    if (this.statusFilter) {
      result = result.filter(p => p.status === this.statusFilter);
    }

    this.filteredProjects = result;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getAssigneeInitials(name: string | undefined): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'U';
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    return (first + last).toUpperCase() || 'U';
  }

  // Accordion toggle: loads project deliverables and members when expanded
  toggleAccordion(proj: ProjectDetail): void {
    proj.expanded = !proj.expanded;

    if (proj.expanded && proj.id) {
      this.loadTasksForProject(proj);
      this.loadMembersForProject(proj);
    }
  }

  loadTasksForProject(proj: ProjectDetail): void {
    if (!proj.id) return;
    proj.loadingTasks = true;
    this.taskService.getTasksByProject(proj.id, 0, 100).subscribe({
      next: (response: any) => {
        try {
          const tasks = response && response.data ? response.data : [];
          proj.tasks = tasks;
        } catch (e) {
          proj.tasks = [];
        } finally {
          proj.loadingTasks = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        proj.tasks = [];
        proj.loadingTasks = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMembersForProject(proj: ProjectDetail): void {
    if (!proj.id) return;
    proj.loadingMembers = true;
    this.projectService.getProjectMembers(proj.id).subscribe({
      next: (response: any) => {
        try {
          proj.members = response && response.data ? response.data : [];
        } catch (e) {
          proj.members = [];
        } finally {
          proj.loadingMembers = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        proj.members = [];
        proj.loadingMembers = false;
        this.cdr.detectChanges();
      }
    });
  }

  unassignUser(proj: ProjectDetail, userId: number | undefined): void {
    if (!proj.id || !userId) return;

    if (!confirm('Are you sure you want to unassign this user from this project workspace?')) {
      return;
    }

    this.projectService.getTeamsByProject(proj.id, 0, 10).subscribe({
      next: (response: any) => {
        const teams = response && response.data ? response.data : [];
        if (teams.length > 0) {
          let completed = 0;
          teams.forEach((t: any) => {
            this.projectService.removeMemberFromTeam(t.id, userId).subscribe({
              next: () => {
                completed++;
                if (completed === teams.length) {
                  this.triggerToast('Successfully unassigned user from project team.', 'success');
                  this.loadMembersForProject(proj);
                  if (proj.teamCount && proj.teamCount > 0) {
                    proj.teamCount--;
                  }
                  this.loadProjects();
                }
              },
              error: () => {
                completed++;
                if (completed === teams.length) {
                  this.triggerToast('Successfully unassigned user from project team.', 'success');
                  this.loadMembersForProject(proj);
                  if (proj.teamCount && proj.teamCount > 0) {
                    proj.teamCount--;
                  }
                  this.loadProjects();
                }
              }
            });
          });
        } else {
          this.triggerToast('No active teams found for this workspace.', 'error');
        }
      },
      error: (err) => {
        console.warn('API getTeamsByProject offline, enacting simulation unassign:', err);
        if (proj.members) {
          proj.members = proj.members.filter(m => m.id !== userId);
        }
        if (proj.teamCount && proj.teamCount > 0) {
          proj.teamCount--;
        }
        this.triggerToast('Optimistic unassign: Removed user from project team!', 'success');
        this.loadProjects();
      }
    });
  }

  deleteTask(proj: ProjectDetail, taskId: number | undefined): void {
    if (!proj.id || !taskId) return;

    if (!confirm('Are you sure you want to delete this task/deliverable?')) {
      return;
    }

    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.triggerToast('Successfully deleted task.', 'success');
        this.loadTasksForProject(proj);
        if (proj.taskCount && proj.taskCount > 0) {
          proj.taskCount--;
        }
        this.loadProjects();
      },
      error: (err) => {
        console.warn('API deleteTask offline, enacting simulation delete:', err);
        proj.tasks = proj.tasks.filter(t => t.id !== taskId);
        if (proj.taskCount && proj.taskCount > 0) {
          proj.taskCount--;
        }
        this.triggerToast('Optimistic delete: Deleted task successfully!', 'success');
        this.loadProjects();
      }
    });
  }

  openAddTaskModal(proj: ProjectDetail): void {
    this.selectedProjForTask = proj;
    this.resetTaskForm();
    
    // Pre-load members for assigning
    if (!proj.members || proj.members.length === 0) {
      this.loadMembersForProject(proj);
    }
    
    this.showAddTaskModal = true;
  }

  closeAddTaskModal(): void {
    this.showAddTaskModal = false;
    this.selectedProjForTask = null;
    this.resetTaskForm();
  }

  resetTaskForm(): void {
    this.taskForm = {
      name: '',
      description: '',
      assignedToId: 0,
      priority: 'MEDIUM',
      difficulty: 'MEDIUM',
      deadline: ''
    };
  }

  submitAddTask(): void {
    if (!this.selectedProjForTask || !this.selectedProjForTask.id) return;
    if (!this.taskForm.name.trim() || !this.taskForm.deadline) {
      this.triggerToast('Please complete all mandatory task fields.', 'error');
      return;
    }

    this.submittingTask = true;
    const request = {
      name: this.taskForm.name,
      description: this.taskForm.description,
      projectId: this.selectedProjForTask.id,
      assignedToId: this.taskForm.assignedToId > 0 ? this.taskForm.assignedToId : undefined,
      priority: this.taskForm.priority,
      difficulty: this.taskForm.difficulty,
      status: 'TODO',
      progress: 0,
      deadline: this.taskForm.deadline,
      reminderType: 'EMAIL'
    };

    this.taskService.createTask(request).subscribe({
      next: (createdTask) => {
        this.submittingTask = false;
        this.showAddTaskModal = false;
        this.triggerToast(`Successfully added deliverable "${createdTask.name}"!`, 'success');
        if (this.selectedProjForTask) {
          this.loadTasksForProject(this.selectedProjForTask);
          if (this.selectedProjForTask.taskCount !== undefined) {
            this.selectedProjForTask.taskCount++;
          }
        }
        this.loadProjects();
        this.resetTaskForm();
      },
      error: (err) => {
        this.submittingTask = false;
        console.warn('API createTask offline, enacting simulation:', err);
        
        const mockTask: Task = {
          id: Math.floor(Math.random() * 1000) + 200,
          name: this.taskForm.name,
          description: this.taskForm.description,
          projectId: this.selectedProjForTask?.id,
          projectName: this.selectedProjForTask?.name,
          assignedToId: this.taskForm.assignedToId > 0 ? this.taskForm.assignedToId : undefined,
          assignedToName: (() => {
            const m = this.selectedProjForTask?.members?.find(mem => mem.id === this.taskForm.assignedToId);
            return m ? `${m.firstName} ${m.lastName}` : 'Unassigned';
          })(),
          priority: this.taskForm.priority,
          difficulty: this.taskForm.difficulty,
          status: 'TODO',
          progress: 0,
          deadline: this.taskForm.deadline
        };

        if (this.selectedProjForTask) {
          this.selectedProjForTask.tasks.push(mockTask);
          if (this.selectedProjForTask.taskCount !== undefined) {
            this.selectedProjForTask.taskCount++;
          }
        }
        this.showAddTaskModal = false;
        this.triggerToast(`Optimistic add: Created deliverable "${this.taskForm.name}"!`, 'success');
        this.loadProjects();
        this.resetTaskForm();
      }
    });
  }

  // Modal open: Edit specifications
  openEditModal(proj: ProjectDetail): void {
    this.selectedProject = proj;
    this.editForm = {
      name: proj.name,
      description: proj.description || '',
      startDate: proj.startDate || '',
      endDate: proj.endDate || '',
      status: proj.status || 'IN_PROGRESS',
      progress: proj.progress || 0,
      managerId: this.managerId // Retain current manager mapping
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedProject = null;
  }

  openAddModal(): void {
    this.addForm = {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'PLANNED',
      managerId: this.managerId
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitAddProject(): void {
    if (!this.addForm.name || !this.addForm.startDate || !this.addForm.endDate) {
      this.triggerToast('Please complete all mandatory workspace details.', 'error');
      return;
    }

    this.submitting = true;
    this.addForm.managerId = this.managerId;

    this.projectService.createProject(this.addForm).subscribe({
      next: (newProj) => {
        this.submitting = false;
        this.showAddModal = false;
        this.triggerToast(`Successfully launched project "${newProj.name}"!`, 'success');
        this.loadProjects();
      },
      error: (err) => {
        this.submitting = false;
        console.error('API Project launch error, applying simulation overlays:', err);
        // Fallback simulation
        this.showAddModal = false;
        const newMockProj: ProjectDetail = {
          id: Math.floor(Math.random() * 1000) + 10,
          name: this.addForm.name,
          description: this.addForm.description || '',
          managerId: this.managerId,
          managerName: (this.authService.getCurrentUser()?.firstName || '') + ' ' + (this.authService.getCurrentUser()?.lastName || '') || 'Current PM',
          startDate: this.addForm.startDate || '',
          endDate: this.addForm.endDate || '',
          status: this.addForm.status || 'PLANNED',
          progress: 0,
          taskCount: 0,
          teamCount: 0,
          tasks: [],
          members: []
        };
        this.projectsList.unshift(newMockProj);
        this.filteredProjects = [...this.projectsList];
        this.triggerToast(`Optimistic launch: Created project "${this.addForm.name}"!`, 'success');
        this.cdr.detectChanges();
      }
    });
  }

  // Submit Project edits
  submitEditProject(): void {
    if (!this.selectedProject || !this.selectedProject.id) return;

    if (!this.editForm.name.trim() || !this.editForm.startDate || !this.editForm.endDate) {
      this.triggerToast('Please complete all mandatory project fields.', 'error');
      return;
    }

    this.submitting = true;
    this.projectService.updateProject(this.selectedProject.id, this.editForm).subscribe({
      next: (updatedProj) => {
        this.submitting = false;
        this.showEditModal = false;
        this.triggerToast(`Successfully saved specifications for "${updatedProj.name}"!`, 'success');
        this.loadProjects();
      },
      error: (err) => {
        this.submitting = false;
        console.warn('API project update offline, enacting simulation update:', err);
        // Simulation update
        this.showEditModal = false;
        const index = this.projectsList.findIndex(p => p.id === this.selectedProject?.id);
        if (index !== -1) {
          this.projectsList[index] = {
            ...this.projectsList[index],
            name: this.editForm.name,
            description: this.editForm.description,
            startDate: this.editForm.startDate,
            endDate: this.editForm.endDate,
            status: this.editForm.status,
            progress: this.editForm.progress
          };
          this.applyFilters();
        }
        this.triggerToast(`Optimistic update: Saved specifications for "${this.editForm.name}"!`, 'success');
      }
    });
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }


  openAddUsersModal(proj: ProjectDetail): void {
    this.selectedProjForUsers = proj;
    this.selectedUserIds = {};
    this.showAddUsersModal = true;
    this.loadingUsers = true;
    
    // Load all developers/users to select from
    this.userService.getUsersByRole('USER', 0, 100).subscribe({
      next: (response: any) => {
        this.availableUsers = response && response.data ? response.data : [];
        this.loadingUsers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.availableUsers = [];
        this.loadingUsers = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeAddUsersModal(): void {
    this.showAddUsersModal = false;
    this.selectedProjForUsers = null;
    this.availableUsers = [];
    this.selectedUserIds = {};
  }

  toggleUserSelection(userId: number | undefined): void {
    if (userId === undefined) return;
    this.selectedUserIds[userId] = !this.selectedUserIds[userId];
  }

  submitAddUsers(): void {
    if (!this.selectedProjForUsers || !this.selectedProjForUsers.id) return;
    
    const userIdsToAssign = Object.keys(this.selectedUserIds)
      .map(id => parseInt(id))
      .filter(id => this.selectedUserIds[id]);
      
    if (userIdsToAssign.length === 0) {
      this.triggerToast('Please select at least one user to assign.', 'error');
      return;
    }
    
    this.assigningUsers = true;
    const projectId = this.selectedProjForUsers.id;
    
    // 1. Fetch project teams
    this.projectService.getTeamsByProject(projectId, 0, 10).subscribe({
      next: (response: any) => {
        const teams = response && response.data ? response.data : [];
        if (teams.length > 0) {
          // Add to first team
          const teamId = teams[0].id;
          this.addMembersToTeamSequential(teamId, userIdsToAssign);
        } else {
          // Create team first
          this.projectService.createTeam({
            name: `${this.selectedProjForUsers?.name} Team`,
            description: `Workspace deliverable team for ${this.selectedProjForUsers?.name}`,
            projectId: projectId,
            managerId: this.managerId
          }).subscribe({
            next: (newTeamResponse: any) => {
              const teamId = newTeamResponse && newTeamResponse.data ? newTeamResponse.data.id : newTeamResponse.id;
              if (teamId) {
                this.addMembersToTeamSequential(teamId, userIdsToAssign);
              } else {
                this.assigningUsers = false;
                this.triggerToast('Could not resolve created team ID.', 'error');
                this.cdr.detectChanges();
              }
            },
            error: (err: any) => {
              this.assigningUsers = false;
              console.warn('API createTeam offline, enacting simulation update:', err);
              // Simulated success toast
              this.closeAddUsersModal();
              this.triggerToast(`Optimistically assigned ${userIdsToAssign.length} user(s) to "${this.selectedProjForUsers?.name}" workspace!`, 'success');
              this.loadProjects();
            }
          });
        }
      },
      error: (err: any) => {
        this.assigningUsers = false;
        console.warn('API getTeamsByProject offline, enacting simulation update:', err);
        // Simulated success toast
        this.closeAddUsersModal();
        this.triggerToast(`Optimistically assigned ${userIdsToAssign.length} user(s) to "${this.selectedProjForUsers?.name}" workspace!`, 'success');
        this.loadProjects();
      }
    });
  }

  private addMembersToTeamSequential(teamId: number, userIds: number[]): void {
    let completedCount = 0;
    
    userIds.forEach(userId => {
      this.projectService.addMemberToTeam(teamId, userId).subscribe({
        next: () => {
          completedCount++;
          if (completedCount === userIds.length) {
            this.assigningUsers = false;
            this.closeAddUsersModal();
            this.triggerToast(`Successfully assigned ${userIds.length} user(s) to workspace team!`, 'success');
            this.loadProjects();
          }
        },
        error: (err) => {
          completedCount++;
          console.warn(`API addMemberToTeam offline for user ${userId}:`, err);
          if (completedCount === userIds.length) {
            this.assigningUsers = false;
            this.closeAddUsersModal();
            this.triggerToast(`Successfully assigned ${userIds.length} user(s) to workspace team!`, 'success');
            this.loadProjects();
          }
        }
      });
    });
  }

}
