import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { BadgeCountsService } from '../../../core/services/badge-counts.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUser: any;
  userRole: string = '';

  // Live counters shown as sidebar badges (PM area) — driven by the shared service.
  deliverablesCount = 0;
  messagesCount = 0;
  notificationsCount = 0;

  private subs: Subscription[] = [];
  private poll: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private badges: BadgeCountsService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.userRole = this.currentUser?.role || 'USER';
  }

  ngOnInit(): void {
    // Reflect the shared counts on the badges.
    this.subs.push(this.badges.deliverables$.subscribe(n => { this.deliverablesCount = n; this.cdr.detectChanges(); }));
    this.subs.push(this.badges.messages$.subscribe(n => { this.messagesCount = n; this.cdr.detectChanges(); }));
    this.subs.push(this.badges.notifications$.subscribe(n => { this.notificationsCount = n; this.cdr.detectChanges(); }));

    if (this.isProjectManager() || this.isUser()) {
      this.badges.refreshAll();
      // Re-sync on every navigation so counts increment when new items arrive
      // and reflect items read on the page you just left.
      this.subs.push(this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.badges.refreshAll()));
      // Light polling so new notifications/messages/deliverables increment live.
      this.poll = setInterval(() => this.badges.refreshAll(), 15000);
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.poll) clearInterval(this.poll);
  }

  isUser(): boolean {
    return this.userRole === 'USER' || this.userRole === 'ROLE_USER';
  }

  isProjectManager(): boolean {
    return this.userRole === 'PROJECT_MANAGER' || this.userRole === 'ROLE_PROJECT_MANAGER';
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN' || this.userRole === 'ROLE_ADMIN';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
