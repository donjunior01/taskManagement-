package com.example.gpiApp.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8073}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Task Planning & Management System API")
                        .version("1.0.0")
                        .description("""
                                ## Overview
                                
                                A comprehensive REST API for managing projects, tasks, teams, deliverables, 
                                messages, notifications, and time tracking in a collaborative environment.
                                
                                ## Features
                                
                                - **User Management**: Create, update, delete users with role-based access
                                - **Project Management**: Full CRUD operations for projects
                                - **Task Management**: Assign, track, and update task progress
                                - **Team Management**: Create teams and manage team members
                                - **Deliverables**: Submit and review work deliverables
                                - **Messaging**: Internal messaging system
                                - **Notifications**: Real-time notification system
                                - **Time Tracking**: Log and track work hours
                                - **Calendar Events**: Schedule and manage events
                                
                                ## Authentication
                                
                                This API uses session-based authentication. Login via `/api/auth/login` to obtain a session cookie.
                                
                                ## Roles
                                
                                - **ADMIN**: Full system access
                                - **PROJECT_MANAGER**: Manage assigned projects and teams
                                - **USER**: Access assigned tasks and personal data
                                """)
                        .contact(new Contact()
                                .name("API Support")
                                .email("support@example.com")
                                .url("https://github.com/donjunior01/taskManagement-"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Development Server")))
                .tags(Arrays.asList(
                        new Tag().name("Authentication").description("Login, logout, and registration endpoints"),
                        new Tag().name("Users").description("User management operations"),
                        new Tag().name("Projects").description("Project management operations"),
                        new Tag().name("Tasks").description("Task management operations"),
                        new Tag().name("Teams").description("Team management operations"),
                        new Tag().name("Deliverables").description("Deliverable submission and review"),
                        new Tag().name("Messages").description("Internal messaging system"),
                        new Tag().name("Notifications").description("Notification management"),
                        new Tag().name("Time Logs").description("Time tracking operations"),
                        new Tag().name("Comments").description("Task comment operations"),
                        new Tag().name("Calendar").description("Calendar event management"),
                        new Tag().name("Support").description("Support ticket management"),
                        new Tag().name("Dashboard").description("Dashboard statistics")))
                .components(new Components()
                        .addSecuritySchemes("cookieAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("JSESSIONID")
                                .description("Session cookie authentication")))
                .addSecurityItem(new SecurityRequirement().addList("cookieAuth"));
    }
}

