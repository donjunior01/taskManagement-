import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/** Manages the light/dark UI theme: toggles `html.dark`, persists to localStorage, respects the OS. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'theme';
  readonly theme = signal<Theme>('light');

  constructor() {
    const saved = (localStorage.getItem(this.KEY) as Theme | null);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(saved ?? (prefersDark ? 'dark' : 'light'), false);
  }

  isDark(): boolean { return this.theme() === 'dark'; }

  toggle(): void { this.apply(this.isDark() ? 'light' : 'dark', true); }

  set(theme: Theme): void { this.apply(theme, true); }

  private apply(theme: Theme, persist: boolean): void {
    this.theme.set(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (persist) localStorage.setItem(this.KEY, theme);
  }
}
