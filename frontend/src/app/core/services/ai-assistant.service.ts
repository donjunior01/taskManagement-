import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ProjectInsight {
  projectId: number;
  projectName: string;
  summary: string;
  healthStatus: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';
  healthHeadline: string;
  recommendations: string[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  todoTasks: number;
  completionRate: number;
  daysRemaining: number | null;
  source: 'MOCK' | 'AI';
  generatedAt: string;
}

export interface TaskPrioritySuggestion {
  taskId: number;
  taskName: string;
  assignedToName: string;
  currentPriority: string;
  suggestedPriority: string;
  changeRecommended: boolean;
  urgencyScore: number;
  reason: string;
}

export interface PrioritizationResult {
  projectId: number;
  projectName: string;
  overallAdvice: string;
  suggestions: TaskPrioritySuggestion[];
  source: 'MOCK' | 'AI';
  generatedAt: string;
}

export interface TaskRisk {
  taskId: number;
  taskName: string;
  assignedToName: string;
  deadline: string | null;
  progress: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedSlipDays: number;
  predictedCompletionDate: string | null;
  reason: string;
}

export interface RiskAssessment {
  projectId: number;
  projectName: string;
  projectRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  headline: string;
  summary: string;
  atRiskCount: number;
  totalOpenTasks: number;
  predictedProjectCompletion: string | null;
  projectDeadline: string | null;
  projectSlipDays: number;
  risks: TaskRisk[];
  source: 'MOCK' | 'AI';
  generatedAt: string;
}

/**
 * Client for the AI assistant endpoints (project insights + task prioritisation).
 * The backend currently returns rule-based ("MOCK") results; the contract is stable
 * for when a live model is wired in.
 */
@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  constructor(private apiService: ApiService) {}

  getProjectSummary(projectId: number): Observable<ProjectInsight> {
    return this.apiService.get<ProjectInsight>(`/ai/projects/${projectId}/summary`);
  }

  getTaskPriorities(projectId: number): Observable<PrioritizationResult> {
    return this.apiService.get<PrioritizationResult>(`/ai/projects/${projectId}/priorities`);
  }

  getRiskAssessment(projectId: number): Observable<RiskAssessment> {
    return this.apiService.get<RiskAssessment>(`/ai/projects/${projectId}/risks`);
  }
}
