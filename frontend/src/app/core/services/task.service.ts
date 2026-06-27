import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Task {
  id?: number;
  name: string;
  description?: string;
  projectId?: number;
  projectName?: string;
  assignedToId?: number;
  assignedToName?: string;
  createdById?: number;
  createdByName?: string;
  priority?: string;
  difficulty?: string;
  status?: string;
  progress?: number;
  deadline?: string;
  reminderType?: string;
  commentCount?: number;
  totalHoursLogged?: number;
  createdAt?: string;
  updatedAt?: string;
  customFields?: { [key: string]: string };
  workflowStatusId?: number | null;
}

export interface TaskRequest {
  name: string;
  description?: string;
  projectId?: number;
  assignedToId?: number;
  priority?: string;
  difficulty?: string;
  status?: string;
  progress?: number;
  deadline?: string;
  reminderType?: string;
  customFields?: { [key: string]: string };
}

export interface PagedResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(private apiService: ApiService) {}

  getAllTasks(page: number = 0, size: number = 10, sortBy: string = 'id', sortDir: string = 'asc'): Observable<PagedResponse<Task>> {
    return this.apiService.get<PagedResponse<Task>>(`/tasks?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  }

  getTaskById(id: number): Observable<Task> {
    return this.apiService.get<Task>(`/tasks/${id}`);
  }

  createTask(task: TaskRequest): Observable<Task> {
    return this.apiService.post<Task>('/tasks', task);
  }

  updateTask(id: number, task: TaskRequest): Observable<Task> {
    return this.apiService.put<Task>(`/tasks/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.apiService.delete<void>(`/tasks/${id}`);
  }

  // ── Dependencies (blockers) ──
  getDependencies(id: number): Observable<any[]> { return this.apiService.get<any[]>(`/tasks/${id}/dependencies`); }
  addDependency(id: number, blockerId: number): Observable<any> { return this.apiService.post<any>(`/tasks/${id}/dependencies/${blockerId}`, {}); }
  removeDependency(id: number, blockerId: number): Observable<any> { return this.apiService.delete<any>(`/tasks/${id}/dependencies/${blockerId}`); }

  getTasksByUser(userId: number, page: number = 0, size: number = 10): Observable<PagedResponse<Task>> {
    return this.apiService.get<PagedResponse<Task>>(`/tasks/user/${userId}?page=${page}&size=${size}`);
  }

  getTasksByProject(projectId: number, page: number = 0, size: number = 10): Observable<PagedResponse<Task>> {
    return this.apiService.get<PagedResponse<Task>>(`/tasks/project/${projectId}?page=${page}&size=${size}`);
  }

  getTasksByStatus(status: string, page: number = 0, size: number = 10): Observable<PagedResponse<Task>> {
    return this.apiService.get<PagedResponse<Task>>(`/tasks/status/${status}?page=${page}&size=${size}`);
  }

  getOverdueTasks(): Observable<Task[]> {
    return this.apiService.get<Task[]>('/tasks/overdue');
  }

  updateTaskProgress(id: number, progress: number, status?: string, workflowStatusId?: number): Observable<Task> {
    return this.apiService.patch<Task>(`/tasks/${id}/progress`, { progress, status, workflowStatusId });
  }
}
