# Task Management System

A comprehensive task management and planning system built with Spring Boot, designed for teams to manage tasks, projects, and weekly planning with role-based access control.

## Features

### User Roles and Functionality

#### 1. Employee (User)
- **Personal Task Management**: Create, modify, and delete personal tasks
- **Task Assignment**: View and manage assigned tasks
- **Calendar Integration**: Google Calendar-like interface for task scheduling
- **Weekly Planning**: Mandatory weekly planning with daily task organization
- **Dashboard**: Performance charts and task analytics
- **Difficulty Reporting**: Report task difficulties with impact assessment
- **Progress Tracking**: Update task progress with percentage completion
- **Collaboration**: Comment on tasks and share files
- **Time Management**: Track time spent on tasks

#### 2. Manager (Team Lead)
- **Team Task Management**: Assign and manage team tasks
- **Progress Monitoring**: Track team member progress and performance
- **Planning Compliance**: Monitor weekly planning compliance
- **Deliverable Review**: Approve or reject task deliverables
- **Performance Evaluation**: Evaluate team member performance
- **Reporting**: Generate team performance reports
- **Resource Management**: Reallocate tasks based on workload

#### 3. Super Admin (System Administrator)
- **User Management**: Create, modify, and manage user accounts
- **System Configuration**: Configure application settings
- **Project Management**: Create and manage projects
- **Global Oversight**: Access all system data and reports
- **Security Management**: Manage authentication and security settings
- **Technical Support**: Provide technical support and training

## Technology Stack

- **Backend**: Spring Boot 3.2.3, Spring Security, Spring Data JPA
- **Database**: MySQL 8.0
- **Authentication**: JWT (JSON Web Tokens)
- **Build Tool**: Maven
- **Java Version**: 17
- **Additional**: Lombok, Validation API

## Database Schema

The system includes comprehensive entities for:
- **User Management**: Users, roles, sessions, audit logs
- **Team Management**: Teams, team members, team performance
- **Project Management**: Projects, project status, project teams
- **Task Management**: Tasks, assignments, progress, difficulties
- **Planning**: Weekly planning, daily schedules
- **Communication**: Comments, replies, notifications
- **File Management**: Task files, deliverables
- **Analytics**: Performance metrics, compliance tracking

## Setup Instructions

### Prerequisites
- Java 17 or higher
- MySQL 8.0 or higher
- Maven 3.6 or higher

### Database Setup
1. Install MySQL 8.0
2. Create a database (optional - will be created automatically):
   ```sql
   CREATE DATABASE task_management_db;
   ```
3. Update database credentials in `application.properties`:
   ```properties
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

### Application Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd taskManagement-
   ```

2. Navigate to the application directory:
   ```bash
   cd gpiApp/gpiApp
   ```

3. Build the application:
   ```bash
   mvn clean install
   ```

4. Run the application:
   ```bash
   mvn spring-boot:run
   ```

5. Access the application:
   - API Base URL: `http://localhost:8080/api`
   - Health Check: `http://localhost:8080/api/actuator/health`

### Default Test Data

The application comes with comprehensive test data including:

#### Users
- **Super Admin**: admin@company.com / password
- **Manager 1**: manager1@company.com / password
- **Manager 2**: manager2@company.com / password
- **Developer 1**: developer1@company.com / password
- **Developer 2**: developer2@company.com / password
- **Designer 1**: designer1@company.com / password
- **Tester 1**: tester1@company.com / password

#### Teams
- **Development Team A**: Web application development team
- **Design Team**: UI/UX design and creative team

#### Projects
- **E-Commerce Platform**: Modern e-commerce platform development
- **Mobile App Redesign**: Mobile application redesign project
- **API Gateway**: Microservices API gateway implementation

#### Sample Tasks
- User authentication implementation
- Product catalog UI design
- Shopping cart functionality
- Payment integration testing
- App icon design
- Home screen redesign

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Team Management
- `GET /api/teams` - Get all teams
- `GET /api/teams/{id}` - Get team by ID
- `POST /api/teams` - Create team
- `PUT /api/teams/{id}` - Update team
- `DELETE /api/teams/{id}` - Delete team

### Project Management
- `GET /api/projects` - Get all projects
- `GET /api/projects/{id}` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Task Management
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/{id}` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `PUT /api/tasks/{id}/status` - Update task status
- `PUT /api/tasks/{id}/progress` - Update task progress

### Weekly Planning
- `GET /api/weekly-plannings` - Get all weekly plannings
- `GET /api/weekly-plannings/{id}` - Get weekly planning by ID
- `POST /api/weekly-plannings` - Create weekly planning
- `PUT /api/weekly-plannings/{id}` - Update weekly planning
- `POST /api/weekly-plannings/{id}/submit` - Submit weekly planning
- `POST /api/weekly-plannings/{id}/approve` - Approve weekly planning

## Configuration

### Application Properties
Key configuration options in `application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/task_management_db
spring.datasource.username=root
spring.datasource.password=root

# JWT
jwt.secret=your-secret-key
jwt.expiration=86400000

# Task Management
app.task.max-per-day=8
app.weekly-planning.deadline=FRIDAY_17_00

# Notifications
app.notification.retention-days=30

# File Upload
spring.servlet.multipart.max-file-size=10MB
```

## Security

The application implements comprehensive security features:
- JWT-based authentication
- Role-based access control (RBAC)
- Password encryption
- Session management
- Audit logging
- Input validation

## Development

### Project Structure
```
src/main/java/com/example/gpiApp/
├── config/          # Configuration classes
├── controller/      # REST controllers
├── dto/            # Data Transfer Objects
├── entity/         # JPA entities
├── repository/     # Data access layer
├── service/        # Business logic
│   └── impl/       # Service implementations
└── GpiAppApplication.java
```

### Adding New Features
1. Create entity in `entity/` package
2. Create DTO in `dto/` package
3. Create repository in `repository/` package
4. Create service interface and implementation
5. Create controller in `controller/` package
6. Add test data to `data.sql`

## Testing

The application includes comprehensive test data for all entities. To test different scenarios:

1. **Employee Testing**: Use employee accounts to create personal tasks and weekly plans
2. **Manager Testing**: Use manager accounts to assign tasks and review deliverables
3. **Admin Testing**: Use admin account to manage users and system settings

## Support

For technical support or questions:
- Check the application logs for detailed error information
- Review the database schema and test data
- Ensure all prerequisites are properly installed
- Verify database connectivity and credentials

