import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { BrandingService } from './branding.service';

export type AppLang = 'fr' | 'en';

/**
 * Holds the active UI/AI language. Initialised from the admin-configured default language
 * (Configuration → Général, exposed via the public branding endpoint); the top-bar toggle
 * lets a user override it, and the choice is remembered in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private static readonly KEY = 'app_lang';

  /** True once the user has explicitly toggled — stops the admin default from overriding them. */
  private explicit = false;
  private subject = new BehaviorSubject<AppLang>('fr');
  public lang$ = this.subject.asObservable();

  constructor(branding: BrandingService, private translate: TranslateService) {
    this.translate.addLangs(['fr', 'en']);
    const saved = (localStorage.getItem(LanguageService.KEY) || '') as AppLang;
    if (saved === 'fr' || saved === 'en') {
      this.explicit = true;
      this.subject.next(saved);
    }
    this.translate.use(this.subject.value);
    this.applyHtmlLang(this.subject.value);

    // Adopt the admin default once branding loads — unless the user already chose.
    branding.branding$.subscribe(b => this.applyAdminDefault(b?.defaultLanguage));
  }

  get current(): AppLang { return this.subject.value; }

  /** Language name for AI prompts ("French" / "English"). */
  get aiCode(): string { return this.subject.value; }

  set(lang: AppLang): void {
    this.explicit = true;
    try { localStorage.setItem(LanguageService.KEY, lang); } catch { /* ignore */ }
    this.subject.next(lang);
    this.translate.use(lang);
    this.applyHtmlLang(lang);
  }

  toggle(): void {
    this.set(this.current === 'fr' ? 'en' : 'fr');
  }

  /** Apply the admin default only when the user hasn't made an explicit choice. */
  private applyAdminDefault(defaultLanguage?: string): void {
    if (this.explicit || !defaultLanguage) return;
    const lang: AppLang = defaultLanguage.toLowerCase().includes('eng') ? 'en' : 'fr';
    this.subject.next(lang);
    this.translate.use(lang);
    this.applyHtmlLang(lang);
  }

  private applyHtmlLang(l: AppLang): void {
    try { document.documentElement.lang = l; } catch { /* SSR/no-DOM guard */ }
  }
}
