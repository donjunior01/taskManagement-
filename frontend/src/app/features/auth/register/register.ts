import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  registerRequest = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  };
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.registerRequest).subscribe({
      next: (response) => {
        this.loading = false;
        // New accounts are inactive until an admin approves them — tell the user on the login page.
        this.router.navigate(['/login'], { queryParams: { registered: 'pending' } });
      },
      error: (error) => {
        this.loading = false;
        // Surface the backend's real reason (e.g. password policy, duplicate email).
        const msg = error?.error?.message || error?.error?.error;
        this.errorMessage = msg || 'L\'inscription a échoué. Veuillez réessayer.';
        console.error('Registration error:', error);
      }
    });
  }
}
