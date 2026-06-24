import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserService, User, UserRequest } from '../../../core/services/user.service';
import { AdminSecurityService } from '../../../core/services/admin-security.service';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { TwoFactorService } from '../../../core/services/twofa.service';
import { RoleService, AppRole } from '../../../core/services/role.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './users.html',
  styleUrls: ['./users.scss']
})
export class AdminUsersComponent implements OnInit {
  usersList: User[] = [];
  filteredUsers: User[] = [];
  loading: boolean = true;

  // Pagination State
  totalElements: number = 0;
  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  sortBy: string = 'id';
  sortDir: string = 'asc';

  // Filters State
  searchTerm: string = '';
  roleFilter: string = ''; // '', 'ADMIN', 'PROJECT_MANAGER', 'USER'
  statusFilter: string = ''; // '', 'ACTIVE', 'INACTIVE'

  // Bulk selection
  selected = new Set<number>();

  // Derived data (no dedicated user fields → computed from real sources)
  private lastLoginMap = new Map<string, string>();   // username/email → last successful login date
  private projectCountMap = new Map<number, number>(); // userId → projects managed/joined
  private createdByCountMap = new Map<number, number>(); // userId → projects this user created (admins)

  // Modals Visibility
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  showStatusModal: boolean = false;

  // Form states
  selectedUser: User | null = null;
  submitting: boolean = false;

  // Add User Form (matches UserRequest DTO)
  addUserForm: UserRequest = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'USER'
  };

  // Edit User Form (matches UserRequest DTO)
  editUserForm: UserRequest = {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'USER'
  };

  constructor(
    private userService: UserService,
    private security: AdminSecurityService,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private translate: TranslateService,
    private twofa: TwoFactorService,
    private sessions: SessionService,
    private roleService: RoleService
  ) {}

  rolesList: AppRole[] = [];
  selectedRoleId: number | null = null;

  /** Permissions granted by the custom role currently selected in the edit modal. */
  get selectedRolePermissions(): string[] {
    const role = this.rolesList.find(r => r.id === this.selectedRoleId);
    return role?.permissions ? [...role.permissions].sort() : [];
  }

  private loadRoles(): void {
    this.roleService.list().subscribe({
      next: (r: any) => {
        const all: AppRole[] = Array.isArray(r) ? r : (r?.data || []);
        // Only custom roles are assignable here; built-in roles follow the access-level dropdown.
        this.rolesList = all.filter(role => !role.system);
        this.cdr.detectChanges();
      },
      error: () => { this.rolesList = []; }
    });
  }

  /** Admin force-logout: revoke every active session of the selected user. */
  forceLogout(): void {
    if (!this.selectedUser?.id || this.submitting) return;
    this.submitting = true;
    this.sessions.adminRevokeAll(this.selectedUser.id).subscribe({
      next: () => {
        this.submitting = false;
        this.triggerToast(this.translate.instant('admin.users.toastForceLogout', { name: this.selectedUser?.firstName }), 'success');
      },
      error: (err) => {
        this.submitting = false;
        this.triggerToast(err?.error?.message || this.translate.instant('admin.users.toastForceLogoutFailed'), 'error');
      }
    });
  }

  /** Admin account recovery: clear a user's 2FA so they can re-enrol (e.g. lost authenticator). */
  resetTwoFa(): void {
    if (!this.selectedUser?.id || this.submitting) return;
    this.submitting = true;
    this.twofa.adminReset(this.selectedUser.id).subscribe({
      next: () => {
        this.submitting = false;
        this.triggerToast(this.translate.instant('admin.users.toast2faReset', { name: this.selectedUser?.firstName }), 'success');
      },
      error: (err) => {
        this.submitting = false;
        this.triggerToast(err?.error?.message || this.translate.instant('admin.users.toast2faResetFailed'), 'error');
      }
    });
  }

  private locale(): string {
    return this.translate.currentLang() === 'en' ? 'en-GB' : 'fr-FR';
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadAuxData();
    this.loadRoles();
  }

  /** Builds the "last connection" and "projects per user" maps from real backend data. */
  loadAuxData(): void {
    // Last successful login per user (from login-attempts journal)
    this.security.getLoginAttempts().subscribe({
      next: (list: any) => {
        const raw: any[] = Array.isArray(list) ? list : (list?.data ?? []);
        const m = new Map<string, string>();
        raw.filter(a => a.success).forEach(a => {
          const key = (a.username || '').toLowerCase();
          if (!key) return;
          const prev = m.get(key);
          if (!prev || new Date(a.attemptedAt) > new Date(prev)) m.set(key, a.attemptedAt);
        });
        this.lastLoginMap = m;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    // Projects per user (managed + membership) from the projects list
    this.projectService.getAllProjects(0, 500).subscribe({
      next: (r: any) => {
        const list: any[] = r && r.data ? r.data : (Array.isArray(r) ? r : []);
        const m = new Map<number, number>();
        const created = new Map<number, number>();
        const bump = (map: Map<number, number>, id: any) => { if (id != null) map.set(Number(id), (map.get(Number(id)) || 0) + 1); };
        list.forEach(p => {
          bump(m, p.managerId);
          const members = p.members || p.memberIds || p.team?.members || [];
          (Array.isArray(members) ? members : []).forEach((mem: any) => bump(m, typeof mem === 'number' ? mem : mem?.id ?? mem?.userId));
          // Per-admin "created projects" count (matches the backend createdBy scoping).
          bump(created, p.createdById);
        });
        this.projectCountMap = m;
        this.createdByCountMap = created;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers(this.currentPage, this.pageSize, this.sortBy, this.sortDir).subscribe({
      next: (response: any) => {
        try {
          this.usersList = response && response.data ? response.data : [];
          this.totalElements = response ? response.totalElements : 0;
          this.totalPages = response ? response.totalPages : 0;
          this.applyClientFilters();
        } catch (e) {
          this.usersList = [];
          this.applyClientFilters();
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.usersList = [];
        this.applyClientFilters();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyClientFilters(): void {
    // We apply robust client-side filters for instant high-end search interactions
    let result = [...this.usersList];

    // Search query filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(u => 
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (this.roleFilter) {
      result = result.filter(u => u.role === this.roleFilter || u.userType === this.roleFilter);
    }

    // Status filter
    if (this.statusFilter === 'ACTIVE') {
      result = result.filter(u => u.isActive !== false);
    } else if (this.statusFilter === 'INACTIVE') {
      result = result.filter(u => u.isActive === false);
    }

    this.filteredUsers = result;
  }

  // ─── Display helpers (prototype-aligned) ───
  getInitials(u: User): string {
    const f = u.firstName?.[0] ?? '';
    const l = u.lastName?.[0] ?? '';
    return (`${f}${l}`.toUpperCase()) || (u.username?.[0]?.toUpperCase() ?? '?');
  }

  roleOf(u: User): string {
    return (u.role || u.userType || 'USER').replace('ROLE_', '');
  }

  roleLabelKey(u: User): string {
    switch (this.roleOf(u)) {
      case 'ADMIN':           return 'admin.users.roleAdminShort';
      case 'PROJECT_MANAGER': return 'admin.users.roleManagerShort';
      default:                return 'admin.users.roleCollaboratorShort';
    }
  }

  roleTone(u: User): string {
    switch (this.roleOf(u)) {
      case 'ADMIN':           return 'navy';
      case 'PROJECT_MANAGER': return 'brand';
      default:                return 'purple';
    }
  }

  lastLogin(u: User): string {
    const v = this.lastLoginMap.get((u.username || '').toLowerCase())
           ?? this.lastLoginMap.get((u.email || '').toLowerCase())
           ?? (u as any).lastLogin ?? (u as any).lastLoginAt;
    if (!v) return this.translate.instant('admin.users.neverLoggedIn');
    const d = new Date(v);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(this.locale(), { day: '2-digit', month: 'short', year: 'numeric' }) +
           ' · ' + d.toLocaleTimeString(this.locale(), { hour: '2-digit', minute: '2-digit' });
  }

  projectCount(u: User): number {
    // Admins → projects they personally created; everyone else → projects managed + joined.
    // Prefer the backend-computed count, falling back to the matching client-side map.
    const isAdmin = this.roleOf(u) === 'ADMIN';
    const fallback = u.id != null
      ? (isAdmin ? this.createdByCountMap.get(u.id) : this.projectCountMap.get(u.id))
      : undefined;
    const v = (u as any).projectCount ?? fallback;
    return v ?? 0;
  }

  // ─── Bulk selection ───
  isSelected(id?: number): boolean { return id != null && this.selected.has(id); }

  toggleSelect(id?: number): void {
    if (id == null) return;
    this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id);
  }

  get allVisibleSelected(): boolean {
    return this.filteredUsers.length > 0 && this.filteredUsers.every(u => u.id != null && this.selected.has(u.id));
  }

  toggleSelectAll(): void {
    if (this.allVisibleSelected) {
      this.filteredUsers.forEach(u => u.id != null && this.selected.delete(u.id));
    } else {
      this.filteredUsers.forEach(u => u.id != null && this.selected.add(u.id));
    }
  }

  clearSelection(): void { this.selected.clear(); }

  private selectedUsers(): User[] {
    return this.usersList.filter(u => u.id != null && this.selected.has(u.id));
  }

  bulkSetActive(target: boolean): void {
    const targets = this.selectedUsers().filter(u => (u.isActive !== false) !== target);
    if (targets.length === 0) { this.triggerToast(this.translate.instant('admin.users.toastNoChange'), 'error'); return; }
    let done = 0;
    targets.forEach(u => {
      this.userService.toggleUserStatus(u.id!).subscribe({
        next: () => { const i = this.usersList.findIndex(x => x.id === u.id); if (i !== -1) this.usersList[i].isActive = target; done++; if (done === targets.length) { this.applyClientFilters(); this.cdr.detectChanges(); } },
        error: () => { const i = this.usersList.findIndex(x => x.id === u.id); if (i !== -1) this.usersList[i].isActive = target; done++; if (done === targets.length) { this.applyClientFilters(); this.cdr.detectChanges(); } }
      });
    });
    this.triggerToast(this.translate.instant(target ? 'admin.users.toastBulkActivated' : 'admin.users.toastBulkDeactivated', { count: targets.length }), 'success');
    this.clearSelection();
  }

  bulkDelete(): void {
    const targets = this.selectedUsers();
    if (targets.length === 0) return;
    targets.forEach(u => this.userService.deleteUser(u.id!).subscribe({ error: () => {} }));
    this.usersList = this.usersList.filter(u => !(u.id != null && this.selected.has(u.id)));
    this.totalElements = Math.max(0, this.totalElements - targets.length);
    this.triggerToast(this.translate.instant('admin.users.toastBulkDeleted', { count: targets.length }), 'success');
    this.clearSelection();
    this.applyClientFilters();
  }

  exportCsv(): void {
    const T = (k: string) => this.translate.instant(k);
    const rows = [[T('admin.users.csvName'), T('admin.users.colEmail'), T('admin.users.colRole'), T('admin.users.colStatus'), T('admin.users.colLastLogin')]];
    this.filteredUsers.forEach(u => rows.push([
      `${u.firstName} ${u.lastName}`,
      u.email,
      T(this.roleLabelKey(u)),
      u.isActive !== false ? T('admin.users.active') : T('admin.users.inactive'),
      this.lastLogin(u)
    ]));
    const csv = rows.map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = T('admin.users.csvFilename'); a.click();
    URL.revokeObjectURL(url);
    this.triggerToast(T('admin.users.toastCsvGenerated'), 'success');
  }

  onFilterChange(): void {
    this.applyClientFilters();
  }

  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
    this.loadUsers();
  }

  // Pagination Actions
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  // Modal Triggers
  openAddModal(): void {
    this.resetAddForm();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  openEditModal(user: User): void {
    this.selectedUser = user;
    this.editUserForm = {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'USER'
    };
    this.selectedRoleId = (user as any).customRoleId ?? null;
    this.showEditModal = true;
  }

  /** Assign or clear the user's custom RBAC role. */
  applyCustomRole(): void {
    if (!this.selectedUser?.id) return;
    const obs = this.selectedRoleId
      ? this.roleService.assign(this.selectedRoleId, this.selectedUser.id)
      : this.roleService.unassign(this.selectedUser.id);
    obs.subscribe({
      next: () => this.triggerToast(this.translate.instant('admin.users.toastRoleUpdated'), 'success'),
      error: (err: any) => this.triggerToast(err?.error?.message || this.translate.instant('admin.users.toastRoleFailed'), 'error')
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  openDeleteModal(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  openStatusModal(user: User): void {
    this.selectedUser = user;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedUser = null;
  }

  // Onboard Action (Create User)
  submitAddUser(): void {
    if (!this.addUserForm.username || !this.addUserForm.email || !this.addUserForm.password || !this.addUserForm.firstName || !this.addUserForm.lastName) {
      this.triggerToast(this.translate.instant('admin.users.toastFillRequired'), 'error');
      return;
    }

    this.submitting = true;
    this.userService.createUser(this.addUserForm).subscribe({
      next: (newUser) => {
        this.submitting = false;
        this.showAddModal = false;
        this.triggerToast(this.translate.instant('admin.users.toastAccountCreated', { name: `${newUser.firstName} ${newUser.lastName}` }), 'success');
        this.loadUsers();
      },
      error: (err) => {
        this.submitting = false;
        this.triggerToast(err?.error?.message || this.translate.instant('admin.users.toastAccountFailed'), 'error');
      }
    });
  }

  // Update Action (Edit User)
  submitEditUser(): void {
    if (!this.selectedUser || !this.selectedUser.id) return;
    
    if (!this.editUserForm.username || !this.editUserForm.email || !this.editUserForm.firstName || !this.editUserForm.lastName) {
      this.triggerToast(this.translate.instant('admin.users.toastFillDetails'), 'error');
      return;
    }

    this.submitting = true;
    this.userService.updateUser(this.selectedUser.id, this.editUserForm).subscribe({
      next: (updatedUser) => {
        // Defer UI/state changes to the next tick so the 'disabled'(=submitting) bindings on the
        // modal buttons don't flip mid change-detection (avoids NG0100).
        setTimeout(() => {
          this.submitting = false;
          this.showEditModal = false;
          this.triggerToast(this.translate.instant('admin.users.toastAccountUpdated', { name: updatedUser.firstName }), 'success');
          this.loadUsers();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.submitting = false;
          this.triggerToast(err?.error?.message || this.translate.instant('admin.users.toastUpdateFailed'), 'error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Delete Action
  submitDeleteUser(): void {
    if (!this.selectedUser || !this.selectedUser.id) return;

    this.submitting = true;
    this.userService.deleteUser(this.selectedUser.id).subscribe({
      next: () => {
        this.submitting = false;
        this.showDeleteModal = false;
        this.triggerToast(this.translate.instant('admin.users.toastAccountDeleted', { name: this.selectedUser?.firstName }), 'success');
        this.loadUsers();
      },
      error: (err) => {
        this.submitting = false;
        this.triggerToast(err?.error?.message || this.translate.instant('admin.users.toastDeleteFailed'), 'error');
      }
    });
  }

  // Status Toggle Action (Activate / Suspend)
  submitToggleStatus(): void {
    if (!this.selectedUser || !this.selectedUser.id) return;

    this.submitting = true;
    const wasActive = this.selectedUser.isActive !== false;
    const userId = this.selectedUser.id;
    const user = this.selectedUser;

    this.userService.toggleUserStatus(userId).subscribe({
      next: (response: any) => {
        this.submitting = false;
        this.showStatusModal = false;
        this.cdr.detectChanges();
        const updatedUser = response?.data || response;
        const newState = updatedUser?.isActive !== undefined ? updatedUser.isActive : !wasActive;
        // Sync local list
        const index = this.usersList.findIndex(u => u.id === userId);
        if (index !== -1) {
          this.usersList[index].isActive = newState;
          this.applyClientFilters();
        }
        this.triggerToast(
          this.translate.instant(newState ? 'admin.users.toastUserActivated' : 'admin.users.toastUserSuspended', { name: `${user?.firstName} ${user?.lastName}` }),
          'success'
        );
        this.selectedUser = null;
      },
      error: (err: any) => {
        this.submitting = false;
        this.showStatusModal = false;
        this.cdr.detectChanges();
        this.triggerToast(err?.error?.message || this.translate.instant('admin.users.toastStatusFailed'), 'error');
        this.selectedUser = null;
      }
    });
  }

  resetPassword(u: User): void {
    if (!u.id) return;
    this.userService.resetUserPassword(u.id).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const temp = data?.temporaryPassword;
        // Email is sent server-side when mail is configured; the temp password is also
        // returned so the admin can relay it if e-mail delivery is disabled.
        this.triggerToast(
          temp
            ? this.translate.instant('admin.users.toastPwdResetTemp', { name: u.firstName, temp, email: u.email })
            : this.translate.instant('admin.users.toastPwdResetSent', { email: u.email }),
          'success'
        );
      },
      error: (err: any) => {
        this.triggerToast(err?.error?.message || this.translate.instant('admin.users.toastPwdResetFailed'), 'error');
      }
    });
  }

  private resetAddForm(): void {
    this.addUserForm = {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'USER'
    };
  }

  private triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }
}
