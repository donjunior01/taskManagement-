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
      this.triggerToast('Veuillez renseigner tous les champs obligatoires de la tâche.', 'error');
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
        this.triggerToast(`Tâche "${newTask.name}" enregistrée avec succès !`, 'success');
        this.loadTasks();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Échec de la création de la tâche.';
        this.triggerToast(msg, 'error');
      }
    });
  }

  submitEditTask(): void {
    if (!this.selectedTask || !this.selectedTask.id) return;

    if (!this.editForm.name || !this.editForm.projectId || !this.editForm.assignedToId || !this.editForm.deadline) {
      this.triggerToast('Tous les paramètres obligatoires de la tâche sont requis.', 'error');
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
        this.triggerToast(`Détails de la tâche "${updatedTask.name}" modifiés avec succès !`, 'success');
        this.loadTasks();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Échec de la mise à jour de la tâche.';
        this.triggerToast(msg, 'error');
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
        this.triggerToast(`La tâche "${this.selectedTask?.name}" a été supprimée définitivement.`, 'success');
        this.loadTasks();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Échec de la suppression de la tâche.';
        this.triggerToast(msg, 'error');
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
