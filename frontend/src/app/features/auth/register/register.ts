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
    lastName: '',
    organizationName: ''
  };
  errorMessage: string = '';
  loading: boolean = false;
  passwordTouched: boolean = false;

  // Registration access policy (loaded from the public endpoint).
  registrationEnabled: boolean = true;
  allowedDomains: string[] = [];
  policyLoaded: boolean = false;

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
    // Load the registration access policy (is sign-up open, allowed domains).
    this.settings.getRegistrationPolicy().subscribe({
      next: (r) => {
        this.registrationEnabled = r?.registrationEnabled !== false;
        this.allowedDomains = r?.allowedDomains || [];
        this.policyLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => { this.policyLoaded = true; }
    });
  }

  /** Human-readable list of allowed domains, e.g. "@taskmaster.com or @acme.com". */
  get allowedDomainsHint(): string {
    return this.allowedDomains.map(d => '@' + d).join(', ');
  }

  /** True when the typed email's domain satisfies the policy (or no restriction is set). */
  get emailDomainAllowed(): boolean {
    if (!this.allowedDomains.length) return true;
    const email = (this.registerRequest.email || '').toLowerCase();
    const at = email.indexOf('@');
    if (at < 0) return false;
    return this.allowedDomains.includes(email.substring(at + 1).trim());
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

    // Company email-domain policy (applies to joining the company, i.e. no new-org name).
    if (!this.registerRequest.organizationName && !this.emailDomainAllowed) {
      this.errorMessage = this.translate.instant('auth.errDomain', { domains: this.allowedDomainsHint });
      this.toast.show(this.errorMessage, 'error');
      this.cdr.detectChanges();
      return;
    }

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
        // Creating an organization makes this user its active admin — they can sign in right away.
        const created = this.registerRequest.organizationName?.trim() ? 'org' : 'pending';
        this.router.navigate(['/login'], { queryParams: { registered: created } });
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
