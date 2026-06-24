import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Logs the user out after a period of inactivity (no mouse/keyboard/scroll), sending them to the
 * login page with a "session expired" notice. Complements the absolute JWT expiry with an idle cap.
 */
@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private static readonly IDLE_MINUTES = 30;
  private static readonly EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

  private timer: any;
  private started = false;
  private readonly handler = () => this.reset();

  constructor(private auth: AuthService, private router: Router, private zone: NgZone) {}

  /** Begin watching for inactivity (idempotent). Call once at app start. */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.zone.runOutsideAngular(() => {
      IdleTimeoutService.EVENTS.forEach(e => window.addEventListener(e, this.handler, { passive: true }));
    });
    this.reset();
  }

  private reset(): void {
    clearTimeout(this.timer);
    if (!this.auth.isLoggedIn()) return;
    this.zone.runOutsideAngular(() => {
      this.timer = setTimeout(() => this.zone.run(() => this.expire()), IdleTimeoutService.IDLE_MINUTES * 60_000);
    });
  }

  private expire(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.logout();
      this.router.navigate(['/login'], { queryParams: { expired: '1' } });
    }
  }
}
