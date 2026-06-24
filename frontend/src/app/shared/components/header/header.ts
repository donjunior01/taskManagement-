import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationPreferencesService, NotificationPreference } from '../../../core/services/notification-preferences.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MessageService } from '../../../core/services/message.service';
import { BadgeCountsService } from '../../../core/services/badge-counts.service';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { TeamService } from '../../../core/services/team.service';
import { DeliverableService } from '../../../core/services/deliverable.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { LangToggleComponent } from '../lang-toggle/lang-toggle';
import { TwofaManagerComponent } from '../twofa-manager/twofa-manager';
import { SessionsManagerComponent } from '../sessions-manager/sessions-manager';

interface SearchResult { type: 'project' | 'task' | 'deliverable' | 'user' | 'team'; id?: number; label: string; sub?: string; route: any[]; query?: any; }
interface SearchGroup { title: string; items: SearchResult[]; }

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
  imports: [CommonModule, FormsModule, TranslatePipe, LangToggleComponent, TwofaManagerComponent, SessionsManagerComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit {
  currentUser: any;

  // Dynamic page title (translation key; resolved via the translate pipe in the template)
  pageTitle: string = 'title.dashboard';

  // Current date shown under the PM page title (prototype top bar)
  currentDate: string = '';

  // Notifications
  showNotifications: boolean = false;
  unreadCount: number = 0;
  notificationsList: DisplayNotification[] = [];

  // Messages
  showMessages: boolean = false;
  unreadMessagesCount: number = 0;
  conversationsList: DisplayConversation[] = [];

  // Quick search
  searchQuery = '';
  searchFocused = false;
  searchGroups: SearchGroup[] = [];
  private searchLoaded = false;
  private sProjects: any[] = [];
  private sTasks: any[] = [];
  private sUsers: any[] = [];
  private sTeams: any[] = [];
  private sDeliverables: any[] = [];

  // Profile dropdown & modals
  showProfileDropdown: boolean = false;
  showProfileModal: boolean = false;
  showPasswordModal: boolean = false;
  showPrefsModal: boolean = false;
  showTwoFaModal: boolean = false;
  showSessionsModal: boolean = false;

  submitting: boolean = false;
  toastMessage: string = '';
  showToast: boolean = false;

  profileForm: any = { firstName: '', lastName: '', email: '' };
  passwordForm: any = { oldPassword: '', newPassword: '', confirmPassword: '' };
  private currentUsername = '';
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
    private badges: BadgeCountsService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private teamService: TeamService,
    private deliverableService: DeliverableService,
    public language: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.pageTitle = this.titleForUrl(this.router.url);
    this.currentDate = this.frenchDate();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.pageTitle = this.titleForUrl(e.urlAfterRedirects || e.url);
        this.cdr.detectChanges();
      });
  }

  /** Maps the active route to its prototype page title (French). */
  private titleForUrl(url: string): string {
    const u = (url || '').split('?')[0];
    const map: { key: string; title: string }[] = [
      { key: '/admin/dashboard', title: 'title.dashboard' },
      { key: '/admin/users', title: 'title.adminUsers' },
      { key: '/admin/projects', title: 'title.adminProjects' },
      { key: '/admin/teams', title: 'title.teams' },
      { key: '/admin/security-log', title: 'title.securityLog' },
      { key: '/admin/login-attempts', title: 'title.loginAttempts' },
      { key: '/admin/activity-logs', title: 'title.activityLogs' },
      { key: '/admin/reports', title: 'title.reports' },
      { key: '/admin/performance', title: 'title.performance' },
      { key: '/admin/settings', title: 'title.settings' },
      { key: '/admin/support', title: 'title.support' },
      { key: '/admin/api-docs', title: 'title.apiDocs' },
      { key: '/pm/dashboard', title: 'title.dashboard' },
      { key: '/pm/analytics', title: 'title.analytics' },
      { key: '/pm/projects', title: 'title.pmProjects' },
      { key: '/pm/tasks', title: 'title.pmTasks' },
      { key: '/pm/teams', title: 'title.teams' },
      { key: '/pm/deliverables', title: 'title.pmDeliverables' },
      { key: '/pm/calendar', title: 'title.calendar' },
      { key: '/pm/reports', title: 'title.pmReports' },
      { key: '/pm/messages', title: 'title.pmMessages' },
      { key: '/pm/support', title: 'title.support2' },
      { key: '/user/dashboard', title: 'title.dashboard' },
      { key: '/user/my-tasks', title: 'title.userMyTasks' },
      { key: '/user/deliverables', title: 'title.userDeliverables' },
      { key: '/user/time-logs', title: 'title.timeLogs' },
      { key: '/user/messages', title: 'title.userMessages' },
      { key: '/user/calendar', title: 'title.calendar' },
      { key: '/user/notifications', title: 'title.userNotifications' },
      { key: '/user/support', title: 'title.support2' }
    ];
    const hit = map.find(m => u.startsWith(m.key));
    return hit ? hit.title : 'title.default';
  }

  goToSecurity(): void {
    this.router.navigate(['/admin/security-log']);
  }

  ngOnInit(): void {
    if (this.currentUser) {
      this.profileForm = {
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email
      };
      this.loadPreferences();
      this.loadProfile();
    }
    // Badge numbers are driven by the shared service (synced with sidebar + pages).
    this.badges.notifications$.subscribe(n => { this.unreadCount = n; this.cdr.detectChanges(); });
    this.badges.messages$.subscribe(n => { this.unreadMessagesCount = n; this.cdr.detectChanges(); });
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
    if (!target.closest('.quick-search') && this.searchFocused) {
      this.searchFocused = false;
      this.cdr.detectChanges();
    }
  }

  // ─── Quick search (PM: projets/tâches/livrables · Admin: projets/tâches/utilisateurs/équipes) ───
  onSearchFocus(): void { this.searchFocused = true; this.loadSearchData(); }

  private loadSearchData(): void {
    if (this.searchLoaded) return;
    this.searchLoaded = true;
    const managerId = this.currentUser?.id || 0;

    if (this.isAdmin()) {
      this.projectService.getAllProjects(0, 200).subscribe({ next: (r: any) => { this.sProjects = r?.data || []; this.onSearch(); }, error: () => {} });
      this.taskService.getAllTasks(0, 300).subscribe({ next: (r: any) => { this.sTasks = r?.data || []; this.onSearch(); }, error: () => {} });
      this.userService.getAllUsers(0, 300).subscribe({ next: (r: any) => { this.sUsers = r?.data || []; this.onSearch(); }, error: () => {} });
      this.teamService.getAllTeams().subscribe({ next: (r: any) => { this.sTeams = Array.isArray(r) ? r : (r?.data || []); this.onSearch(); }, error: () => {} });
    } else if (this.isProjectManager()) {
      this.projectService.getProjectsByManager(managerId, 0, 200).subscribe({
        next: (r: any) => {
          this.sProjects = r?.data || [];
          const pids = this.sProjects.map((p: any) => p.id);
          this.taskService.getAllTasks(0, 400).subscribe({ next: (tr: any) => { const all = tr?.data || []; this.sTasks = pids.length ? all.filter((t: any) => pids.includes(t.projectId)) : all; this.onSearch(); }, error: () => {} });
          this.onSearch();
        },
        error: () => {}
      });
      this.deliverableService.getAllDeliverables().subscribe({ next: (r: any) => { this.sDeliverables = Array.isArray(r) ? r : (r?.data || []); this.onSearch(); }, error: () => {} });
    }
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { this.searchGroups = []; return; }
    const groups: SearchGroup[] = [];
    const inc = (s?: string) => (s || '').toLowerCase().includes(q);

    const projects = this.sProjects.filter(p => inc(p.name)).slice(0, 5)
      .map(p => ({ type: 'project' as const, id: p.id, label: p.name, sub: this.statusFr(p.status), route: this.isAdmin() ? ['/admin/projects'] : ['/pm/projects', p.id] }));
    if (projects.length) groups.push({ title: 'Projets', items: projects });

    const tasks = this.sTasks.filter(t => inc(t.name) || inc(t.projectName)).slice(0, 5)
      .map(t => ({ type: 'task' as const, id: t.id, label: t.name, sub: t.projectName, route: this.isAdmin() ? ['/admin/tasks'] : ['/pm/tasks'], query: this.isAdmin() ? undefined : { focus: t.id } }));
    if (tasks.length) groups.push({ title: 'Tâches', items: tasks });

    if (this.isProjectManager()) {
      const dels = this.sDeliverables.filter(d => inc(d.fileName) || inc(d.taskName)).slice(0, 5)
        .map(d => ({ type: 'deliverable' as const, id: d.id, label: d.fileName, sub: d.taskName, route: ['/pm/deliverables'] }));
      if (dels.length) groups.push({ title: 'Livrables', items: dels });
    }

    if (this.isAdmin()) {
      const users = this.sUsers.filter(u => inc(u.firstName) || inc(u.lastName) || inc(u.email)).slice(0, 5)
        .map(u => ({ type: 'user' as const, id: u.id, label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email, sub: u.email, route: ['/admin/users'] }));
      if (users.length) groups.push({ title: 'Utilisateurs', items: users });
      const teams = this.sTeams.filter(t => inc(t.name)).slice(0, 5)
        .map(t => ({ type: 'team' as const, id: t.id, label: t.name, sub: t.description, route: ['/admin/teams'] }));
      if (teams.length) groups.push({ title: 'Équipes', items: teams });
    }

    this.searchGroups = groups;
    this.cdr.detectChanges();
  }

  goResult(r: SearchResult): void {
    this.searchFocused = false;
    this.searchQuery = '';
    this.searchGroups = [];
    this.router.navigate(r.route, r.query ? { queryParams: r.query } : {});
  }

  private statusFr(s?: string): string {
    const map: Record<string, string> = { ACTIVE: 'Actif', IN_PROGRESS: 'En cours', PLANNED: 'Planifié', ON_HOLD: 'En pause', COMPLETED: 'Terminé', CANCELLED: 'Annulé' };
    return map[(s || '').toUpperCase()] || 'Projet';
  }

  // ─── Notifications ───
  loadNotifications(): void {
    this.notificationService.getUnreadNotifications().subscribe({
      next: (response: any) => {
        const raw: any[] = Array.isArray(response)
          ? response
          : (response?.data ?? response?.content ?? response?.notifications ?? []);

        this.notificationsList = raw.map(n => this.mapNotification(n));
        this.badges.setNotifications(this.notificationsList.filter(n => !n.isRead).length);
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.notificationService.getUnreadCount().subscribe({
      next: (count: any) => {
        const n = typeof count === 'number' ? count : (count?.data ?? count?.count ?? 0);
        if (n > 0) { this.badges.setNotifications(n); this.cdr.detectChanges(); }
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
    this.badges.decNotifications(1);
    this.notificationService.markAsRead(notif.id).subscribe({ error: () => {} });
    this.cdr.detectChanges();
  }

  markAllAsRead(): void {
    this.notificationsList.forEach(n => n.isRead = true);
    this.badges.setNotifications(0);
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
        this.badges.setMessages(this.conversationsList.filter(c => !c.isRead).length);
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.messageService.getUnreadCount().subscribe({
      next: (count: any) => {
        const n = typeof count === 'number' ? count : (count?.data ?? count?.count ?? 0);
        if (n > 0) { this.badges.setMessages(n); this.cdr.detectChanges(); }
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

  get unreadConversations(): DisplayConversation[] {
    return this.conversationsList.filter(c => !c.isRead);
  }

  toggleMessages(): void {
    this.showMessages = !this.showMessages;
    this.showNotifications = false;
    this.showProfileDropdown = false;
  }

  openConversation(conv: DisplayConversation): void {
    if (!conv.isRead) {
      conv.isRead = true;
      this.badges.decMessages(1);
      this.messageService.markConversationAsRead(conv.senderId).subscribe({ error: () => {} });
    }
    this.showMessages = false;
    this.goToMessages();
  }

  markAllMessagesRead(): void {
    this.conversationsList.forEach(c => c.isRead = true);
    this.badges.setMessages(0);
    this.cdr.detectChanges();
  }

  goToMessages(): void {
    const role = this.currentUser?.role?.replace('ROLE_', '');
    this.router.navigate([role === 'PROJECT_MANAGER' ? '/pm/messages' : '/user/messages']);
  }

  /** "View all activity" → open the full notifications page for the current role. */
  goToNotifications(): void {
    this.showNotifications = false;
    const base = this.isAdmin() ? '/admin' : this.isProjectManager() ? '/pm' : '/user';
    this.router.navigate([base, 'notifications']);
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
      : 'Utilisateur';
  }

  /** Top-bar menu shows the user's first name (falls back to the email handle). */
  getFirstName(): string {
    return this.currentUser?.firstName?.trim()
      || this.currentUser?.email?.split('@')[0]
      || 'Mon compte';
  }

  /** Loads the real profile (first/last name, email, username) to populate the menu + forms. */
  private loadProfile(): void {
    if (!this.currentUser?.id) return;
    this.userService.getUserProfile(this.currentUser.id).subscribe({
      next: (p: any) => {
        const u = p?.data || p;
        if (!u) return;
        this.currentUsername = u.username || '';
        this.currentUser = { ...this.currentUser, firstName: u.firstName, lastName: u.lastName, email: u.email };
        this.authService.updateCurrentUser({ firstName: u.firstName, lastName: u.lastName, email: u.email });
        this.profileForm = { firstName: u.firstName, lastName: u.lastName, email: u.email };
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  getDisplayTitle(): string {
    return this.getDisplayRole();
  }

  getDisplayRole(): string {
    if (!this.currentUser?.role) return 'role.user';
    const role = this.currentUser.role.replace('ROLE_', '');
    switch (role) {
      case 'ADMIN':           return 'role.admin';
      case 'PROJECT_MANAGER': return 'role.pm';
      case 'USER':            return 'role.user';
      default:                return role;
    }
  }

  getUserInitials(): string {
    const f = this.currentUser?.firstName?.[0] ?? '';
    const l = this.currentUser?.lastName?.[0] ?? '';
    const initials = `${f}${l}`.toUpperCase();
    return initials || (this.currentUser?.email?.[0]?.toUpperCase() ?? 'U');
  }

  isAdmin(): boolean {
    if (!this.currentUser?.role) return false;
    return this.currentUser.role.replace('ROLE_', '') === 'ADMIN';
  }

  isProjectManager(): boolean {
    if (!this.currentUser?.role) return false;
    return this.currentUser.role.replace('ROLE_', '') === 'PROJECT_MANAGER';
  }

  isUser(): boolean {
    if (!this.currentUser?.role) return false;
    return this.currentUser.role.replace('ROLE_', '') === 'USER';
  }

  /** Long French date, capitalised — e.g. "Vendredi 5 juin 2026". */
  private frenchDate(): string {
    const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return d.charAt(0).toUpperCase() + d.slice(1);
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
    if (!this.profileForm.firstName?.trim() || !this.profileForm.email?.trim()) {
      this.triggerToast('Le prénom et l\'email sont requis.');
      return;
    }
    this.submitting = true;
    const payload = {
      username: this.currentUsername || this.profileForm.email,
      email: this.profileForm.email,
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      role: this.currentUser?.role
    };
    this.userService.updateUserProfile(this.currentUser.id, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.showProfileModal = false;
        this.currentUser = { ...this.currentUser, firstName: payload.firstName, lastName: payload.lastName, email: payload.email };
        this.authService.updateCurrentUser({ firstName: payload.firstName, lastName: payload.lastName, email: payload.email });
        this.triggerToast('Profil mis à jour avec succès.');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.submitting = false;
        this.triggerToast(err?.error?.message || err?.error?.error || 'Échec de la mise à jour du profil.');
        this.cdr.detectChanges();
      }
    });
  }

  openPasswordModal(): void {
    this.showProfileDropdown = false;
    this.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
    this.showPasswordModal = true;
  }

  closePasswordModal(): void { this.showPasswordModal = false; }

  openTwoFaModal(): void {
    this.showProfileDropdown = false;
    this.showTwoFaModal = true;
  }

  closeTwoFaModal(): void { this.showTwoFaModal = false; }

  openSessionsModal(): void {
    this.showProfileDropdown = false;
    this.showSessionsModal = true;
  }

  closeSessionsModal(): void { this.showSessionsModal = false; }

  changePassword(): void {
    if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword) {
      this.triggerToast('Veuillez remplir tous les champs.');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.triggerToast('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (this.passwordForm.newPassword.length < 4) {
      this.triggerToast('Le nouveau mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    this.submitting = true;
    // Backend expects { currentPassword, newPassword }.
    this.userService.changePassword({
      currentPassword: this.passwordForm.oldPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: (res: any) => {
        this.submitting = false;
        if (res && res.success === false) { this.triggerToast(res.message || 'Échec du changement de mot de passe.'); return; }
        this.showPasswordModal = false;
        this.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
        this.triggerToast('Mot de passe modifié avec succès.');
      },
      error: (err: any) => {
        this.submitting = false;
        this.triggerToast(err?.error?.message || 'Le mot de passe actuel est incorrect.');
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
        this.triggerToast('Préférences de notification enregistrées.');
      },
      error: () => {
        this.prefsService.createPreferences(this.prefsForm).subscribe({
          next: () => {
            this.submitting = false;
            this.showPrefsModal = false;
            this.triggerToast('Préférences de notification créées.');
          },
          error: (err: any) => {
            this.submitting = false;
            this.triggerToast(err?.error?.message || 'Échec de l\'enregistrement des préférences.');
          }
        });
      }
    });
  }

  deletePreferences(): void {
    this.prefsService.deleteMyPreferences().subscribe({
      next: () => { this.showPrefsModal = false; this.triggerToast('Préférences supprimées.'); },
      error: () => { this.showPrefsModal = false; this.triggerToast('Préférences supprimées localement.'); }
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
