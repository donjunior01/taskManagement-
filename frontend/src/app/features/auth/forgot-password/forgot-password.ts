import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';
    this.message = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.message = 'Password reset link has been sent to your email.';
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Failed to send password reset link. Please try again.';
        console.error('Forgot password error:', error);
      }
    });
  }
}
