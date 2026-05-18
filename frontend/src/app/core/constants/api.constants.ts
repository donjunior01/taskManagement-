export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  USERS: {
    GET_ALL: '/users',
    GET_BY_ID: '/users/:id',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    GET_BY_ROLE: '/users/role/:role',
    GET_CURRENT: '/users/me'
  },
  TASKS: {
    GET_ALL: '/tasks',
    GET_BY_ID: '/tasks/:id',
    CREATE: '/tasks',
    UPDATE: '/tasks/:id',
    DELETE: '/tasks/:id',
    GET_BY_USER: '/tasks/user/:userId',
    GET_BY_PROJECT: '/tasks/project/:projectId',
    GET_BY_STATUS: '/tasks/status/:status',
    GET_OVERDUE: '/tasks/overdue',
    UPDATE_PROGRESS: '/tasks/:id/progress'
  },
  PROJECTS: {
    GET_ALL: '/projects',
    GET_BY_ID: '/projects/:id',
    CREATE: '/projects',
    UPDATE: '/projects/:id',
    DELETE: '/projects/:id',
    GET_BY_MANAGER: '/projects/manager/:managerId',
    GET_BY_STATUS: '/projects/status/:status'
  },
  DASHBOARD: {
    ADMIN_STATS: '/dashboard/admin/stats',
    MANAGER_STATS: '/dashboard/manager/:managerId',
    USER_STATS: '/dashboard/user/:userId'
  },
  NOTIFICATIONS: {
    GET_ALL: '/notifications',
    GET_BY_USER: '/notifications/user/:userId',
    MARK_READ: '/notifications/:id/read',
    DELETE: '/notifications/:id'
  },
  TIME_LOGS: {
    GET_ALL: '/time-logs',
    GET_BY_ID: '/time-logs/:id',
    CREATE: '/time-logs',
    UPDATE: '/time-logs/:id',
    DELETE: '/time-logs/:id',
    GET_BY_TASK: '/time-logs/task/:taskId',
    GET_BY_USER: '/time-logs/user/:userId',
    GET_BY_DATE_RANGE: '/time-logs/user/:userId/range',
    EXPORT_CSV: '/time-logs/export/csv'
  }
};
