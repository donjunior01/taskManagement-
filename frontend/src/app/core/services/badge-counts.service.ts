import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DeliverableService } from './deliverable.service';
import { MessageService } from './message.service';
import { NotificationService } from './notification.service';
import { ProjectService } from './project.service';
import { AuthService } from './auth.service';

/**
 * Single source of truth for the unread/pending counters shown on the sidebar
 * badges and the top-bar icons. Pages decrement it optimistically when items are
 * opened/read; refresh() re-syncs with the backend (so new items increment it).
 */
@Injectable({ providedIn: 'root' })
export class BadgeCountsService {
  private _deliverables = new BehaviorSubject<number>(0);
  private _messages = new BehaviorSubject<number>(0);
  private _notifications = new BehaviorSubject<number>(0);

  deliverables$ = this._deliverables.asObservable();
  messages$ = this._messages.asObservable();
  notifications$ = this._notifications.asObservable();

  get deliverables(): number { return this._deliverables.value; }
  get messages(): number { return this._messages.value; }
  get notifications(): number { return this._notifications.value; }

  constructor(
    private deliverableService: DeliverableService,
    private messageService: MessageService,
    private notificationService: NotificationService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  private toNum(r: any): number {
    if (typeof r === 'number') return r;
    if (r && typeof r.data === 'number') return r.data;
    if (Array.isArray(r)) return r.length;
    if (r && Array.isArray(r.data)) return r.data.length;
    return 0;
  }

  // ── setters / mutators ──
  setDeliverables(n: number): void { this._deliverables.next(Math.max(0, n)); }
  setMessages(n: number): void { this._messages.next(Math.max(0, n)); }
  setNotifications(n: number): void { this._notifications.next(Math.max(0, n)); }
  decDeliverables(by = 1): void { this.setDeliverables(this._deliverables.value - by); }
  decMessages(by = 1): void { this.setMessages(this._messages.value - by); }
  decNotifications(by = 1): void { this.setNotifications(this._notifications.value - by); }

  // ── backend sync ──
  refreshDeliverables(): void {
    this.deliverableService.getPendingDeliverables().subscribe({
      next: r => this.setDeliverables(this.toNum(r)), error: () => {}
    });
  }

  /**
   * Unread messages are computed the SAME way as the Messages page: project group
   * chats, counting messages newer than the per-group last-read id (kept in
   * localStorage) that weren't sent by me. This keeps the sidebar/top-bar badge in
   * lockstep with what the page shows.
   */
  refreshMessages(): void {
    const uid = this.authService.getCurrentUser()?.id || 0;
    this.projectService.getActiveProjectsForUser().subscribe({
      next: (r: any) => {
        const projects: any[] = r?.data || (Array.isArray(r) ? r : []);
        if (!projects.length) { this.setMessages(0); return; }
        let total = 0, done = 0;
        projects.forEach(p => {
          this.messageService.getMessagesByProject(p.id).subscribe({
            next: (resp: any) => {
              const msgs: any[] = resp?.data || (Array.isArray(resp) ? resp : []);
              const lastRead = Number(localStorage.getItem(`msg_lastread_${uid}_${p.id}`) || 0);
              total += msgs.filter(m => m.id != null && m.id > lastRead && m.senderId !== uid).length;
              if (++done === projects.length) this.setMessages(total);
            },
            error: () => { if (++done === projects.length) this.setMessages(total); }
          });
        });
      },
      // Fallback to the direct-unread endpoint if the projects call is unavailable.
      error: () => this.messageService.getUnreadMessages().subscribe({ next: c => this.setMessages(this.toNum(c)), error: () => {} })
    });
  }

  refreshNotifications(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: r => this.setNotifications(this.toNum(r)),
      error: () => this.notificationService.getUnreadNotifications().subscribe({ next: c => this.setNotifications(this.toNum(c)), error: () => {} })
    });
  }
  refreshAll(): void { this.refreshDeliverables(); this.refreshMessages(); this.refreshNotifications(); }
}
