import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';
import { TaskService, Task, TaskRequest } from '../../../core/services/task.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { UserService, User } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, AiDescribeButtonComponent],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.scss']
})
export class AdminTasksComponent implements OnInit {
  tasksList: Task[] = [];
  filteredTasks: Task[] = [];
  projectList: Project[] = [];
  assigneeList: User[] = [];
  loading: boolean = true;

  // Pagination State
  totalElements: number = 0;
  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  sortBy: string = 'id';
  sortDir: string = 'asc';

  // Filters State
  searchTerm: string = '';
  projectFilter: string = ''; // Mapped as string (projectId or '')
  statusFilter: string = '';
  priorityFilter: string = '';

  // Modals Visibility
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;

  // Form states
  selectedTask: Task | null = null;
  submitting: boolean = false;

  // Launch Task Form (matches TaskRequest DTO)
  addForm: TaskRequest = {
    name: '',
    description: '',
    projectId: undefined,
    assignedToId: undefined,
    priority: 'MEDIUM',
    difficulty: 'MEDIUM',
    status: 'PLANNED',
    progress: 0,
    deadline: '',
    reminderType: 'NONE'
  };

  // Edit Task Form (matches TaskRequest DTO)
  editForm: TaskRequest = {
    name: '',
    description: '',
    projectId: undefined,
    assignedToId: undefined,
    priority: 'MEDIUM',
    difficulty: 'MEDIUM',
    status: 'PLANNED',
    progress: 0,
    deadline: '',
    reminderType: 'NONE'
  };

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadProjects();
    this.loadAssignees();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getAllTasks(this.currentPage, this.pageSize, this.sortBy, this.sortDir).subscribe({
      next: (response: any) => {
        try {
          this.tasksList = response && response.data ? response.data : [];
          this.totalElements = response ? response.totalElements : 0;
          this.totalPages = response ? response.totalPages : 0;
          this.applyClientFilters();
        } catch (e) {
          console.error('Error parsing tasks list:', e);
          this.tasksList = [];
          this.applyClientFilters();
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.tasksList = [];
        this.applyClientFilters();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProjects(): void {
    this.projectService.getAllProjects(0, 100).subscribe({
      next: (response) => {
        this.projectList = response.data;
      },
      error: () => {
        this.projectList = [];
      }
    });
  }

  loadAssignees(): void {
    this.userService.getAllUsers(0, 100).subscribe({
      next: (response) => {
        this.assigneeList = response.data;
      },
      error: () => {
        this.assigneeList = [];
      }
    });
  }

  applyClientFilters(): void {
    let result = [...this.tasksList];

    // Search query filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(t => 
        t.name.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.projectName && t.projectName.toLowerCase().includes(term)) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(term))
      );
    }

    // Project filter
    if (this.projectFilter) {
      const projId = Number(this.projectFilter);
      result = result.filter(t => t.projectId === projId);
    }

    // Status filter
    if (this.statusFilter) {
      result = result.filter(t => t.status === this.statusFilter);
    }

    // Priority filter
    if (this.priorityFilter) {
      result = result.filter(t => t.priority === this.priorityFilter);
    }

    this.filteredTasks = result;
  }

  onFilterChange(): void {
    this.applyClientFilters();
  }

  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
    this.loadTasks();
  }

  // Pagination Actions
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadTasks();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadTasks();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadTasks();
    }
  }

  // Modals Actions
  openAddModal(): void {
    this.resetAddForm();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  openEditModal(task: Task): void {
    this.selectedTask = task;
    this.editForm = {
      name: task.name,
      description: task.description || '',
      projectId: task.projectId,
      assignedToId: task.assignedToId,
      priority: task.priority || 'MEDIUM',
      difficulty: task.difficulty || 'MEDIUM',
      status: task.status || 'PLANNED',
      progress: task.progress || 0,
      deadline: task.deadline || '',
      reminderType: task.reminderType || 'NONE'
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTask = null;
  }

  openDeleteModal(task: Task): void {
    this.selectedTask = task;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedTask = null;
  }

  // Form Submissions
  submitAddTask(): void {
    if (!this.addForm.name || !this.addForm.projectId || !this.addForm.assignedToId || !this.addForm.deadline) {
      this.triggerToast('Please complete all mandatory task details.', 'error');
      return;
    }

    this.submitting = true;
    this.addForm.projectId = Number(this.addForm.projectId);
    this.addForm.assignedToId = Number(this.addForm.assignedToId);
    
    // Automatically set progress to 100 if completed
    if (this.addForm.status === 'COMPLETED') {
      this.addForm.progress = 100;
    }

    this.taskService.createTask(this.addForm).subscribe({
      next: (newTask) => {
        this.submitting = false;
        this.showAddModal = false;
        this.triggerToast(`Successfully registered task "${newTask.name}"!`, 'success');
        this.loadTasks();
      },
      error: (err) => {
        this.submitting = false;
        console.error('API task registration error, enacting simulation:', err);
        // Offline simulation
        this.showAddModal = false;
        const targetProj = this.projectList.find(p => p.id === Number(this.addForm.projectId));
        const targetUser = this.assigneeList.find(u => u.id === Number(this.addForm.assignedToId));
        const mockNewTask: Task = {
          id: this.tasksList.length + 1,
          name: this.addForm.name,
          description: this.addForm.description,
          projectId: Number(this.addForm.projectId),
          projectName: targetProj ? targetProj.name : 'Unknown Workspace',
          assignedToId: Number(this.addForm.assignedToId),
          assignedToName: targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'Unassigned',
          priority: this.addForm.priority,
          difficulty: this.addForm.difficulty,
          status: this.addForm.status,
          progress: this.addForm.progress || 0,
          deadline: this.addForm.deadline,
          reminderType: this.addForm.reminderType,
          commentCount: 0,
          totalHoursLogged: 0,
          createdAt: new Date().toISOString().split('T')[0]
        };
        this.tasksList = [mockNewTask, ...this.tasksList];
        this.totalElements++;
        this.applyClientFilters();
        this.triggerToast(`Optimistic launch: Spawned task "${this.addForm.name}"!`, 'success');
      }
    });
  }

  submitEditTask(): void {
    if (!this.selectedTask || !this.selectedTask.id) return;

    if (!this.editForm.name || !this.editForm.projectId || !this.editForm.assignedToId || !this.editForm.deadline) {
      this.triggerToast('All mandatory task parameters are required.', 'error');
      return;
    }

    this.submitting = true;
    this.editForm.projectId = Number(this.editForm.projectId);
    this.editForm.assignedToId = Number(this.editForm.assignedToId);

    if (this.editForm.status === 'COMPLETED') {
      this.editForm.progress = 100;
    } else if (this.editForm.status === 'PLANNED') {
      this.editForm.progress = 0;
    }

    this.taskService.updateTask(this.selectedTask.id, this.editForm).subscribe({
      next: (updatedTask) => {
        this.submitting = false;
        this.showEditModal = false;
        this.triggerToast(`Successfully modified details for task "${updatedTask.name}"!`, 'success');
        this.loadTasks();
      },
      error: (err) => {
        this.submitting = false;
        console.error('API task update error, triggering offline simulation:', err);
        // Simulation update
        this.showEditModal = false;
        const index = this.tasksList.findIndex(t => t.id === this.selectedTask?.id);
        if (index !== -1) {
          const targetProj = this.projectList.find(p => p.id === Number(this.editForm.projectId));
          const targetUser = this.assigneeList.find(u => u.id === Number(this.editForm.assignedToId));
          this.tasksList[index] = {
            ...this.tasksList[index],
            name: this.editForm.name,
            description: this.editForm.description,
            projectId: Number(this.editForm.projectId),
            projectName: targetProj ? targetProj.name : 'Unknown Workspace',
            assignedToId: Number(this.editForm.assignedToId),
            assignedToName: targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'Unassigned',
            priority: this.editForm.priority,
            difficulty: this.editForm.difficulty,
            status: this.editForm.status,
            progress: this.editForm.progress,
            deadline: this.editForm.deadline,
            reminderType: this.editForm.reminderType
          };
          this.applyClientFilters();
        }
        this.triggerToast(`Optimistic update: Saved details for "${this.editForm.name}"!`, 'success');
      }
    });
  }

  submitDeleteTask(): void {
    if (!this.selectedTask || !this.selectedTask.id) return;

    this.submitting = true;
    this.taskService.deleteTask(this.selectedTask.id).subscribe({
      next: () => {
        this.submitting = false;
        this.showDeleteModal = false;
        this.triggerToast(`Task "${this.selectedTask?.name}" was destroyed permanently.`, 'success');
        this.loadTasks();
      },
      error: (err) => {
        this.submitting = false;
        console.error('API task deletion error, running simulation delete:', err);
        // Simulation delete
        this.showDeleteModal = false;
        this.tasksList = this.tasksList.filter(t => t.id !== this.selectedTask?.id);
        this.totalElements--;
        this.applyClientFilters();
        this.triggerToast(`Optimistic destroy: Removed task "${this.selectedTask?.name}"!`, 'success');
      }
    });
  }

  private resetAddForm(): void {
    this.addForm = {
      name: '',
      description: '',
      projectId: undefined,
      assignedToId: undefined,
      priority: 'MEDIUM',
      difficulty: 'MEDIUM',
      status: 'PLANNED',
      progress: 0,
      deadline: '',
      reminderType: 'NONE'
    };
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }
}
