import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { ROLES } from './core/constants/role.constants';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Auth routes
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'auth/sso-callback', loadComponent: () => import('./features/auth/sso-callback/sso-callback').then(m => m.SsoCallbackComponent) },
  { path: 'accept-invite', loadComponent: () => import('./features/auth/accept-invite/accept-invite').then(m => m.AcceptInviteComponent) },
  
  // Admin routes
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard([ROLES.ADMIN])],
    children: [
      { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/users').then(m => m.AdminUsersComponent) },
      { path: 'projects', loadComponent: () => import('./features/admin/projects/projects').then(m => m.AdminProjectsComponent) },
      { path: 'projects/:id', loadComponent: () => import('./features/admin/project-detail/project-detail').then(m => m.AdminProjectDetailComponent) },
      { path: 'teams', loadComponent: () => import('./features/admin/teams/teams').then(m => m.AdminTeamsComponent) },
      { path: 'tasks', loadComponent: () => import('./features/admin/tasks/tasks').then(m => m.AdminTasksComponent) },
      { path: 'security-log', loadComponent: () => import('./features/admin/security-log/security-log').then(m => m.AdminSecurityLogComponent) },
      { path: 'login-attempts', loadComponent: () => import('./features/admin/login-attempts/login-attempts').then(m => m.AdminLoginAttemptsComponent) },
      { path: 'activity-logs', loadComponent: () => import('./features/admin/activity-logs/activity-logs').then(m => m.AdminActivityLogsComponent) },
      { path: 'reports', loadComponent: () => import('./features/admin/reports/reports').then(m => m.AdminReportsComponent) },
      { path: 'scheduled-reports', loadComponent: () => import('./features/admin/scheduled-reports/scheduled-reports').then(m => m.ScheduledReportsComponent) },
      { path: 'performance', loadComponent: () => import('./features/admin/performance/performance').then(m => m.AdminPerformanceComponent) },
      { path: 'notifications', loadComponent: () => import('./features/project-manager/notifications/notifications').then(m => m.PmNotificationsComponent) },
      { path: 'settings', loadComponent: () => import('./features/admin/settings/settings').then(m => m.AdminSettingsComponent) },
      { path: 'roles', loadComponent: () => import('./features/admin/roles/roles').then(m => m.AdminRolesComponent) },
      { path: 'automations', loadComponent: () => import('./features/admin/automations/automations').then(m => m.AutomationsComponent), canActivate: [permissionGuard('automation.manage')] },
      { path: 'custom-fields', loadComponent: () => import('./features/admin/custom-fields/custom-fields').then(m => m.CustomFieldsComponent), canActivate: [permissionGuard('customfield.manage')] },
      { path: 'task-templates', loadComponent: () => import('./features/admin/task-templates/task-templates').then(m => m.TaskTemplatesComponent), canActivate: [permissionGuard('template.manage')] },
      { path: 'workflows', loadComponent: () => import('./features/admin/workflows/workflows').then(m => m.WorkflowsComponent), canActivate: [permissionGuard('workflow.manage')] },
      { path: 'wiki', loadComponent: () => import('./features/wiki/wiki').then(m => m.WikiComponent) },
      { path: 'okrs', loadComponent: () => import('./features/okr/okr').then(m => m.OkrComponent) },
      { path: 'api-keys', loadComponent: () => import('./features/admin/api-keys/api-keys').then(m => m.AdminApiKeysComponent) },
      { path: 'webhooks', loadComponent: () => import('./features/admin/webhooks/webhooks').then(m => m.AdminWebhooksComponent) },
      { path: 'plan', loadComponent: () => import('./features/admin/plan/plan').then(m => m.AdminPlanComponent) },
      { path: 'support', loadComponent: () => import('./features/admin/support/support').then(m => m.AdminSupportComponent) },
      { path: 'api-docs', loadComponent: () => import('./features/admin/api-docs/api-docs').then(m => m.AdminApiDocsComponent) }
    ]
  },
  
  // Project Manager routes
  {
    path: 'pm',
    loadComponent: () => import('./layouts/pm-layout/pm-layout').then(m => m.PmLayoutComponent),
    canActivate: [authGuard, roleGuard([ROLES.PROJECT_MANAGER])],
    children: [
      { path: '', redirectTo: '/pm/dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/project-manager/dashboard/dashboard').then(m => m.PmDashboardComponent) },
      { path: 'analytics', loadComponent: () => import('./features/project-manager/analytics/analytics').then(m => m.PmAnalyticsComponent), canActivate: [permissionGuard('report.view')] },
      { path: 'custom-dashboard', loadComponent: () => import('./features/project-manager/custom-dashboard/custom-dashboard').then(m => m.CustomDashboardComponent), canActivate: [permissionGuard('report.view')] },
      { path: 'projects', loadComponent: () => import('./features/project-manager/projects/projects').then(m => m.PmProjectsComponent), canActivate: [permissionGuard('project.view')] },
      { path: 'projects/:id', loadComponent: () => import('./features/project-manager/project-detail/project-detail').then(m => m.PmProjectDetailComponent), canActivate: [permissionGuard('project.view')] },
      { path: 'tasks', loadComponent: () => import('./features/project-manager/tasks/tasks').then(m => m.PmTasksComponent), canActivate: [permissionGuard('task.view')] },
      { path: 'teams', loadComponent: () => import('./features/project-manager/teams/teams').then(m => m.PmTeamsComponent), canActivate: [permissionGuard('team.view')] },
      { path: 'deliverables', loadComponent: () => import('./features/project-manager/deliverables/deliverables').then(m => m.PmDeliverablesComponent), canActivate: [permissionGuard('deliverable.view')] },
      { path: 'calendar', loadComponent: () => import('./features/project-manager/calendar/calendar').then(m => m.PmCalendarComponent) },
      { path: 'reports', loadComponent: () => import('./features/project-manager/reports/reports').then(m => m.PmReportsComponent), canActivate: [permissionGuard('report.view')] },
      { path: 'automations', loadComponent: () => import('./features/admin/automations/automations').then(m => m.AutomationsComponent), canActivate: [permissionGuard('automation.manage')] },
      { path: 'custom-fields', loadComponent: () => import('./features/admin/custom-fields/custom-fields').then(m => m.CustomFieldsComponent), canActivate: [permissionGuard('customfield.manage')] },
      { path: 'task-templates', loadComponent: () => import('./features/admin/task-templates/task-templates').then(m => m.TaskTemplatesComponent), canActivate: [permissionGuard('template.manage')] },
      { path: 'workflows', loadComponent: () => import('./features/admin/workflows/workflows').then(m => m.WorkflowsComponent), canActivate: [permissionGuard('workflow.manage')] },
      { path: 'wiki', loadComponent: () => import('./features/wiki/wiki').then(m => m.WikiComponent) },
      { path: 'okrs', loadComponent: () => import('./features/okr/okr').then(m => m.OkrComponent) },
      { path: 'plan', loadComponent: () => import('./features/admin/plan/plan').then(m => m.AdminPlanComponent), canActivate: [permissionGuard('billing.manage')] },
      { path: 'roles', loadComponent: () => import('./features/admin/roles/roles').then(m => m.AdminRolesComponent), canActivate: [permissionGuard('role.manage')] },
      { path: 'activity-logs', loadComponent: () => import('./features/admin/activity-logs/activity-logs').then(m => m.AdminActivityLogsComponent), canActivate: [permissionGuard('audit.view')] },
      { path: 'api-keys', loadComponent: () => import('./features/admin/api-keys/api-keys').then(m => m.AdminApiKeysComponent), canActivate: [permissionGuard('settings.manage')] },
      { path: 'webhooks', loadComponent: () => import('./features/admin/webhooks/webhooks').then(m => m.AdminWebhooksComponent), canActivate: [permissionGuard('settings.manage')] },
      { path: 'notifications', loadComponent: () => import('./features/project-manager/notifications/notifications').then(m => m.PmNotificationsComponent) },
      { path: 'support', loadComponent: () => import('./features/support/support').then(m => m.SupportComponent) },
      { path: 'messages', loadComponent: () => import('./features/user/messages/messages').then(m => m.UserMessagesComponent) }
    ]
  },
  
  // User routes
  {
    path: 'user',
    loadComponent: () => import('./layouts/user-layout/user-layout').then(m => m.UserLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '/user/dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/user/dashboard/dashboard').then(m => m.UserDashboardComponent) },
      { path: 'my-tasks', loadComponent: () => import('./features/user/my-tasks/my-tasks').then(m => m.UserMyTasksComponent), canActivate: [permissionGuard('task.view')] },
      { path: 'deliverables', loadComponent: () => import('./features/user/deliverables/deliverables').then(m => m.UserDeliverablesComponent), canActivate: [permissionGuard('deliverable.view')] },
      { path: 'plan', loadComponent: () => import('./features/admin/plan/plan').then(m => m.AdminPlanComponent), canActivate: [permissionGuard('billing.manage')] },
      { path: 'roles', loadComponent: () => import('./features/admin/roles/roles').then(m => m.AdminRolesComponent), canActivate: [permissionGuard('role.manage')] },
      { path: 'activity-logs', loadComponent: () => import('./features/admin/activity-logs/activity-logs').then(m => m.AdminActivityLogsComponent), canActivate: [permissionGuard('audit.view')] },
      { path: 'api-keys', loadComponent: () => import('./features/admin/api-keys/api-keys').then(m => m.AdminApiKeysComponent), canActivate: [permissionGuard('settings.manage')] },
      { path: 'webhooks', loadComponent: () => import('./features/admin/webhooks/webhooks').then(m => m.AdminWebhooksComponent), canActivate: [permissionGuard('settings.manage')] },
      { path: 'time-logs', loadComponent: () => import('./features/user/time-logs/time-logs').then(m => m.UserTimeLogsComponent) },
      { path: 'wiki', loadComponent: () => import('./features/wiki/wiki').then(m => m.WikiComponent) },
      { path: 'okrs', loadComponent: () => import('./features/okr/okr').then(m => m.OkrComponent) },
      { path: 'messages', loadComponent: () => import('./features/user/messages/messages').then(m => m.UserMessagesComponent) },
      { path: 'calendar', loadComponent: () => import('./features/user/calendar/calendar').then(m => m.UserCalendarComponent) },
      { path: 'notifications', loadComponent: () => import('./features/project-manager/notifications/notifications').then(m => m.PmNotificationsComponent) },
      { path: 'support', loadComponent: () => import('./features/support/support').then(m => m.SupportComponent) }
    ]
  },
  
  { path: '**', redirectTo: '/login' }
];
