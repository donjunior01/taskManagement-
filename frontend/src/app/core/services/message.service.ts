import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Message {
  id?: number;
  senderId?: number;
  receiverId?: number;
  projectId?: number;
  content: string;
  isRead?: boolean;
  createdAt?: string;
  senderName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private basePath = '/messages';

  constructor(private apiService: ApiService) {}

  getAllMessages(): Observable<Message[]> {
    return this.apiService.get<Message[]>(this.basePath);
  }

  getMessageById(id: number): Observable<Message> {
    return this.apiService.get<Message>(`${this.basePath}/${id}`);
  }

  getMessagesByUser(userId: number): Observable<Message[]> {
    return this.apiService.get<Message[]>(`${this.basePath}/user/${userId}`);
  }

  getUnreadMessages(): Observable<Message[]> {
    return this.apiService.get<Message[]>(`${this.basePath}/unread`);
  }

  getUnreadCount(): Observable<number> {
    return this.apiService.get<number>(`${this.basePath}/unread/count`);
  }

  getSentMessages(): Observable<Message[]> {
    return this.apiService.get<Message[]>(`${this.basePath}/sent`);
  }

  getReceivedMessages(): Observable<Message[]> {
    return this.apiService.get<Message[]>(`${this.basePath}/received`);
  }

  getMessagesByProject(projectId: number): Observable<Message[]> {
    return this.apiService.get<Message[]>(`${this.basePath}/project/${projectId}`);
  }

  getConversations(): Observable<any[]> {
    return this.apiService.get<any[]>(`${this.basePath}/conversations`);
  }

  getConversationWithUser(otherUserId: number): Observable<Message[]> {
    return this.apiService.get<Message[]>(`${this.basePath}/conversation/${otherUserId}`);
  }

  sendMessage(message: Message): Observable<Message> {
    return this.apiService.post<Message>(this.basePath, message);
  }

  markAsRead(id: number): Observable<void> {
    return this.apiService.post<void>(`${this.basePath}/${id}/read`, {});
  }

  markConversationAsRead(senderId: number): Observable<void> {
    return this.apiService.put<void>(`${this.basePath}/read/${senderId}`, {});
  }

  deleteMessage(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
