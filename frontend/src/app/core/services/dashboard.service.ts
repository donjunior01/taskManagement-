import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  
  totalTeams: number;
  teamMembers: number;
}

export interface ManagerDashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  teamMembers: number;
}

export interface UserDashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private apiService: ApiService) {}

  getAdminStats(): Observable<AdminDashboardStats> {
    return this.apiService.get<AdminDashboardStats>('/dashboard/admin/stats');
  }

  getManagerStats(): Observable<ManagerDashboardStats> {
    return this.apiService.get<ManagerDashboardStats>(`/dashboard/manager/stats`);
  }

  getUserStats(): Observable<UserDashboardStats> {
    return this.apiService.get<UserDashboardStats>(`/dashboard/user/stats`);
  }
}
