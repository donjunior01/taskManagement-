# Task Management System

A comprehensive task planning and management system built with Spring Boot and modern web technologies.

## Features

- **User Management**: Role-based access control (Admin, Project Manager, User)
- **Task Management**: Create, assign, track, and complete tasks
- **Project Management**: Organize tasks into projects with deadlines
- **Team Collaboration**: Team assignments and internal messaging
- **Time Tracking**: Log time spent on tasks
- **Deliverables**: Submit and review project deliverables
- **Calendar**: Google Calendar-like interface for events and deadlines
- **Notifications**: Real-time notification system
- **Dashboard**: Interactive charts and performance metrics
- **Support System**: Built-in support ticket management

## Technology Stack

- **Backend**: Spring Boot 3.x, Spring Security, Spring Data JPA
- **Database**: MySQL
- **Frontend**: Thymeleaf, JavaScript, Chart.js, FullCalendar
- **Documentation**: Swagger/OpenAPI 3.0
- **Build Tool**: Maven

## Quick Start

### Prerequisites

- Java 17 or higher
- MySQL 8.0 or higher
- Maven 3.6 or higher

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd taskManagement-
```

2. Configure database in `gpiApp/gpiApp/src/main/resources/application.properties`
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/your_database
spring.datasource.username=your_username
spring.datasource.password=your_password
```

3. Build and run
```bash
cd gpiApp/gpiApp
mvn clean install
mvn spring-boot:run
```

4. Access the application
```
Application: http://localhost:8073
Swagger UI: http://localhost:8073/swagger-ui.html
```

## Project Structure

```
gpiApp/gpiApp/
├── src/main/
│   ├── java/com/example/gpiApp/
│   │   ├── config/          # Security and application configuration
│   │   ├── controller/      # REST API controllers
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── entity/          # JPA entities
│   │   ├── repository/      # Data access layer
│   │   └── service/         # Business logic
│   └── resources/
│       ├── static/          # CSS, JavaScript, images
│       ├── templates/       # Thymeleaf HTML templates
│       └── application.properties
└── pom.xml
```

## API Documentation

Access comprehensive API documentation via Swagger UI:
```
http://localhost:8073/swagger-ui.html
```

### Key Endpoints

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Projects**: `/api/projects/*`
- **Tasks**: `/api/tasks/*`
- **Deliverables**: `/api/deliverables/*`
- **Time Logs**: `/api/time-logs/*`
- **Messages**: `/api/messages/*`
- **Notifications**: `/api/notifications/*`
- **Calendar**: `/api/calendar/*`
- **Support Tickets**: `/api/support-tickets/*`

## User Roles

### Admin
- Full system access
- User management
- System configuration
- Activity monitoring

### Project Manager
- Project creation and management
- Team assignments
- Task delegation
- Deliverable review
- Progress tracking

### User
- View assigned tasks
- Update task progress
- Submit deliverables
- Log time
- Internal messaging

## Features in Detail

### Dashboard
- Interactive charts showing task distribution and progress
- System performance metrics
- Recent activity feed
- Quick actions

### Task Management
- Create and assign tasks
- Set priorities and deadlines
- Track progress with percentage completion
- Add comments and attachments
- Filter and sort capabilities

### Calendar
- Google Calendar-like interface
- Multiple view options (Month, Week, Day, List)
- Drag-and-drop event management
- Color-coded event types
- Deadline reminders

### Deliverables
- File upload and submission
- Review and approval workflow
- Status tracking (Pending, Approved, Rejected)
- Feedback system

### Time Tracking
- Log hours spent on tasks
- View time summaries (daily, weekly, monthly)
- Generate time reports
- Export capabilities

### Messaging
- Internal messaging system
- User-to-user conversations
- Project-based group messaging
- Unread message indicators

### Notifications
- Real-time notifications
- Notification dropdown
- Mark as read functionality
- Notification preferences

## Security

- Session-based authentication
- JWT token support
- BCrypt password hashing
- Role-based access control
- CSRF protection
- XSS prevention
- SQL injection prevention

## Development

### Running Tests
```bash
mvn test
```

### Building for Production
```bash
mvn clean package -DskipTests
```

### Running the JAR
```bash
java -jar target/performance-management-0.0.1-SNAPSHOT.jar
```

## Configuration

### Database
Configure in `application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/taskmanagement
spring.datasource.username=root
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
```

### Server Port
```properties
server.port=8073
```

### File Upload
```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8073
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8073
kill -9 <PID>
```

### Database Connection Issues
- Verify MySQL is running
- Check database credentials
- Ensure database exists
- Check firewall settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Check the Swagger documentation

## Version

**Current Version**: 1.0.0  
**Last Updated**: January 22, 2026  
**Status**: Production Ready
