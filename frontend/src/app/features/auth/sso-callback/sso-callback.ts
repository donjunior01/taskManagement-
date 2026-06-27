import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Landing route the backend redirects to after a successful SSO login, carrying ?token=. It hydrates
 * the session and forwards to the right dashboard, or back to /login on error.
 */
@Component({
  selector: 'app-sso-callback',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="sso-cb">
      <div class="sso-card">
        <div class="sso-spinner" *ngIf="!error"></div>
        <p *ngIf="!error">{{ 'auth.sso.signingIn' | translate }}</p>
        <p class="sso-error" *ngIf="error">{{ 'auth.sso.failed' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .sso-cb { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-subtle); }
    .sso-card { display: flex; flex-direction: column; align-items: center; gap: 14px; color: var(--text-secondary); font-size: 14px; font-weight: 600; }
    .sso-spinner { width: 38px; height: 38px; border: 4px solid var(--border-strong); border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .sso-error { color: var(--danger-text); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SsoCallbackComponent implements OnInit {
  error = false;

  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const err = this.route.snapshot.queryParamMap.get('error');
    if (err || !token) {
      this.error = true;
      setTimeout(() => this.router.navigate(['/login'], { queryParams: { ssoError: err || 'no_token' } }), 1800);
      return;
    }
    this.auth.establishSsoSession(token).subscribe({
      next: (role) => {
        if (role.includes('ADMIN')) this.router.navigate(['/admin/dashboard']);
        else if (role.includes('PROJECT_MANAGER')) this.router.navigate(['/pm/dashboard']);
        else this.router.navigate(['/user/dashboard']);
      },
      error: () => {
        this.error = true;
        setTimeout(() => this.router.navigate(['/login'], { queryParams: { ssoError: 'session' } }), 1800);
      }
    });
  }
}
