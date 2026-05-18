# Task Management System - Frontend Project Context & Implementation Plan

This document provides a comprehensive overview of the Task Management System frontend application. It is designed to give any AI developer or teammate the absolute context needed to understand the project architecture, frontend-backend synchronization, styling standards, and component routing.

---

## 1. Project Overview & Architecture

The frontend is a modern **Angular 21** application using **TypeScript** and **standalone components**. It follows a clean, modular directory structure structured around core services, feature modules, layouts, and reusable components.

### 1.1 Directory Layout
```text
frontend/src/app/
├── core/                   # Singleton services, guards, interceptors, and models
│   ├── constants/          # App constants (roles, status codes, etc.)
│   ├── guards/             # AuthGuard and RoleGuard for route protection
│   ├── interceptors/       # HTTP interceptors (error handling, loading, etc.)
│   ├── models/             # Standard models & DTO mappings matching the backend
│   └── services/           # Data services (ApiService, AuthService, UserService, etc.)
├── features/               # Route-level feature views
│   ├── admin/              # Admin pages: dashboard, users, projects, activity-logs
│   ├── auth/               # Authentication: login, register, forgot-password
│   ├── project-manager/    # Project Manager views: dashboard, projects, tasks, teams, deliverables
│   └── user/               # Standard User/Employee views: dashboard, my-tasks, time-logs, messages, calendar
├── layouts/                # Layout shell components wrapping child views
│   ├── admin-layout/       # Sidebar + Header container for Admin routes
│   ├── pm-layout/          # Layout for Project Managers
│   └── user-layout/        # Layout for standard Employees
├── shared/                 # Shared components, directives, and pipes
│   └── components/         # Header, Sidebar, Loading Spinner, Modals, Confirm Dialogs
├── styles.scss             # Global style sheets (defines custom theme variables)
└── main.ts                 # App bootstrapping
```

---

## 2. Design System & Theme Guidelines

We utilize a **Premium, State-of-the-Art Dark-Mode / Glassmorphic UI theme** with custom HSL/RGB colors and smooth animations. Avoid generic browser defaults or basic colors.

### 2.1 CSS Custom Properties (Theme Palette)
These are defined in the global stylesheet (`styles.scss` / `app.scss`) for unified styling across all pages:
*   **Backgrounds**: Rich midnight-indigo gradient (`#0b0d19` to `#161a30`) and semi-transparent panels with backdrop-filter blur.
*   **Primary Accent**: Glowing Electric Indigo (`#6366f1` / HSL 235, 86%, 65%)
*   **Secondary Accent**: Cyan/Teal Pulse (`#06b6d4` / HSL 189, 94%, 43%)
*   **Success**: Emerald (`#10b981`)
*   **Warning**: Amber Gold (`#f59e0b`)
*   **Danger**: Rose Crimson (`#f43f5e`)
*   **Text colors**: Clean off-white (`#f8fafc`) for headers and muted lavender-gray (`#94a3b8`) for body copy.
*   **Effects**: Glassmorphism backdrop-blur, rich box-shadows, and micro-hover scaling.

---

## 3. Backend DTO Synchronization & Frontend Models

Every request sent to the API is meticulously mapped to matching DTO models to prevent excessive or missing data payloads. 

### 3.1 Authentication DTOs
*   **Login Request**:
    ```typescript
    export interface LoginRequest {
      email: string;      // Not blank, valid email format
      password: string;   // Not blank
    }
    ```
*   **Login Response**:
    ```typescript
    export interface LoginResponse {
      token: string;
      type: string;
      id: number;
      email: string;
      roles: string[];
    }
    ```
*   **Register Request (`UserRequestDTO`)**:
    ```typescript
    export interface UserRequest {
      username: string;
      email: string;
      password?: string;
      firstName: string;
      lastName: string;
      role?: string;
    }
    ```

### 3.2 Dashboard Statistics DTOs
*   **Admin Dashboard Stats (`DashboardStatsDTO`)**:
    ```typescript
    export interface AdminDashboardStats {
      totalTasks: number;
      totalProjects: number;
      totalUsers: number;
      activeTasks: number;
      completedTasks: number;
      taskCompletionRate: number; // double (percentage)
    }
    ```

### 3.3 Task & Project DTOs
*   **Task Request DTO**:
    ```typescript
    export interface TaskRequest {
      name: string;
      description?: string;
      projectId?: number;
      assigneeId?: number;
      status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      dueDate?: string; // YYYY-MM-DD
    }
    ```
*   **Project Request DTO**:
    ```typescript
    export interface ProjectRequest {
      name: string;
      description?: string;
      managerId?: number;
      startDate?: string;
      endDate?: string;
      status?: 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    }
    ```

---

## 4. Feature Flow Implementation Plan

### 4.1 Login Page (`/login`)
1.  **Layout**: Centered card overlaying an active abstract dark-indigo particle gradient.
2.  **Validation**: Real-time validation for email structure and password requirements.
3.  **UI/UX States**:
    *   **Normal State**: Gorgeous text inputs, glowing outline on focus, password hide/reveal toggle.
    *   **Loading State**: Button shows a subtle pulse loading spinner, blocks repeated submit.
    *   **Error State**: Animated shaking alert modal/message displaying precise backend error feedback.
4.  **Role Redirection**:
    *   `ADMIN` -> Redirection to `/admin/dashboard`
    *   `PROJECT_MANAGER` -> Redirection to `/pm/dashboard`
    *   `USER` -> Redirection to `/user/dashboard`

### 4.2 Admin Dashboard (`/admin/dashboard`)
1.  **Grid Layout**: Highly responsive multi-column CSS grid.
2.  **Top Header Area**: Quick greeting with active profile, real-time date/clock, and quick-action menu (Create Task, Add User, etc.).
3.  **Metric Cards (Statistics)**:
    *   **Visual Indicators**: Four animated cards displaying **Total Tasks**, **Total Projects**, **Total Users**, and **Task Completion Rate** (using radial progress circular bar).
    *   **Icons**: Integrated SVG iconography.
4.  **Quick Action Actions & Modals**:
    *   **Add User Modal**: Floating form with role selection matching backend role validations.
    *   **Create Project Modal**: Start/End date selectors, Manager assignment dropdown.
    *   **Confirmation Alerts**: Semi-transparent, glowing popups for confirming user deletions, state edits, or logging out.
5.  **Activity Logs Feed**: Live stream showing the latest system operations (user logins, created projects, deleted tasks).

---

## 5. Security & HTTP Interception
*   **Auth Guard**: Redirects unauthorized visitors immediately to `/login`.
*   **Role Guard**: Performs deep check of the user's role list in local storage or memory before resolving paths to `/admin`, `/pm`, or `/user`.
*   **JWT Token Handling**: The `ApiService` automatically attaches a `Bearer <token>` HTTP header from local storage.
*   **Error Handler Interceptor**: Centrally handles `401 Unauthorized` (triggers logout/redirect) and generic error pop-up rendering.
