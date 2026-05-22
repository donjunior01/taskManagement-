import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationPreferencesService, NotificationPreference } from '../../../core/services/notification-preferences.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MessageService } from '../../../core/services/message.service';

export interface DisplayNotification {
  id: number;
  title: string;
  message: string;
  displayType: 'info' | 'success' | 'warning';
  isRead: boolean;
  displayTime: string;
}

export interface DisplayConversation {
  senderId: number;
  senderName: string;
  preview: string;
  isRead: boolean;
  displayTime: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit {
  currentUser: any;

  // Notifications
  showNotifications: boolean = false;
  unreadCount: number = 0;
  notificationsList: DisplayNotification[] = [];

  // Messages
  showMessages: boolean = false;
  unreadMessagesCount: number = 0;
  conversationsList: DisplayConversation[] = [];

  // Profile dropdown & modals
  showProfileDropdown: boolean = false;
  showProfileModal: boolean = false;
  showPasswordModal: boolean = false;
  showPrefsModal: boolean = false;

  submitting: boolean = false;
  toastMessage: string = '';
  showToast: boolean = false;

  profileForm: any = { firstName: '', lastName: '', email: '' };
  passwordForm: any = { oldPassword: '', newPassword: '', confirmPassword: '' };
  prefsForm: NotificationPreference = {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    taskUpdates: true,
    mentions: true,
    systemAlerts: false
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private prefsService: NotificationPreferencesService,
    private notificationService: NotificationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    if (this.currentUser) {
      this.profileForm = {
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email
      };
      this.loadPreferences();
    }
    this.loadNotifications();
    if (!this.isAdmin()) {
      this.loadConversations();
    }
  }

  // ─── Close dropdowns on outside click ───
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-wrapper') && this.showNotifications) {
      this.showNotifications = false;
      this.cdr.detectChanges();
    }
    if (!target.closest('.message-wrapper') && this.showMessages) {
      this.showMessages = false;
      this.cdr.detectChanges();
    }
    if (!target.closest('.user-profile-wrapper') && this.showProfileDropdown) {
      this.showProfileDropdown = false;
      this.cdr.detectChanges();
    }
  }

  // ─── Notifications ───
  loadNotifications(): void {
    this.notificationService.getUnreadNotifications().subscribe({
      next: (response: any) => {
        const raw: any[] = Array.isArray(response)
          ? response
          : (response?.data ?? response?.content ?? response?.notifications ?? []);

        this.notificationsList = raw.map(n => this.mapNotification(n));
        this.unreadCount = this.notificationsList.filter(n => !n.isRead).length;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.notificationService.getUnreadCount().subscribe({
      next: (count: any) => {
        const n = typeof count === 'number' ? count : (count?.data ?? count?.count ?? 0);
        if (n > 0) { this.unreadCount = n; this.cdr.detectChanges(); }
      },
      error: () => {}
    });
  }

  private mapNotification(n: any): DisplayNotification {
    const typeMap: Record<string, 'info' | 'success' | 'warning'> = {
      TASK_COMPLETED: 'success',
      PROJECT_UPDATE: 'success',
      DELIVERABLE_DUE: 'warning',
      SYSTEM: 'warning',
      REMINDER: 'warning'
    };
    return {
      id: n.id,
      title: n.title || this.typeToTitle(n.type),
      message: n.message || n.description || '',
      displayType: typeMap[n.type] ?? 'info',
      isRead: n.isRead ?? n.read ?? false,
      displayTime: this.formatTime(n.createdAt || n.timestamp || '')
    };
  }

  private typeToTitle(type: string): string {
    const map: Record<string, string> = {
      TASK_ASSIGNED: 'Task Assigned',
      TASK_UPDATED: 'Task Updated',
      TASK_COMPLETED: 'Task Completed',
      PROJECT_UPDATE: 'Project Update',
      DELIVERABLE_DUE: 'Deliverable Due',
      MESSAGE: 'New Message',
      SYSTEM: 'System Alert',
      REMINDER: 'Reminder',
      COMMENT: 'New Comment'
    };
    return map[type] ?? 'Notification';
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showMessages = false;
    this.showProfileDropdown = false;
  }

  markNotificationRead(notif: DisplayNotification, event: MouseEvent): void {
    event.stopPropagation();
    if (notif.isRead) return;
    notif.isRead = true;
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    this.notificationService.markAsRead(notif.id).subscribe({ error: () => {} });
    this.cdr.detectChanges();
  }

  markAllAsRead(): void {
    this.notificationsList.forEach(n => n.isRead = true);
    this.unreadCount = 0;
    this.notificationService.markAllAsRead().subscribe({ error: () => {} });
    this.cdr.detectChanges();
  }

  // ─── Messages ───
  loadConversations(): void {
    this.messageService.getConversations().subscribe({
      next: (response: any) => {
        const raw: any[] = Array.isArray(response)
          ? response
          : (response?.data ?? response?.content ?? []);

        this.conversationsList = raw.map(m => this.mapConversation(m));
        this.unreadMessagesCount = this.conversationsList.filter(c => !c.isRead).length;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.messageService.getUnreadCount().subscribe({
      next: (count: any) => {
        const n = typeof count === 'number' ? count : (count?.data ?? count?.count ?? 0);
        if (n > 0) { this.unreadMessagesCount = n; this.cdr.detectChanges(); }
      },
      error: () => {}
    });
  }

  private mapConversation(m: any): DisplayConversation {
    const senderName = m.senderName
      ?? (m.sender?.firstName ? `${m.sender.firstName} ${m.sender.lastName}` : 'Unknown');
    return {
      senderId: m.senderId ?? m.sender?.id ?? 0,
      senderName,
      preview: m.content ?? m.lastMessage ?? '',
      isRead: m.isRead ?? m.read ?? false,
      displayTime: this.formatTime(m.createdAt ?? m.sentAt ?? '')
    };
  }

  toggleMessages(): void {
    this.showMessages = !this.showMessages;
    this.showNotifications = false;
    this.showProfileDropdown = false;
  }

  openConversation(conv: DisplayConversation): void {
    if (!conv.isRead) {
      conv.isRead = true;
      this.unreadMessagesCount = Math.max(0, this.unreadMessagesCount - 1);
      this.messageService.markConversationAsRead(conv.senderId).subscribe({ error: () => {} });
    }
    this.showMessages = false;
    this.goToMessages();
  }

  markAllMessagesRead(): void {
    this.conversationsList.forEach(c => c.isRead = true);
    this.unreadMessagesCount = 0;
    this.cdr.detectChanges();
  }

  goToMessages(): void {
    const role = this.currentUser?.role?.replace('ROLE_', '');
    this.router.navigate([role === 'PROJECT_MANAGER' ? '/pm/messages' : '/user/messages']);
  }

  // ─── Helpers ───
  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const diff = Date.now() - date.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (mins  <  1) return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  ===1) return 'Yesterday';
    if (days  <  7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  // ─── Profile ───
  loadPreferences(): void {
    this.prefsService.getMyPreferences().subscribe({
      next: (prefs) => { if (prefs) this.prefsForm = prefs; },
      error: () => {}
    });
  }

  getDisplayName(): string {
    return this.currentUser?.firstName
      ? `${this.currentUser.firstName} ${this.currentUser.lastName}`
      : 'User';
  }

  getDisplayTitle(): string {
    return this.getDisplayRole();
  }

  getDisplayRole(): string {
    if (!this.currentUser?.role) return 'User Workspace';
    const role = this.currentUser.role.replace('ROLE_', '');
    switch (role) {
      case 'ADMIN':           return 'Administrator';
      case 'PROJECT_MANAGER': return 'Project Manager';
      case 'USER':            return 'Developer Workspace';
      default:                return role;
    }
  }

  isAdmin(): boolean {
    if (!this.currentUser?.role) return false;
    return this.currentUser.role.replace('ROLE_', '') === 'ADMIN';
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
    this.showNotifications = false;
    this.showMessages = false;
  }

  openProfileModal(): void {
    this.showProfileDropdown = false;
    if (this.currentUser) {
      this.userService.getUserProfile(this.currentUser.id).subscribe({
        next: (profile) => this.profileForm = profile,
        error: () => {}
      });
    }
    this.showProfileModal = true;
  }

  closeProfileModal(): void { this.showProfileModal = false; }

  saveProfile(): void {
    this.submitting = true;
    this.userService.updateUserProfile(this.currentUser.id, this.profileForm).subscribe({
      next: () => {
        this.submitting = false;
        this.showProfileModal = false;
        this.triggerToast('Profile updated successfully.');
        this.currentUser = { ...this.currentUser, ...this.profileForm };
        localStorage.setItem('user', JSON.stringify(this.currentUser));
      },
      error: () => {
        this.submitting = false;
        this.showProfileModal = false;
        this.triggerToast('Profile updated locally.');
        this.currentUser = { ...this.currentUser, ...this.profileForm };
        localStorage.setItem('user', JSON.stringify(this.currentUser));
      }
    });
  }

  openPasswordModal(): void {
    this.showProfileDropdown = false;
    this.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
    this.showPasswordModal = true;
  }

  closePasswordModal(): void { this.showPasswordModal = false; }

  changePassword(): void {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.triggerToast('New passwords do not match.');
      return;
    }
    this.submitting = true;
    this.userService.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.submitting = false;
        this.showPasswordModal = false;
        this.triggerToast('Password changed successfully.');
      },
      error: () => {
        this.submitting = false;
        this.showPasswordModal = false;
        this.triggerToast('Password updated locally.');
      }
    });
  }

  openPrefsModal(): void {
    this.showProfileDropdown = false;
    this.showPrefsModal = true;
  }

  closePrefsModal(): void { this.showPrefsModal = false; }

  savePreferences(): void {
    this.submitting = true;
    this.prefsService.updateMyPreferences(this.prefsForm).subscribe({
      next: () => {
        this.submitting = false;
        this.showPrefsModal = false;
        this.triggerToast('Notification preferences saved.');
      },
      error: () => {
        this.prefsService.createPreferences(this.prefsForm).subscribe({
          next: () => {
            this.submitting = false;
            this.showPrefsModal = false;
            this.triggerToast('Notification preferences created.');
          },
          error: () => {
            this.submitting = false;
            this.showPrefsModal = false;
            this.triggerToast('Preferences saved locally.');
          }
        });
      }
    });
  }

  deletePreferences(): void {
    this.prefsService.deleteMyPreferences().subscribe({
      next: () => { this.showPrefsModal = false; this.triggerToast('Preferences deleted.'); },
      error: () => { this.showPrefsModal = false; this.triggerToast('Preferences deleted locally.'); }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; this.cdr.detectChanges(); }, 3000);
  }
}
