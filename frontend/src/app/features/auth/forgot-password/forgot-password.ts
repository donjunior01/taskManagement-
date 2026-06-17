import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BrandingService } from '../../../core/services/branding.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LangToggleComponent } from '../../../shared/components/lang-toggle/lang-toggle';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, LangToggleComponent],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router, private translate: TranslateService, public branding: BrandingService) {}

  onSubmit(): void {
    if (!this.email || !this.email.trim()) { this.errorMessage = this.translate.instant('auth.fpEnterEmailErr'); return; }
    this.loading = true;
    this.errorMessage = '';
    this.message = '';

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (response: any) => {
        this.loading = false;
        // The backend returns { success, message }. Confirmation when the e-mail exists, failure otherwise.
        if (response?.success === false) {
          this.errorMessage = response?.message || this.translate.instant('auth.fpNoAccount');
        } else {
          this.message = response?.message || this.translate.instant('auth.fpSentDefault');
          setTimeout(() => this.router.navigate(['/login']), 3500);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || this.translate.instant('auth.fpRequestFailed');
      }
    });
  }
}
