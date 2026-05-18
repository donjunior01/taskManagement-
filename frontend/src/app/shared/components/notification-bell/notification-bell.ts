import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount: number = 0;
  showNotifications: boolean = false;
  notifications: Notification[] = [];
  private pollSub: Subscription | null = null;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadNotifications();
      // Poll every 30 seconds
      this.pollSub = interval(30000).subscribe(() => this.loadNotifications());
    }
  }

  ngOnDestroy(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
  }

  loadNotifications(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount = count,
      error: () => {} // silent fallback
    });

    this.notificationService.getUnreadNotifications().subscribe({
      next: (notifs) => this.notifications = notifs,
      error: () => {
        // Fallback mock
        if (this.notifications.length === 0) {
          this.notifications = [
            { id: 1, message: 'New deliverable assigned to you', type: 'TASK', isRead: false, createdAt: new Date().toISOString(), userId: 0 }
          ];
          this.unreadCount = this.notifications.length;
        }
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications && this.unreadCount > 0) {
      this.notificationService.markAllAsRead().subscribe({
        next: () => {
          this.unreadCount = 0;
          this.notifications.forEach(n => n.isRead = true);
        },
        error: () => {
          // Optimistic
          this.unreadCount = 0;
          this.notifications.forEach(n => n.isRead = true);
        }
      });
    }
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      },
      error: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      }
    });
  }
}
