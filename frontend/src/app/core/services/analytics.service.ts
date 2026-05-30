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
}
