import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { FooterComponent } from './shared/components/footer/footer';
import { MfaSetupGateComponent } from './shared/components/mfa-setup-gate/mfa-setup-gate';
import { PasswordGateComponent } from './shared/components/password-gate/password-gate';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette';
import { BrandingService } from './core/services/branding.service';
import { IdleTimeoutService } from './core/services/idle-timeout.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, FooterComponent, MfaSetupGateComponent, PasswordGateComponent, CommandPaletteComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');

  constructor(private branding: BrandingService, private idle: IdleTimeoutService, private theme: ThemeService) {
    // Load the admin-configured app name / logo / PDF colours app-wide (public endpoint).
    this.branding.load();
    // Start the inactivity watchdog (logs out after a period of no activity).
    this.idle.start();
    // ThemeService applies the saved/OS theme to <html> on construction.
    void this.theme;
  }
}
