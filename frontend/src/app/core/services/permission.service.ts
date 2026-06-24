import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';
import { ApiService } from './api.service';

/**
 * Holds the current user's effective RBAC permissions and answers has(key) for gating menus/routes.
 *
 * FAIL-OPEN by design: until permissions are successfully loaded (or if the load fails), has()
 * returns true so a normal user is never accidentally hidden out of their own pages. Once loaded,
 * gating is exact. A user's base-role defaults already cover their normal pages, so the only visible
 * effect is a custom role *restricting* what that user can reach.
 *
 * SYNCHRONISED: refresh() re-fetches the live permissions (throttled, updated in place without a
 * fail-open flicker) so a custom-role change by an admin takes effect for the user's active session
 * on their next navigation / poll — no full re-login required.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private perms = new Set<string>();
  private loaded = false;
  private inflight: Observable<Set<string>> | null = null;
  private lastFetch = 0;
  private static readonly THROTTLE_MS = 5000;
  /** Emits whenever the permission set changes, so gated elements (directive) can re-evaluate. */
  private changed$ = new BehaviorSubject<number>(0);

  constructor(private api: ApiService) {}

  /** Observable that fires on every permission change (load / refresh / reset). */
  changes(): Observable<number> { return this.changed$.asObservable(); }

  /** Fetch once and cache; safe to call repeatedly. */
  ensureLoaded(): Observable<Set<string>> {
    if (this.loaded) return of(this.perms);
    if (!this.inflight) {
      this.inflight = this.api.get<string[]>('/permissions/me').pipe(
        map((r: any) => new Set<string>(Array.isArray(r) ? r : (r?.data || []))),
        tap(set => { this.perms = set; this.loaded = true; this.lastFetch = Date.now(); this.changed$.next(Date.now()); }),
        catchError(() => { this.loaded = false; return of(new Set<string>()); }),
        shareReplay(1)
      );
    }
    return this.inflight;
  }

  /** Trigger a load (fire-and-forget) — e.g. from the sidebar on init. */
  load(): void { this.ensureLoaded().subscribe(); }

  /**
   * Re-fetch live permissions and update in place (keeps current perms until the new set arrives,
   * so there's no fail-open flicker; keeps current on error). Throttled unless force=true.
   */
  refresh(force = false): Observable<Set<string>> {
    const now = Date.now();
    if (!force && now - this.lastFetch < PermissionService.THROTTLE_MS) return of(this.perms);
    this.lastFetch = now;
    return this.api.get<string[]>('/permissions/me').pipe(
      map((r: any) => new Set<string>(Array.isArray(r) ? r : (r?.data || []))),
      tap(set => { this.perms = set; this.loaded = true; this.changed$.next(Date.now()); }),
      catchError(() => of(this.perms))   // keep the current set on error
    );
  }

  isLoaded(): boolean { return this.loaded; }

  /** True if the user has the permission, OR permissions aren't loaded yet (fail-open). */
  has(key: string): boolean { return !this.loaded || this.perms.has(key); }

  /** Clear cached permissions (call on logout / before a new login). */
  reset(): void { this.perms.clear(); this.loaded = false; this.inflight = null; this.lastFetch = 0; this.changed$.next(Date.now()); }
}
