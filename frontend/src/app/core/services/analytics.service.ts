import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface WeeklyPoint {
  label: string;
  created: number;
  completed: number;
}

export interface MemberWorkload {
  memberName: string;
  openTasks: number;
  completedTasks: number;
}

export interface ManagerAnalytics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  onHoldTasks: number;
  onTimeCompletionRate: number;
  avgCompletionDays: number;
  velocityLast4Weeks: number;
  weeklyTrend: WeeklyPoint[];
  workloadByMember: MemberWorkload[];
  generatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private apiService: ApiService) {}

  getManagerAnalytics(): Observable<ManagerAnalytics> {
    return this.apiService.get<ManagerAnalytics>('/analytics/manager');
  }

  /** Portfolio-wide report analytics (real data). Response is wrapped in ApiResponse.data. */
  getAdminReports(period?: string): Observable<any> {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.apiService.get<any>(`/analytics/admin/reports${q}`);
  }

  /** Live API performance metrics (real request metrics). Wrapped in ApiResponse.data. */
  getPerformance(): Observable<any> {
    return this.apiService.get<any>('/analytics/admin/performance');
  }
}
