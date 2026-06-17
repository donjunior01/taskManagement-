import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BrandingService } from '../../../core/services/branding.service';
import { SystemSettingsService, PasswordPolicy } from '../../../core/services/system-settings.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LangToggleComponent } from '../../../shared/components/lang-toggle/lang-toggle';

interface PasswordRule { label: string; met: boolean; }

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, LangToggleComponent],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent implements OnInit {
  registerRequest = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  };
  errorMessage: string = '';
  loading: boolean = false;
  passwordTouched: boolean = false;

  // Active password policy (defaults mirror the backend until the live policy loads).
  policy: PasswordPolicy = { minLength: 12, requireUppercase: true, requireDigit: true, requireSpecial: true };

  constructor(
    private authService: AuthService,
    private router: Router,
    public branding: BrandingService,
    private settings: SystemSettingsService,
    private toast: ToastService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load the real password policy so requirements shown match what the backend enforces.
    this.settings.getPasswordPolicy().subscribe({
      next: (p) => { if (p) { this.policy = { ...this.policy, ...p }; this.cdr.detectChanges(); } },
      error: () => { /* keep sensible defaults if offline */ }
    });
  }

  /** Live checklist of the password requirements, each flagged met/unmet as the user types. */
  get passwordRules(): PasswordRule[] {
    const pw = this.registerRequest.password || '';
    const rules: PasswordRule[] = [
      { label: this.translate.instant('auth.ruleMinLength', { n: this.policy.minLength || 0 }), met: pw.length >= (this.policy.minLength || 0) }
    ];
    if (this.policy.requireUppercase) rules.push({ label: this.translate.instant('auth.ruleUppercase'), met: /[A-Z]/.test(pw) });
    if (this.policy.requireDigit)     rules.push({ label: this.translate.instant('auth.ruleDigit'), met: /[0-9]/.test(pw) });
    if (this.policy.requireSpecial)   rules.push({ label: this.translate.instant('auth.ruleSpecial'), met: /[^A-Za-z0-9]/.test(pw) });
    return rules;
  }

  /** True once every active password requirement is satisfied. */
  get passwordValid(): boolean {
    return this.passwordRules.every(r => r.met);
  }

  onSubmit(): void {
    this.errorMessage = '';

    // Client-side guard so the user is guided before the request is even sent.
    if (!this.passwordValid) {
      this.passwordTouched = true;
      this.errorMessage = this.translate.instant('auth.errPasswordReqs');
      this.toast.show(this.errorMessage, 'error');
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.authService.register(this.registerRequest).subscribe({
      next: () => {
        this.loading = false;
        // New accounts are inactive until an admin approves them — tell the user on the login page.
        this.router.navigate(['/login'], { queryParams: { registered: 'pending' } });
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.friendlyError(error);
        // Surface the reason via the app-level toast too, so it's visible regardless of scroll/position.
        this.toast.show(this.errorMessage, 'error');
        console.error('Registration error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  /** Map the backend's reason to a clear, localized message shown in the form. */
  private friendlyError(error: any): string {
    const raw: string = (typeof error === 'string' ? error : (error?.error?.message || error?.error?.error || error?.message || '')) || '';
    const low = raw.toLowerCase();
    if (low.includes('email') && (low.includes('exist') || low.includes('already') || low.includes('utilis'))) {
      return this.translate.instant('auth.errEmailExists');
    }
    if (low.includes('username') && (low.includes('exist') || low.includes('already') || low.includes('pris'))) {
      return this.translate.instant('auth.errUsernameTaken');
    }
    if (low.includes('mot de passe') || low.includes('password')) {
      return raw; // backend already returns a precise password-policy message
    }
    return raw || this.translate.instant('auth.errRegisterFailed');
  }
}
