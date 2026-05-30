import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface LoginRequest {
  email: string;
  password: string;
  code?: string;   // TOTP code when 2FA is enabled
}

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  roles: string[];
  twoFactorRequired?: boolean;   // true when the account needs a TOTP code
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/login', credentials).pipe(
      map(response => {
        if (response.token) {
          localStorage.setItem('jwt_token', response.token);
          localStorage.setItem('user_id', response.id.toString());
          localStorage.setItem('user_email', response.email);
          localStorage.setItem('user_roles', JSON.stringify(response.roles));
          
          const user: User = {
            id: response.id,
            email: response.email,
            firstName: '',
            lastName: '',
            role: response.roles && response.roles.length > 0 ? response.roles[0] : 'USER'
          };
          
          this.currentUserSubject.next(user);
        }
        return response;
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.apiService.post<any>('/auth/register', userData);
  }

  forgotPassword(email: string): Observable<any> {
    return this.apiService.post<any>('/auth/password-reset/request', { email });
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_roles');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserRoles(): string[] {
    const roles = localStorage.getItem('user_roles');
    return roles ? JSON.parse(roles) : [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  private loadUserFromStorage(): void {
    const userId = localStorage.getItem('user_id');
    const email = localStorage.getItem('user_email');
    const roles = this.getUserRoles();
    
    if (userId && email) {
      const user: User = {
        id: parseInt(userId),
        email: email,
        firstName: '',
        lastName: '',
        role: roles && roles.length > 0 ? roles[0] : 'USER'
      };
      this.currentUserSubject.next(user);
    }
  }
}
