import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { ROLES } from './core/constants/role.constants';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout';
import { PmLayoutComponent } from './layouts/pm-layout/pm-layout';
import { UserLayoutComponent } from './layouts/user-layout/user-layout';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard';
import { AdminUsersComponent } from './features/admin/users/users';
import { AdminProjectsComponent } from './features/admin/projects/projects';
import { AdminProjectDetailComponent } from './features/admin/project-detail/project-detail';
import { AdminTasksComponent } from './features/admin/tasks/tasks';
import { AdminActivityLogsComponent } from './features/admin/activity-logs/activity-logs';
import { AdminSettingsComponent } from './features/admin/settings/settings';
import { PmDashboardComponent } from './features/project-manager/dashboard/dashboard';
import { PmAnalyticsComponent } from './features/project-manager/analytics/analytics';
import { PmProjectsComponent } from './features/project-manager/projects/projects';
import { PmProjectDetailComponent } from './features/project-manager/project-detail/project-detail';
import { PmTasksComponent } from './features/project-manager/tasks/tasks';
import { PmTeamsComponent } from './features/project-manager/teams/teams';
import { PmDeliverablesComponent } from './features/project-manager/deliverables/deliverables';
import { PmCalendarComponent } from './features/project-manager/calendar/calendar';
import { PmReportsComponent } from './features/project-manager/reports/reports';
import { PmNotificationsComponent } from './features/project-manager/notifications/notifications';
import { SupportComponent } from './features/support/support';
import { UserDashboardComponent } from './features/user/dashboard/dashboard';
import { UserMyTasksComponent } from './features/user/my-tasks/my-tasks';
import { UserTimeLogsComponent } from './features/user/time-logs/time-logs';
import { UserMessagesComponent } from './features/user/messages/messages';
import { UserCalendarComponent } from './features/user/calendar/calendar';
import { AdminSupportComponent } from './features/admin/support/support';
import { AdminReportsComponent } from './features/admin/reports/reports';
import { AdminTeamsComponent } from './features/admin/teams/teams';
import { AdminLoginAttemptsComponent } from './features/admin/login-attempts/login-attempts';
import { AdminSecurityLogComponent } from './features/admin/security-log/security-log';
import { AdminPerformanceComponent } from './features/admin/performance/performance';
import { AdminApiDocsComponent } from './features/admin/api-docs/api-docs';
import { AdminRolesComponent } from './features/admin/roles/roles';
import { AdminApiKeysComponent } from './features/admin/api-keys/api-keys';
import { AdminWebhooksComponent } from './features/admin/webhooks/webhooks';
import { AdminPlanComponent } from './features/admin/plan/plan';
import { UserDeliverablesComponent } from './features/user/deliverables/deliverables';
import { SsoCallbackComponent } from './features/auth/sso-callback/sso-callback';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Auth routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'auth/sso-callback', component: SsoCallbackComponent },
  
  // Admin routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard([ROLES.ADMIN])],
    children: [
      { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'projects', component: AdminProjectsComponent },
      { path: 'projects/:id', component: AdminProjectDetailComponent },
      { path: 'teams', component: AdminTeamsComponent },
      { path: 'tasks', component: AdminTasksComponent },
      { path: 'security-log', component: AdminSecurityLogComponent },
      { path: 'login-attempts', component: AdminLoginAttemptsComponent },
      { path: 'activity-logs', component: AdminActivityLogsComponent },
      { path: 'reports', component: AdminReportsComponent },
      { path: 'performance', component: AdminPerformanceComponent },
      { path: 'notifications', component: PmNotificationsComponent },
      { path: 'settings', component: AdminSettingsComponent },
      { path: 'roles', component: AdminRolesComponent },
      { path: 'api-keys', component: AdminApiKeysComponent },
      { path: 'webhooks', component: AdminWebhooksComponent },
      { path: 'plan', component: AdminPlanComponent },
      { path: 'support', component: AdminSupportComponent },
      { path: 'api-docs', component: AdminApiDocsComponent }
    ]
  },
  
  // Project Manager routes
  {
    path: 'pm',
    component: PmLayoutComponent,
    canActivate: [authGuard, roleGuard([ROLES.PROJECT_MANAGER])],
    children: [
      { path: '', redirectTo: '/pm/dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PmDashboardComponent },
      { path: 'analytics', component: PmAnalyticsComponent, canActivate: [permissionGuard('report.view')] },
      { path: 'projects', component: PmProjectsComponent, canActivate: [permissionGuard('project.view')] },
      { path: 'projects/:id', component: PmProjectDetailComponent, canActivate: [permissionGuard('project.view')] },
      { path: 'tasks', component: PmTasksComponent, canActivate: [permissionGuard('task.view')] },
      { path: 'teams', component: PmTeamsComponent, canActivate: [permissionGuard('team.view')] },
      { path: 'deliverables', component: PmDeliverablesComponent, canActivate: [permissionGuard('deliverable.view')] },
      { path: 'calendar', component: PmCalendarComponent },
      { path: 'reports', component: PmReportsComponent, canActivate: [permissionGuard('report.view')] },
      { path: 'plan', component: AdminPlanComponent, canActivate: [permissionGuard('billing.manage')] },
      { path: 'roles', component: AdminRolesComponent, canActivate: [permissionGuard('role.manage')] },
      { path: 'activity-logs', component: AdminActivityLogsComponent, canActivate: [permissionGuard('audit.view')] },
      { path: 'api-keys', component: AdminApiKeysComponent, canActivate: [permissionGuard('settings.manage')] },
      { path: 'webhooks', component: AdminWebhooksComponent, canActivate: [permissionGuard('settings.manage')] },
      { path: 'notifications', component: PmNotificationsComponent },
      { path: 'support', component: SupportComponent },
      { path: 'messages', component: UserMessagesComponent }
    ]
  },
  
  // User routes
  {
    path: 'user',
    component: UserLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '/user/dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: UserDashboardComponent },
      { path: 'my-tasks', component: UserMyTasksComponent, canActivate: [permissionGuard('task.view')] },
      { path: 'deliverables', component: UserDeliverablesComponent, canActivate: [permissionGuard('deliverable.view')] },
      { path: 'plan', component: AdminPlanComponent, canActivate: [permissionGuard('billing.manage')] },
      { path: 'roles', component: AdminRolesComponent, canActivate: [permissionGuard('role.manage')] },
      { path: 'activity-logs', component: AdminActivityLogsComponent, canActivate: [permissionGuard('audit.view')] },
      { path: 'api-keys', component: AdminApiKeysComponent, canActivate: [permissionGuard('settings.manage')] },
      { path: 'webhooks', component: AdminWebhooksComponent, canActivate: [permissionGuard('settings.manage')] },
      { path: 'time-logs', component: UserTimeLogsComponent },
      { path: 'messages', component: UserMessagesComponent },
      { path: 'calendar', component: UserCalendarComponent },
      { path: 'notifications', component: PmNotificationsComponent },
      { path: 'support', component: SupportComponent }
    ]
  },
  
  { path: '**', redirectTo: '/login' }
];
