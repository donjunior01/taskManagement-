import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  userType?: string;
  isActive?: boolean;
  createdAt?: string;
  projectCount?: number;
}

export interface UserRequest {
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface PagedResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getAllUsers(page: number = 0, size: number = 10, sortBy: string = 'id', sortDir: string = 'asc'): Observable<PagedResponse<User>> {
    return this.apiService.get<PagedResponse<User>>(`/users?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  }

  getUserById(id: number): Observable<User> {
    return this.apiService.get<User>(`/users/${id}`);
  }

  createUser(user: UserRequest): Observable<User> {
    return this.apiService.post<User>('/users', user);
  }

  updateUser(id: number, user: UserRequest): Observable<User> {
    return this.apiService.put<User>(`/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.apiService.delete<void>(`/users/${id}`);
  }

  toggleUserStatus(id: number): Observable<User> {
    return this.apiService.patch<User>(`/users/${id}/status`, {});
  }

  getUsersByRole(role: string, page: number = 0, size: number = 10): Observable<PagedResponse<User>> {
    return this.apiService.get<PagedResponse<User>>(`/users/filter?role=${role}&page=${page}&size=${size}`);
  }

  getCurrentUser(): Observable<User> {
    return this.apiService.get<User>('/users/me'); // keeping for backwards compatibility if needed, but we should use auth context
  }

  getUserProfile(id: number): Observable<any> {
    return this.apiService.get<any>(`/users/${id}/profile`);
  }

  updateUserProfile(id: number, profileData: any): Observable<any> {
    return this.apiService.put<any>(`/users/${id}/profile`, profileData);
  }

  getUserList(): Observable<User[]> {
    return this.apiService.get<User[]>('/users/list');
  }

  filterUsers(params: any): Observable<PagedResponse<User>> {
    // Convert params object to HttpParams string
    const queryStr = Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    return this.apiService.get<PagedResponse<User>>(`/users/filter?${queryStr}`);
  }

  changePassword(passwordData: any): Observable<any> {
    return this.apiService.post<any>('/users/change-password', passwordData);
  }

  /** Admin: reset a user's password to a policy-compliant temporary value and email it. */
  resetUserPassword(id: number): Observable<any> {
    return this.apiService.post<any>(`/users/${id}/reset-password`, {});
  }
}
