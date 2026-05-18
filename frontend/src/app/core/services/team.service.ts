import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Team {
  id?: number;
  name: string;
  projectId: number;
  description?: string;
  members?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private basePath = '/teams';

  constructor(private apiService: ApiService) {}

  getAllTeams(): Observable<Team[]> {
    return this.apiService.get<Team[]>(this.basePath);
  }

  getTeamById(id: number): Observable<Team> {
    return this.apiService.get<Team>(`${this.basePath}/${id}`);
  }

  getTeamsByProject(projectId: number): Observable<Team[]> {
    return this.apiService.get<Team[]>(`${this.basePath}/project/${projectId}`);
  }

  getTeamsByMember(userId: number): Observable<Team[]> {
    return this.apiService.get<Team[]>(`${this.basePath}/member/${userId}`);
  }

  createTeam(team: Team): Observable<Team> {
    return this.apiService.post<Team>(this.basePath, team);
  }

  updateTeam(id: number, team: Team): Observable<Team> {
    return this.apiService.put<Team>(`${this.basePath}/${id}`, team);
  }

  addMemberToTeam(teamId: number, userId: number): Observable<void> {
    return this.apiService.post<void>(`${this.basePath}/${teamId}/members/${userId}`, {});
  }

  removeMemberFromTeam(teamId: number, userId: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${teamId}/members/${userId}`);
  }

  deleteTeam(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
