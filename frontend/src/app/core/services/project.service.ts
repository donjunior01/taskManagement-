import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Project {
  id?: number;
  name: string;
  description?: string;
  managerId?: number;
  managerName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  progress?: number;
  taskCount?: number;
  teamCount?: number;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRequest {
  name: string;
  description?: string;
  managerId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  progress?: number;
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
export class ProjectService {
  constructor(private apiService: ApiService) {}

  getAllProjects(page: number = 0, size: number = 10, sortBy: string = 'id', sortDir: string = 'asc'): Observable<PagedResponse<Project>> {
    return this.apiService.get<PagedResponse<Project>>(`/projects?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  }

  getActiveProjectsForUser(): Observable<any> {
    return this.apiService.get<any>('/projects/my-active');
  }

  getProjectById(id: number): Observable<Project> {
    return this.apiService.get<Project>(`/projects/${id}`);
  }

  createProject(project: ProjectRequest): Observable<Project> {
    return this.apiService.post<Project>('/projects', project);
  }

  updateProject(id: number, project: ProjectRequest): Observable<Project> {
    return this.apiService.put<Project>(`/projects/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.apiService.delete<void>(`/projects/${id}`);
  }

  /** Archive a project — it drops out of the default project lists. */
  archiveProject(id: number): Observable<any> {
    return this.apiService.patch<any>(`/projects/${id}/archive`, {});
  }

  getProjectsByManager(managerId: number, page: number = 0, size: number = 10): Observable<PagedResponse<Project>> {
    return this.apiService.get<PagedResponse<Project>>(`/projects/manager/${managerId}?page=${page}&size=${size}`);
  }

  getProjectsByStatus(status: string, page: number = 0, size: number = 10): Observable<PagedResponse<Project>> {
    return this.apiService.get<PagedResponse<Project>>(`/projects/status/${status}?page=${page}&size=${size}`);
  }

  // Team-related operations
  getTeamsByProject(projectId: number, page: number = 0, size: number = 10): Observable<any> {
    return this.apiService.get<any>(`/teams/project/${projectId}?page=${page}&size=${size}`);
  }

  createTeam(team: { name: string; description?: string; projectId?: number; managerId?: number; memberIds?: number[] }): Observable<any> {
    return this.apiService.post<any>('/teams', team);
  }

  addMemberToTeam(teamId: number, userId: number): Observable<any> {
    return this.apiService.post<any>(`/teams/${teamId}/members/${userId}`, {});
  }

  removeMemberFromTeam(teamId: number, userId: number): Observable<any> {
    return this.apiService.delete<any>(`/teams/${teamId}/members/${userId}`);
  }

  getProjectMembers(projectId: number): Observable<any> {
    return this.apiService.get<any>(`/projects/${projectId}/members`);
  }
}
