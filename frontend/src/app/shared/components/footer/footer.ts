import { Component, AfterViewInit, OnDestroy, NgZone, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BrandingService } from '../../../core/services/branding.service';

/**
 * Slim dashboard footer pinned to the bottom of the viewport (so it's visible before any scroll),
 * aligned to the dashboard content column with left/right padding. It fades out while the user
 * scrolls and returns shortly after scrolling stops. Shows app name, copyright and build/version.
 *
 * The bar is re-parented to <body> on init: the dashboard's .dash-wrap has an animation whose
 * retained `transform` would otherwise become the containing block for `position: fixed`, pinning
 * the footer to the (scrolling) content instead of the viewport.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer #bar class="app-footer" [class.hidden]="hidden" [class.off]="onAuthPage">
      © {{ year }} {{ branding.current.appName }} · V 2.0.0 — Build by Don Junior
    </footer>
  `,
  styles: [`
    .app-footer {
      position: fixed; z-index: 25;
      left: calc(var(--sidebar-w, 260px) + 36px); right: 90px; bottom: 16px;
      padding: 9px 18px; text-align: right;
      font-size: 11px; color: var(--text-muted);
      background: var(--bg-card); border: 1px solid var(--border-light, var(--border));
      border-radius: var(--radius-lg, 12px); box-shadow: 0 2px 10px rgba(15, 23, 42, .14);
      transition: transform .25s ease, opacity .25s ease; will-change: transform;
    }
    .app-footer.hidden { transform: translateY(180%); opacity: 0; pointer-events: none; }
    .app-footer.off { display: none; } /* fully hidden on auth pages (login/register/forgot-password) */
    @media (max-width: 768px) { .app-footer { left: 16px; right: 16px; bottom: 12px; text-align: center; } }
  `]
})
export class FooterComponent implements AfterViewInit, OnDestroy {
  readonly year = new Date().getFullYear();
  hidden = false;
  /** Hidden on the pre-login auth pages (login / register / forgot-password). */
  onAuthPage = false;

  @ViewChild('bar', { static: true }) private bar!: ElementRef<HTMLElement>;
  private onScroll?: () => void;
  private timer: any;
  private routerSub?: Subscription;

  constructor(public branding: BrandingService, private zone: NgZone, private cdr: ChangeDetectorRef, private router: Router) {
    this.onAuthPage = this.isAuthRoute(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => { this.onAuthPage = this.isAuthRoute(e.urlAfterRedirects); this.cdr.markForCheck(); });
  }

  /** True for the unauthenticated landing/auth routes where the dashboard footer shouldn't show. */
  private isAuthRoute(url: string): boolean {
    const path = (url || '').split('?')[0].split('#')[0];
    return path === '/' || /^\/(login|register|forgot-password)\b/.test(path);
  }

  ngAfterViewInit(): void {
    // Escape any transformed ancestor so `position: fixed` is relative to the viewport (visible at rest).
    try { document.body.appendChild(this.bar.nativeElement); } catch { /* ignore */ }
    // The app scrolls on the window; hide while scrolling, restore shortly after it stops.
    this.zone.runOutsideAngular(() => {
      this.onScroll = () => {
        if (!this.hidden) this.zone.run(() => { this.hidden = true; this.cdr.markForCheck(); });
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.zone.run(() => { this.hidden = false; this.cdr.markForCheck(); }), 600);
      };
      window.addEventListener('scroll', this.onScroll, { passive: true, capture: true });
    });
  }

  ngOnDestroy(): void {
    if (this.onScroll) window.removeEventListener('scroll', this.onScroll, true);
    clearTimeout(this.timer);
    this.routerSub?.unsubscribe();
    try { this.bar?.nativeElement?.remove(); } catch { /* ignore */ }
  }
}
