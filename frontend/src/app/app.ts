import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { BrandingService } from './core/services/branding.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');

  constructor(private branding: BrandingService) {
    // Load the admin-configured app name / logo / PDF colours app-wide (public endpoint).
    this.branding.load();
  }
}
