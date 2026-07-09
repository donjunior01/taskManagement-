import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ImportResult {
  projectId: number;
  projectName: string;
  tasksImported: number;
  cardsSkipped: number;
  source: string;
}

/** Data migration from other tools (currently: Trello board JSON export). */
@Injectable({ providedIn: 'root' })
export class ImportService {
  constructor(private api: ApiService) {}

  importTrello(board: any): Observable<any> {
    return this.api.post<any>('/import/trello', board);
  }

  importAsana(projectName: string, csv: string): Observable<any> {
    return this.api.post<any>('/import/asana', { projectName, csv });
  }

  importJira(projectName: string, csv: string): Observable<any> {
    return this.api.post<any>('/import/jira', { projectName, csv });
  }
}
