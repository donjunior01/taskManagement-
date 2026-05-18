import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface TimeLog {
  id?: number;
  taskId: number;
  userId?: number;
  hours: number;
  date: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimeLogService {
  private basePath = '/time-logs';

  constructor(private apiService: ApiService) {}

  getAllTimeLogs(): Observable<TimeLog[]> {
    return this.apiService.get<TimeLog[]>(this.basePath);
  }

  getTimeLogById(id: number): Observable<TimeLog> {
    return this.apiService.get<TimeLog>(`${this.basePath}/${id}`);
  }

  getTimeLogsByUser(userId: number): Observable<TimeLog[]> {
    return this.apiService.get<TimeLog[]>(`${this.basePath}/user/${userId}`);
  }

  getTotalHoursByUser(userId: number): Observable<number> {
    return this.apiService.get<number>(`${this.basePath}/user/${userId}/total`);
  }

  getTimeLogsByDateRange(userId: number, startDate: string, endDate: string): Observable<TimeLog[]> {
    return this.apiService.get<TimeLog[]>(`${this.basePath}/user/${userId}/range?startDate=${startDate}&endDate=${endDate}`);
  }

  getTimeLogsByTask(taskId: number): Observable<TimeLog[]> {
    return this.apiService.get<TimeLog[]>(`${this.basePath}/task/${taskId}`);
  }

  getTotalHoursByTask(taskId: number): Observable<number> {
    return this.apiService.get<number>(`${this.basePath}/task/${taskId}/total`);
  }

  exportTimeLogsByTaskCsv(taskId: number): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/task/${taskId}/export/csv`);
  }

  getMyTimeLogsSimple(): Observable<TimeLog[]> {
    return this.apiService.get<TimeLog[]>(`${this.basePath}/my`);
  }

  getMyTimeLogs(): Observable<TimeLog[]> {
    return this.apiService.get<TimeLog[]>(`${this.basePath}/my-logs`);
  }

  exportMyTimeLogsCsv(): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/export/csv`);
  }

  createTimeLog(timeLog: TimeLog): Observable<TimeLog> {
    return this.apiService.post<TimeLog>(this.basePath, timeLog);
  }

  updateTimeLog(id: number, timeLog: TimeLog): Observable<TimeLog> {
    return this.apiService.put<TimeLog>(`${this.basePath}/${id}`, timeLog);
  }

  deleteTimeLog(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
