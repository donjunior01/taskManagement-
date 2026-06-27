import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PermissionService } from './permission.service';

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
  mfaSetupRequired?: boolean;    // true when policy forces this account to enrol in 2FA
  passwordChangeRequired?: boolean; // true when the password is past the rotation policy
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

  constructor(private apiService: ApiService, private permission: PermissionService) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/login', credentials).pipe(
      map(response => {
        if (response.token) {
          this.permission.reset();   // drop any cached permissions from a previous session
          localStorage.setItem('jwt_token', response.token);
          localStorage.setItem('user_id', response.id.toString());
          localStorage.setItem('user_email', response.email);
          localStorage.setItem('user_roles', JSON.stringify(response.roles));
          // Policy may require this account to enrol in 2FA before continuing (read by the setup gate).
          if (response.mfaSetupRequired) localStorage.setItem('mfa_setup_required', '1');
          else localStorage.removeItem('mfa_setup_required');
          // Password rotation policy may force a change before continuing (read by the password gate).
          if (response.passwordChangeRequired) localStorage.setItem('password_change_required', '1');
          else localStorage.removeItem('password_change_required');

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

  /** Whether SSO is available (drives the login-page button). */
  ssoStatus(): Observable<{ enabled: boolean; loginUrl: string }> {
    return this.apiService.get<{ enabled: boolean; loginUrl: string }>('/auth/sso-status');
  }

  /**
   * Hydrate the SPA session from an SSO-issued token: persist it, then load the current user so
   * role-based routing works exactly like a normal login. Returns the primary role for redirect.
   */
  establishSsoSession(token: string): Observable<string> {
    this.permission.reset();
    localStorage.setItem('jwt_token', token);
    return this.apiService.get<any>('/auth/me').pipe(
      map(me => {
        const roles: string[] = me?.roles || [];
        localStorage.setItem('user_id', String(me?.id ?? ''));
        localStorage.setItem('user_email', me?.email ?? '');
        localStorage.setItem('user_roles', JSON.stringify(roles));
        this.currentUserSubject.next({
          id: me?.id, email: me?.email, firstName: '', lastName: '',
          role: roles.length ? roles[0] : 'USER'
        });
        return roles.length ? roles[0] : 'USER';
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.apiService.post<any>('/auth/password-reset/request', { email });
  }

  logout(): void {
    this.permission.reset();
    // Purge ALL per-user / per-tenant cached data so nothing leaks to the next account on the same
    // browser (saved views tviews_*, live timer timer_*, msg_lastread_*, profile, etc.). Only the
    // global UI preferences (theme, language) are kept.
    const keep = new Set<string>(['theme', 'app_lang']);
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && !keep.has(k)) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch { /* storage unavailable — ignore */ }
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    // An expired token must NOT count as logged-in, otherwise route guards would activate the
    // dashboard and the user would briefly see an empty shell before the first 401 kicks them out.
    // Clearing it here makes the guard redirect straight to /login on (re)load.
    if (this.isJwtExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  /** Decode the JWT payload and check its `exp` claim (seconds). Malformed → treat as expired. */
  private isJwtExpired(token: string): boolean {
    try {
      const part = token.split('.')[1];
      if (!part) return true;
      const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(json);
      if (!payload || typeof payload.exp !== 'number') return false; // no exp → don't lock out
      return payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  /** True while a logged-in account still has a forced 2FA enrolment pending (admin policy). */
  isMfaSetupRequired(): boolean {
    return this.isLoggedIn() && localStorage.getItem('mfa_setup_required') === '1';
  }

  /** Called once the user has completed the forced 2FA enrolment. */
  clearMfaSetupRequired(): void {
    localStorage.removeItem('mfa_setup_required');
  }

  /** True while the rotation policy still requires this account to change its password. */
  isPasswordChangeRequired(): boolean {
    return this.isLoggedIn() && localStorage.getItem('password_change_required') === '1';
  }

  clearPasswordChangeRequired(): void {
    localStorage.removeItem('password_change_required');
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** Merge a partial update into the current user (e.g. after a profile edit) and persist it. */
  updateCurrentUser(patch: Partial<User>): void {
    const cur = this.currentUserSubject.value;
    if (!cur) return;
    const next = { ...cur, ...patch };
    this.currentUserSubject.next(next);
    if (patch.email != null) localStorage.setItem('user_email', patch.email);
    if (patch.firstName != null) localStorage.setItem('user_first', patch.firstName);
    if (patch.lastName != null) localStorage.setItem('user_last', patch.lastName);
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
        firstName: localStorage.getItem('user_first') || '',
        lastName: localStorage.getItem('user_last') || '',
        role: roles && roles.length > 0 ? roles[0] : 'USER'
      };
      this.currentUserSubject.next(user);
    }
  }
}
