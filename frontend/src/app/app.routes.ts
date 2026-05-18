import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
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
import { AdminTasksComponent } from './features/admin/tasks/tasks';
import { AdminActivityLogsComponent } from './features/admin/activity-logs/activity-logs';
import { AdminSettingsComponent } from './features/admin/settings/settings';
import { PmDashboardComponent } from './features/project-manager/dashboard/dashboard';
import { PmProjectsComponent } from './features/project-manager/projects/projects';
import { PmTasksComponent } from './features/project-manager/tasks/tasks';
import { PmTeamsComponent } from './features/project-manager/teams/teams';
import { PmDeliverablesComponent } from './features/project-manager/deliverables/deliverables';
import { PmCalendarComponent } from './features/project-manager/calendar/calendar';
import { PmReportsComponent } from './features/project-manager/reports/reports';
import { SupportComponent } from './features/support/support';
import { UserDashboardComponent } from './features/user/dashboard/dashboard';
import { UserMyTasksComponent } from './features/user/my-tasks/my-tasks';
import { UserTimeLogsComponent } from './features/user/time-logs/time-logs';
import { UserMessagesComponent } from './features/user/messages/messages';
import { UserCalendarComponent } from './features/user/calendar/calendar';
import { AdminSupportComponent } from './features/admin/support/support';
import { AdminReportsComponent } from './features/admin/reports/reports';
import { UserDeliverablesComponent } from './features/user/deliverables/deliverables';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Auth routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  
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
      { path: 'tasks', component: AdminTasksComponent },
      { path: 'activity-logs', component: AdminActivityLogsComponent },
      { path: 'settings', component: AdminSettingsComponent },
      { path: 'support', component: AdminSupportComponent },
      { path: 'reports', component: AdminReportsComponent }
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
      { path: 'projects', component: PmProjectsComponent },
      { path: 'tasks', component: PmTasksComponent },
      { path: 'teams', component: PmTeamsComponent },
      { path: 'deliverables', component: PmDeliverablesComponent },
      { path: 'calendar', component: PmCalendarComponent },
      { path: 'reports', component: PmReportsComponent },
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
      { path: 'my-tasks', component: UserMyTasksComponent },
      { path: 'deliverables', component: UserDeliverablesComponent },
      { path: 'time-logs', component: UserTimeLogsComponent },
      { path: 'messages', component: UserMessagesComponent },
      { path: 'calendar', component: UserCalendarComponent },
      { path: 'support', component: SupportComponent }
    ]
  },
  
  { path: '**', redirectTo: '/login' }
];
