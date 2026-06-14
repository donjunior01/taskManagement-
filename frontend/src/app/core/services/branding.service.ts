import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

/** Branding values shown app-wide and baked into every generated PDF. */
export interface Branding {
  appName: string;
  logoUrl: string | null;
  pdfHeaderColor: string;
  pdfFooterColor: string;
  pdfFooterText: string;
  defaultLanguage: string;
}

const DEFAULTS: Branding = {
  appName: 'TaskMaster Pro',
  logoUrl: null,
  pdfHeaderColor: '#1e2540',
  pdfFooterColor: '#2563eb',
  pdfFooterText: 'Document confidentiel — généré automatiquement',
  defaultLanguage: 'Français'
};

/**
 * Single source of truth for the application's brand (name, logo, PDF colours).
 * Loaded from the public `/settings/branding` endpoint at startup so the login &
 * registration pages — and the dashboards — all show the admin-configured identity.
 */
@Injectable({ providedIn: 'root' })
export class BrandingService {
  private subject = new BehaviorSubject<Branding>({ ...DEFAULTS });
  /** Subscribe to react live when the admin changes the app name / logo. */
  public branding$ = this.subject.asObservable();

  constructor(private api: ApiService) {}

  get current(): Branding { return this.subject.value; }

  /** Fetch the public branding (no auth required) and apply it app-wide. */
  load(): void {
    this.api.get<any>('/settings/branding').subscribe({
      next: (b) => this.apply(b),
      error: () => { /* keep defaults if the backend is momentarily unavailable */ }
    });
  }

  /** Merge a (partial) settings/branding payload into the live brand and update the tab title. */
  apply(b: Partial<Branding> | null | undefined): void {
    if (!b) return;
    const next: Branding = {
      appName: (b.appName && b.appName.trim()) || DEFAULTS.appName,
      logoUrl: b.logoUrl ? b.logoUrl : null,
      pdfHeaderColor: b.pdfHeaderColor || DEFAULTS.pdfHeaderColor,
      pdfFooterColor: b.pdfFooterColor || DEFAULTS.pdfFooterColor,
      pdfFooterText: b.pdfFooterText != null ? b.pdfFooterText : DEFAULTS.pdfFooterText,
      defaultLanguage: (b.defaultLanguage && b.defaultLanguage.trim()) || DEFAULTS.defaultLanguage
    };
    this.subject.next(next);
    try { document.title = next.appName; } catch { /* SSR/no-DOM guard */ }
  }
}
