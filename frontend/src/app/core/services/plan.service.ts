import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PlanOption { key: string; maxUsers: number; maxProjects: number; }
export interface PlanInfo {
  organizationName: string;
  plan: string;
  maxUsers: number;
  maxProjects: number;
  userCount: number;
  projectCount: number;
  available: PlanOption[];
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private base = '/plan';
  constructor(private api: ApiService) {}

  current(): Observable<PlanInfo> { return this.api.get<PlanInfo>(this.base); }
  change(plan: string): Observable<any> { return this.api.post<any>(`${this.base}/change`, { plan }); }
}
