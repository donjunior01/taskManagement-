import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

/** Reusable FR ⇄ EN pill toggle with circular flag icons (header + auth pages). */
@Component({
  selector: 'app-lang-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
  <button class="lang-toggle" type="button" [class.is-en]="(language.lang$ | async) === 'en'"
          (click)="language.toggle()" title="Changer la langue / Switch language"
          [attr.aria-label]="'Language: ' + ((language.lang$ | async) === 'en' ? 'English' : 'Français')">
    <ng-container *ngIf="(language.lang$ | async) === 'en'; else frTpl">
      <span class="flag-svg" aria-hidden="true">
        <svg viewBox="0 0 60 60">
          <defs><clipPath id="ltUkClip"><circle cx="30" cy="30" r="30"/></clipPath></defs>
          <g clip-path="url(#ltUkClip)">
            <rect width="60" height="60" fill="#012169"/>
            <path d="M0,0 L60,60 M60,0 L0,60" stroke="#ffffff" stroke-width="10"/>
            <path d="M0,0 L60,60 M60,0 L0,60" stroke="#C8102E" stroke-width="5"/>
            <rect x="24" width="12" height="60" fill="#ffffff"/>
            <rect y="24" width="60" height="12" fill="#ffffff"/>
            <rect x="26" width="8" height="60" fill="#C8102E"/>
            <rect y="26" width="60" height="8" fill="#C8102E"/>
          </g>
        </svg>
      </span>
      <span class="lang-code">EN</span>
    </ng-container>
    <ng-template #frTpl>
      <span class="lang-code">FR</span>
      <span class="flag-svg" aria-hidden="true">
        <svg viewBox="0 0 60 60">
          <defs><clipPath id="ltFrClip"><circle cx="30" cy="30" r="30"/></clipPath></defs>
          <g clip-path="url(#ltFrClip)">
            <rect x="0" width="20" height="60" fill="#0055A4"/>
            <rect x="20" width="20" height="60" fill="#ffffff"/>
            <rect x="40" width="20" height="60" fill="#EF4135"/>
          </g>
        </svg>
      </span>
    </ng-template>
  </button>
  `,
  styles: [`
    .lang-toggle {
      display: inline-flex; align-items: center; gap: 7px;
      height: 34px; padding: 3px 11px;
      border: 1px solid var(--border, #e2e8f0); border-radius: 9999px;
      background: linear-gradient(180deg, #ffffff, #eef2f7);
      box-shadow: inset 0 1px 1px rgba(255,255,255,.9), 0 1px 2px rgba(15,23,42,.10);
      cursor: pointer; font-family: inherit;
      transition: box-shadow .15s ease, transform .12s ease;
    }
    .lang-toggle:hover { box-shadow: inset 0 1px 1px rgba(255,255,255,.9), 0 3px 8px rgba(15,23,42,.14); }
    .lang-toggle:active { transform: scale(.97); }
    .lang-code { font-size: 13px; font-weight: 800; letter-spacing: .6px; color: #475569; }
    .flag-svg { width: 22px; height: 22px; flex-shrink: 0; }
    .flag-svg svg { width: 100%; height: 100%; display: block; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
  `]
})
export class LangToggleComponent {
  constructor(public language: LanguageService) {}
}
