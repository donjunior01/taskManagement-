import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { BadgeCountsService } from '../../../core/services/badge-counts.service';
import { resolveNotifTitle, resolveNotifMessage } from '../../../core/services/notification-i18n';

type Cat = 'task' | 'deliverable' | 'approved' | 'overdue' | 'team' | 'message' | 'system';
interface NotifRow extends Notification { cat: Cat; }

@Component({
  selector: 'app-pm-notifications',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
  <div class="nt-wrap">

    <!-- ═══ Tabs + mark all ═══ -->
    <div class="nt-bar">
      <div class="tabs">
        <button class="tab" *ngFor="let t of tabs" [class.on]="tab === t.key" (click)="tab = t.key">
          {{ t.label | translate }}<span class="cnt" *ngIf="tabCount(t.key) > 0">{{ tabCount(t.key) }}</span>
        </button>
      </div>
      <button class="mark-all" (click)="markAll()" [disabled]="unreadCount === 0">{{ 'notifications.markAll' | translate }}</button>
    </div>

    <!-- ═══ List ═══ -->
    <div class="nt-card">
      <div class="nt-item" *ngFor="let n of filtered" [ngClass]="'b-' + n.cat" [class.unread]="!n.isRead">
        <div class="nt-icon" [ngClass]="'c-' + n.cat" [ngSwitch]="n.cat">
          <svg *ngSwitchCase="'task'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>
          <svg *ngSwitchCase="'deliverable'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <svg *ngSwitchCase="'approved'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <svg *ngSwitchCase="'overdue'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <svg *ngSwitchCase="'team'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <svg *ngSwitchCase="'message'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <svg *ngSwitchDefault viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </div>
        <div class="nt-body">
          <p class="nt-msg">{{ dispTitle(n) }}<span *ngIf="dispMsg(n)"> — {{ dispMsg(n) }}</span></p>
          <p class="nt-time">{{ timeAgo(n.createdAt) }}</p>
        </div>
        <span class="nt-dot" *ngIf="!n.isRead"></span>
        <button class="nt-see" (click)="open(n)">{{ 'notifications.view' | translate }}</button>
      </div>
      <div class="empty" *ngIf="filtered.length === 0">{{ 'notifications.empty' | translate }}</div>
    </div>
  </div>

  <!-- ═══ Notification detail popup ═══ -->
  <div class="nt-modal-backdrop" *ngIf="detail" (click)="closeDetail()">
    <div class="nt-modal" (click)="$event.stopPropagation()">
      <div class="ntm-head">
        <div class="ntm-icon" [ngClass]="'c-' + detail!.cat" [ngSwitch]="detail!.cat">
          <svg *ngSwitchCase="'task'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>
          <svg *ngSwitchCase="'deliverable'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <svg *ngSwitchCase="'approved'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <svg *ngSwitchCase="'overdue'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <svg *ngSwitchCase="'team'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          <svg *ngSwitchCase="'message'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <svg *ngSwitchDefault viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </div>
        <div class="ntm-titles"><span class="ntm-cat">{{ labelKey(detail!.cat) | translate }}</span><h3>{{ dispTitle(detail!) }}</h3></div>
        <button class="ntm-x" (click)="closeDetail()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
      <div class="ntm-body">
        <p class="ntm-msg">{{ dispMsg(detail!) || ('notifications.noDetail' | translate) }}</p>
        <p class="ntm-time">{{ timeAgo(detail!.createdAt) }}</p>
      </div>
      <div class="ntm-foot"><button class="ntm-close-btn" (click)="closeDetail()">{{ 'notifications.close' | translate }}</button></div>
    </div>
  </div>
  `,
  styles: [`
    .nt-wrap { display: flex; flex-direction: column; gap: 16px; }
    .nt-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .tabs { display: inline-flex; gap: 3px; background: var(--bg-subtle); border-radius: 10px; padding: 3px; flex-wrap: wrap; }
    .tab { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border: none; background: none; border-radius: 8px; font-size: 12.5px; font-weight: 600; color: var(--text-muted); cursor: pointer; font-family: inherit; }
    .tab.on { background: var(--bg-card); color: var(--text-primary); box-shadow: 0 1px 2px rgba(15,23,42,.1); }
    .cnt { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 9999px; background: #2563eb; color: #fff; }
    .mark-all { height: 34px; padding: 0 14px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 9px; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); cursor: pointer; font-family: inherit; } .mark-all:hover:not(:disabled) { background: var(--bg-muted); } .mark-all:disabled { opacity: .5; cursor: not-allowed; }

    .nt-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
    .nt-item { display: flex; align-items: flex-start; gap: 12px; padding: 15px 18px; border-top: 1px solid #f1f5f9; border-left: 4px solid transparent; transition: background .12s ease; }
    .nt-item:first-child { border-top: none; }
    .nt-item.unread { background: rgba(37,99,235,.04); }
    .nt-item.b-task { border-left-color: #2563eb; } .nt-item.b-deliverable { border-left-color: #d97706; } .nt-item.b-approved { border-left-color: #16a34a; }
    .nt-item.b-overdue { border-left-color: var(--danger-text); } .nt-item.b-team { border-left-color: #a855f7; } .nt-item.b-message { border-left-color: #0891b2; } .nt-item.b-system { border-left-color: var(--text-muted); }
    .nt-icon { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; background: var(--bg-card); box-shadow: inset 0 0 0 1px var(--border); margin-top: 1px; }
    .nt-icon svg { width: 17px; height: 17px; }
    .nt-icon.c-task { color: #2563eb; } .nt-icon.c-deliverable { color: #d97706; } .nt-icon.c-approved { color: #16a34a; } .nt-icon.c-overdue { color: var(--danger-text); } .nt-icon.c-team { color: #a855f7; } .nt-icon.c-message { color: #0891b2; } .nt-icon.c-system { color: var(--text-muted); }
    .nt-body { flex: 1; min-width: 0; }
    .nt-msg { margin: 0; font-size: 13.5px; color: var(--text-primary); line-height: 1.4; }
    .nt-time { margin: 3px 0 0; font-size: 11.5px; color: var(--text-muted); }
    .nt-dot { width: 8px; height: 8px; border-radius: 50%; background: #2563eb; margin-top: 7px; flex-shrink: 0; }
    .nt-see { height: 28px; padding: 0 11px; border: none; background: none; border-radius: 7px; color: #2563eb; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; flex-shrink: 0; } .nt-see:hover { background: rgba(37,99,235,.08); }
    .empty { padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px; }

    .nt-modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .nt-modal { width: 100%; max-width: 440px; background: var(--bg-card); border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .ntm-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px 12px; }
    .ntm-icon { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; box-shadow: inset 0 0 0 1px var(--border); }
    .ntm-icon svg { width: 18px; height: 18px; }
    .ntm-icon.c-task { color: #2563eb; } .ntm-icon.c-deliverable { color: #d97706; } .ntm-icon.c-approved { color: #16a34a; } .ntm-icon.c-overdue { color: var(--danger-text); } .ntm-icon.c-team { color: #a855f7; } .ntm-icon.c-message { color: #0891b2; } .ntm-icon.c-system { color: var(--text-muted); }
    .ntm-titles { flex: 1; min-width: 0; } .ntm-cat { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); } .ntm-titles h3 { font-size: 15.5px; font-weight: 700; color: var(--text-primary); margin: 2px 0 0; }
    .ntm-x { width: 30px; height: 30px; border: none; background: var(--bg-subtle); border-radius: 8px; cursor: pointer; color: var(--text-muted); display: grid; place-items: center; flex-shrink: 0; } .ntm-x svg { width: 15px; height: 15px; }
    .ntm-body { padding: 4px 20px 12px; } .ntm-msg { margin: 0; font-size: 13.5px; color: var(--text-secondary); line-height: 1.55; } .ntm-time { margin: 10px 0 0; font-size: 11.5px; color: var(--text-muted); }
    .ntm-foot { display: flex; justify-content: flex-end; padding: 8px 20px 18px; } .ntm-close-btn { height: 36px; padding: 0 16px; border: none; border-radius: 9px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; } .ntm-close-btn:hover { background: #1d4ed8; }
  `]
})
export class PmNotificationsComponent implements OnInit, OnDestroy {
  rows: NotifRow[] = [];
  tab: 'all' | 'unread' | 'task' | 'deliverable' | 'team' | 'system' = 'all';
  tabs = [
    { key: 'all' as const, label: 'notifications.tabAll' }, { key: 'unread' as const, label: 'notifications.tabUnread' },
    { key: 'task' as const, label: 'notifications.tabTask' }, { key: 'deliverable' as const, label: 'notifications.tabDeliverable' },
    { key: 'team' as const, label: 'notifications.tabTeam' }, { key: 'system' as const, label: 'notifications.tabSystem' }
  ];

  detail: NotifRow | null = null;
  private subs: Subscription[] = [];

  constructor(private notificationService: NotificationService, private badges: BadgeCountsService, private cdr: ChangeDetectorRef, private translate: TranslateService) {}

  ngOnInit(): void {
    this.load();
    this.subs.push(this.badges.notifications$.subscribe(count => {
      const currentUnread = this.rows.filter(n => !n.isRead).length;
      if (count > currentUnread) {
        this.load();
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private load(): void {
    this.notificationService.getNotifications().subscribe({
      next: (r: any) => {
        const list = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        this.rows = (list || [])
          .sort((a: Notification, b: Notification) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .map((n: Notification) => ({ ...n, cat: this.categorize(n.type) }));
        this.badges.setNotifications(this.unreadCount);
        this.cdr.detectChanges();
      },
      error: () => { this.rows = []; }
    });
  }

  private categorize(type: string): Cat {
    const t = (type || '').toUpperCase();
    if (t.includes('DELIVER')) return 'deliverable';
    if (t.includes('APPROV') || t.includes('COMPLET')) return 'approved';
    if (t.includes('OVERDUE') || t.includes('DEADLINE') || t.includes('ALERT') || t.includes('REMIND')) return 'overdue';
    if (t.includes('TEAM')) return 'team';
    if (t.includes('MESSAGE') || t.includes('COMMENT') || t.includes('MENTION')) return 'message';
    if (t.includes('TASK') || t.includes('PROJECT')) return 'task';
    return 'system';
  }

  get unreadCount(): number { return this.rows.filter(n => !n.isRead).length; }

  get filtered(): NotifRow[] {
    if (this.tab === 'all') return this.rows;
    if (this.tab === 'unread') return this.rows.filter(n => !n.isRead);
    if (this.tab === 'task') return this.rows.filter(n => n.cat === 'task');
    if (this.tab === 'deliverable') return this.rows.filter(n => n.cat === 'deliverable');
    if (this.tab === 'team') return this.rows.filter(n => n.cat === 'team');
    return this.rows.filter(n => ['approved', 'overdue', 'message', 'system'].includes(n.cat)); // Système
  }

  tabCount(key: string): number {
    if (key === 'all') return this.rows.length;
    if (key === 'unread') return this.unreadCount;
    if (key === 'task') return this.rows.filter(n => n.cat === 'task').length;
    if (key === 'deliverable') return this.rows.filter(n => n.cat === 'deliverable').length;
    if (key === 'team') return this.rows.filter(n => n.cat === 'team').length;
    return this.rows.filter(n => ['approved', 'overdue', 'message', 'system'].includes(n.cat)).length;
  }

  open(n: NotifRow): void {
    this.detail = n;
    if (!n.isRead) {
      n.isRead = true;
      this.badges.decNotifications(1);
      this.notificationService.markAsRead(n.id).subscribe({ error: () => {} });
    }
    this.cdr.detectChanges();
  }
  closeDetail(): void { this.detail = null; }
  markAll(): void {
    this.rows.forEach(n => n.isRead = true);
    this.badges.setNotifications(0);
    this.notificationService.markAllAsRead().subscribe({ error: () => {} });
    this.cdr.detectChanges();
  }

  /** Localised notification title — uses the i18nKey when present, else the category label. */
  dispTitle(n: NotifRow): string {
    return resolveNotifTitle(n, this.translate) || this.translate.instant(this.labelKey(n.cat));
  }
  /** Localised notification body text (empty when there is none). */
  dispMsg(n: NotifRow): string { return resolveNotifMessage(n, this.translate); }

  labelKey(cat: Cat): string {
    return ({ task: 'notifications.catTask', deliverable: 'notifications.catDeliverable', approved: 'notifications.catApproved', overdue: 'notifications.catOverdue', team: 'notifications.catTeam', message: 'notifications.catMessage', system: 'notifications.catSystem' } as Record<Cat, string>)[cat];
  }

  icon(cat: Cat): string {
    const map: Record<Cat, string> = {
      task: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>',
      deliverable: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
      approved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      overdue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
    };
    return map[cat];
  }

  timeAgo(at?: string): string {
    if (!at) return '';
    const diff = Date.now() - new Date(at).getTime();
    if (isNaN(diff)) return '';
    const min = Math.floor(diff / 60000);
    if (min < 1) return this.translate.instant('relTime.justNow');
    if (min < 60) return this.translate.instant('relTime.minAgo', { n: min });
    const h = Math.floor(min / 60);
    if (h < 24) return this.translate.instant('relTime.hAgo', { n: h });
    return this.translate.instant('relTime.dAgo', { n: Math.floor(h / 24) });
  }
}
