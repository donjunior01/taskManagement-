import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { FooterComponent } from './shared/components/footer/footer';
import { MfaSetupGateComponent } from './shared/components/mfa-setup-gate/mfa-setup-gate';
import { PasswordGateComponent } from './shared/components/password-gate/password-gate';
import { BrandingService } from './core/services/branding.service';
import { IdleTimeoutService } from './core/services/idle-timeout.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, FooterComponent, MfaSetupGateComponent, PasswordGateComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');

  constructor(private branding: BrandingService, private idle: IdleTimeoutService) {
    // Load the admin-configured app name / logo / PDF colours app-wide (public endpoint).
    this.branding.load();
    // Start the inactivity watchdog (logs out after a period of no activity).
    this.idle.start();
  }
}
