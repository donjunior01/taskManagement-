import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Comment {
  id?: number;
  content: string;
  userId?: number;
  taskId?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private basePath = '/comments';

  constructor(private apiService: ApiService) {}

  getAllComments(): Observable<Comment[]> {
    return this.apiService.get<Comment[]>(this.basePath);
  }

  getCommentById(id: number): Observable<Comment> {
    return this.apiService.get<Comment>(`${this.basePath}/${id}`);
  }

  getCommentsByUser(userId: number): Observable<Comment[]> {
    return this.apiService.get<Comment[]>(`${this.basePath}/user/${userId}`);
  }

  getCommentsByTask(taskId: number): Observable<Comment[]> {
    return this.apiService.get<Comment[]>(`${this.basePath}/task/${taskId}`);
  }

  createComment(comment: Comment): Observable<Comment> {
    return this.apiService.post<Comment>(this.basePath, comment);
  }

  updateComment(id: number, comment: Comment): Observable<Comment> {
    return this.apiService.put<Comment>(`${this.basePath}/${id}`, comment);
  }

  deleteComment(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }
}
