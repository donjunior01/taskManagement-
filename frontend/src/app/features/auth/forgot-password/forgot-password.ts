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
    if (!this.email || !this.email.trim()) { this.errorMessage = 'Veuillez saisir votre adresse e-mail.'; return; }
    this.loading = true;
    this.errorMessage = '';
    this.message = '';

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (response: any) => {
        this.loading = false;
        // The backend returns { success, message }. Confirmation when the e-mail exists, failure otherwise.
        if (response?.success === false) {
          this.errorMessage = response?.message || 'Aucun compte n\'est associé à cette adresse e-mail.';
        } else {
          this.message = response?.message || 'Votre demande a été envoyée à l\'administrateur.';
          setTimeout(() => this.router.navigate(['/login']), 3500);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Échec de l\'envoi de la demande. Veuillez réessayer.';
      }
    });
  }
}
