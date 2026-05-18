import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';

export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  userId?: number;
  taskId?: number;
  projectId?: number;
  isAllDay?: boolean;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private basePath = '/calendar';

  constructor(private apiService: ApiService) {}

  getAllEvents(): Observable<CalendarEvent[]> {
    return this.apiService.get<CalendarEvent[]>(this.basePath);
  }

  getEventById(id: number): Observable<CalendarEvent> {
    return this.apiService.get<CalendarEvent>(`${this.basePath}/${id}`);
  }

  getUserEvents(): Observable<CalendarEvent[]> {
    return this.apiService.get<CalendarEvent[]>(`${this.basePath}/user`);
  }

  getUpcomingEvents(): Observable<CalendarEvent[]> {
    return this.apiService.get<CalendarEvent[]>(`${this.basePath}/upcoming`);
  }

  getEventsByRange(startDate: string, endDate: string): Observable<CalendarEvent[]> {
    let params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.apiService.get<CalendarEvent[]>(`${this.basePath}/range`, params);
  }

  getGoogleEvents(): Observable<any[]> {
    return this.apiService.get<any[]>(`${this.basePath}/google/events`);
  }

  createEvent(event: CalendarEvent): Observable<CalendarEvent> {
    return this.apiService.post<CalendarEvent>(this.basePath, event);
  }

  syncEvent(id: number): Observable<any> {
    return this.apiService.post<any>(`${this.basePath}/${id}/sync`, {});
  }

  createEventForTask(taskId: number, event: CalendarEvent): Observable<CalendarEvent> {
    return this.apiService.post<CalendarEvent>(`${this.basePath}/task/${taskId}/events`, event);
  }

  createEventForProject(projectId: number, event: CalendarEvent): Observable<CalendarEvent> {
    return this.apiService.post<CalendarEvent>(`${this.basePath}/project/${projectId}/events`, event);
  }

  updateEvent(id: number, event: CalendarEvent): Observable<CalendarEvent> {
    return this.apiService.put<CalendarEvent>(`${this.basePath}/${id}`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
