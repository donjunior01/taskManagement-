import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SupportTicket {
  id?: number;
  title: string;
  description: string;
  status?: string;
  assignedToId?: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportTicketService {
  private basePath = '/support-tickets';

  constructor(private apiService: ApiService) {}

  getAllTickets(): Observable<SupportTicket[]> {
    return this.apiService.get<SupportTicket[]>(this.basePath);
  }

  getTicketById(id: number): Observable<SupportTicket> {
    return this.apiService.get<SupportTicket>(`${this.basePath}/${id}`);
  }

  getMyTickets(): Observable<SupportTicket[]> {
    return this.apiService.get<SupportTicket[]>(`${this.basePath}/my`);
  }

  getOpenTicketsCount(): Observable<number> {
    return this.apiService.get<number>(`${this.basePath}/count/open`);
  }

  createTicket(ticket: SupportTicket): Observable<SupportTicket> {
    return this.apiService.post<SupportTicket>(this.basePath, ticket);
  }

  updateTicketStatus(id: number, status: string): Observable<SupportTicket> {
    return this.apiService.patch<SupportTicket>(`${this.basePath}/${id}/status`, status);
  }

  assignTicket(id: number, assigneeId: number): Observable<SupportTicket> {
    return this.apiService.patch<SupportTicket>(`${this.basePath}/${id}/assign`, assigneeId);
  }

  deleteTicket(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
