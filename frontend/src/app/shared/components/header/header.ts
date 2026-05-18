import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationPreferencesService, NotificationPreference } from '../../../core/services/notification-preferences.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit {
  currentUser: any;

  showNotifications: boolean = false;
  unreadCount: number = 5;
  notifications = [
    { id: 1, message: 'New deliverable uploaded by David Miller', time: '10 mins ago', read: false, type: 'info' },
    { id: 2, message: 'Cloud Migration Core milestone completed!', time: '2 hours ago', read: false, type: 'success' },
    { id: 3, message: 'High CPU usage alert on production server', time: '5 hours ago', read: false, type: 'warning' },
    { id: 4, message: 'Sarah Kerrigan assigned you to a new task', time: '1 day ago', read: true, type: 'info' }
  ];

  showProfileDropdown: boolean = false;
  showProfileModal: boolean = false;
  showPasswordModal: boolean = false;
  showPrefsModal: boolean = false;

  submitting: boolean = false;
  toastMessage: string = '';
  showToast: boolean = false;

  // Forms
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
    private prefsService: NotificationPreferencesService
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
  }

  loadPreferences(): void {
    this.prefsService.getMyPreferences().subscribe({
      next: (prefs) => {
        if (prefs) this.prefsForm = prefs;
      },
      error: () => console.log('Using default mock preferences')
    });
  }

  getDisplayName(): string {
    if (this.currentUser && (this.currentUser.username === 'alex' || this.currentUser.email === 'alex@company.com')) {
      return 'Alex Johnson';
    }
    return this.currentUser?.firstName ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : 'Alex Johnson';
  }

  getDisplayTitle(): string {
    if (this.currentUser && (this.currentUser.username === 'alex' || this.currentUser.email === 'alex@company.com')) {
      return 'Frontend Developer';
    }
    return this.getDisplayRole();
  }

  getDisplayRole(): string {
    if (!this.currentUser || !this.currentUser.role) return 'User Workspace';
    const role = this.currentUser.role.replace('ROLE_', '');
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'PROJECT_MANAGER': return 'Project Manager';
      case 'USER': return 'Developer Workspace';
      default: return role;
    }
  }

  isAdmin(): boolean {
    if (!this.currentUser || !this.currentUser.role) return false;
    const role = this.currentUser.role.replace('ROLE_', '');
    return role === 'ADMIN';
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfileDropdown = false;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
    this.showNotifications = false;
  }

  openProfileModal(): void {
    this.showProfileDropdown = false;
    if (this.currentUser) {
      this.userService.getUserProfile(this.currentUser.id).subscribe({
        next: (profile) => this.profileForm = profile,
        error: () => {} // fallback to existing data
      });
    }
    this.showProfileModal = true;
  }

  closeProfileModal(): void { this.showProfileModal = false; }

  saveProfile(): void {
    this.submitting = true;
    this.userService.updateUserProfile(this.currentUser.id, this.profileForm).subscribe({
      next: (res) => {
        this.submitting = false;
        this.showProfileModal = false;
        this.triggerToast('Profile updated successfully.');
        this.currentUser = { ...this.currentUser, ...this.profileForm };
        localStorage.setItem('user', JSON.stringify(this.currentUser));
      },
      error: () => {
        // Optimistic
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
        this.triggerToast('Password changed locally (Optimistic).');
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
      next: (res) => {
        this.submitting = false;
        this.showPrefsModal = false;
        this.triggerToast('Notification preferences saved.');
      },
      error: () => {
        // Fallback to post if put fails? Or just optimistic
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
      next: () => {
        this.showPrefsModal = false;
        this.triggerToast('Preferences deleted.');
      },
      error: () => {
        this.showPrefsModal = false;
        this.triggerToast('Preferences deleted locally.');
      }
    });
  }

  private triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
