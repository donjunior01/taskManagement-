package com.example.gpiApp.config;

import com.example.gpiApp.entity.*;
import com.example.gpiApp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final MessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createDefaultUsers();
        createSampleData();
    }

    private void createDefaultUsers() {
        // Create default admin user if not exists
        if (!userRepository.existsByEmail("admin@system.com") && !userRepository.existsByUsername("admin")) {
            allUsers admin = allUsers.builder()
                    .username("admin")
                    .email("admin@system.com")
                    .password(passwordEncoder.encode("admin123"))
                    .firstName("System")
                    .lastName("Administrator")
                    .role(allUsers.Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created: admin@system.com / admin123");
        }

        // Create default project manager if not exists
        if (!userRepository.existsByEmail("pm@system.com") && !userRepository.existsByUsername("projectmanager")) {
            allUsers pm = allUsers.builder()
                    .username("projectmanager")
                    .email("pm@system.com")
                    .password(passwordEncoder.encode("pm123456"))
                    .firstName("Project")
                    .lastName("Manager")
                    .role(allUsers.Role.PROJECT_MANAGER)
                    .build();
            userRepository.save(pm);
            log.info("Default project manager created: pm@system.com / pm123456");
        }

        // Create default user if not exists
        if (!userRepository.existsByEmail("user@system.com") && !userRepository.existsByUsername("testuser")) {
            allUsers user = allUsers.builder()
                    .username("testuser")
                    .email("user@system.com")
                    .password(passwordEncoder.encode("user1234"))
                    .firstName("Test")
                    .lastName("User")
                    .role(allUsers.Role.USER)
                    .build();
            userRepository.save(user);
            log.info("Default user created: user@system.com / user1234");
        }
    }

    private void createSampleData() {
        // Only create sample data if there are no projects yet
        if (projectRepository.count() > 0) {
            log.info("Sample data already exists, skipping...");
            return;
        }

        log.info("Creating sample data for MTN Cameroon...");

        // Get or create users
        allUsers pm = userRepository.findByEmail("pm@system.com").orElse(null);
        allUsers testUser = userRepository.findByEmail("user@system.com").orElse(null);

        if (pm == null || testUser == null) {
            log.warn("Default users not found, cannot create sample data");
            return;
        }

        // Create additional team members
        allUsers user1 = createUserIfNotExists("paul.mbarga", "paul.mbarga@mtncameroon.cm", "Paul", "Mbarga", allUsers.Role.USER);
        allUsers user2 = createUserIfNotExists("sandrine.fotso", "sandrine.fotso@mtncameroon.cm", "Sandrine", "Fotso", allUsers.Role.USER);
        allUsers user3 = createUserIfNotExists("emmanuel.ngono", "emmanuel.ngono@mtncameroon.cm", "Emmanuel", "Ngono", allUsers.Role.USER);
        allUsers pm2 = createUserIfNotExists("marie.tchinda", "marie.tchinda@mtncameroon.cm", "Marie", "Tchinda", allUsers.Role.PROJECT_MANAGER);

        // Create Projects
        Project project1 = createProject("Network 5G Expansion Douala", 
            "Deploy 5G network infrastructure across Douala metropolitan area", 
            pm, LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(5), 
            Project.ProjectStatus.ACTIVE, 45);

        Project project2 = createProject("Mobile Money Platform Upgrade", 
            "Upgrade MTN MoMo platform with new features including international transfers", 
            pm, LocalDate.now().minusWeeks(2), LocalDate.now().plusMonths(3), 
            Project.ProjectStatus.ACTIVE, 60);

        Project project3 = createProject("Customer Service Portal Redesign", 
            "Modernize the customer self-service portal with new UI/UX", 
            pm2, LocalDate.now().minusMonths(2), LocalDate.now().plusMonths(2), 
            Project.ProjectStatus.ACTIVE, 75);

        Project project4 = createProject("Rural Coverage Initiative", 
            "Extend network coverage to rural areas in Far North region", 
            pm, LocalDate.now(), LocalDate.now().plusMonths(10), 
            Project.ProjectStatus.ACTIVE, 20);

        Project project5 = createProject("Data Center Yaounde", 
            "Build new data center facility in Yaounde for improved service reliability", 
            pm2, LocalDate.now().minusMonths(4), LocalDate.now().plusMonths(6), 
            Project.ProjectStatus.ACTIVE, 55);

        // Create Teams
        createTeam("Network Engineering Douala", "Team responsible for 5G network deployment", project1);
        createTeam("MoMo Development Team", "Mobile Money platform development team", project2);
        createTeam("UX/UI Design Team", "User experience and interface design", project3);
        createTeam("Rural Deployment Squad", "Field team for rural network deployment", project4);
        createTeam("Infrastructure Team", "Data center and infrastructure management", project5);

        // Create Tasks
        Task task1 = createTask("Install 5G towers in Akwa district", 
            "Deploy and configure 5G towers in Akwa business district", 
            project1, user1, pm, Task.TaskPriority.HIGH, Task.TaskDifficulty.DIFFICULT, 
            Task.TaskStatus.IN_PROGRESS, 60, LocalDate.now().plusWeeks(2));

        Task task2 = createTask("Configure 5G network equipment", 
            "Set up and test 5G network equipment for optimal performance", 
            project1, user2, pm, Task.TaskPriority.HIGH, Task.TaskDifficulty.DIFFICULT, 
            Task.TaskStatus.IN_PROGRESS, 40, LocalDate.now().plusWeeks(3));

        Task task3 = createTask("Develop international transfer module", 
            "Build international money transfer feature for MoMo app", 
            project2, user3, pm, Task.TaskPriority.HIGH, Task.TaskDifficulty.DIFFICULT, 
            Task.TaskStatus.IN_PROGRESS, 70, LocalDate.now().plusDays(10));

        Task task4 = createTask("Design new dashboard UI", 
            "Create modern dashboard interface for customer portal", 
            project3, testUser, pm2, Task.TaskPriority.MEDIUM, Task.TaskDifficulty.MEDIUM, 
            Task.TaskStatus.COMPLETED, 100, LocalDate.now().minusDays(5));

        Task task5 = createTask("Survey Far North region sites", 
            "Conduct site surveys for network tower locations", 
            project4, user1, pm, Task.TaskPriority.HIGH, Task.TaskDifficulty.MEDIUM, 
            Task.TaskStatus.TODO, 0, LocalDate.now().plusMonths(1));

        Task task6 = createTask("Server room construction oversight", 
            "Oversee server room construction and equipment installation", 
            project5, user2, pm2, Task.TaskPriority.HIGH, Task.TaskDifficulty.DIFFICULT, 
            Task.TaskStatus.IN_PROGRESS, 55, LocalDate.now().plusMonths(2));

        // Create Comments
        createComment("First tower installation completed successfully in Bonanjo area.", task1, user1);
        createComment("Equipment arrived from supplier. Starting configuration tomorrow.", task2, user2);
        createComment("API integration with partner banks is 70% complete.", task3, user3);
        createComment("Dashboard design approved by stakeholders! Great work team.", task4, pm2);
        createComment("Regional coordinator confirmed for site surveys next month.", task5, user1);
        createComment("Cooling system installation on schedule. Power systems ready.", task6, user2);

        // Create Messages
        createMessage(pm, user1, project1, "Paul, please provide status update on the tower installation.", true);
        createMessage(user1, pm, project1, "Installation is 60% complete. We're back on track now.", true);
        createMessage(pm, user3, project2, "Emmanuel, how is the API integration going?", true);
        createMessage(user3, pm, project2, "API integration progressing well. Testing starts next week.", true);
        createMessage(pm2, testUser, project3, "The new dashboard design looks amazing! Great work!", true);
        createMessage(testUser, pm2, project3, "Thank you! Starting frontend development tomorrow.", false);

        log.info("Sample data created successfully!");
        log.info("Created {} projects, {} teams, {} tasks", 
            projectRepository.count(), teamRepository.count(), taskRepository.count());
    }

    private allUsers createUserIfNotExists(String username, String email, String firstName, String lastName, allUsers.Role role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            allUsers user = allUsers.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode("password123"))
                    .firstName(firstName)
                    .lastName(lastName)
                    .role(role)
                    .build();
            return userRepository.save(user);
        });
    }

    private Project createProject(String name, String description, allUsers manager, 
                                   LocalDate startDate, LocalDate endDate, 
                                   Project.ProjectStatus status, int progress) {
        Project project = Project.builder()
                .name(name)
                .description(description)
                .manager(manager)
                .startDate(startDate)
                .endDate(endDate)
                .status(status)
                .progress(progress)
                .build();
        return projectRepository.save(project);
    }

    private void createTeam(String name, String description, Project project) {
        Team team = Team.builder()
                .name(name)
                .description(description)
                .project(project)
                .build();
        teamRepository.save(team);
    }

    private Task createTask(String name, String description, Project project, 
                            allUsers assignedTo, allUsers createdBy,
                            Task.TaskPriority priority, Task.TaskDifficulty difficulty,
                            Task.TaskStatus status, int progress, LocalDate deadline) {
        Task task = Task.builder()
                .name(name)
                .description(description)
                .project(project)
                .assignedTo(assignedTo)
                .createdBy(createdBy)
                .priority(priority)
                .difficulty(difficulty)
                .status(status)
                .progress(progress)
                .deadline(deadline)
                .reminderType(Task.ReminderType.EMAIL)
                .build();
        return taskRepository.save(task);
    }

    private void createComment(String content, Task task, allUsers user) {
        Comment comment = Comment.builder()
                .content(content)
                .task(task)
                .user(user)
                .build();
        commentRepository.save(comment);
    }

    private void createMessage(allUsers sender, allUsers recipient, Project project, String content, boolean isRead) {
        Message message = Message.builder()
                .sender(sender)
                .recipient(recipient)
                .project(project)
                .content(content)
                .isRead(isRead)
                .build();
        messageRepository.save(message);
    }
}
