import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService, LoginRequest } from '../../../core/services/auth.service';
import { BrandingService } from '../../../core/services/branding.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LangToggleComponent } from '../../../shared/components/lang-toggle/lang-toggle';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, LangToggleComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  loginRequest: LoginRequest = {
    email: '',
    password: ''
  };
  errorMessage: string = '';
  infoMessage: string = '';
  loading: boolean = false;
  showPassword: boolean = false;
  showSuspendedModal: boolean = false;
  twoFactorRequired: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public branding: BrandingService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['registered'] === 'pending') {
      this.infoMessage = this.translate.instant('auth.infoPending');
    } else if (params['expired'] === '1') {
      this.infoMessage = this.translate.instant('auth.infoExpired');
    }
  }

  onSubmit(): void {
    if (!this.loginRequest.email || !this.loginRequest.password) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginRequest).subscribe({
      next: (response) => {
        // 2FA challenge: password accepted, ask for the authenticator code.
        if (response && response.twoFactorRequired && !response.token) {
          this.twoFactorRequired = true;
          this.loading = false;
          this.errorMessage = '';
          this.cdr.detectChanges();
          return;
        }
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
          this.errorMessage = this.translate.instant('auth.errRedirect');
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loading = false;
        // errorInterceptor may transform the error into a plain string
        const raw = typeof error === 'string' ? error : (error?.error?.message || error?.error?.error || error?.message || '');
        const low = raw.toLowerCase();
        const isSuspended = low.includes('suspended') || low.includes('suspendu');
        if (isSuspended) {
          this.showSuspendedModal = true;
        } else if (error?.status === 403 && raw) {
          // Pending activation, maintenance mode, etc. — show the backend's exact reason.
          this.errorMessage = raw;
        } else if (this.twoFactorRequired) {
          this.errorMessage = this.translate.instant('auth.errInvalid2fa');
        } else {
          this.errorMessage = this.translate.instant('auth.errInvalidCreds');
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

