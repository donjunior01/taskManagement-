# Task Planning & Management System (GPI App)

A comprehensive task and project management system built with **Spring Boot** and **Thymeleaf**, featuring role-based access control, real-time notifications, calendar integration, and collaborative features.

## 🎯 Overview

The Task Planning & Management System is designed for organizations to efficiently manage projects, tasks, teams, and deliverables. It supports three user roles: **Admin**, **Project Manager**, and **User**, each with tailored dashboards and functionalities.

## ✨ Features

### Core Features
- **Project Management**: Create, edit, track projects with progress monitoring
- **Task Management**: Assign tasks, set priorities, track deadlines, and monitor completion
- **Team Management**: Create teams, assign members, manage team roles
- **Deliverables**: Submit and review work deliverables with feedback system
- **Time Tracking**: Log work hours on tasks with detailed reporting
- **Calendar Integration**: FullCalendar.js integration with project deadlines and events
- **Messaging System**: Internal messaging with read/unread status
- **Notifications**: Real-time notifications for messages, task assignments, and updates
- **Activity Logging**: Complete audit trail of system activities

### Role-Based Dashboards
- **Admin Dashboard**: System overview, user management, all projects/tasks, settings
- **Project Manager Dashboard**: Managed projects, team tasks, deliverable reviews
- **User Dashboard**: Assigned tasks, time logs, personal deliverables

### Additional Features
- **Dark/Light Theme**: User-selectable themes with persistence
- **Multi-language Support**: English, French, Spanish, German
- **Quick Search**: Search across projects, tasks, and users
- **Support Tickets**: Built-in support system
- **Profile Management**: User profile editing and password changes

## 🛠 Technology Stack

### Backend
- **Java 17+**
- **Spring Boot 3.2.x**
- **Spring Security** with Session-based Authentication
- **Spring Data JPA** with Hibernate
- **MySQL 8.0+** Database

### Frontend
- **Thymeleaf** Template Engine
- **HTML5 / CSS3** with CSS Variables
- **Vanilla JavaScript** (ES6+)
- **FullCalendar.js** for calendar features
- **Chart.js** for analytics visualizations
- **Font Awesome** icons

## 📋 Prerequisites

- **Java JDK 17** or higher
- **Maven 3.8+**
- **MySQL Server 8.0+**
- Modern web browser (Chrome, Firefox, Edge, Safari)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/taskManagement-.git
cd taskManagement-/gpiApp/gpiApp
```

### 2. Database Setup
Create a MySQL database:
```sql
CREATE DATABASE project_management;
```

### 3. Configure Application
Edit `src/main/resources/application.properties`:
```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/project_management?createDatabaseIfNotExist=true
spring.datasource.username=your_username
spring.datasource.password=your_password

# Server Port (default: 8073)
server.port=8073
```

### 4. Build and Run
```bash
# Build the project
mvn clean compile

# Run the application
mvn spring-boot:run
```

### 5. Access the Application
Open your browser and navigate to:
```
http://localhost:8073
```

## 👤 Default User Accounts

The system creates default accounts on first startup:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@system.com | admin123 |
| Project Manager | pm@system.com | pm123 |
| User | user@system.com | user123 |

**⚠️ Important**: Change these passwords immediately in a production environment!

## 📁 Project Structure

```
gpiApp/
├── src/
│   ├── main/
│   │   ├── java/com/example/gpiApp/
│   │   │   ├── config/           # Security & app configurations
│   │   │   ├── controller/       # REST & web controllers
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── entity/           # JPA entities
│   │   │   ├── repository/       # Spring Data repositories
│   │   │   └── service/          # Business logic services
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/          # Stylesheets
│   │       │   └── js/           # JavaScript files
│   │       ├── templates/        # Thymeleaf templates
│   │       │   ├── admin/        # Admin dashboard
│   │       │   ├── project-manager/  # PM dashboard
│   │       │   └── user/         # User dashboard
│   │       ├── application.properties
│   │       ├── schema.sql        # Database schema
│   │       └── data.sql          # Sample data
│   └── test/                     # Unit & integration tests
├── pom.xml                       # Maven dependencies
└── README.md                     # This file
```

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/login` | Login page |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | Logout user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/{id}` | Get user by ID |
| POST | `/api/users` | Create user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| GET | `/api/projects/{id}` | Get project by ID |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/my-tasks` | Get current user's tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| PATCH | `/api/tasks/{id}/progress` | Update task progress |

### Deliverables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deliverables` | Get all deliverables |
| GET | `/api/deliverables/my` | Get user's deliverables |
| POST | `/api/deliverables` | Submit deliverable |
| PUT | `/api/deliverables/{id}/review` | Review deliverable |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | Get conversations |
| GET | `/api/messages/conversation/{userId}` | Get conversation with user |
| POST | `/api/messages` | Send message |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/unread` | Get unread notifications |
| POST | `/api/notifications/{id}/read` | Mark notification as read |
| POST | `/api/notifications/read-all` | Mark all as read |

## 🎨 Theme Customization

The application supports customizable themes via CSS variables. To change the primary color:

1. Navigate to **Settings** in your dashboard
2. Select your preferred **Theme** (Light/Dark)
3. Choose a **Primary Color** from the palette

Settings are saved in browser localStorage and persist across sessions.

## 🌐 Internationalization (i18n)

Supported languages:
- 🇬🇧 English (en)
- 🇫🇷 Français (fr)
- 🇪🇸 Español (es)
- 🇩🇪 Deutsch (de)

Change language in **Settings > Language**.

## 🔧 Configuration Options

### Email Notifications (Optional)
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Google Calendar Integration (Optional)
```properties
google.calendar.enabled=true
google.calendar.credentials.file=classpath:google-credentials.json
google.calendar.id=primary
```

## 📊 Sample Data

The application includes sample data for a fictional "MTN Cameroon" company:
- 5 users (admin, managers, employees)
- 3 projects
- Multiple tasks and deliverables
- Sample messages and calendar events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Use the in-app Support Tickets feature
- Contact: support@example.com

## 🙏 Acknowledgments

- Spring Boot Team
- Thymeleaf Team
- FullCalendar.js
- Chart.js
- Font Awesome

---

**Built with ❤️ for efficient project management**

