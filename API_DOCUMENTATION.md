# Task Management System - API Documentation

## Backend Status
**Note:** Backend cannot be started due to missing Maven wrapper files (`.mvn/wrapper/maven-wrapper.properties`). To fix this, the Maven wrapper needs to be regenerated or the project needs to be built using a system-installed Maven.

## Base URL
```
http://localhost:8073/api
```

## Authentication Endpoints

### POST /auth/login
Login user with email and password
- **Request Body:** `{ email: string, password: string }`
- **Response:** JWT token and user information

### POST /auth/register
Register a new user
- **Request Body:** UserRequestDTO
  - username (string, @NotBlank)
  - email (string, @NotBlank, @Email)
  - password (string, @NotBlank)
  - firstName (string, @NotBlank)
  - lastName (string, @NotBlank)
- **Response:** Created user information

### POST /auth/forgot-password
Send password reset link to email
- **Request Body:** `{ email: string }`
- **Response:** Success message

## User Endpoints

### GET /users
Get all users (Admin only)

### GET /users/{id}
Get user by ID

### PUT /users/{id}
Update user information

### DELETE /users/{id}
Delete user (Admin only)

## Task Endpoints

### GET /tasks
Get all tasks

### GET /tasks/{id}
Get task by ID

### POST /tasks
Create a new task
- **Request Body:** TaskRequestDTO
  - name (string, @NotBlank)
  - description (string, optional)
  - projectId (Long, optional)
  - assigneeId (Long, optional)
  - status (TaskStatus, optional)
  - priority (TaskPriority, optional)
  - dueDate (LocalDate, optional)
- **Response:** Created task

### PUT /tasks/{id}
Update task
- **Request Body:** TaskRequestDTO
- **Response:** Updated task

### DELETE /tasks/{id}
Delete task

### GET /tasks/project/{projectId}
Get tasks by project ID

### GET /tasks/assignee/{assigneeId}
Get tasks by assignee ID

### GET /tasks/status/{status}
Get tasks by status

## Project Endpoints

### GET /projects
Get all projects

### GET /projects/{id}
Get project by ID

### POST /projects
Create a new project
- **Request Body:** ProjectRequestDTO
  - name (string, @NotBlank)
  - description (string, optional)
  - managerId (Long, optional)
  - startDate (LocalDate, optional)
  - endDate (LocalDate, optional)
  - status (ProjectStatus, optional)
- **Response:** Created project

### PUT /projects/{id}
Update project
- **Request Body:** ProjectRequestDTO
- **Response:** Updated project

### DELETE /projects/{id}
Delete project

### GET /projects/manager/{managerId}
Get projects by manager ID

## Dashboard Endpoints

### GET /dashboard/admin
Get admin dashboard statistics
- **Response:** DashboardStatsDTO
  - totalTasks (long)
  - totalProjects (long)
  - totalUsers (long)
  - activeTasks (long)
  - completedTasks (long)
  - taskCompletionRate (double)

### GET /dashboard/manager/{managerId}
Get project manager dashboard statistics
- **Response:** DashboardStatsDTO
  - totalTasks (long)
  - activeTasks (long)
  - completedTasks (long)
  - overdueTasks (long)
  - taskCompletionRate (double)
  - teamMembers (long)

### GET /dashboard/user/{userId}
Get user dashboard statistics
- **Response:** DashboardStatsDTO
  - totalTasks (long)
  - activeTasks (long)
  - completedTasks (long)
  - overdueTasks (long)
  - taskCompletionRate (double)

## Team Endpoints

### GET /teams
Get all teams

### GET /teams/{id}
Get team by ID

### POST /teams
Create a new team
- **Request Body:** TeamRequestDTO
  - name (string, @NotBlank)
  - description (string, optional)
  - managerId (Long, optional)
- **Response:** Created team

### PUT /teams/{id}
Update team
- **Request Body:** TeamRequestDTO
- **Response:** Updated team

### DELETE /teams/{id}
Delete team

### POST /teams/{teamId}/members/{userId}
Add user to team

### DELETE /teams/{teamId}/members/{userId}
Remove user from team

## Time Log Endpoints

### GET /time-logs
Get all time logs

### GET /time-logs/{id}
Get time log by ID

### POST /time-logs
Create a new time log
- **Request Body:** TimeLogRequestDTO
  - taskId (Long, @NotNull)
  - hoursSpent (double, @NotNull, @Positive)
  - logDate (LocalDate, @NotNull)
  - description (string, optional)
- **Response:** Created time log

### PUT /time-logs/{id}
Update time log
- **Request Body:** TimeLogRequestDTO
- **Response:** Updated time log

### DELETE /time-logs/{id}
Delete time log

### GET /time-logs/task/{taskId}
Get time logs by task ID

### GET /time-logs/user/{userId}
Get time logs by user ID

### GET /time-logs/date-range
Get time logs by date range
- **Query Parameters:** startDate, endDate

### GET /time-logs/total-hours/task/{taskId}
Get total hours for a task

### GET /time-logs/total-hours/user/{userId}
Get total hours for a user

## Comment Endpoints

### GET /comments/task/{taskId}
Get comments by task ID

### POST /comments
Create a new comment
- **Request Body:** CommentRequestDTO
  - content (string, @NotBlank)
  - taskId (Long, @NotNull)
- **Response:** Created comment

### DELETE /comments/{id}
Delete comment

## Message Endpoints

### GET /messages
Get all messages

### GET /messages/{id}
Get message by ID

### POST /messages
Send a new message
- **Request Body:** MessageRequestDTO
  - content (string, @NotBlank)
  - senderId (Long, optional)
  - receiverId (Long, optional)
- **Response:** Created message

### GET /messages/sender/{senderId}
Get messages by sender ID

### GET /messages/receiver/{receiverId}
Get messages by receiver ID

## Notification Endpoints

### GET /notifications
Get all notifications

### GET /notifications/{id}
Get notification by ID

### GET /notifications/user/{userId}
Get notifications by user ID

### PUT /notifications/{id}/read
Mark notification as read

## Deliverable Endpoints

### GET /deliverables
Get all deliverables

### GET /deliverables/{id}
Get deliverable by ID

### POST /deliverables
Create a new deliverable
- **Request Body:** DeliverableRequestDTO
  - taskId (Long, @NotNull)
  - fileName (string, @NotBlank)
  - fileUrl (string, @NotBlank)
- **Response:** Created deliverable

### DELETE /deliverables/{id}
Delete deliverable

### GET /deliverables/task/{taskId}
Get deliverables by task ID

## Activity Log Endpoints

### GET /activity-logs
Get all activity logs (Admin only)

### GET /activity-logs/user/{userId}
Get activity logs by user ID

### GET /activity-logs/project/{projectId}
Get activity logs by project ID

## Google Calendar Integration

### POST /calendar/events
Create a Google Calendar event for a task

### GET /calendar/events/task/{taskId}
Get Google Calendar event for a task

## Error Responses

All endpoints may return error responses with the following structure:
```json
{
  "status": "error",
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
