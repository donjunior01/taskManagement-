import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginRequest: LoginRequest = {
    email: '',
    password: ''
  };
  errorMessage: string = '';
  loading: boolean = false;
  showPassword: boolean = false;
  showSuspendedModal: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    if (!this.loginRequest.email || !this.loginRequest.password) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginRequest).subscribe({
      next: (response) => {
        try {
          // Dynamic redirection based on user roles
          const roles = response && response.roles ? response.roles : [];
          
          // Support both "ROLE_XXX" and "XXX" formats for robust routing
          if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')) {
            this.router.navigate(['/admin/dashboard']);
          } else if (roles.includes('PROJECT_MANAGER') || roles.includes('ROLE_PROJECT_MANAGER')) {
            this.router.navigate(['/pm/dashboard']);
          } else {
            this.router.navigate(['/user/dashboard']);
          }
        } catch (e) {
          console.error('Routing evaluation failed:', e);
          this.errorMessage = 'An error occurred during redirection. Please try again.';
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loading = false;
        // errorInterceptor may transform the error into a plain string
        const raw = typeof error === 'string' ? error : (error?.error?.message || error?.error?.error || error?.message || '');
        const isSuspended = error?.status === 403 || raw.toLowerCase().includes('suspended');
        if (isSuspended) {
          this.showSuspendedModal = true;
        } else {
          this.errorMessage = 'Invalid credentials. Please verify your corporate email and try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

