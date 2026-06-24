import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';

/**
 * Structural directive that shows its element only when the current user has the given permission.
 * Works for ANY element — a sidebar link, a button, a section. Reactive: it re-evaluates whenever
 * permissions load/refresh (so a custom-role change reflects live).
 *
 * It renders nothing until permissions are known, then shows only if granted — so privileged links
 * and action buttons never "flash" for a user who shouldn't see them. (Base menu items that every
 * user normally has should keep using fail-open `*ngIf="perm.has(...)"` instead.)
 *
 *   <a *appHasPermission="'billing.manage'" routerLink="/pm/plan">Billing</a>
 *   <button *appHasPermission="'project.delete'" (click)="delete()">Delete</button>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private permission = '';
  private shown = false;
  private sub?: Subscription;

  @Input('appHasPermission') set appHasPermission(perm: string) {
    this.permission = perm;
    this.update();
  }

  constructor(
    private tpl: TemplateRef<unknown>,
    private vcr: ViewContainerRef,
    private perm: PermissionService
  ) {}

  ngOnInit(): void {
    this.perm.ensureLoaded().subscribe();
    this.sub = this.perm.changes().subscribe(() => this.update());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private update(): void {
    // Wait until permissions are known before showing privileged UI (no flash for non-holders).
    const allowed = this.perm.isLoaded() && (!this.permission || this.perm.has(this.permission));
    if (allowed && !this.shown) {
      this.shown = true;
      this.vcr.createEmbeddedView(this.tpl);
    } else if (!allowed && this.shown) {
      this.shown = false;
      this.vcr.clear();
    }
  }
}
